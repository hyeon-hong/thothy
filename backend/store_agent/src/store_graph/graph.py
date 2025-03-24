from typing import List
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END, MessagesState
from langchain.embeddings import init_embeddings
import requests
from bs4 import BeautifulSoup
from langgraph.store.memory import InMemoryStore
import uuid

# Define the state schema


class State(MessagesState):
    urls: List[str] | None = None
    content: List[str] | None = None
    chunks: List[str] | None = None
    summary: str | None = None
    user_message: str | None = None
    chunk_count: int | None = None
    namespace: tuple | None = None

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


def store_chunks(state: State, store: InMemoryStore):
    # Store each chunk in the InMemoryStore
    for chunk in state["chunks"]:
        memory_id = str(uuid.uuid4())
        store.put(
            namespace=state["namespace"],
            key=memory_id,
            value={"text": chunk},
            index=["text"]
        )

    return {"store_status": "success"}


def summarize_process(state: State):
    """Summarize the processing results"""
    # Calculate average chunk size
    total_chars = sum(len(chunk) for chunk in state['chunks'])
    avg_chunk_size = total_chars / len(state['chunks'])

    summary = f"""
    Processing Complete:
    - Number of URLs processed: {len(state['urls'])}
    - Total content chunks created: {state['chunk_count']}
    - Average chunk size: {avg_chunk_size:.2f} characters
    - URLs processed: {', '.join(state['urls'])}
    """
    return {"summary": summary}


# Create the graph
workflow = StateGraph(State)

# Initialize store with embedding configuration
store = InMemoryStore(
    index={
        "embed": init_embeddings("openai:text-embedding-3-small"),
        "dims": 1536,  # OpenAI embedding dimensions
        "fields": ["$"]  # Embed all fields
    }
)

# Add nodes
workflow.add_node("extract_urls", extract_urls)
workflow.add_node("fetch_content", fetch_content)
workflow.add_node("chunk_content", chunk_content)
# Add store_chunks node with store dependency
workflow.add_node(
    "store_chunks",
    lambda state: store_chunks(state, store=store)
)
workflow.add_node("summarize", summarize_process)

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
