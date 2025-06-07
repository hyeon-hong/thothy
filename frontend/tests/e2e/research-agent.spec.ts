import { test, expect, Page } from '@playwright/test';
import { mockResearchAgentResponses } from './fixtures/research-agent-mocks';

// Mock API endpoints
async function setupApiMocks(page: Page) {
  // Mock LangGraph API endpoints
  await page.route('**/api/langgraph/**', async (route) => {
    const url = route.request().url();
    
    if (url.includes('/threads') && route.request().method() === 'POST') {
      // Mock thread creation
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          thread_id: 'test-thread-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {}
        })
      });
    } else if (url.includes('/runs') && route.request().method() === 'POST') {
      // Mock streaming response for research agent
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: mockResearchAgentResponses.streamingResponse
      });
    } else {
      await route.continue();
    }
  });

  // Mock authentication
  await page.route('**/api/auth/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: 'test-user', email: 'test@example.com' } })
    });
  });
}

test.describe('Research Agent Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/agents/research_graph');
  });

  test('should load research agent page successfully', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page is accessible
    await expect(page).toHaveTitle(/Thothy/);
    
    // Look for chat interface elements
    await expect(page.locator('[data-testid="thread-container"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display initial chat interface with input field', async ({ page }) => {
    // Wait for chat interface to load
    await page.waitForSelector('[data-testid="message-input"], [placeholder*="message"], [placeholder*="Message"], textarea', { timeout: 10000 });
    
    // Check for message input
    const messageInput = page.locator('[data-testid="message-input"], [placeholder*="message"], [placeholder*="Message"], textarea').first();
    await expect(messageInput).toBeVisible();
    
    // Check for send button
    const sendButton = page.locator('[data-testid="send-button"], button[type="submit"], button:has-text("Send")').first();
    await expect(sendButton).toBeVisible();
  });

  test('should send a research query and display response', async ({ page }) => {
    const testQuery = 'Research the latest developments in artificial intelligence';
    
    // Wait for input field
    const messageInput = page.locator('[data-testid="message-input"], [placeholder*="message"], [placeholder*="Message"], textarea').first();
    await messageInput.waitFor({ state: 'visible' });
    
    // Type research query
    await messageInput.fill(testQuery);
    
    // Send message
    const sendButton = page.locator('[data-testid="send-button"], button[type="submit"], button:has-text("Send")').first();
    await sendButton.click();
    
    // Wait for user message to appear
    await expect(page.locator('text=' + testQuery)).toBeVisible({ timeout: 5000 });
    
    // Wait for agent response
    await expect(page.locator('[data-testid="agent-message"], [data-role="assistant"]')).toBeVisible({ timeout: 10000 });
  });

  test('should handle empty message submission gracefully', async ({ page }) => {
    const sendButton = page.locator('[data-testid="send-button"], button[type="submit"], button:has-text("Send")').first();
    
    // Try to send empty message
    await sendButton.click();
    
    // Should not create a message or should show validation
    const messages = page.locator('[data-testid="message"], .message');
    await expect(messages).toHaveCount(0);
  });

  test('should display loading state while processing', async ({ page }) => {
    const testQuery = 'Quick research question';
    
    const messageInput = page.locator('[data-testid="message-input"], [placeholder*="message"], [placeholder*="Message"], textarea').first();
    await messageInput.waitFor({ state: 'visible' });
    
    await messageInput.fill(testQuery);
    
    const sendButton = page.locator('[data-testid="send-button"], button[type="submit"], button:has-text("Send")').first();
    await sendButton.click();
    
    // Check for loading indicators
    await expect(page.locator('[data-testid="loading"], .loading, [data-state="loading"]')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Research Agent Artifact Interface', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/agents/research_graph');
    
    // Trigger artifact display by sending a research query
    const messageInput = page.locator('[data-testid="message-input"], [placeholder*="message"], [placeholder*="Message"], textarea').first();
    await messageInput.waitFor({ state: 'visible' });
    await messageInput.fill('Research AI developments');
    
    const sendButton = page.locator('[data-testid="send-button"], button[type="submit"], button:has-text("Send")').first();
    await sendButton.click();
    
    // Wait for artifact to potentially appear
    await page.waitForTimeout(2000);
  });

  test('should display research report artifact when available', async ({ page }) => {
    // Mock artifact appearance
    await page.evaluate(() => {
      // Simulate artifact data being received
      window.postMessage({
        type: 'artifact_update',
        data: {
          topic: 'AI Research Report',
          sections: {
            sections: [
              {
                name: 'Introduction',
                description: 'Overview of AI developments',
                research: false,
                content: 'AI has made significant progress...'
              },
              {
                name: 'Machine Learning',
                description: 'Recent ML advancements',
                research: true,
                content: ''
              }
            ]
          }
        }
      }, '*');
    });

    // Look for artifact toggle button
    const artifactToggle = page.locator('button:has-text("Click to"), button:has-text("report"), button:has-text("display")');
    if (await artifactToggle.isVisible()) {
      await artifactToggle.click();
    }

    // Check for research report sections
    await expect(page.locator('text=Report Sections')).toBeVisible({ timeout: 10000 });
  });

  test('should show different section statuses correctly', async ({ page }) => {
    // Mock different section statuses
    await page.evaluate(() => {
      window.postMessage({
        type: 'artifact_update',
        data: {
          sections: {
            sections: [
              {
                name: 'Completed Section',
                description: 'This section is done',
                research: false,
                content: 'Completed content here'
              }
            ]
          },
          section_update: {
            name: 'Completed Section',
            content: 'Updated content',
            status: 'completed',
            research: false
          }
        }
      }, '*');
    });

    // Look for status indicators
    await expect(page.locator('text=Completed, .text-green-600, [class*="green"]')).toBeVisible({ timeout: 5000 });
  });

  test('should display research sections with proper styling', async ({ page }) => {
    await page.evaluate(() => {
      window.postMessage({
        type: 'artifact_update',
        data: {
          sections: {
            sections: [
              {
                name: 'Research Section',
                description: 'Needs research',
                research: true,
                content: 'Research in progress...'
              }
            ]
          }
        }
      }, '*');
    });

    // Check for research required badge
    await expect(page.locator('text=Research Required, [class*="blue-100"]')).toBeVisible({ timeout: 5000 });
  });

  test('should toggle artifact visibility', async ({ page }) => {
    // Mock artifact presence
    await page.evaluate(() => {
      window.postMessage({
        type: 'artifact_update',
        data: {
          topic: 'Test Report',
          content: 'Test report content'
        }
      }, '*');
    });

    const toggleButton = page.locator('button:has-text("Click to"), button:has-text("hide"), button:has-text("display")');
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      
      // Check if artifact content is hidden
      await expect(page.locator('[data-testid="artifact-content"]')).toBeHidden();
      
      // Click again to show
      await toggleButton.click();
      await expect(page.locator('[data-testid="artifact-content"]')).toBeVisible();
    }
  });
});

