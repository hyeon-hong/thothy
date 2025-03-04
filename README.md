# Thothy

<div align="center">

![Thothy Logo](https://via.placeholder.com/200x200?text=Thothy)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Python Version](https://img.shields.io/badge/python-3.7%2B-blue)](https://www.python.org/downloads/)
[![GitHub Stars](https://img.shields.io/github/stars/ai.thothy/thothy?style=social)](https://github.com/ai.thothy/thothy)

**A powerful AI-driven web crawling and data extraction toolkit.**

[Getting Started](#getting-started) •
[Examples](#examples) •
[Documentation](#documentation) •
[Contributing](#contributing) •
[License](#license)

</div>

## 🚀 Overview

Thothy is a modern, flexible toolkit for web crawling, data extraction, and web automation. It provides an easy-to-use API for scraping websites, with powerful features like:

-   **Headless browser automation** via Chrome/Chromium
-   **Smart extraction** for structured data
-   **Rate-limiting** and polite crawling built-in
-   **Asynchronous support** for high-performance operations
-   **Caching capabilities** to reduce bandwidth usage
-   **Customizable agents** for specialized tasks

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/ai.thothy/thothy.git
cd thothy

# Install dependencies
pip install -r requirements.txt
```

## 🏁 Getting Started

Here's a simple example to get you started:

```python
from thothy import AsyncWebCrawler

async def main():
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url="https://example.com")
        print(result.html)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

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

-   [Quickstart Guide](docs/)
-   [API Reference](docs/)
-   [Advanced Usage](docs/)
-   [Best Practices](docs/)

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

```bash
# Initialize Git Flow in your repository
git flow init

# Start a new feature
git flow feature start feature-name

# Finish a feature (merges back to develop)
git flow feature finish feature-name

# Start a bugfix
git flow bugfix start bugfix-name

# Finish a bugfix
git flow bugfix finish bugfix-name

# Start a release
git flow release start 1.0.0

# Finish a release (merges to main and develop)
git flow release finish 1.0.0

# Start a hotfix
git flow hotfix start hotfix-name

# Finish a hotfix (merges to main and develop)
git flow hotfix finish hotfix-name
```

### 📝 Pull Request Guidelines

-   **Title**: Use a clear, descriptive title that explains the purpose of the PR
-   **Description**: Provide a detailed description of your changes, including:
    -   What changes were made
    -   Why these changes are necessary
    -   Any related issues or PRs
-   **Code Quality**:
    -   Ensure all tests pass
    -   Follow the project's coding style
    -   Keep PRs focused and small (ideally under 400 lines)
    -   Include tests for new features
-   **Review Process**:
    -   Address all review comments
    -   Keep the PR up to date with the base branch
    -   Mark the PR as "Ready for Review" when complete

### 💬 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type> #<issue_number> <description>

[optional body]

[optional footer(s)]
```

**Types**:

-   `feat`: New feature
-   `fix`: Bug fix
-   `docs`: Documentation changes
-   `style`: Code style changes (formatting, etc.)
-   `refactor`: Code refactoring
-   `perf`: Performance improvements
-   `test`: Adding or modifying tests
-   `chore`: Maintenance tasks

**Examples**:

```
feat #123 add OAuth2 login support
fix #123 resolve memory leak in long-running sessions
docs #123 update installation instructions
```

### 🔒 Automatic Issue Closing

Issues will be automatically closed when:

-   A PR is merged with the commit message containing `fixes #123` or `closes #123`
-   The PR description includes `Fixes #123` or `Closes #123`
-   The PR is linked to an issue and marked as "merged"

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

-   [Selenium](https://www.selenium.dev/) - WebDriver automation
-   [Playwright](https://playwright.dev/) - Browser automation
-   [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/) - HTML parsing
-   All contributors who have helped shape this project

---

<div align="center">
  <sub>Built with ❤️ by the Thothy team</sub>
</div>
