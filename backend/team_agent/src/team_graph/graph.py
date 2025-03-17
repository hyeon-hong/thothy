import logging
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.types import Command
from langchain_anthropic import ChatAnthropic
from typing_extensions import TypedDict
from typing import Literal

from blog_graph.graph import graph as blog_graph
from news_graph.graph import graph as news_graph

members = ["news_agent", "blog_agent"]
# Our team supervisor is an LLM node. It just picks the next agent to process
# and decides when the work is completed
options = members + ["FINISH"]

system_prompt = (
    "You are a supervisor tasked with managing a conversation between the"
    f" following workers: {members}. Given the following user request,"
    " respond with the worker to act next. Each worker will perform a"
    " task and respond with their results and status. When finished,"
    " respond with FINISH."
)


class Router(TypedDict):
    """Worker to route to next. If no workers needed, route to FINISH."""

    next: Literal[*options]


llm = ChatAnthropic(model="claude-3-5-sonnet-latest")


async def call_news_agent(state: MessagesState):
    """Call the news agent with the current state."""
    return await news_graph.invoke(state)


async def call_blog_agent(state: MessagesState):
    """Call the blog agent with the current state."""
    return await blog_graph.invoke(state)


def supervisor_node(state: MessagesState) -> Command[Literal[*members, "__end__"]]:
    messages = [
        {"role": "system", "content": system_prompt},
    ] + state["messages"]
    logging.info(f"Supervisor messages: {messages}")
    response = llm.with_structured_output(Router).invoke(messages)
    logging.info(f"Supervisor response: {response}")
    goto = response["next"]
    if goto == "FINISH":
        goto = END

    return Command(goto=goto, update={"next": goto})


# Build the graph
builder = StateGraph(MessagesState)

# Add edges
builder.add_edge(START, "supervisor")

# Add nodes
builder.add_node("supervisor", supervisor_node)
builder.add_node("news_agent", call_news_agent)
builder.add_node("blog_agent", call_blog_agent)

# Compile the graph
graph = builder.compile()
graph.name = "team_graph"

__all__ = ["graph"]
