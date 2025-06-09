# Thothy

<div align="center">

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python Version](https://img.shields.io/badge/python-3.7%2B-blue)](https://www.python.org/downloads/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/realbits-lab/thothy)
[![GitHub Stars](https://img.shields.io/github/stars/realbits-lab/thothy?style=social)](https://github.com/realbits-lab/thothy)

**A powerful AI-driven web crawling and data extraction toolkit.**

[Getting Started](#getting-started) •
[Examples](#examples) •
[Documentation](#documentation) •
[Contributing](#contributing) •
[License](#license)

</div>

## 🚀 Overview

Thothy is a modular, agent-based AI automation toolkit designed for web crawling, data extraction, research report generation, chat automation, and AI-powered slide/presentation creation. It provides a flexible framework for orchestrating specialized agents, each tailored for different tasks, including:

- **Web crawling and smart data extraction** (with headless browser automation)
- **Research agent** for multi-step, LLM-driven report generation and web research
- **Chat agent** for conversational automation and integration
- **Data agent** for structured data collection and processing
- **Slide agent** for generating AI-powered presentations from prompts or outlines
- **Customizable agent framework** for building new automation workflows

Thothy leverages [LangGraph](https://github.com/langchain-ai/langgraph) for agent orchestration, supports asynchronous operations, and is designed for extensibility and high performance.

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/ai.thothy/thothy.git
cd thothy

# Install dependencies
pip install -r requirements.txt
```

## 🏁 Getting Started

Here's a command to get you started:

```bash
langgraph dev --config langgraph-develop.json
```

### Running Langgraph

Thothy uses Langgraph for orchestrating agents. You can run Langgraph in both development and production modes:

#### Development Mode

Development mode uses the `langgraph-develop.json` configuration file with authentication enabled:

```bash
langgraph dev --config langgraph-develop.json
```

#### Production Mode

Production mode uses the default `langgraph.json` configuration file (with authentication disabled):

```bash
# Using the default config file
langgraph dev

# Or explicitly specifying the config file
langgraph dev --config langgraph.json
```

#### Configuration Differences

The main difference between development and production configurations is the `disable_studio_auth` option:

- **Development**: Authentication is enabled (`disable_studio_auth: false`)
- **Production**: Authentication is disabled (`disable_studio_auth: true`)

Choose the appropriate configuration based on your security requirements and deployment environment.

#### Troubleshooting Common Issues

**Auth File Not Covered by Dependencies**

If you encounter this error:

```
ValueError: Auth file '/workspace/thothy/agents/security/auth.py' not covered by dependencies.
Add its parent directory to the 'dependencies' array in your config.
```

Make sure to include the security module in your dependencies:

```json
"dependencies": [
  "./agents/chat_agent/src/chat_graph",
  "./agents/research_agent/src/research_graph",
  "./agents/open_deep_research_agent/src/open_deep_research_graph",
  "./agents/security"
]
```

Any directory referenced in the configuration must be included in the dependencies array.

## 📚 Examples

Thothy comes with several example scripts that demonstrate its capabilities:

### Amazon Clothes Crawler

A script that crawls Amazon's clothing section and extracts product information including names, prices, ratings, reviews, and image URLs.

```bash
# Navigate to the examples directory
cd examples

# Run the Amazon clothes crawler
python amazon_clothes_crawler.py
```

See the [examples directory](examples/) for more detailed examples and documentation.

## 📖 Documentation

Comprehensive documentation is available in the [docs](docs/) directory. Key topics include:

- [Quickstart Guide](docs/)
- [API Reference](docs/)
- [Advanced Usage](docs/)
- [Best Practices](docs/)

## 🧩 Project Structure

```
thothy/
├── agents/              # Agent implementations
│   ├── chat_agent/      # Interactive chat agent
│   └── research_agent/  # Research and data collection agent
├── docs/                # Documentation
├── examples/            # Example scripts and use cases
├── frontend/            # Web interface components
├── outputs/             # Default output directory for crawled data
├── tests/               # Test suite
└── tools/               # Utility tools and helpers
```

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚙️ Development Guidelines

### 🌿 Branch Strategy

Our repository uses `develop` as the default branch instead of `main` because the project is currently under active development and not yet ready for production use. This follows the Git Flow branching model where:

- `develop`: Contains the latest development changes
- `main`: Will be used for production-ready releases in the future

When contributing, please:

1. Create your feature branches from `develop`
2. Submit PRs targeting the `develop` branch
3. Ensure your changes are up-to-date with `develop` before submitting

#### 🔄 Git Flow Commands

We use Git Flow for branch management. Here are the essential commands:
