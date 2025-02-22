# Thothy - AI Agent Platform

Thothy is an intelligent platform that allows you to interact with various AI agents through a modern web interface. It provides a seamless way to manage and run different types of AI agents for various tasks.

## Getting Started

These instructions will help you set up the project locally and get it running on your machine.

### Prerequisites

-   Node.js (latest LTS version)
-   Python 3.8+
-   npm or yarn

### Directory Structure

```bash
thothy/
├── agents/
├── backend/
├── frontend/
```

#### agents/

This directory contains the AI agents. Each agent has its own directory with the following structure:

```bash
memory_chat_agent/
├── src/
│   ├── chatbot_graph/
│   ├── memory_graph/
│   └── ...
├── pyproject.toml
├── langgraph.json
└── ...
```

The pyproject and langgraph configuration file is located just under agent directory. And the source code is located in `src` directory.
If you have one more graphs, you can add more directories under `src` directory. The graph directory name has "\_graph" suffix.

#### backend/

This directory contains the backend server. It is built with Python and FastAPI.

```bash
cd backend
```

### Installation

1. Clone the repository

```bash
git clone https://github.com/realbits-lab/thothy.git
cd thothy
```

2. Set up Python environment

```bash
# Set Python path
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Install Python dependencies
cd backend
pip install -r requirements.txt
```

3. Install frontend dependencies

```bash
cd frontend
yarn install
```

4. Start the development servers

Backend:

```bash
cd backend
python run.py
```

Frontend:

```bash
cd frontend
yarn dev
```

## Usage

1. Access the web interface at `http://localhost:3000`
2. Browse available AI agents
3. Select an agent to use
4. Run the agent with your desired inputs

## Features

-   Modern web interface for AI agent interaction
-   Multiple agent support
-   Easy agent selection and management
-   Real-time agent execution

## Built With

-   [Next.js](https://nextjs.org/) - Frontend framework
-   [Python](https://www.python.org/) - Backend server
-   [Material-UI](https://mui.com/) - UI components

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Copyright 2024 Realbits Lab

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
