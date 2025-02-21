# memory_agent

This is a simple agent that can be used to store and retrieve memories.

## Usage

The memory agent operates in two parallel modes:

1. **Patch Memory**: Updates existing memory states by patching them

    - Fetches existing state
    - Extracts new memories
    - Updates the state if changes are detected

2. **Semantic Memory**: Stores new memory events
    - Extracts semantic memories from messages
    - Inserts new memories as individual events
    - Each memory gets a unique ID and timestamp

The process begins with a scheduling step that can optionally delay processing to allow for conversation completion. The memory types are then processed in parallel based on the schema configuration.
