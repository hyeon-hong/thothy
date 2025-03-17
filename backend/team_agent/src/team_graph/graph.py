import logging
from typing import Literal
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from langgraph.graph import MessagesState
from langchain_anthropic import ChatAnthropic
from typing_extensions import TypedDict

from blog_graph.graph import graph as blog_graph
from news_graph.graph import graph as news_graph

llm = ChatAnthropic(model="claude-3-5-sonnet-latest")

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


class State(MessagesState):
    next: str


def supervisor_node(state: State) -> Command[Literal[*members, "__end__"]]:
    messages = [
        {"role": "system", "content": system_prompt},
    ] + state["messages"]
    response = llm.with_structured_output(Router).invoke(messages)
    goto = response["next"]
    logging.info(f"Supervisor goto: {goto}")
    if goto == "FINISH":
        goto = END

    return Command(goto=goto, update={"next": goto})


async def news_agent_node(state: State) -> Command[Literal["supervisor"]]:
    result = await news_graph.ainvoke(state)
    logging.info(f"News agent result: {result}")
    return Command(
        update={
            "messages": [
                HumanMessage(
                    content=result["messages"][-1].content,
                    name="news_agent"
                )
            ]
        },
        goto="supervisor",
    )


async def blog_agent_node(state: State) -> Command[Literal["supervisor"]]:
    result = await blog_graph.ainvoke(state)
    logging.info(f"Blog agent result: {result}")
    return Command(
        update={
            "messages": [
                HumanMessage(
                    content=result["messages"][-1].content,
                    name="blog_agent"
                )
            ]
        },
        goto="supervisor",
    )


builder = StateGraph(State)
builder.add_edge(START, "supervisor")
builder.add_node("supervisor", supervisor_node)
builder.add_node("news_agent", news_agent_node)
builder.add_node("blog_agent", blog_agent_node)
graph = builder.compile()
