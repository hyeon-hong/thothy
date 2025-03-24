"""Simple feedback agent using LangGraph."""

import logging
import datetime  # Import datetime for getting current time

from langchain.chat_models import init_chat_model

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.base import BaseStore

# Import utility functions
try:
    # Try importing normally first (for production)
    from backend.libs.utils import (
        initialize_store,
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
    )

from feedback_graph.configuration import FeedbackConfigurable

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.WARNING)

# Initialize store with embedding configuration
store = initialize_store()

# Initialize the LLM using the model from configuration
llm = init_chat_model(
    "gpt-4o-mini", model_provider="openai", temperature=0.8)


async def feedback_bot(
    state: MessagesState,
    config: FeedbackConfigurable,
    *,
    store: BaseStore
) -> dict:
    """Feedback node that processes messages and generates responses."""

    configurable = FeedbackConfigurable.from_runnable_config(config)

    # Get current system time
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Use system prompt from configuration with time variable
    system_msg = configurable.system_prompt.format(time=current_time)

    # Invoke the LLM
    response = llm.invoke(
        [{"role": "system", "content": system_msg}] + state["messages"]
    )

    return {"messages": response}


"""Build and return the feedback graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, FeedbackConfigurable)

# Add feedback_bot node
workflow.add_node("feedback_bot", feedback_bot)

# Add edges - start at feedback_bot and can end after feedback_bot
workflow.add_edge(START, "feedback_bot")
workflow.add_edge("feedback_bot", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver(), store=store)
graph.name = "feedback_graph"

__all__ = ["graph"]
