import logging
from typing import Literal, List, Dict
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage
from langgraph.types import Command, interrupt
from langgraph.graph import MessagesState
from typing_extensions import TypedDict
from langchain.chat_models import init_chat_model
from langgraph.checkpoint.memory import MemorySaver
from langgraph.store.base import BaseStore

from team_graph.configuration import TeamConfigurable
from blog_graph.graph import graph as blog_graph
from news_graph.graph import graph as news_graph
from thothy.backend.libs.utils import (  # type: ignore
    HumanInterrupt,
    initialize_store,
    initialize_memory_manager,
    initialize_executor
)

# Initialize store with reconnection capability
store = initialize_store()
llm = init_chat_model("gpt-4o-mini", model_provider="openai", temperature=0.8)

# Create memory manager
memory_manager = initialize_memory_manager()

# Wrap memory_manager to handle deferred background processing
executor = initialize_executor(memory_manager, store)

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
        "\naction. If there are pending tasks, assign the next task to the"
        "\nappropriate agent. When all tasks are completed, respond with"
        " FINISH."
    )


async def init_request_node(
    state: State,
    config: TeamConfigurable,
    *,
    store: BaseStore
) -> Command[Literal["team_supervisor"]]:
    """Initialize the state with the user's request and generate todo list."""
    # Get the initial request from the first message
    initial_request = state["messages"][0].content if state["messages"] else ""
    logging.info(f"state['messages']: {state['messages']}")

    # Get configurable values
    configurable = TeamConfigurable.from_runnable_config(config)
    team_id = configurable.team_id
    user_id = configurable.user_id
    agent_id_list = configurable.agent_id_list

    # Set namespace for memories
    namespace = ("memories", user_id, "default", team_id, "default", "default")
    agents = agent_id_list.split(",")
    logging.info(f"agents: {agents}")

    # Search for existing memories
    memories = await store.asearch(
        namespace,
        query=str(state["messages"][-1].content)
    )

    joined_memories = "\n".join(
        [d.value.get("data", "") for d in memories if d.value]
    )

    system_msg = (
        f"You are a helpful team supervisor talking to a user. "
        f"Your memories about the user: {joined_memories}"
    )
    # thread_state = {"messages": [
    #     {"role": "system", "content": system_msg}] + state["messages"]}

    # Generate todo list using LLM
    # todo_prompt = get_todo_prompt(initial_request)
    todo_prompt = get_todo_prompt(system_msg + "\n\n" + initial_request)
    try:
        response = llm.with_structured_output(TodoListResponse).invoke(
            [{"role": "user", "content": todo_prompt}]
        )
    except Exception as e:
        logging.error(f"Error generating todo list: {str(e)}")
        # TODO: Should handle this better
        # raise RuntimeError(f"Failed to generate todo list: {str(e)}")
    finally:
        # TODO: Remove this
        response = {
            "todos": [
                {
                    "task": "Fetch news articles",
                    "agent": "news_agent",
                    "done": False
                },
                {
                    "task": "Create a blog post",
                    "agent": "blog_agent",
                    "done": False
                },
            ]
        }
    logging.info(f"response: {response}")

    # Store only user's request in memory
    # Don't save the todo list in memory
    to_process = {
        "messages": [
            {"role": "user", "content": state["messages"][-1].content}
        ]
    }
    executor.submit(to_process, after_seconds=0.5, config=config)

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
        # Go to finish node
        goto = "finish_node"
        return Command(goto=goto)

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

    # TODO: Generalize this to all agents. Set this interrupt_before in UI
    if goto == "blog_agent":
        request: HumanInterrupt = {
            "action_request": {
                "action": "Review Blog Post",
                "args": {
                    "request": state["initial_request"],
                    "response": state["messages"][-1].content,
                }
            },
            "config": {
                "allow_ignore": False,  # Don't allow ignoring the review
                "allow_respond": True,  # Allow responding with feedback
                "allow_edit": True,     # Allow editing the response
                "allow_accept": True    # Allow accepting as-is
            },
            "description": """Please review this AI response. You can:
    - Accept the response as-is
    - Edit the response before sending
    - Provide feedback or instructions for regeneration
    - Make any necessary corrections

    Current response for review:
    ```
    {response}
    ```
    """
        }

        # Send interrupt and get response
        logging.info(f"Sending interrupt request: {request}")
        response = interrupt(request)
        logging.info(f"Interrupt response: {response}")

    # TODO: Check the interrupt response and go to the appropriate node

    return Command(goto=goto, update=update)


async def news_agent_node(
    state: State,
    config: TeamConfigurable
) -> Command[Literal["team_supervisor"]]:
    # Get configurable values
    configurable = TeamConfigurable.from_runnable_config(config)
    user_id = configurable.user_id
    thread_id = config.get("configurable", {}).get("thread_id")
    # Use first agent as default
    agent_id = config.get("configurable", {}).get(
        "agent_id_list", ""
    ).split(",")[0]

    # Pass user_id to news_graph
    result = await news_graph.ainvoke(
        state,
        config={
            "configurable": {
                "user_id": user_id,
                "thread_id": thread_id,
                "agent_id": agent_id,
                "project_id": config.get("configurable", {}).get("project_id"),
                "team_id": config.get("configurable", {}).get("team_id"),
                "staff_id": config.get("configurable", {}).get("staff_id"),
            }
        }
    )
    logging.info(f"News agent result: {result}")
    return Command(
        update={
            "messages": [
                HumanMessage(
                    content=result["messages"][-1].content,
                    name="news_graph"
                )
            ]
        },
        goto="team_supervisor",
    )


async def blog_agent_node(
    state: State,
    config: TeamConfigurable
) -> Command[Literal["team_supervisor"]]:
    # Get configurable values
    configurable = TeamConfigurable.from_runnable_config(config)
    user_id = configurable.user_id
    thread_id = config.get("configurable", {}).get("thread_id")
    # Use second agent as default
    agent_id = config.get("configurable", {}).get(
        "agent_id_list", ""
    ).split(",")[1]

    # Pass user_id and thread_id to blog_graph
    result = await blog_graph.ainvoke(
        state,
        config={
            "configurable": {
                "user_id": user_id,
                "thread_id": thread_id,
                "agent_id": agent_id,
                "project_id": config.get("configurable", {}).get("project_id"),
                "team_id": config.get("configurable", {}).get("team_id"),
                "staff_id": config.get("configurable", {}).get("staff_id"),
            }
        }
    )
    logging.info(f"Blog agent result: {result}")
    return Command(
        update={
            "messages": [
                HumanMessage(
                    content=result["messages"][-1].content,
                    name="blog_graph"
                )
            ]
        },
        goto="team_supervisor",
    )


def finish_node(state: State) -> dict:
    return {"messages": [HumanMessage(content="Finished", name="team_graph")]}


# Build the graph
builder = StateGraph(State, TeamConfigurable)

# Add the nodes
builder.add_node("init_request", init_request_node)
builder.add_node("team_supervisor", team_supervisor_node)
builder.add_node("news_agent", news_agent_node)
builder.add_node("blog_agent", blog_agent_node)
builder.add_node("finish_node", finish_node)

# Add the edges
builder.add_edge(START, "init_request")
builder.add_edge("init_request", "team_supervisor")
builder.add_edge("finish_node", END)

# Compile the graph
graph = builder.compile(checkpointer=MemorySaver(), store=store)
graph.name = "team_graph"

__all__ = ["graph"]
