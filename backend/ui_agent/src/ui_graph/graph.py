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
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.5
        )
    return llm


def build_artifact_response(llm_response, title=None, context=None):
    # Ensure content is always a string for the frontend
    if hasattr(llm_response, "content"):
        content = llm_response.content
    elif isinstance(llm_response, str):
        content = llm_response
    else:
        content = str(llm_response)
    return {
        "artifact": {
            "title": title or "Generated Artifact",
            "content": content,
            "context": context or {}
        }
    }


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
    chat_model = chat_model.bind_tools(
        [generate_shadcn_widget], tool_choice="any", strict=True)
    logging.debug(f"Using model: {chat_model}")

    # Invoke the LLM with tools
    logging.info(f"Message: {messages}")
    response = chat_model.invoke(messages)
    logging.info(f"Response: {response}")
    logging.info(f"Response.tool_calls: {response.tool_calls}")

    tool_message = generate_shadcn_widget.invoke(response.tool_calls[0])
    logging.info(f"Tool message: {tool_message}")

    return tool_message

    # artifact_title = "Shadcn Widget"  # You can extract or generate this dynamically
    # return_message = build_artifact_response(response, title=artifact_title)
    # logging.info(f"Return message: {return_message}")
    # return return_message


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
