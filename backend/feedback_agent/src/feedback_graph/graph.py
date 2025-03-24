"""Simple feedback agent using LangGraph."""

import logging
import datetime  # Import datetime for getting current time
import uuid

from langchain.chat_models import init_chat_model

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.base import BaseStore
from feedback_graph.prompts import SYSTEM_PROMPT

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

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.WARNING)

# Initialize store with embedding configuration
store = initialize_store()

# Default UUID for system-level operations
DEFAULT_USER_ID = str(uuid.uuid4())  # Generate a fixed UUID for default user

# Initialize the LLM using the model from configuration
llm = init_chat_model(
    "gpt-4o-mini", model_provider="openai", temperature=0.8)


def feedback_bot(state: MessagesState, store: BaseStore):
    """Feedback node that processes messages and generates responses."""

    # Get current system time
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logging.info(f"messages: {state['messages']}")
    logging.info(f"messages[-1].content: {state['messages'][-1].content}")

    # Get user_id from state and ensure it's a valid UUID
    try:
        user_id = state.get("user_id", DEFAULT_USER_ID)
        # Validate UUID format
        uuid.UUID(user_id)
    except ValueError:
        user_id = DEFAULT_USER_ID
    
    # Search store for relevant memories using search
    knowledges = store.search(
        ("knowledges",),
        query=state["messages"][-1].content,
        where={"user_id": user_id},  # Filter by user_id
        limit=5
    )
    logging.info(f"Knowledges: {knowledges}")

    # Format memories into a string if any were found
    knowledge_context = "\n\nRelevant Knowledge:\n" + "\n".join(
        [knowledge.value["text"] for knowledge in knowledges]
    ) if knowledges else ""

    # Use system prompt from configuration with time and knowledge
    system_message = SYSTEM_PROMPT.format(
        time=current_time,
        knowledge_context=knowledge_context
    )

    # Invoke the LLM
    response = llm.invoke(
        [{"role": "system", "content": system_message}] + state["messages"]
    )

    return {"messages": response}


"""Build and return the feedback graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState)

# Add feedback_bot node
workflow.add_node(
    "feedback_bot",
    lambda state: feedback_bot(state, store=store)
)

# Add edges - start at feedback_bot and can end after feedback_bot
workflow.add_edge(START, "feedback_bot")
workflow.add_edge("feedback_bot", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver(), store=store)
graph.name = "feedback_graph"

__all__ = ["graph"]
