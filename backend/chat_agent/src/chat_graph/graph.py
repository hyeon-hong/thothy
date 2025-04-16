"""Simple chat agent using LangGraph."""

import logging
import datetime  # Import datetime for getting current time
import os
from typing import Optional

from langchain_ollama import ChatOllama
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.base import BaseStore
from chat_graph.configuration import ChatConfigurable

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.WARNING)
logging.getLogger("langgraph").setLevel(logging.WARNING)

# Initialize global LLM
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
llm: Optional[ChatOllama] = None


def get_llm() -> ChatOllama:
    """Get or initialize the LLM."""
    global llm
    if llm is None:
        llm = ChatOllama(
            model="gemma3:12b",
            base_url=OLLAMA_BASE_URL,
            temperature=0.8
        )
    return llm


async def chatbot(
    state: MessagesState,
    config: ChatConfigurable,
    *,
    store: BaseStore
) -> dict:
    """Chat node that processes messages and generates responses."""

    configurable = ChatConfigurable.from_runnable_config(config)

    # Get current system time
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Use system prompt from configuration with time variable
    system_msg = configurable.system_prompt.format(time=current_time)

    # Get the LLM instance
    chat_model = get_llm()

    # Invoke the LLM
    response = chat_model.invoke(
        [{"role": "system", "content": system_msg}] + state["messages"]
    )

    return {"messages": response}


"""Build and return the chat graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, ChatConfigurable)

# Add chatbot node
workflow.add_node("chatbot", chatbot)

# Add edges - start at chatbot and can end after chatbot
workflow.add_edge(START, "chatbot")
workflow.add_edge("chatbot", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver())
graph.name = "chat_graph"

__all__ = ["graph"]
