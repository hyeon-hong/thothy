import logging
from typing import Literal, List, Dict
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
OptionType = Literal["news_agent", "blog_agent", "FINISH"]


class TodoItem(TypedDict):
    """A todo item with task description and completion status."""
    task: str
    done: bool
    agent: str


class Router(TypedDict):
    """Worker to route to next. If no workers needed, route to FINISH."""
    next: OptionType


class TodoListResponse(TypedDict):
    """Response format for todo list generation."""
    todos: List[Dict[str, str]]


class State(MessagesState):
    next: str
    initial_request: str
    todos: List[TodoItem]


def get_todo_prompt(request: str) -> str:
    return (
        "Given the following user request, create a list of tasks that need to"
        " be completed. For each task, specify which agent should handle it"
        f" (options: {members}).\n\nUser request: {request}\n\n"
        "Respond with a list of tasks in order of execution. Each task should"
        " include the task description and the agent responsible."
    )


def get_system_prompt(initial_request: str, todos: List[TodoItem]) -> str:
    todo_status = "\n".join(
        f"- {item['task']} (Agent: {item['agent']}, "
        f"{'Done' if item['done'] else 'Pending'})"
        for item in todos
    )
    return (
        "You are a team supervisor tasked with managing a conversation between"
        f" the following workers: {members}. The user's initial request was:"
        f"\n\n{initial_request}\n\n"
        f"Current todo list status:\n{todo_status}\n\n"
        "Based on the todo list and conversation history, determine the next"
        " action. If there are pending tasks, assign the next task to the"
        " appropriate agent. When all tasks are completed, respond with FINISH."
    )


def init_request_node(state: State) -> Command[Literal["team_supervisor"]]:
    """Initialize the state with the user's request and generate todo list."""
    # Get the initial request from the first message
    initial_request = state["messages"][0].content if state["messages"] else ""
    logging.info(f"state['messages']: {state['messages']}")

    # Generate todo list using LLM
    todo_prompt = get_todo_prompt(initial_request)
    try:
        response = llm.with_structured_output(TodoListResponse).invoke(
            [{"role": "user", "content": todo_prompt}]
        )
    except Exception as e:
        logging.error(f"Error generating todo list: {str(e)}")
        raise RuntimeError(f"Failed to generate todo list: {str(e)}")
    logging.info(f"response: {response}")

    # Convert response to TodoItems
    todos = [
        TodoItem(task=item["task"], agent=item["agent"], done=False)
        for item in response["todos"]
    ]
    logging.info(f"Generated todos: {todos}")

    return Command(
        goto="team_supervisor",
        update={
            "initial_request": initial_request,
            "todos": todos,
            "next": "",
        }
    )


def team_supervisor_node(
    state: State
) -> Command[Literal["news_agent", "blog_agent", "__end__"]]:
    system_prompt = get_system_prompt(state["initial_request"], state["todos"])
    messages = [
        {"role": "system", "content": system_prompt},
    ] + state["messages"]

    logging.info(f"Team supervisor state['messages']: {state['messages']}")
    logging.info(f"Team supervisor messages: {messages}")
    try:
        response = llm.with_structured_output(Router).invoke(messages)
    except Exception as e:
        logging.error(f"Error in team supervisor routing: {str(e)}")
        raise RuntimeError(f"Failed to determine next action: {str(e)}")

    goto = response["next"]
    logging.info(f"Team supervisor goto: {goto}")

    # Check if the goto is a valid option
    if goto not in members + ["FINISH"]:
        raise ValueError(f"Invalid goto: {goto}")

    # If the goto is FINISH, set the goto to END
    if goto == "FINISH":
        goto = END

    # Update todo list if an agent completed a task
    if state["next"] in members:
        todos = state["todos"]
        for todo in todos:
            if todo["agent"] == state["next"] and not todo["done"]:
                todo["done"] = True
                break
        update = {"next": goto, "todos": todos}
    else:
        update = {"next": goto}

    return Command(goto=goto, update=update)


async def news_agent_node(state: State) -> Command[Literal["team_supervisor"]]:
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
        goto="team_supervisor",
    )


async def blog_agent_node(state: State) -> Command[Literal["team_supervisor"]]:
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
        goto="team_supervisor",
    )


# Build the graph
builder = StateGraph(State)

# Add the nodes
builder.add_node("init_request", init_request_node)
builder.add_node("team_supervisor", team_supervisor_node)
builder.add_node("news_agent", news_agent_node)
builder.add_node("blog_agent", blog_agent_node)

# Add the edges
builder.add_edge(START, "init_request")
builder.add_edge("init_request", "team_supervisor")

# Compile the graph
graph = builder.compile()
graph.name = "team_graph"

__all__ = ["graph"]
