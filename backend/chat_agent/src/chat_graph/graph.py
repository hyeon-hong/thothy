"""Simple chat agent using LangGraph."""

import logging
import datetime  # Import datetime for getting current time
import os
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.base import BaseStore
from chat_graph.configuration import ChatConfigurable

# Initialize global LLM
VLLM_API_URL = os.getenv("VLLM_API_URL")
llm: Optional[ChatGoogleGenerativeAI] = None


def get_llm() -> ChatGoogleGenerativeAI:
    """Get or initialize the LLM."""
    global llm
    if llm is None:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash-preview-05-20",
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
    logging.info(f"Using model: {chat_model}")

    # Invoke the LLM
    logging.info(f"Message: {state['messages']}")
    response = chat_model.invoke(
        [{"role": "system", "content": system_msg}] + state["messages"]
    )
    logging.info(f"Response: {response}")

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
graph = workflow.compile()
graph.name = "chat_graph"
