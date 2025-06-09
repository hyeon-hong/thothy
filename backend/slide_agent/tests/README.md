# Slide Agent Tests

This directory contains comprehensive tests for the slide agent, including unit tests for individual nodes and integration tests for the complete workflow.

## Test Structure

The test suite is organized as follows:

- `conftest.py` - Shared fixtures and test configuration
- `test_slide_nodes.py` - Main test file with comprehensive node tests
- `pytest.ini` - Pytest configuration
- `requirements.txt` - Test dependencies
- `run_tests.py` - Test runner script
- `README.md` - This documentation

## What's Tested

### Node Tests
- **create_presentation_node**: Tests the presentation creation functionality
  - Success scenarios with valid input
  - Error handling for database failures
  - Minimal state handling
  - Output format validation

- **generate_titles_node**: Tests the title generation functionality
  - Success scenarios with valid presentation ID
  - Error handling for title generation failures
  - Missing presentation ID handling
  - Output format validation

### Graph Tests
- **Compiled Graph**: Tests the complete slide agent workflow
  - End-to-end successful execution
  - Error handling at different stages
  - Graph structure validation
  - State flow between nodes

### Integration Tests
- **Complete Workflow**: Tests the entire presentation creation process
  - Document processing and summary generation
  - Presentation creation and title generation
  - Final output validation

## Running Tests

### Prerequisites

Install test dependencies:
```bash
pip install -r requirements.txt
```

### Quick Start

Run all tests:
```bash
python run_tests.py
```

### Test Options

Run with coverage:
```bash
python run_tests.py --coverage
```

Run only unit tests:
```bash
python run_tests.py --unit
```

Run only integration tests:
```bash
python run_tests.py --integration
```

Run tests in parallel:
```bash
python run_tests.py --parallel
```

Skip slow tests:
```bash
python run_tests.py --fast
```

Run with verbose output:
```bash
python run_tests.py --verbose
```

Run a specific test:
```bash
python run_tests.py --test test_slide_nodes.py::TestCreatePresentationNode::test_create_presentation_node_success
```

### Direct Pytest Usage

You can also run tests directly with pytest:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=slide_graph --cov-report=html

# Run specific test class
pytest tests/test_slide_nodes.py::TestCreatePresentationNode

# Run with markers
pytest -m unit
pytest -m integration
pytest -m "not slow"
```

## Test Fixtures

The test suite includes comprehensive fixtures for mocking:

- `mock_presentation_state` - Basic presentation state for testing
- `mock_slide_config` - Configuration for slide agent
- `mock_presentation_sql_model` - Mock database model
- `mock_logging_service` - Mock logging service
- `mock_base_store` - Mock LangGraph store

## Test Coverage

The tests cover:

- ✅ Node function logic and error handling
- ✅ Graph compilation and execution
- ✅ State transitions between nodes
- ✅ Handler mocking and verification
- ✅ Edge cases and error conditions
- ✅ Output format validation
- ✅ End-to-end workflow testing

## Writing New Tests

When adding new tests:

1. Follow the existing naming conventions
2. Use appropriate fixtures from `conftest.py`
3. Mock external dependencies properly
4. Test both success and failure scenarios
5. Add appropriate test markers (`unit`, `integration`, `slow`)
6. Document test purpose clearly

Example test structure:
```python
@pytest.mark.unit
async def test_new_functionality(mock_state, mock_config):
    """Test description explaining what is being tested."""
    
    # Setup
    # ... arrange test data
    
    # Execute
    result = await function_under_test(mock_state, mock_config)
    
    # Assert
    assert result["expected_field"] == expected_value
    assert result["error"] is None
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure you're running tests from the correct directory
2. **Async Test Issues**: Make sure async tests use `async def` and are properly awaited
3. **Mock Issues**: Verify that all external dependencies are properly mocked
4. **Path Issues**: Use relative paths in tests and fixtures

### Debug Mode

For debugging failed tests:
```bash
pytest --pdb  # Drop into debugger on failure
pytest -s     # Don't capture output
pytest -vv    # Very verbose output
```

## CI/CD Integration

These tests are designed to be run in CI/CD pipelines. The test runner returns appropriate exit codes and supports parallel execution for faster CI runs.

Example CI command:
```bash
python run_tests.py --coverage --parallel --fast
``` 