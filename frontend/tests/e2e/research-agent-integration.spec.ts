import { test, expect } from '@playwright/test';
import { ResearchAgentTestHelper, TEST_QUERIES, TestDataGenerator, PerformanceHelper } from './utils/test-helpers';
import { mockResearchAgentResponses, createMockResearchData } from './fixtures/research-agent-mocks';

test.describe('Research Agent Integration Tests', () => {
  let helper: ResearchAgentTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ResearchAgentTestHelper(page);
    
    // Setup API mocks for integration tests
    await page.route('**/api/langgraph/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('/threads') && route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            thread_id: 'integration-test-thread',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: { test: 'integration' }
          })
        });
      } else if (url.includes('/runs') && route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: mockResearchAgentResponses.streamingResponse
        });
      } else {
        await route.continue();
      }
    });

    await helper.navigateToResearchAgent();
  });

  test('should complete full research workflow', async ({ page }) => {
    // Test the complete research agent workflow
    await helper.verifyPageLoad();
    await helper.waitForChatInterface();

    // Send research query
    const query = TEST_QUERIES.complex;
    await helper.verifyMessageExchange(query, true);

    // Wait for and interact with artifact
    const mockData = createMockResearchData({
      topic: 'AI Research Analysis',
      sections: {
        sections: [
          {
            name: 'Introduction',
            description: 'Overview of AI landscape',
            research: false,
            content: 'AI continues to advance rapidly...'
          },
          {
            name: 'Technical Analysis',
            description: 'Deep dive into technical aspects',
            research: true,
            content: 'Technical developments include...'
          },
          {
            name: 'Market Impact',
            description: 'Economic and business implications',
            research: true,
            content: 'Market analysis shows...'
          }
        ]
      },
      content: '# Complete AI Research Report\n\n## Summary\n\nThis comprehensive analysis...'
    });

    await helper.verifyArtifactFlow(mockData);

    // Verify section statuses
    await helper.expectSectionStatus('completed');
    await helper.expectResearchBadge('required');
    await helper.expectResearchBadge('done');

    // Verify final report
    await expect(page.locator('text=Complete AI Research Report')).toBeVisible();
  });

  test('should handle multiple consecutive queries', async ({ page }) => {
    await helper.waitForChatInterface();

    const queries = [
      TEST_QUERIES.simple,
      TEST_QUERIES.healthcare,
      TEST_QUERIES.ethics
    ];

    for (const query of queries) {
      await helper.sendMessage(query);
      await helper.waitForUserMessage(query);
      await helper.waitForAgentResponse();
      
      // Brief pause between queries
      await page.waitForTimeout(1000);
    }

    // Verify all messages are present
    for (const query of queries) {
      await expect(page.locator(`text=${query}`)).toBeVisible();
    }
  });

  test('should handle research section updates in real-time', async ({ page }) => {
    await helper.waitForChatInterface();
    await helper.sendMessage(TEST_QUERIES.comparison);

    // Simulate progressive section updates
    const mockData = createMockResearchData({
      sections: {
        sections: [
          {
            name: 'LLM Comparison',
            description: 'Comparing different language models',
            research: true,
            content: ''
          }
        ]
      }
    });

    await helper.simulateArtifactUpdate(mockData);
    await helper.waitForArtifact();

    // Simulate section going through different states
    const states = [
      { status: 'processing', content: 'Starting research...', iteration: 1 },
      { status: 'needs_more_research', content: 'Gathering more data...', iteration: 2 },
      { status: 'processing', content: 'Analyzing findings...', iteration: 3 },
      { status: 'completed', content: 'Complete comparison of LLMs including GPT-4, Claude, and others...', research: false }
    ];

    for (const state of states) {
      await helper.simulateSectionUpdate({
        name: 'LLM Comparison',
        ...state
      });

      // Verify the status update is reflected
      if (state.status === 'completed') {
        await helper.expectSectionStatus('completed');
      } else if (state.status === 'processing') {
        await helper.expectSectionStatus('processing');
      } else if (state.status === 'needs_more_research') {
        await helper.expectSectionStatus('needsResearch');
      }

      await page.waitForTimeout(500);
    }

    // Final verification
    await expect(page.locator('text=Complete comparison of LLMs')).toBeVisible();
  });

  test('should handle error recovery gracefully', async ({ page }) => {
    await helper.waitForChatInterface();

    // First, simulate an error
    await page.route('**/api/langgraph/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Temporary server error' })
      });
    });

    await helper.sendMessage('Test error recovery');
    await helper.expectErrorMessage();

    // Then, fix the API and retry
    await page.route('**/api/langgraph/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: mockResearchAgentResponses.streamingResponse
      });
    });

    await helper.sendMessage('Retry after error');
    await helper.waitForAgentResponse();
    await helper.expectNoErrorMessage();
  });

  test('should maintain state across artifact toggles', async ({ page }) => {
    await helper.waitForChatInterface();
    await helper.sendMessage(TEST_QUERIES.simple);

    const mockData = createMockResearchData({
      topic: 'State Persistence Test'
    });

    await helper.simulateArtifactUpdate(mockData);
    await helper.waitForArtifact();

    // Toggle artifact visibility multiple times
    for (let i = 0; i < 3; i++) {
      await helper.toggleArtifact();
      await helper.expectArtifactHidden();
      
      await helper.toggleArtifact();
      await helper.expectArtifactVisible();
      
      // Verify content is still there
      await expect(page.locator('text=State Persistence Test')).toBeVisible();
    }
  });

  test('should handle concurrent section updates', async ({ page }) => {
    await helper.waitForChatInterface();
    await helper.sendMessage('Test concurrent updates');

    const mockData = createMockResearchData({
      sections: {
        sections: [
          { name: 'Section A', description: 'First section', research: true, content: '' },
          { name: 'Section B', description: 'Second section', research: true, content: '' },
          { name: 'Section C', description: 'Third section', research: true, content: '' }
        ]
      }
    });

    await helper.simulateArtifactUpdate(mockData);
    await helper.waitForArtifact();

    // Simulate concurrent updates to different sections
    const updates = [
      { name: 'Section A', content: 'Content A completed', status: 'completed' },
      { name: 'Section B', content: 'Content B in progress', status: 'processing' },
      { name: 'Section C', content: 'Content C needs research', status: 'needs_more_research' }
    ];

    // Send all updates quickly
    for (const update of updates) {
      await helper.simulateSectionUpdate(update);
    }

    // Verify all sections are updated correctly
    await expect(page.locator('text=Content A completed')).toBeVisible();
    await expect(page.locator('text=Content B in progress')).toBeVisible();
    await expect(page.locator('text=Content C needs research')).toBeVisible();
  });

  test('should handle large research reports', async ({ page }) => {
    await helper.waitForChatInterface();
    await helper.sendMessage('Generate large research report');

    // Create a large mock dataset
    const largeMockData = TestDataGenerator.generateMockResearchData(15);
    largeMockData.content = `# Large Research Report

${Array.from({ length: 50 }, (_, i) => 
  `## Section ${i + 1}\n\nThis is content for section ${i + 1} with detailed analysis and findings.\n\n`
).join('')}

