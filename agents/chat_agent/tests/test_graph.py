import asyncio
from chat_graph.graph import graph


async def test_chat_graph():
    """Test the chat graph with a simple message."""
    config = {
        "configurable": {"user_id": "alice-test"}
    }
    input_message = {
        "role": "user",
        "content": "My name is Alice, and I love pizza."
    }

    # Stream the response
    async for chunk in graph.astream(
        {"messages": [input_message]},
        config,
        stream_mode="values"
    ):
        print(f"Response: {chunk['messages'][-1].content}")


if __name__ == "__main__":
    asyncio.run(test_chat_graph())
