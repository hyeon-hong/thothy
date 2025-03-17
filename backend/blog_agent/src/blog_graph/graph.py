"""Blog agent using LangGraph."""

import logging
import json
from typing import Sequence, TypedDict, Union
from pydantic import BaseModel

from langchain.chat_models import init_chat_model
from langchain.tools import tool

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from blog_graph.configuration import BlogConfigurable
from blog_graph.tools import fetch_hackernews_articles, post_blog

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
async def get_hacker_news(limit: int = 5) -> str:
    """
    Fetch the latest articles from Hacker News.
    
    Args:
        limit: Number of articles to fetch (default: 5)
    """
    articles = await fetch_hackernews_articles(limit)
    return json.dumps(articles, indent=2)


@tool
async def create_blog_post(
    title: str,
    content: str,
    user_id: str,
    tags: list[str] | None = None
) -> str:
    """
    Create a new blog post on Thothy.
    
    Args:
        title: The title of the blog post
        content: The content of the blog post (HTML format)
        user_id: The ID of the user creating the post
        tags: Optional list of tags for the post
    """
    result = await post_blog(title, content, user_id, tags)
    return json.dumps(result, indent=2)


async def blog_processor(
    state: AgentState,
    config: BlogConfigurable,
) -> dict:
    """Process blog-related requests and generate responses."""
    system_msg = (
        "You are a helpful blog assistant with access to two main functions:\n"
        "1. get_hacker_news: Fetch latest articles from Hacker News\n"
        "2. create_blog_post: Create a new blog post on Thothy\n\n"
        "Help users by fetching news or creating blog posts based on their "
        "requests. When creating blog posts, ensure the content is well-"
        "formatted and includes proper HTML tags. When fetching news, you "
        "can specify how many articles to fetch."
    )

    # Check for tool outputs in state
    tool_outputs = getattr(state, 'tool_outputs', [])
    
    # Add tool outputs to messages if they exist
    additional_context = []
    if tool_outputs:
        for output in tool_outputs:
            msg = f"Tool {output['tool']} returned: {output['tool_output']}"
            additional_context.append({
                "role": "assistant",
                "content": msg
            })

    # Invoke the LLM
    response = llm.invoke(
        [{"role": "system", "content": system_msg}] +
        state["messages"] +
        additional_context
    )

    # Parse the response for tool calls
    if "get_hacker_news" in response.content.lower():
        limit = 5  # Default limit
        # Try to extract limit from response
        if "limit" in response.content.lower():
            try:
                limit = int(response.content.split("limit")[1].split()[0])
            except (ValueError, IndexError):
                pass
        
        articles = await get_hacker_news(limit)
        return {
            "messages": response,
            "tool_outputs": [
                {
                    "tool": "get_hacker_news",
                    "tool_input": {"limit": limit},
                    "tool_output": articles,
                    "log": f"Fetched {limit} articles from Hacker News"
                }
            ]
        }
    
    elif "create_blog_post" in response.content.lower():
        # Extract blog post details from the response
        try:
            # Extract blog post details from response lines
            lines = response.content.split("\n")
            title = next(
                line.split(":")[1].strip()
                for line in lines if "title:" in line.lower()
            )
            content = next(
                line.split(":")[1].strip()
                for line in lines if "content:" in line.lower()
            )
            user_id = config.user_id
            tags = next(
                (
                    line.split(":")[1].strip().split(",")
                    for line in lines if "tags:" in line.lower()
                ),
                None
            )
            
            result = await create_blog_post(title, content, user_id, tags)
            return {
                "messages": response,
                "tool_outputs": [
                    {
                        "tool": "create_blog_post",
                        "tool_input": {
                            "title": title,
                            "content": content,
                            "user_id": user_id,
                            "tags": tags
                        },
                        "tool_output": result,
                        "log": f"Created blog post: {title}"
                    }
                ]
            }
        except Exception as e:
            return {
                "messages": response,
                "tool_outputs": [
                    {
                        "tool": "create_blog_post",
                        "tool_input": {},
                        "tool_output": str(e),
                        "log": "Failed to create blog post"
                    }
                ]
            }
    
    return {"messages": response}


"""Build and return the blog graph."""

# Initialize graph builder with state schema
workflow = StateGraph(AgentState, BlogConfigurable)

# Add blog processor node
workflow.add_node("blog_processor", blog_processor)

# Add edges - start at blog processor and can end after blog processor
workflow.add_edge(START, "blog_processor")
workflow.add_edge("blog_processor", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver())
graph.name = "blog_graph"

__all__ = ["graph"]