test.describe('Research Agent Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/langgraph/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/agents/research_graph');
    
    const messageInput = page.locator('[data-testid="message-input"], [placeholder*="message"], [placeholder*="Message"], textarea').first();
    await messageInput.waitFor({ state: 'visible' });
    await messageInput.fill('Test message');
    
    const sendButton = page.locator('[data-testid="send-button"], button[type="submit"], button:has-text("Send")').first();
    await sendButton.click();
    
    // Should show error message or handle gracefully
    await expect(page.locator('text=error, text=Error, [data-testid="error"]')).toBeVisible({ timeout: 10000 });
  });

  test('should handle network timeouts', async ({ page }) => {
    // Mock slow network
    await page.route('**/api/langgraph/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
      await route.continue();
    });

    await page.goto('/agents/research_graph');
    
    const messageInput = page.locator('[data-testid="message-input"], [placeholder*="message"], [placeholder*="Message"], textarea').first();
    await messageInput.waitFor({ state: 'visible' });
    await messageInput.fill('Test timeout');
    
    const sendButton = page.locator('[data-testid="send-button"], button[type="submit"], button:has-text("Send")').first();
    await sendButton.click();
    
    // Should handle timeout gracefully
    await expect(page.locator('[data-testid="timeout"], text=timeout, text=slow')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Research Agent Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // Mobile viewport

  test('should display properly on mobile devices', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/agents/research_graph');
    
    // Check if interface adapts to mobile
    await expect(page.locator('[data-testid="thread-container"]')).toBeVisible();
    
    // Check if input is accessible on mobile
    const messageInput = page.locator('[data-testid="message-input"], [placeholder*="message"], [placeholder*="Message"], textarea').first();
    await expect(messageInput).toBeVisible();
  });

  test('should handle touch interactions', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/agents/research_graph');
    
    const messageInput = page.locator('[data-testid="message-input"], [placeholder*="message"], [placeholder*="Message"], textarea').first();
    await messageInput.waitFor({ state: 'visible' });
    
    // Simulate touch interaction
    await messageInput.tap();
    await messageInput.fill('Mobile test message');
    
    const sendButton = page.locator('[data-testid="send-button"], button[type="submit"], button:has-text("Send")').first();
    await sendButton.tap();
    
    await expect(page.locator('text=Mobile test message')).toBeVisible();
  });
});

test.describe('Research Agent Accessibility', () => {
  test('should be accessible with keyboard navigation', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/agents/research_graph');
    
    // Tab to message input
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    
    // Should be able to type in focused input
    await page.keyboard.type('Accessibility test message');
    
    // Tab to send button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('text=Accessibility test message')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/agents/research_graph');
    
    // Check for proper ARIA labels on interactive elements
    const messageInput = page.locator('[data-testid="message-input"], [placeholder*="message"], [placeholder*="Message"], textarea').first();
    await expect(messageInput).toHaveAttribute('aria-label', /.+/);
    
    const sendButton = page.locator('[data-testid="send-button"], button[type="submit"], button:has-text("Send")').first();
    await expect(sendButton).toHaveAttribute('aria-label', /.+/);
  });
}); 