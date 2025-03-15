# Browser Agent

An autonomous web browsing agent built with LangGraph, Playwright, and LLMs.

## Overview

This browser agent can:
- Navigate web pages autonomously
- Search and find information
- Click on elements 
- Type text into forms
- Scroll through content
- Answer questions based on what it discovers

## Installation

First, make sure you have the required dependencies:

```bash
pip install -e .
```

The browser agent requires Playwright, which must be installed separately:

```bash
playwright install
```

## Usage

You can run the browser agent with:

```bash
python tests/test_browser_graph.py --query xkcd
```

The `--query` parameter accepts several predefined query types:

- `xkcd`: Explains today's XKCD comic
- `news`: Summarizes top AI news stories
- `weather`: Shows weather in San Francisco
- `python`: Finds documentation for Python's asyncio
- `paris`: Lists tourist attractions in Paris
- `simple`: Answers a simple question (capital of France)

## Debugging Features

The browser agent includes comprehensive debugging features:

### Session Directories

Each run creates a unique session directory under `outputs/` with the following structure:

```
outputs/
└── 20250315_123456_a1b2c3d4/
    ├── README.md                 # Human-readable session summary
    ├── session_summary.json      # JSON summary of the session
    ├── session_log.jsonl         # Line-by-line log of all events
    ├── step_001_data.json        # Metadata for each step
    ├── step_002_data.json
    └── images/
        ├── step_001.png          # Screenshot of each step
        ├── step_002.png
        └── ...
```

### Captured Data

For each step, the agent captures:
- Screenshot of the page
- Current URL
- Action performed
- Input values
- Timestamp

### Viewing Results

After running a test, you'll see a summary in the terminal and a message showing where the full debug data was saved:

```
🏁 BROWSER AGENT COMPLETED
✅ FINAL ANSWER: The capital of France is Paris.
📁 Complete session data saved to: outputs/20250315_123456_a1b2c3d4
```

You can open the `README.md` file in the session directory for a human-readable summary.

## Development

To modify the agent's behavior, you can edit:
- `src/browser_graph/graph.py`: The LangGraph definition
- `src/browser_graph/tools.py`: Web interaction tools
- `src/browser_graph/states.py`: State definitions

## License

This project is licensed under the MIT License - see the LICENSE file for details. 