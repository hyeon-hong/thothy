# Frontend Research Agent Tests

This directory contains comprehensive Playwright tests for the research agent frontend functionality.

## Overview

The test suite covers:

- **Chat Interface**: Message sending, receiving, and real-time interactions
- **Artifact UI**: Research report display, section updates, and status indicators
- **Error Handling**: API failures, network timeouts, and graceful recovery
- **Mobile Responsiveness**: Touch interactions and responsive design
- **Accessibility**: Keyboard navigation, ARIA labels, and screen reader compatibility
- **Performance**: Load times, response times, and stress testing
- **Integration**: Complete workflows and state management

## Test Structure

```
tests/
├── e2e/
│   ├── fixtures/
│   │   └── research-agent-mocks.ts    # Mock data and API responses
│   ├── utils/
│   │   └── test-helpers.ts            # Utility functions and helpers
│   ├── research-agent.spec.ts         # Core functionality tests
│   ├── research-agent-artifact.spec.ts # Artifact UI tests
│   └── research-agent-integration.spec.ts # Integration tests
├── screenshots/                       # Test screenshots (auto-generated)
└── README.md                         # This file
```

## Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   pnpm install
   ```

2. **Install Playwright Browsers**:
   ```bash
   npx playwright install
   ```

3. **Start the Development Server**:
   ```bash
   pnpm dev
   ```

## Running Tests

### All Tests
```bash
# Run all e2e tests
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in headed mode (visible browser)
pnpm test:e2e:headed

# Run in debug mode
pnpm test:e2e:debug
```

### Specific Test Suites
```bash
# Core research agent functionality
pnpm test:research-agent

# Artifact UI and interactions
pnpm test:research-artifact

# Integration and workflow tests
pnpm test:research-integration
```

### Test Filtering
```bash
# Run specific test by name
npx playwright test --grep "should send a research query"

# Run tests in specific file
npx playwright test research-agent.spec.ts

# Run tests with specific tag
npx playwright test --grep "@smoke"
```

## Test Categories

### 1. Core Chat Interface Tests (`research-agent.spec.ts`)

- **Page Loading**: Verifies the research agent page loads correctly
- **Chat Interface**: Tests message input, send button, and basic interactions
- **Message Exchange**: Validates user message sending and agent responses
- **Loading States**: Checks loading indicators and processing states
- **Error Handling**: Tests API error scenarios and timeout handling
- **Mobile Support**: Validates mobile viewport and touch interactions
- **Accessibility**: Keyboard navigation and ARIA label compliance

### 2. Artifact UI Tests (`research-agent-artifact.spec.ts`)

- **Section Display**: Tests research report section rendering
- **Status Indicators**: Validates different section statuses (pending, processing, completed)
- **Research Badges**: Verifies "Research Required" and "Research Done" indicators
- **Dynamic Updates**: Tests real-time section content updates
- **Markdown Rendering**: Validates markdown content display
- **Iteration Tracking**: Tests section iteration numbers
- **Toggle Functionality**: Artifact visibility controls
- **Scroll Behavior**: Large content scrolling

### 3. Integration Tests (`research-agent-integration.spec.ts`)

- **Complete Workflow**: End-to-end research agent flow
- **Multiple Queries**: Consecutive query handling
- **Real-time Updates**: Progressive section status changes
- **Error Recovery**: Graceful error handling and recovery
- **State Persistence**: Artifact state across interactions
- **Concurrent Updates**: Multiple section updates simultaneously
- **Large Reports**: Performance with large research reports
- **Stress Testing**: Rapid interactions and load testing
- **Performance Benchmarks**: Load time and response time measurement

## Mock Data and API Responses

The tests use comprehensive mock data located in `fixtures/research-agent-mocks.ts`:

- **Streaming Responses**: Mock SSE (Server-Sent Events) for real-time updates
- **Research Report Data**: Complete mock research reports with sections
- **Section Updates**: Mock section status and content updates
- **API Responses**: Thread creation, run execution, and error responses
- **Loading States**: Various loading and processing states

## Test Helpers and Utilities

The `utils/test-helpers.ts` file provides:

- **ResearchAgentTestHelper**: Main helper class with common test actions
- **SELECTORS**: Centralized element selectors
- **TEST_QUERIES**: Pre-defined test research queries
- **MockAPIBuilder**: Utility for creating mock API responses
- **TestDataGenerator**: Random test data generation
- **PerformanceHelper**: Performance measurement utilities

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { ResearchAgentTestHelper } from './utils/test-helpers';

test.describe('New Test Suite', () => {
  let helper: ResearchAgentTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ResearchAgentTestHelper(page);
    await helper.navigateToResearchAgent();
  });

  test('should test specific functionality', async ({ page }) => {
    await helper.waitForChatInterface();
    await helper.sendMessage('Test message');
    await helper.waitForAgentResponse();
    
    // Add specific assertions
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Using Mock Data

```typescript
import { createMockResearchData } from './fixtures/research-agent-mocks';

const mockData = createMockResearchData({
  topic: 'Custom Topic',
  sections: {
    sections: [
      {
        name: 'Custom Section',
        description: 'Test description',
        research: true,
        content: 'Test content'
      }
    ]
  }
});

await helper.simulateArtifactUpdate(mockData);
```

## Configuration

Test configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Timeout**: 30 seconds default
- **Retries**: 2 on CI, 0 locally
- **Browsers**: Chrome, Firefox, Safari (desktop and mobile)
- **Reports**: HTML reporter with trace on failure

## Performance Testing

Tests include performance benchmarks:

- **Page Load Time**: Should be < 5 seconds
- **Message Response Time**: Should be < 3 seconds
- **Artifact Rendering**: Should be < 2 seconds
- **Stress Testing**: Multiple rapid interactions

## Debugging

### Debug Mode
```bash
# Run single test in debug mode
npx playwright test --debug research-agent.spec.ts

# Run with headed browser
npx playwright test --headed
```

### Screenshots
Tests automatically capture screenshots on failure. Custom screenshots:

```typescript
await helper.takeScreenshot('test-state');
```

### Console Logging
Enable console and network logging:

```typescript
await helper.logConsoleErrors();
await helper.logNetworkRequests();
```

## Continuous Integration

Tests are designed to run in CI environments:

- Headless by default
- Retry on failure
- HTML reports with traces
- Screenshot capture on failure

## Best Practices

1. **Use Test Helpers**: Leverage the helper classes for common actions
2. **Mock API Calls**: Always mock external API calls for consistent testing
3. **Wait for Elements**: Use proper waiting strategies for dynamic content
4. **Descriptive Test Names**: Use clear, descriptive test names
5. **Isolate Tests**: Each test should be independent and isolated
6. **Clean Mock Data**: Use the factory functions for generating test data
7. **Performance Awareness**: Include performance assertions where relevant

## Troubleshooting

### Common Issues

1. **Timeouts**: Increase timeout for slow operations
2. **Flaky Tests**: Add proper waits and stable selectors
3. **API Mocking**: Ensure all API endpoints are properly mocked
4. **Element Selection**: Use data-testid attributes for stable selection

### Getting Help

- Check Playwright documentation: https://playwright.dev/
- Review test helper methods in `utils/test-helpers.ts`
- Examine mock data structure in `fixtures/research-agent-mocks.ts`
- Use debug mode to step through test execution 