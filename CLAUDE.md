# Thothy Development Guidelines

## Build, Test & Lint Commands

**Frontend (Next.js):**
- `yarn dev`: Start development server
- `yarn build`: Build for production
- `yarn lint`: Run ESLint
- `yarn format`: Format with Prettier

**Backend (Python):**
- `pytest tests/test_file.py::TestClass::test_function`: Run single test
- `python -m langgraph dev --config ./langgraph.json`: Start LangGraph dev server
- `ruff check .`: Run Python linter
- `mypy .`: Run type checker

## Code Style Guidelines

### TypeScript/React
- Use functional components (no classes)
- Use descriptive variables with auxiliary verbs (isLoading, hasError)
- Minimize `'use client'`, prefer React Server Components
- Error handling: use early returns and guard clauses
- Follow mobile-first responsive design
- Use Tailwind CSS for styling
- Validate with Zod for schema validation

### Python
- Follow Google docstring style
- Type hints required for all functions
- Handle errors gracefully with appropriate exception handling
- Use f-strings for string formatting
- Follow PEP8 conventions (enforced by ruff)

### Package Management
- Use Yarn instead of npm
- Use Python 3.12+ for all backend services

### File Structure
- Use lowercase with dashes for directory names
- Organize imports: standard library, third-party, local