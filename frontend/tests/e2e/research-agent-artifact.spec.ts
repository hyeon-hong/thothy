import { test, expect, Page } from '@playwright/test';
import { mockResearchAgentResponses, createMockResearchData, createMockSectionUpdate } from './fixtures/research-agent-mocks';

// Helper function to simulate artifact state updates
async function simulateArtifactUpdate(page: Page, data: any) {
  await page.evaluate((updateData) => {
    // Simulate the LangGraph SDK artifact update
    const event = new CustomEvent('langgraph-artifact-update', {
      detail: updateData
    });
    window.dispatchEvent(event);
  }, data);
}

// Helper function to wait for artifact to be visible
async function waitForArtifact(page: Page) {
  await page.waitForSelector('button:has-text("Click to"), button:has-text("report"), button:has-text("display")', { timeout: 10000 });
}

test.describe('Research Agent Artifact UI', () => {
  test.beforeEach(async ({ page }) => {
    // Mock LangGraph SDK
    await page.addInitScript(() => {
      // Mock the useStreamContext hook
      (window as any).mockStreamContext = {
        meta: {
          artifact: [
            // ArtifactContent component
            ({ children, title }: any) => {
              const div = document.createElement('div');
              div.setAttribute('data-testid', 'artifact-content');
              div.style.display = 'block';
              if (title) {
                const titleEl = document.createElement('h2');
                titleEl.textContent = typeof title === 'string' ? title : 'Research Report';
                div.appendChild(titleEl);
              }
              if (typeof children === 'string') {
                div.innerHTML = children;
              }
              return div;
            },
            {
              open: true,
              setOpen: (open: boolean) => {
                const artifact = document.querySelector('[data-testid="artifact-content"]') as HTMLElement;
                if (artifact) {
                  artifact.style.display = open ? 'block' : 'none';
                }
              },
              context: {},
              setContext: () => {}
            }
          ]
        }
      };
    });

    await page.goto('/agents/research_graph');
  });

  test('should display research report sections correctly', async ({ page }) => {
    const mockData = createMockResearchData({
      topic: 'AI Research Report',
      sections: {
        sections: [
          {
            name: 'Introduction',
            description: 'Overview of AI developments',
            research: false,
            content: 'AI has made significant progress in recent years...'
          },
          {
            name: 'Machine Learning',
            description: 'Recent ML advancements',
            research: true,
            content: 'ML research includes...'
          }
        ]
      }
    });

    await simulateArtifactUpdate(page, mockData);
    await waitForArtifact(page);

    // Check if sections are displayed
    await expect(page.locator('text=Report Sections')).toBeVisible();
    await expect(page.locator('text=Introduction')).toBeVisible();
    await expect(page.locator('text=Machine Learning')).toBeVisible();
  });

  test('should show correct status indicators for different section states', async ({ page }) => {
    const mockData = createMockResearchData();
    await simulateArtifactUpdate(page, mockData);

    // Test completed status
    const completedUpdate = createMockSectionUpdate({
      name: 'Introduction',
      status: 'completed',
      content: 'Completed section content'
    });
    await simulateArtifactUpdate(page, { section_update: completedUpdate });

    await expect(page.locator('text=Completed, .text-green-600, [class*="green"]')).toBeVisible();

    // Test processing status
    const processingUpdate = createMockSectionUpdate({
      name: 'Analysis',
      status: 'processing',
      content: 'Processing...'
    });
    await simulateArtifactUpdate(page, { section_update: processingUpdate });

    await expect(page.locator('text=Processing, .text-blue-600, [class*="blue"]')).toBeVisible();

    // Test needs more research status
    const researchUpdate = createMockSectionUpdate({
      name: 'Research Section',
      status: 'needs_more_research',
      iteration: 2
    });
    await simulateArtifactUpdate(page, { section_update: researchUpdate });

    await expect(page.locator('text=Research in progress, .text-orange-600, [class*="orange"]')).toBeVisible();
  });

  test('should display research badges correctly', async ({ page }) => {
    const mockData = createMockResearchData({
      sections: {
        sections: [
          {
            name: 'Research Required Section',
            description: 'This needs research',
            research: true,
            content: ''
          },
          {
            name: 'No Research Section', 
            description: 'This is done',
            research: false,
            content: 'Content here'
          }
        ]
      }
    });

    await simulateArtifactUpdate(page, mockData);
    await waitForArtifact(page);

    // Check for research required badge
    await expect(page.locator('text=Research Required')).toBeVisible();
    
    // Check for research done badge
    await expect(page.locator('text=Research Done')).toBeVisible();
  });

  test('should update section content dynamically', async ({ page }) => {
    const initialData = createMockResearchData({
      sections: {
        sections: [{
          name: 'Dynamic Section',
          description: 'This will be updated',
          research: true,
          content: 'Initial content'
        }]
      }
    });

    await simulateArtifactUpdate(page, initialData);
    await waitForArtifact(page);

    // Check initial content
    await expect(page.locator('text=Initial content')).toBeVisible();

    // Update section content
    const updatedSection = createMockSectionUpdate({
      name: 'Dynamic Section',
      content: 'Updated content with new information',
      status: 'completed'
    });

    await simulateArtifactUpdate(page, { section_update: updatedSection });

    // Check updated content
    await expect(page.locator('text=Updated content with new information')).toBeVisible();
    await expect(page.locator('text=Initial content')).not.toBeVisible();
  });

  test('should display markdown content properly', async ({ page }) => {
    const markdownContent = `# Heading 1

## Heading 2

**Bold text** and *italic text*

- List item 1
- List item 2

\`\`\`javascript
const code = "example";
\`\`\`

[Link example](https://example.com)`;

    const mockData = createMockResearchData({
      sections: {
        sections: [{
          name: 'Markdown Section',
          description: 'Section with markdown',
          research: false,
          content: markdownContent
        }]
      }
    });

    await simulateArtifactUpdate(page, mockData);
    await waitForArtifact(page);

    // Check for markdown elements
    await expect(page.locator('h1:has-text("Heading 1")')).toBeVisible();
    await expect(page.locator('h2:has-text("Heading 2")')).toBeVisible();
    await expect(page.locator('strong:has-text("Bold text")')).toBeVisible();
    await expect(page.locator('em:has-text("italic text")')).toBeVisible();
    await expect(page.locator('ul li:has-text("List item 1")')).toBeVisible();
  });

  test('should handle section iteration numbers', async ({ page }) => {
    const mockData = createMockResearchData();
    await simulateArtifactUpdate(page, mockData);

    // Update with iteration
    const iterationUpdate = createMockSectionUpdate({
      name: 'Iterative Section',
      status: 'needs_more_research',
      iteration: 3
    });

    await simulateArtifactUpdate(page, { section_update: iterationUpdate });

    // Check for iteration indicator
    await expect(page.locator('text=(3), text=iteration')).toBeVisible();
  });

  test('should display final research report', async ({ page }) => {
    const reportContent = `# Research Report

## Executive Summary
This report analyzes recent developments...

## Key Findings
1. Finding one
2. Finding two
3. Finding three

## Conclusion
Based on the research...`;

    const mockData = createMockResearchData({
      content: reportContent
    });

    await simulateArtifactUpdate(page, mockData);
    await waitForArtifact(page);

    // Check for final report
    await expect(page.locator('text=Generated Research Report')).toBeVisible();
    await expect(page.locator('h1:has-text("Research Report")')).toBeVisible();
    await expect(page.locator('text=Executive Summary')).toBeVisible();
    await expect(page.locator('text=Key Findings')).toBeVisible();
  });

  test('should show report generation timestamp', async ({ page }) => {
    const mockData = createMockResearchData({
      content: 'Test report content'
    });

    await simulateArtifactUpdate(page, mockData);
    await waitForArtifact(page);

    // Check for timestamp
    await expect(page.locator('text=Report generated at')).toBeVisible();
  });

  test('should handle empty sections gracefully', async ({ page }) => {
    const mockData = createMockResearchData({
      sections: {
        sections: []
      }
    });

    await simulateArtifactUpdate(page, mockData);
    
    // Should not show sections header if no sections
    await expect(page.locator('text=Report Sections')).not.toBeVisible();
  });

  test('should display sections with proper scroll behavior', async ({ page }) => {
    // Create many sections to test scrolling
    const manySections = Array.from({ length: 10 }, (_, i) => ({
      name: `Section ${i + 1}`,
      description: `Description for section ${i + 1}`,
      research: i % 2 === 0,
      content: `Content for section ${i + 1}`
    }));

    const mockData = createMockResearchData({
      sections: { sections: manySections }
    });

    await simulateArtifactUpdate(page, mockData);
    await waitForArtifact(page);

    // Check if scrollable container exists
    const scrollContainer = page.locator('[style*="overflow-y: auto"], .overflow-y-auto');
    await expect(scrollContainer).toBeVisible();

    // Check if multiple sections are visible
    await expect(page.locator('text=Section 1')).toBeVisible();
    await expect(page.locator('text=Section 5')).toBeVisible();
  });
});

