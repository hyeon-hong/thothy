"""Simple feedback agent using LangGraph."""

import logging
import datetime  # Import datetime for getting current time

from langchain.chat_models import init_chat_model

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.base import BaseStore
from feedback_graph.configuration import FeedbackConfigurable

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.WARNING)
logging.getLogger("langgraph").setLevel(logging.WARNING)


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

    # Initialize the LLM using the model from configuration
    llm = init_chat_model(
        configurable.model, model_provider="openai", temperature=0.8)

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
graph = workflow.compile(checkpointer=MemorySaver())
graph.name = "feedback_graph"

__all__ = ["graph"]