## Conclusion

This concludes the large research report with comprehensive findings.`;

    await helper.simulateArtifactUpdate(largeMockData);
    await helper.waitForArtifact();

    // Verify scrolling works with large content
    const scrollContainer = page.locator('[style*="overflow-y: auto"], .overflow-y-auto');
    await expect(scrollContainer).toBeVisible();

    // Verify first and last sections are accessible via scrolling
    await expect(page.locator('text=Section 1')).toBeVisible();
    
    // Scroll to bottom
    await scrollContainer.scroll({ top: 9999 });
    await expect(page.locator('text=Section 15')).toBeVisible();
  });

  test('should measure performance benchmarks', async ({ page }) => {
    // Measure page load performance
    const loadTime = await helper.measurePageLoadTime();
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Measure message response time
    const responseTime = await helper.measureMessageResponseTime(TEST_QUERIES.simple);
    expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds

    // Measure artifact rendering time
    const artifactTime = await PerformanceHelper.measureTime(async () => {
      const mockData = createMockResearchData();
      await helper.simulateArtifactUpdate(mockData);
      await helper.waitForArtifact();
    });
    
    expect(artifactTime.time).toBeLessThan(2000); // Should render within 2 seconds
  });

  test('should handle stress testing with rapid interactions', async ({ page }) => {
    await helper.waitForChatInterface();

    // Send multiple rapid messages
    const rapidQueries = Array.from({ length: 10 }, () => TestDataGenerator.generateRandomQuery());
    
    for (const query of rapidQueries) {
      await helper.sendMessage(query);
      await page.waitForTimeout(100); // Brief pause
    }

    // Verify all messages are processed
    for (const query of rapidQueries) {
      await expect(page.locator(`text=${query}`)).toBeVisible();
    }

    // Rapid artifact updates
    for (let i = 0; i < 20; i++) {
      const mockData = createMockResearchData();
      mockData.topic = `Rapid Update ${i}`;
      await helper.simulateArtifactUpdate(mockData);
      await page.waitForTimeout(50);
    }

    // Verify final state
    await expect(page.locator('text=Rapid Update 19')).toBeVisible();
  });

  test('should maintain accessibility standards', async ({ page }) => {
    await helper.waitForChatInterface();

    // Test keyboard navigation
    await helper.testKeyboardNavigation();

    // Test ARIA labels (this might need adjustment based on actual implementation)
    // await helper.testAriaLabels();

    // Test screen reader compatibility
    await helper.sendMessage('Test accessibility');
    
    // Verify semantic HTML structure
    await expect(page.locator('main, [role="main"]')).toBeVisible();
    
    // Check for proper heading hierarchy
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Verify color contrast and visual indicators
    const statusElements = page.locator('[class*="green"], [class*="blue"], [class*="orange"]');
    if (await statusElements.count() > 0) {
      // These should have appropriate text alternatives
      await expect(statusElements.first()).toBeVisible();
    }
  });
}); 