test.describe('Research Agent Artifact Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agents/research_graph');
  });

  test('should toggle artifact visibility with button', async ({ page }) => {
    const mockData = createMockResearchData();
    await simulateArtifactUpdate(page, mockData);

    const toggleButton = page.locator('button:has-text("Click to")');
    await expect(toggleButton).toBeVisible();

    // Test hiding
    if (await toggleButton.textContent() === 'Click to hide report') {
      await toggleButton.click();
      await expect(page.locator('button:has-text("Click to display report")')).toBeVisible();
    } else {
      // Test showing
      await toggleButton.click();
      await expect(page.locator('button:has-text("Click to hide report")')).toBeVisible();
    }
  });

  test('should maintain artifact state during updates', async ({ page }) => {
    const initialData = createMockResearchData({
      topic: 'Initial Topic'
    });
    await simulateArtifactUpdate(page, initialData);

    // Verify initial state
    await expect(page.locator('text=Initial Topic')).toBeVisible();

    // Update topic
    const updatedData = createMockResearchData({
      topic: 'Updated Topic'
    });
    await simulateArtifactUpdate(page, updatedData);

    // Verify updated state
    await expect(page.locator('text=Updated Topic')).toBeVisible();
    await expect(page.locator('text=Initial Topic')).not.toBeVisible();
  });

  test('should handle rapid section updates', async ({ page }) => {
    const mockData = createMockResearchData();
    await simulateArtifactUpdate(page, mockData);

    // Simulate rapid updates
    for (let i = 1; i <= 5; i++) {
      const update = createMockSectionUpdate({
        name: 'Rapid Section',
        content: `Update ${i}`,
        status: i === 5 ? 'completed' : 'processing',
        iteration: i
      });

      await simulateArtifactUpdate(page, { section_update: update });
      await page.waitForTimeout(100); // Small delay between updates
    }

    // Final state should be visible
    await expect(page.locator('text=Update 5')).toBeVisible();
    await expect(page.locator('text=Completed')).toBeVisible();
  });
}); 