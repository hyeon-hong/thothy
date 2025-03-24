"""Common utilities for LangGraph-based agents."""

import logging
import os
from typing import Any, Dict

from dotenv import load_dotenv
from langgraph.store.postgres import PostgresStore
from langmem import ReflectionExecutor, create_memory_store_manager
from psycopg import Connection, OperationalError
from pydantic import BaseModel


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
        """Search for documents synchronously."""
        self._ensure_connection()
        return self.store.search(*args, **kwargs)

    async def asearch(self, *args, **kwargs):
        """Wrap asearch with connection check."""
        self._ensure_connection()
        return await self.store.asearch(*args, **kwargs)

    def put(self, *args, **kwargs):
        """Put documents into store synchronously."""
        self._ensure_connection()
        return self.store.put(*args, **kwargs)

    async def aput(self, *args, **kwargs):
        """Wrap aput with connection check."""
        self._ensure_connection()
        return await self.store.aput(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Delete documents from store synchronously."""
        self._ensure_connection()
        return self.store.delete(*args, **kwargs)

    async def adelete(self, *args, **kwargs):
        """Wrap adelete with connection check."""
        self._ensure_connection()
        return await self.store.adelete(*args, **kwargs)

    def setup(self):
        """Set up the store."""
        self._ensure_connection()
        self.store.setup()


class Triple(BaseModel):
    """Store all new facts, preferences, and relationships as triples."""

    subject: str
    predicate: str
    object: str
    context: str | None = None


def initialize_store():
    """Initialize the database store with reconnection capability."""
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
    
    return store


def initialize_memory_manager(
    user_id="{user_id}",
    project_id="{project_id}", 
    team_id="{team_id}",
    staff_id="{staff_id}", 
    agent_id="{agent_id}"
):
    """Initialize the memory manager for extracting memories from conversations."""
    # Namespaces contains template variables to be populated from configurable
    # values at runtime. If id is not provided, it will be set as "default".
    namespace = ("memories", user_id, project_id, team_id, staff_id, agent_id)
    
    memory_manager = create_memory_store_manager(
        "anthropic:claude-3-5-sonnet-latest",
        schemas=[Triple],
        enable_inserts=True,
        enable_deletes=True,
        instructions="Extract user's preferences and any other useful information",
        namespace=namespace,
    )
    
    return memory_manager


def initialize_executor(memory_manager, store):
    """Initialize the reflection executor with the given memory manager and store."""
    return ReflectionExecutor(memory_manager, store=store) 