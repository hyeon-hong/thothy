"""Blog agent using LangGraph."""

import logging
from pydantic import BaseModel

from langchain.chat_models import init_chat_model

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langmem import create_memory_store_manager
from blog_graph.configuration import BlogConfigurable

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

# Create memory manager for blog-related information


class BlogPost(BaseModel):
    """Store blog-related information."""
    title: str
    content: str
    author: str
    category: str
    timestamp: str
    summary: str | None = None
    tags: list[str] | None = None


async def blog_processor(
    state: MessagesState,
    config: BlogConfigurable,
) -> dict:
    """Process blog-related requests and generate responses."""
    system_msg = (
        "You are a helpful blog assistant. Help the user find, summarize, "
        "and understand blog posts. Provide insights and analysis about "
        "blog content and trends."
    )

    # Invoke the LLM
    response = llm.invoke(
        [{"role": "system", "content": system_msg}] + state["messages"]
    )

    return {"messages": response}

"""Build and return the blog graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, BlogConfigurable)

# Add blog processor node
workflow.add_node("blog_processor", blog_processor)

# Add edges - start at blog processor and can end after blog processor
workflow.add_edge(START, "blog_processor")
workflow.add_edge("blog_processor", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver())
graph.name = "blog_graph"

__all__ = ["graph"]
