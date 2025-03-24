import logging
import os
from typing import List
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END, MessagesState
import requests
from bs4 import BeautifulSoup
import uuid
from langgraph.store.base import BaseStore
import datetime

# Import utility functions
try:
    # Try importing normally first (for production)
    from backend.libs.utils import (
        initialize_store,
    )
except ImportError:
    # If that fails, try a relative import approach
    import sys
    from pathlib import Path
    # Add the backend directory to sys.path
    root_dir = Path(__file__).parent.parent.parent.parent
    if str(root_dir) not in sys.path:
        sys.path.append(str(root_dir))
    # Now try the import again
    from libs.utils import (
        initialize_store,
    )

# Initialize store with embedding configuration
store = initialize_store()

# Default UUID for system-level operations
DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID")


class State(MessagesState):
    urls: List[str] | None = None
    content: List[str] | None = None
    chunks: List[str] | None = None
    summary: str | None = None
    user_message: str | None = None
    chunk_count: int | None = None
    namespace: tuple | None = None
    user_id: str = DEFAULT_USER_ID  # Default to the system UUID

# Schema for URL extraction


class URLExtraction(BaseModel):
    urls: List[str] = Field(
        description="List of URLs extracted from the message")


def extract_urls(state: State):
    """Extract URLs from user message"""
    # You can use your LLM here to extract URLs more intelligently if needed
    # For now using a simple example
    message = state["messages"][-1].content
    # Basic URL extraction using simple string matching
    urls = [
        word for word in message.split()
        if word.startswith(("http://", "https://"))
    ]
    return {"urls": urls, "namespace": ("knowledges", "chunks")}


def fetch_content(state: State):
    """Fetch content from each URL"""
    content_list = []
    for url in state["urls"]:
        try:
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            text = soup.get_text()
            # Clean up text
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip()
                      for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            content_list.append(text)
        except Exception as e:
            content_list.append(f"Error fetching {url}: {str(e)}")

    return {"content": content_list}


def chunk_content(state: State):
    """Split content into manageable chunks"""
    chunks = []
    chunk_size = 1000  # Adjust based on your needs

    for content in state["content"]:
        # Simple chunking by character count
        # You might want to use more sophisticated chunking methods
        current_chunk = ""
        words = content.split()

        for word in words:
            if len(current_chunk) + len(word) + 1 <= chunk_size:
                current_chunk += " " + word if current_chunk else word
            else:
                chunks.append(current_chunk)
                current_chunk = word

        if current_chunk:
            chunks.append(current_chunk)

    return {
        "chunks": chunks,
        "chunk_count": len(chunks)
    }


def store_chunks(state: State, store: BaseStore):
    # Store each chunk in the ReconnectingPostgresStore
    for chunk in state["chunks"]:
        memory_id = str(uuid.uuid4())
        # Ensure user_id is a valid UUID, fallback to DEFAULT_USER_ID if not
        try:
            user_id = state.get("user_id", DEFAULT_USER_ID)
            # Validate UUID format
            uuid.UUID(user_id)
        except ValueError:
            user_id = DEFAULT_USER_ID

        store.put(
            namespace=state["namespace"],
            key=memory_id,
            value={
                "text": chunk,
                "user_id": user_id,
                "created_at": datetime.datetime.now().isoformat(),
            },
            index=["text", "user_id"]
        )

    return {"store_status": "success"}


def summarize_process(state: State, store: BaseStore):
    """Summarize the processing results"""
    # Calculate average chunk size
    total_chars = sum(len(chunk) for chunk in state['chunks'])
    avg_chunk_size = total_chars / len(state['chunks'])
    knowledges = store.search(
        ("knowledges",),
        query="What is LangGraph?",
        limit=5
    )
    logging.info(f"Knowledges: {knowledges}")
    knowledge_context = "\n\nRelevant Knowledge:\n" + "\n".join(
        [knowledge.value["text"] for knowledge in knowledges]
    ) if knowledges else ""

    summary = f"""
    Processing Complete:
    - Number of URLs processed: {len(state['urls'])}
    - Total content chunks created: {state['chunk_count']}
    - Average chunk size: {avg_chunk_size:.2f} characters
    - URLs processed: {', '.join(state['urls'])}
    - Knowledge context: {knowledge_context}
    """
    return {"summary": summary}


# Create the graph
workflow = StateGraph(State)

# Add nodes
workflow.add_node("extract_urls", extract_urls)
workflow.add_node("fetch_content", fetch_content)
workflow.add_node("chunk_content", chunk_content)
# Add store_chunks node with store dependency
workflow.add_node(
    "store_chunks",
    lambda state: store_chunks(state, store=store)
)
workflow.add_node(
    "summarize",
    lambda state: summarize_process(state, store=store)
)
# workflow.add_node("store_chunks", store_chunks)
# workflow.add_node("summarize", summarize_process)

# Add edges
workflow.add_edge(START, "extract_urls")
workflow.add_edge("extract_urls", "fetch_content")
workflow.add_edge("fetch_content", "chunk_content")
workflow.add_edge("chunk_content", "store_chunks")
workflow.add_edge("store_chunks", "summarize")
workflow.add_edge("summarize", END)

# Compile the graph
graph = workflow.compile(store=store)
graph.name = "store_graph"

__all__ = ["graph"]
