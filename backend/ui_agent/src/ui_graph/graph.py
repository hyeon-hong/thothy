"""Simple chat agent using LangGraph."""

import logging
import datetime  # Import datetime for getting current time
import os
from typing import Optional

from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.base import BaseStore
from chat_graph.configuration import ChatConfigurable
from ui_graph.shadcn_tools import generate_shadcn_widget

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.DEBUG)

# Initialize global LLM
VLLM_API_URL = os.getenv("VLLM_API_URL")
llm: Optional[ChatOpenAI] = None


def get_llm() -> ChatOpenAI:
    """Get or initialize the LLM with shadcn tools bound."""
    global llm
    if llm is None:
        # base_llm = ChatOpenAI(
        #     model="Qwen/Qwen2.5-1.5B-Instruct",
        #     base_url=VLLM_API_URL,
        #     temperature=0.5
        # )
        base_llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.5
        )
        llm = base_llm.bind_tools([generate_shadcn_widget])
    return llm


async def generate_artifact(
    state: MessagesState,
    config: ChatConfigurable,
    *,
    store: BaseStore
) -> dict:
    """Chat node that processes messages and generates responses, following the generateArtifact process."""

    configurable = ChatConfigurable.from_runnable_config(config)

    # Get current system time
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Prepare the system prompt (optionally could be extended with user/system overrides)
    system_msg = configurable.system_prompt.format(time=current_time)

    # Placeholder: Add context/memories if implemented in the future
    # context_document_messages = ...

    # Prepare the full prompt/messages (system prompt + chat history)
    messages = [{"role": "system", "content": system_msg}] + state["messages"]

    # Get the LLM instance (with tools bound)
    chat_model = get_llm()
    logging.debug(f"Using model: {chat_model}")

    # Invoke the LLM with tools
    logging.debug(f"Message: {messages}")
    response = chat_model.invoke(messages)
    logging.debug(f"Response: {response}")

    return {"messages": response}


"""Build and return the chat graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, ChatConfigurable)

# Add chatbot node
workflow.add_node("generate_artifact", generate_artifact)

# Add edges - start at chatbot and can end after chatbot
workflow.add_edge(START, "generate_artifact")
workflow.add_edge("generate_artifact", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver())
graph.name = "ui_graph"

__all__ = ["graph"]
