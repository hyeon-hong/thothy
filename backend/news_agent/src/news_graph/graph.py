"""News agent using LangGraph."""

import logging
import json
from typing import Sequence, TypedDict, Union
from pydantic import BaseModel

from langchain.chat_models import init_chat_model
from langchain.tools import tool

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from news_graph.configuration import NewsConfigurable
from news_graph.tools import fetch_hackernews_articles
from langgraph.prebuilt import ToolNode

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.WARNING)
# Set specific loggers for langgraph and related libraries to WARNING level
logging.getLogger("langgraph").setLevel(logging.WARNING)
logging.getLogger("langchain").setLevel(logging.WARNING)
logging.getLogger("langmem").setLevel(logging.WARNING)


class NewsPost(BaseModel):
    """Store news-related information."""
    title: str
    content: str
    author: str
    category: str
    timestamp: str
    summary: str | None = None
    tags: list[str] | None = None


class ToolOutput(TypedDict):
    """Output from a tool call."""
    tool: str
    tool_input: dict
    tool_output: Union[str, dict, list]
    log: str


class AgentState(MessagesState):
    """State for the news agent."""
    tool_outputs: Sequence[ToolOutput]


class HackerNewsInput(BaseModel):
    """Input schema for get_hacker_news tool."""
    limit: int = 5


@tool
async def get_hacker_news(input_dict: HackerNewsInput) -> str:
    """
    Fetch the latest articles from Hacker News.

    Args:
        input_dict: HackerNewsInput containing:
            limit: Number of articles to fetch (default: 5)
    """
    logging.warning(f"get_hacker_news input: {input_dict}")
    try:
        articles = await fetch_hackernews_articles(input_dict.limit)
        return json.dumps(articles, indent=2)
    except Exception as e:
        logging.error(f"Error in get_hacker_news: {str(e)}")
        raise


# Create the tool node with our tools
tools = [get_hacker_news]
tool_node = ToolNode(tools)

llm = init_chat_model(
    "gemini-2.5-flash-preview-05-20",
    model_provider="google_genai",
    temperature=0.7
).bind_tools(tools)


async def should_continue(state: MessagesState):
    """Determine if we should continue running tools or end."""
    messages = state["messages"]
    last_message = messages[-1]
    if last_message.tool_calls:
        return "tools"
    return END


async def call_model(state: MessagesState):
    """Call the model with the current state."""
    system_msg = (
        "You are a helpful news assistant with access to one main function:\n"
        "1. get_hacker_news: Fetch latest articles from Hacker News\n"
        "Help users by fetching news based on their requests. When fetching "
        "news, you can specify how many articles to fetch."
    )
    messages = [{"role": "system", "content": system_msg}] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}


# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, NewsConfigurable)

# Add the nodes we will cycle between
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)

# Add edges
workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue, ["tools", END])
workflow.add_edge("tools", "agent")

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver())
graph.name = "news_graph"

__all__ = ["graph"]
