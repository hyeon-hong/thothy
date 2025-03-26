"""Simple interrupt agent using LangGraph."""

import logging
import datetime  # Import datetime for getting current time

from langchain.chat_models import init_chat_model
from langgraph.types import interrupt
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.base import BaseStore
from interrupt_graph.configuration import InterruptConfigurable
from thothy.backend.libs.utils import HumanInterrupt

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.WARNING)
logging.getLogger("langgraph").setLevel(logging.WARNING)


async def interrupt_bot(
    state: MessagesState,
    config: InterruptConfigurable,
    *,
    store: BaseStore
) -> dict:
    """Interrupt node that processes messages and generates responses."""

    configurable = InterruptConfigurable.from_runnable_config(config)

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

    # Create interrupt request following the schema
    request: HumanInterrupt = {
        "action_request": {
            "action": "Review Response",
            "args": {"response": response}
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
    interrupt_response = interrupt(request)

    # Process the response based on type
    if interrupt_response[0]["type"] == "edit":
        # Use the edited response
        response = interrupt_response[0]["args"]
    elif interrupt_response[0]["type"] == "response":
        # Regenerate with the feedback
        feedback = interrupt_response[0]["args"]
        msg = f"Please revise. Feedback: {feedback}"
        response = llm.invoke(
            [{"role": "system", "content": system_msg}] +
            state["messages"] +
            [{"role": "human", "content": msg}]
        )

    return {"messages": response}


"""Build and return the interrupt graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, InterruptConfigurable)

# Add interrupt bot node
workflow.add_node("interrupt_bot", interrupt_bot)

# Add edges - start at interrupt bot and can end after interrupt bot
workflow.add_edge(START, "interrupt_bot")
workflow.add_edge("interrupt_bot", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver())
graph.name = "interrupt_graph"

__all__ = ["graph"]
