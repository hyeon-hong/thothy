"""Simple chat agent using LangGraph."""

import os
from dotenv import load_dotenv
from pydantic import BaseModel
from psycopg import Connection

from langchain.chat_models import init_chat_model

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.memory import InMemoryStore
from langgraph.store.base import BaseStore
from langgraph.store.postgres import PostgresStore

from langmem import ReflectionExecutor, create_memory_store_manager
from chat_graph.configuration import ChatConfigurable

# Get database URL
load_dotenv()
db_url = os.getenv('SUPABASE_URL')
if not db_url:
    raise ValueError("SUPABASE_URL environment variable is not set")

conn = Connection.connect(db_url, autocommit=True)
store = PostgresStore(
    conn,
    index={
        "dims": 1536,
        "embed": "openai:text-embedding-3-small",
        "fields": ["test-memory"],
    }
)
store.setup()

llm = init_chat_model("gpt-4o-mini", model_provider="openai", temperature=0)


# Create memory manager to extract memories from conversations
class Triple(BaseModel):
    """Store all new facts, preferences, and relationships as triples."""
    subject: str
    predicate: str
    object: str
    context: str | None = None


namespace = ("memories", "{user_id}", "triples")

# in_memory_store = InMemoryStore(
#     index={
#         "dims": 1536,
#         "embed": "openai:text-embedding-3-small",
#     }
# )

memory_manager = create_memory_store_manager(
    "anthropic:claude-3-5-sonnet-latest",
    schemas=[Triple],
    enable_inserts=True,
    enable_deletes=True,
    instructions="Extract user preferences and any other useful information",
    namespace=namespace,
)

# Wrap memory_manager to handle deferred background processing
executor = ReflectionExecutor(memory_manager, store=store)


async def chatbot(state: MessagesState, config: ChatConfigurable, *, store: BaseStore) -> dict:
    """Chat node that processes messages and generates responses."""
    print(f"store: {store}")

    # Get user_id from config
    configurable = ChatConfigurable.from_runnable_config(config)
    print(f"configurable: {configurable}")
    user_id = configurable.user_id
    print(f"Processing chat for user_id: {user_id}")

    # Use the same namespace format as defined above
    namespace = ("memories", user_id, "triples")

    # Search for existing memories
    memories = await store.asearch(namespace, query=str(
        state["messages"][-1].content))
    print(f"memories: {memories}")
    memories = []

    info = "\n".join([d.value.get("data", "") for d in memories if d.value])
    system_msg = f"You are a helpful assistant talking to the user. User info: {info}"

    # Invoke the LLM
    response = llm.invoke(
        [{"role": "system", "content": system_msg}] + state["messages"]
    )

    # Submit memory processing task
    print("Submitting memory processing task...")
    to_process = {"messages": [
        {"role": "user", "content": state["messages"][-1].content}] + [response]}
    executor.submit(to_process, after_seconds=0.5, config=config)
    print("Memory processing task submitted")

    return {"messages": response}


"""Build and return the chat graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, ChatConfigurable)

# Add chatbot node
workflow.add_node("chatbot", chatbot)

# Add edges - start at chatbot and can end after chatbot
workflow.add_edge(START, "chatbot")
workflow.add_edge("chatbot", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver(), store=store)
graph.name = "chat_agent"

__all__ = ["graph"]
