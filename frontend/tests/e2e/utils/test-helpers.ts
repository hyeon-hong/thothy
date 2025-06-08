import { Page, expect } from '@playwright/test';

// Common selectors for research agent components
export const SELECTORS = {
  messageInput: '[data-testid="message-input"], [placeholder*="message"], [placeholder*="Message"], textarea',
  sendButton: '[data-testid="send-button"], button[type="submit"], button:has-text("Send")',
  threadContainer: '[data-testid="thread-container"]',
  agentMessage: '[data-testid="agent-message"], [data-role="assistant"]',
  userMessage: '[data-testid="user-message"], [data-role="user"]',
  loadingIndicator: '[data-testid="loading"], .loading, [data-state="loading"]',
  errorMessage: '[data-testid="error"], text=error, text=Error',
  artifactToggle: 'button:has-text("Click to"), button:has-text("report"), button:has-text("display")',
  artifactContent: '[data-testid="artifact-content"]',
  reportSections: 'text=Report Sections',
  sectionStatus: {
    completed: 'text=Completed, .text-green-600, [class*="green"]',
    processing: 'text=Processing, .text-blue-600, [class*="blue"]',
    needsResearch: 'text=Research in progress, .text-orange-600, [class*="orange"]',
    pending: 'text=Pending, .text-yellow-600, [class*="yellow"]'
  },
  researchBadges: {
    required: 'text=Research Required',
    done: 'text=Research Done'
  }
};

// Common test data
export const TEST_QUERIES = {
  simple: 'Research AI developments',
  complex: 'Research the latest developments in artificial intelligence, focusing on machine learning, natural language processing, and computer vision',
  healthcare: 'Analyze the impact of AI on healthcare industry',
  ethics: 'Investigate the ethical implications of AI automation',
  comparison: 'Compare different large language models available in 2024'
};

// Helper functions for common test actions
export class ResearchAgentTestHelper {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateToResearchAgent() {
    await this.page.goto('/agents/research_graph');
    await this.page.waitForLoadState('networkidle');
  }

  // Chat interaction helpers
  async waitForChatInterface() {
    await this.page.waitForSelector(SELECTORS.messageInput, { timeout: 10000 });
    await expect(this.page.locator(SELECTORS.messageInput).first()).toBeVisible();
    await expect(this.page.locator(SELECTORS.sendButton).first()).toBeVisible();
  }

  async sendMessage(message: string) {
    const messageInput = this.page.locator(SELECTORS.messageInput).first();
    await messageInput.waitFor({ state: 'visible' });
    await messageInput.fill(message);
    
    const sendButton = this.page.locator(SELECTORS.sendButton).first();
    await sendButton.click();
  }

  async waitForUserMessage(message: string) {
    await expect(this.page.locator(`text=${message}`)).toBeVisible({ timeout: 5000 });
  }

  async waitForAgentResponse() {
    await expect(this.page.locator(SELECTORS.agentMessage)).toBeVisible({ timeout: 10000 });
  }

  async waitForLoadingState() {
    await expect(this.page.locator(SELECTORS.loadingIndicator)).toBeVisible({ timeout: 5000 });
  }

  // Artifact helpers
  async waitForArtifact() {
    await this.page.waitForSelector(SELECTORS.artifactToggle, { timeout: 10000 });
  }

