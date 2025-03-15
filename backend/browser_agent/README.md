# Browser Agent

A vision-enabled web-browsing agent capable of controlling the mouse and keyboard, based on the Web Voyager architecture.

## Description

This agent works by viewing annotated browser screenshots for each turn, then choosing the next step to take. It uses a basic reasoning and action (ReAct) loop architecture with these unique aspects:

- Utilizes Set-of-Marks image annotations to serve as UI affordances for the agent
- Controls both mouse and keyboard in the browser
- Uses Playwright for browser automation

## Setup

### Requirements

1. Python 3.12 or higher
2. Install the required dependencies:

```bash
pip install -e .
```

3. Install Playwright browsers:

```bash
playwright install
```

## Usage

The browser agent can be invoked through the LangGraph framework:

```python
from browser_graph.graph import configure_and_get_graph

# Configure the graph with optional parameters
graph = configure_and_get_graph()

# Execute the graph with an initial task
result = graph.invoke({
    "task": "Search for the latest news on AI and summarize the top 3 results",
    "url": "https://www.google.com"
})
```

## Features

- Browser initialization and control
- Screenshot capture and annotation
- Mouse and keyboard interaction
- Web navigation and task execution 