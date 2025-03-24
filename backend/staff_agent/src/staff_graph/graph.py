"""Simple staff agent using LangGraph."""

import logging
from langchain.chat_models import init_chat_model
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.store.base import BaseStore

from staff_graph.configuration import StaffConfigurable
from blog_graph.graph import graph as blog_graph
from chat_graph.graph import graph as chat_graph
from news_graph.graph import graph as news_graph

# Import utility functions
try:
    # Try importing normally first (for production)
    from backend.libs.utils import (
        initialize_store, 
        initialize_memory_manager,
        initialize_executor
    )
except ImportError:
    # If that fails, try a relative import approach
    import sys
    from pathlib import Path
    # Add the backend directory to sys.path
    root_dir = Path(__file__).parent.parent.parent.parent
    if str(root_dir) not in sys.path:
        sys.path.append(str(root_dir))
    # Now try the import again
    from libs.utils import (
        initialize_store, 
        initialize_memory_manager,
        initialize_executor
    )

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.WARNING)

# Initialize store with reconnection capability
store = initialize_store()
llm = init_chat_model("gpt-4o-mini", model_provider="openai", temperature=0.8)

# Create memory manager
memory_manager = initialize_memory_manager()

# Wrap memory_manager to handle deferred background processing
executor = initialize_executor(memory_manager, store)


async def staff_assistant(
    state: MessagesState,
    config: StaffConfigurable,
    *,
    store: BaseStore
) -> dict:
    """Staff assistant node that processes messages and generates responses."""
    # Get configurable values
    configurable = StaffConfigurable.from_runnable_config(config)
    project_id = configurable.project_id
    team_id = configurable.team_id
    staff_id = configurable.staff_id
    agent_id = configurable.agent_id
    user_id = configurable.user_id

    # Set namespace for memories
    namespace = ("memories", user_id, project_id,
                 team_id, staff_id, agent_id)

    # Search for existing memories
    memories = await store.asearch(
        namespace,
        query=str(state["messages"][-1].content)
    )

    joined_memories = "\n".join(
        [d.value.get("data", "") for d in memories if d.value]
    )

    system_msg = (
        f"You are a helpful staff assistant talking to a user. "
        f"Your memories about the user: {joined_memories}"
    )
    thread_state = {"messages": [
        {"role": "system", "content": system_msg}] + state["messages"]}

    # Route to the appropriate agent based on agent_id
    if agent_id == "blog":
        # Call blog agent
        result = await blog_graph.ainvoke(thread_state, config)
    elif agent_id == "news":
        # Call news agent
        result = await news_graph.ainvoke(thread_state, config)
    elif agent_id == "chat":
        # Call chat agent
        result = await chat_graph.ainvoke(thread_state, config)
    else:
        raise ValueError(f"Invalid agent_id: {agent_id}")

    response = result["messages"][-1]
    # Submit memory processing task
    to_process = {
        "messages": [
            {"role": "user", "content": state["messages"][-1].content}
        ] + [response]
    }

    # config["configurable"] should has user_id, project_id, team_id,
    # staff_id, agent_id and it will be populated from the namespace
    executor.submit(to_process, after_seconds=0.5, config=config)

    return {"messages": response}


"""Build and return the staff graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, StaffConfigurable)

# Add staff_assistant node
workflow.add_node("staff_assistant", staff_assistant)

# Add edges - start at staff_assistant and can end after staff_assistant
workflow.add_edge(START, "staff_assistant")
workflow.add_edge("staff_assistant", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver(), store=store)
graph.name = "staff_graph"

__all__ = ["graph"]
