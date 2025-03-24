# Backend Tests

This directory contains tests for the backend agent infrastructure.

## Available Tests

1. **Basic Memory Test**: Tests that memory functionality works by simulating memory extraction and retrieval.
2. **Staff Agent Memory Test**: Tests the full staff agent memory functionality (requires proper LangSmith configuration).

## Running Tests

To run all tests:

```bash
python backend/tests/run_test.py
```

To run a specific test directly:

```bash
python backend/tests/test_basic_memory.py
```

## Adding Tests

1. Create a new test file with an async test function
2. Add the test to `run_test.py` by creating a new runner function
3. Add the test to the `tests` list in `run_test.py`

## Test Environment

- Tests disable LangSmith tracing by default
- The full staff agent test is commented out by default to avoid LangSmith errors
- If you want to run the full staff agent test, you need to:
  1. Configure LangSmith API keys
  2. Uncomment the staff memory test in `run_test.py` 