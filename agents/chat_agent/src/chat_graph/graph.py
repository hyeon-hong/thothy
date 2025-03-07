"""Simple chat agent using LangGraph."""

import os
import logging
from dotenv import load_dotenv
from pydantic import BaseModel
from psycopg import Connection, OperationalError
from typing import Any, Dict

from langchain.chat_models import init_chat_model

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.base import BaseStore
from langgraph.store.postgres import PostgresStore

# We're using create_memory_store_manager but not ReflectionExecutor
from langmem import ReflectionExecutor, create_memory_store_manager
from chat_graph.configuration import ChatConfigurable

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.WARNING)
# Set specific loggers for langgraph and related libraries to WARNING level
logging.getLogger("langgraph").setLevel(logging.WARNING)
logging.getLogger("langchain").setLevel(logging.WARNING)
logging.getLogger("langmem").setLevel(logging.WARNING)


class ReconnectingPostgresStore:
    """PostgresStore wrapper that handles reconnection."""

    def __init__(self, db_url: str, index: Dict[str, Any]):
        """Initialize with database URL and index configuration."""
        self.db_url = db_url
        self.index = index
        self.store = None
        self._connect()

    def _connect(self) -> None:
        """Establish database connection and setup store."""
        try:
            conn = Connection.connect(self.db_url, autocommit=True)
            self.store = PostgresStore(conn)
            self.store.index = self.index
            self.store.setup()
        except Exception as e:
            raise ValueError(f"Failed to connect to database: {e}")

    def _ensure_connection(self) -> None:
        """Ensure database connection is active, reconnect if needed."""
        try:
            # Test connection with a simple query
            self.store.conn.execute("SELECT 1")
        except (OperationalError, Exception):
            # Connection is closed or error occurred, try to reconnect
            self._connect()

    def search(self, *args, **kwargs):
        """Synchronous version of asearch."""
        self._ensure_connection()
        return self.store.search(*args, **kwargs)

    async def asearch(self, *args, **kwargs):
        """Wrap asearch with connection check."""
        self._ensure_connection()
        return await self.store.asearch(*args, **kwargs)

    def put(self, *args, **kwargs):
        """Synchronous version of aput."""
        self._ensure_connection()
        return self.store.put(*args, **kwargs)

    async def aput(self, *args, **kwargs):
        """Wrap aput with connection check."""
        self._ensure_connection()
        return await self.store.aput(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Synchronous version of adelete."""
        self._ensure_connection()
        return self.store.delete(*args, **kwargs)

    async def adelete(self, *args, **kwargs):
        """Wrap adelete with connection check."""
        self._ensure_connection()
        return await self.store.adelete(*args, **kwargs)

    def setup(self):
        """Setup the store."""
        self._ensure_connection()
        self.store.setup()


# Get database URL
load_dotenv()
db_url = os.getenv("SUPABASE_DATABASE_URL")
if not db_url:
    raise ValueError("SUPABASE_DATABASE_URL environment variable is not set")

# Initialize store with reconnection capability
store = ReconnectingPostgresStore(
    db_url=db_url,
    index={
        "dims": 1536,
        "embed": "openai:text-embedding-3-small",
        # Embed entire document (default)
        "fields": ["$"],
    }
)

llm = init_chat_model("gpt-4o-mini", model_provider="openai", temperature=0)


# Create memory manager to extract memories from conversations
class Triple(BaseModel):
    """Store all new facts, preferences, and relationships as triples."""
    subject: str
    predicate: str
    object: str
    context: str | None = None


namespace = ("memories", "{user_id}", "triples")

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


async def chatbot(
    state: MessagesState,
    config: ChatConfigurable,
    *,
    store: BaseStore
) -> dict:
    """Chat node that processes messages and generates responses."""
    # Get user_id from config
    configurable = ChatConfigurable.from_runnable_config(config)
    user_id = configurable.user_id

    # Use the same namespace format as defined above
    namespace = ("memories", user_id, "triples")

    # Search for existing memories
    memories = await store.asearch(
        namespace,
        query=str(state["messages"][-1].content)
    )
    memories = []

    info = "\n".join(
        [d.value.get("data", "") for d in memories if d.value]
    )
    system_msg = (
        f"You are a helpful assistant talking to the user. "
        f"User info: {info}"
    )

    # Invoke the LLM
    response = llm.invoke(
        [{"role": "system", "content": system_msg}] + state["messages"]
    )

    # Submit memory processing task
    to_process = {
        "messages": [
            {"role": "user", "content": state["messages"][-1].content}
        ] + [response]
    }
    executor.submit(to_process, after_seconds=0.5, config=config)

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
graph = workflow.compile(checkpointer=MemorySaver(), store=store.store)
graph.name = "chat_graph"

__all__ = ["graph"]
