import asyncio

from langchain_core.messages import HumanMessage
from chat_graph.graph import graph

# Create test message
test_message = HumanMessage(
    content="My name is Alice and I love pizza"
)

# Create test state
state = {"messages": [test_message]}

# Create test config
config = {
    "configurable": {
        "thread_id": "test-thread-123",
        "user_id": "test-user-123",
        "model": "gpt-4-turbo-preview",
    }
}

# Collect all events from the stream


async def main():
    events = []
    async for event in graph.astream(state, config, stream_mode="values"):
        events.append(event)
        event["messages"][-1].pretty_print()
    print("waiting for 5 seconds")
    await asyncio.sleep(5)
    print("done waiting")
    print(f"events: {events}")

asyncio.run(main())
