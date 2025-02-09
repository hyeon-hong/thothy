# Thothy - AI Agent Platform

Thothy is an intelligent platform that allows you to interact with various AI agents through a modern web interface. It provides a seamless way to manage and run different types of AI agents for various tasks.

## Getting Started

These instructions will help you set up the project locally and get it running on your machine.

### Prerequisites

-   Node.js (latest LTS version)
-   Python 3.8+
-   npm or yarn

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

This project is licensed under the MIT License - see the LICENSE file for details.