  async toggleArtifact() {
    const toggleButton = this.page.locator(SELECTORS.artifactToggle);
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
    }
  }

  async expectArtifactVisible() {
    await expect(this.page.locator(SELECTORS.artifactContent)).toBeVisible();
  }

  async expectArtifactHidden() {
    await expect(this.page.locator(SELECTORS.artifactContent)).toBeHidden();
  }

  async expectSectionStatus(status: keyof typeof SELECTORS.sectionStatus) {
    await expect(this.page.locator(SELECTORS.sectionStatus[status])).toBeVisible();
  }

  async expectResearchBadge(type: keyof typeof SELECTORS.researchBadges) {
    await expect(this.page.locator(SELECTORS.researchBadges[type])).toBeVisible();
  }

  // Error handling helpers
  async expectErrorMessage() {
    await expect(this.page.locator(SELECTORS.errorMessage)).toBeVisible({ timeout: 10000 });
  }

  async expectNoErrorMessage() {
    await expect(this.page.locator(SELECTORS.errorMessage)).not.toBeVisible();
  }

  // Accessibility helpers
  async testKeyboardNavigation() {
    // Tab to message input
    await this.page.keyboard.press('Tab');
    const focusedElement = this.page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('placeholder', /message/i);
  }

  async testAriaLabels() {
    const messageInput = this.page.locator(SELECTORS.messageInput).first();
    const sendButton = this.page.locator(SELECTORS.sendButton).first();
    
    // Check for ARIA labels or accessible names
    await expect(messageInput).toHaveAttribute('aria-label', /.+/);
    await expect(sendButton).toHaveAttribute('aria-label', /.+/);
  }

  // Mobile helpers
  async testMobileInterface() {
    // Check if interface adapts to mobile viewport
    await expect(this.page.locator(SELECTORS.threadContainer)).toBeVisible();
    await expect(this.page.locator(SELECTORS.messageInput).first()).toBeVisible();
  }

  async sendMessageOnMobile(message: string) {
    const messageInput = this.page.locator(SELECTORS.messageInput).first();
    await messageInput.waitFor({ state: 'visible' });
    
    // Use tap instead of click for mobile
    await messageInput.tap();
    await messageInput.fill(message);
    
    const sendButton = this.page.locator(SELECTORS.sendButton).first();
    await sendButton.tap();
  }

  // Simulation helpers
  async simulateArtifactUpdate(data: any) {
    await this.page.evaluate((updateData) => {
      const event = new CustomEvent('langgraph-artifact-update', {
        detail: updateData
      });
      window.dispatchEvent(event);
    }, data);
  }

  async simulateStreamingMessage(content: string) {
    await this.page.evaluate((messageContent) => {
      const event = new CustomEvent('langgraph-stream-message', {
        detail: {
          content: messageContent,
          role: 'assistant',
          type: 'message'
        }
      });
      window.dispatchEvent(event);
    }, content);
  }

  async simulateSectionUpdate(sectionUpdate: any) {
    await this.page.evaluate((update) => {
      const event = new CustomEvent('langgraph-section-update', {
        detail: { section_update: update }
      });
      window.dispatchEvent(event);
    }, sectionUpdate);
  }

  // Verification helpers
  async verifyPageLoad() {
    await expect(this.page).toHaveTitle(/Thothy/);
    await expect(this.page.locator(SELECTORS.threadContainer)).toBeVisible({ timeout: 10000 });
  }

  async verifyMessageExchange(userMessage: string, expectAgentResponse: boolean = true) {
    await this.sendMessage(userMessage);
    await this.waitForUserMessage(userMessage);
    
    if (expectAgentResponse) {
      await this.waitForAgentResponse();
    }
  }

  async verifyArtifactFlow(mockData: any) {
    await this.simulateArtifactUpdate(mockData);
    await this.waitForArtifact();
    await this.toggleArtifact();
    await this.expectArtifactVisible();
  }

  // Performance helpers
  async measurePageLoadTime() {
    const startTime = Date.now();
    await this.navigateToResearchAgent();
    await this.waitForChatInterface();
    const endTime = Date.now();
    return endTime - startTime;
  }

  async measureMessageResponseTime(message: string) {
    const startTime = Date.now();
    await this.sendMessage(message);
    await this.waitForAgentResponse();
    const endTime = Date.now();
    return endTime - startTime;
  }

  // Debug helpers
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `tests/screenshots/${name}.png`, fullPage: true });
  }

  async logConsoleErrors() {
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
  }

  async logNetworkRequests() {
    this.page.on('request', request => {
      console.log('Request:', request.method(), request.url());
    });

    this.page.on('response', response => {
      console.log('Response:', response.status(), response.url());
    });
  }
}

// Mock API response builders
export class MockAPIBuilder {
  static createThreadResponse(threadId: string = 'test-thread-123') {
    return {
      thread_id: threadId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {}
    };
  }

  static createRunResponse(runId: string = 'test-run-456', threadId: string = 'test-thread-123') {
    return {
      run_id: runId,
      thread_id: threadId,
      assistant_id: 'research_graph',
      status: 'running',
      created_at: new Date().toISOString()
    };
  }

  static createStreamingResponse(messages: string[]) {
    let response = 'event: metadata\ndata: {"run_id": "test-run-123", "thread_id": "test-thread-123"}\n\n';
    
    messages.forEach(message => {
      response += `event: data\ndata: {"content": "${message}", "type": "message", "role": "assistant"}\n\n`;
    });
    
    response += 'event: end\ndata: {"status": "completed"}\n\n';
    return response;
  }

  static createErrorResponse(error: string, code: number = 500) {
    return {
      status: code,
      contentType: 'application/json',
      body: JSON.stringify({
        error,
        message: error,
        code
      })
    };
  }
}

// Test data generators
export class TestDataGenerator {
  static generateRandomQuery(): string {
    const topics = ['AI', 'machine learning', 'robotics', 'blockchain', 'quantum computing'];
    const actions = ['research', 'analyze', 'investigate', 'study', 'examine'];
    const contexts = ['recent developments', 'current trends', 'future implications', 'market impact'];
    
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const context = contexts[Math.floor(Math.random() * contexts.length)];
    
    return `${action} ${context} in ${topic}`;
  }

  static generateMockSection(name: string, research: boolean = true) {
    return {
      name,
      description: `Description for ${name}`,
      research,
      content: research ? '' : `Content for ${name}`
    };
  }

  static generateMockResearchData(sectionCount: number = 3) {
    const sections = Array.from({ length: sectionCount }, (_, i) => 
      this.generateMockSection(`Section ${i + 1}`, i % 2 === 0)
    );

    return {
      topic: 'Generated Research Report',
      sections: { sections },
      content: 'Generated research report content'
    };
  }
}

// Performance measurement utilities
export class PerformanceHelper {
  static async measureTime<T>(operation: () => Promise<T>): Promise<{ result: T; time: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    return { result, time: endTime - startTime };
  }

  static async waitForNetworkIdle(page: Page, timeout: number = 5000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  static async measureNetworkRequests(page: Page, operation: () => Promise<void>) {
    const requests: any[] = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    });

    await operation();
    return requests;
  }
} 