# Thothy Monorepo Structure

This repository is organized as a monorepo containing multiple Python projects, each with its own configuration and dependencies while sharing common settings.

## Repository Structure

```
thothy/
├── pyproject.toml               # Root configuration file with common settings
├── agents/                      # Directory containing multiple agent projects
│   ├── chat_agent/              # Chat agent project
│   │   ├── pyproject.toml       # Project-specific configuration
│   │   └── src/                 # Source code
│   ├── research_agent/          # Research agent project
│   │   ├── pyproject.toml       # Project-specific configuration
│   │   └── src/                 # Source code
│   ├── security/                # Security agent project
│   │   ├── pyproject.toml       # Project-specific configuration
│   │   └── src/                 # Source code
│   └── open_deep_research_agent/# Open Deep Research agent project
│       ├── pyproject.toml       # Project-specific configuration
│       └── src/                 # Source code
├── tests/                       # Shared test utilities and integration tests
└── tools/                       # Shared tools and utilities
```

## Working with pyproject.toml Files

### Root pyproject.toml

The root `pyproject.toml` file contains:
- Common build system configuration
- Global project metadata
- Shared development dependencies
- Common tool configurations (ruff, mypy, etc.)

These settings provide default configurations that apply to the entire monorepo.

> **Note:** The root `pyproject.toml` is configured to not install any packages when running `pip install -e .` from the root directory. This is intentional, as each agent should be installed individually. Use the management script described below to install specific or all agents.

### Project-Specific pyproject.toml Files

Each project directory contains its own `pyproject.toml` file with:
- Project-specific metadata (name, version, description)
- Project-specific dependencies
- Package configuration for that specific project

## Development Workflow

### Installing Dependencies

You can install dependencies using our management script or manually:

#### Using the Management Script

```bash
# Install a specific agent
python tools/monorepo_management.py install chat_agent

# Install a specific agent with development dependencies
python tools/monorepo_management.py install chat_agent --dev

# Install all agents
python tools/monorepo_management.py install all

# Install all agents with development dependencies
python tools/monorepo_management.py install all --dev
```

#### Manual Installation

To install dependencies for a specific project:

```bash
# Change to the project directory
cd agents/chat_agent

# Install the project in development mode
pip install -e .

# Install development dependencies
pip install -e ".[dev]"
```

To install all projects manually, you need to repeat the above process for each project.

### Building Projects

To build a specific project:

```bash
# Change to the project directory
cd agents/chat_agent

# Build the project
python -m build
```

### Running Tests

To run tests for a specific project:

```bash
# Change to the project directory
cd agents/chat_agent

# Run tests
pytest
```

## Adding a New Project

To add a new project to the monorepo:

1. Create a new directory within the appropriate parent directory (e.g., `agents/new_agent`)
2. Create a `pyproject.toml` file in the new directory with project-specific settings
3. Set up the project structure (src/, tests/, etc.)
4. Inherit common configurations from the root `pyproject.toml` where appropriate

## Benefits of This Structure

- **Common Configuration**: Shared settings in the root pyproject.toml reduce duplication
- **Project Independence**: Each project manages its own dependencies and can be developed independently
- **Flexibility**: Projects can override common settings as needed
- **Selective Installation**: Install only the projects you need to work with
- **Shared Code**: Common code can be extracted into shared packages within the monorepo 