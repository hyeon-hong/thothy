"""News agent using LangGraph."""

import logging
from pydantic import BaseModel

from langchain.chat_models import init_chat_model

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langmem import create_memory_store_manager
from news_graph.configuration import NewsConfigurable

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.WARNING)
# Set specific loggers for langgraph and related libraries to WARNING level
logging.getLogger("langgraph").setLevel(logging.WARNING)
logging.getLogger("langchain").setLevel(logging.WARNING)
logging.getLogger("langmem").setLevel(logging.WARNING)

llm = init_chat_model(
    "gpt-4-turbo-preview",
    model_provider="openai",
    temperature=0.7
)

# Create memory manager for news-related information
class NewsItem(BaseModel):
    """Store news-related information."""
    title: str
    content: str
    source: str
    category: str
    timestamp: str
    summary: str | None = None

namespace = ("news", "{user_id}", "articles")

memory_manager = create_memory_store_manager(
    "anthropic:claude-3-sonnet-20240229",
    schemas=[NewsItem],
    enable_inserts=True,
    enable_deletes=True,
    instructions="Extract and organize news information",
    namespace=namespace,
)

async def news_processor(
    state: MessagesState,
    config: NewsConfigurable,
) -> dict:
    """Process news-related requests and generate responses."""
    system_msg = (
        "You are a helpful news assistant. Help the user find, summarize, "
        "and understand news articles. Provide balanced and factual "
        "information from reliable sources."
    )

    # Invoke the LLM
    response = llm.invoke(
        [{"role": "system", "content": system_msg}] + state["messages"]
    )

    return {"messages": response}

"""Build and return the news graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, NewsConfigurable)

# Add news processor node
workflow.add_node("news_processor", news_processor)

# Add edges - start at news processor and can end after news processor
workflow.add_edge(START, "news_processor")
workflow.add_edge("news_processor", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver())
graph.name = "news_graph"

__all__ = ["graph"] 