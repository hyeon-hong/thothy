"""Simple slide agent using LangGraph."""

import datetime  # Import datetime for getting current time
import os
from typing import Optional

from langchain.chat_models import init_chat_model
from langchain_core.messages import AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.base import BaseStore
from slide_graph.configuration import SlideConfigurable

# Initialize global LLM
VLLM_API_URL = os.getenv("VLLM_API_URL")
llm: Optional[ChatGoogleGenerativeAI] = None


def get_llm() -> ChatGoogleGenerativeAI:
    """Get or initialize the LLM asynchronously."""
    global llm
    if llm is None:
        llm = init_chat_model(
            model="gemini-2.5-flash-preview-05-20", model_provider="google_genai")
    return llm


async def chatbot(
    state: MessagesState,
    config: SlideConfigurable,
    *,
    store: BaseStore
) -> dict:
    """Chat node that processes messages and generates responses."""

    configurable = SlideConfigurable.from_runnable_config(config)

    # Get current system time
    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Use system prompt from configuration with time variable
    system_msg = configurable.system_prompt.format(time=current_time)

    # Get the LLM instance
    chat_model = get_llm()

    # Invoke the LLM
    response = await chat_model.ainvoke(
        [{"role": "system", "content": system_msg}] + state["messages"]
    )
    ai_message = AIMessage(content=response.content)

    return {"messages": [ai_message]}


"""Build and return the slide graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, SlideConfigurable)

# Add chatbot node
workflow.add_node("chatbot", chatbot)

# Add edges - start at chatbot and can end after chatbot
workflow.add_edge(START, "chatbot")
workflow.add_edge("chatbot", END)

# Compile graph
graph = workflow.compile()
graph.name = "slide_graph"

__all__ = ["graph"]
