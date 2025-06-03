"""Simple chat agent using LangGraph."""

import logging
import datetime  # Import datetime for getting current time
import os
from typing import Optional
import asyncio

from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.base import BaseStore
from chat_graph.configuration import ChatConfigurable

# Initialize global LLM
VLLM_API_URL = os.getenv("VLLM_API_URL")
llm: Optional[ChatGoogleGenerativeAI] = None


async def get_llm() -> ChatGoogleGenerativeAI:
    """Get or initialize the LLM asynchronously."""
    global llm
    if llm is None:
        def create_llm():
            return ChatGoogleGenerativeAI(
                model="gemini-2.5-flash-preview-05-20",
                temperature=0.8
            )
        llm = await asyncio.to_thread(create_llm)
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
    chat_model = await get_llm()

    # Invoke the LLM
    response = await chat_model.ainvoke(
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
