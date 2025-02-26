import asyncio
import os

from dotenv import load_dotenv
from psycopg import Connection
from langgraph.store.postgres import PostgresStore
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

    load_dotenv()
    db_url = os.getenv('SUPABASE_URL')
    conn = Connection.connect(db_url, autocommit=True)
    store = PostgresStore(
        conn,
        index={
            "dims": 1536,
            "embed": "openai:text-embedding-3-small",
            "fields": ["test-memory"],
        }
    )
    # Search for existing memories
    namespace = ("memories", "test-user-123", "triples")
    memories = store.search(namespace, query=str(
        state["messages"][-1].content))
    print(f"memories: {memories}")
    memories = []
    print("done waiting")
    print(f"events: {events}")

asyncio.run(main())
