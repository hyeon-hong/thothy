"""Blog agent using LangGraph."""

import logging
import json
import os
from typing import Sequence, TypedDict, Union
from pydantic import BaseModel

from langchain.chat_models import init_chat_model
from langchain.tools import tool

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from blog_graph.configuration import BlogConfigurable
from blog_graph.tools import post_blog
from langgraph.prebuilt import ToolNode

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.WARNING)
# Set specific loggers for langgraph and related libraries to WARNING level
logging.getLogger("langgraph").setLevel(logging.WARNING)
logging.getLogger("langchain").setLevel(logging.WARNING)
logging.getLogger("langmem").setLevel(logging.WARNING)


class BlogPost(BaseModel):
    """Store blog-related information."""
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
    """State for the blog agent."""
    tool_outputs: Sequence[ToolOutput]


@tool
async def create_blog_post(
    title: str,
    content: str,
    user_id: str,
) -> str:
    """
    Create a new blog post on Thothy.

    Args:
        title: The title of the blog post
        content: The content of the blog post (HTML format)
        user_id: The ID of the user creating the post
    """
    # TODO: user_id shoud be passed in from the frontend
    # user_id = os.getenv("BLOG_AGENT_USER_ID")
    logging.warning(f"create_blog_post user_id: {user_id}")
    result = await post_blog(title, content, user_id)
    return json.dumps(result, indent=2)


# Create the tool node with our tools
tools = [create_blog_post]
tool_node = ToolNode(tools)

llm = init_chat_model(
    "gpt-4-turbo-preview",
    model_provider="openai",
    temperature=0.7
).bind_tools(tools)


async def should_continue(state: MessagesState):
    """Determine if we should continue running tools or end."""
    messages = state["messages"]
    last_message = messages[-1]
    if last_message.tool_calls:
        return "tools"
    return END


async def call_model(state: MessagesState, config: BlogConfigurable):
    """Call the model with the current state."""
    # Get user_id from configurable
    configurable = BlogConfigurable.from_runnable_config(config)
    user_id = configurable.user_id

    # Pass user_id to create_blog_post tool
    system_msg = (
        "You are a helpful blog assistant with access to the create_blog_post "
        "function that allows you to create new blog posts on Thothy.\n\n"
        "Help users by creating blog posts based on their requests. When "
        "creating blog posts, ensure the content is well-formatted and "
        f"includes proper HTML tags with the user_id of {user_id}."
    )
    messages = [{"role": "system", "content": system_msg}] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}


# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, BlogConfigurable)

# Add the nodes we will cycle between
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)

# Add edges
workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue, ["tools", END])
workflow.add_edge("tools", "agent")

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver())
graph.name = "blog_graph"

__all__ = ["graph"]
