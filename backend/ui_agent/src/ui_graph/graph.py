"""Simple chat agent using LangGraph."""

import logging
import os
from typing import Optional

from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.prebuilt import ToolNode
from ui_graph.prompts import SYSTEM_PROMPT
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


tool_node = ToolNode([generate_shadcn_widget])

model = get_llm()
model_with_tools = model.bind_tools([generate_shadcn_widget],
                                    tool_choice="any",
                                    strict=True)


def should_continue(state: MessagesState):
    messages = state["messages"]
    last_message = messages[-1]
    if last_message.tool_calls:
        return "tools"
    return END


def call_model(state: MessagesState):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + \
        state["messages"]
    response = model_with_tools.invoke(messages)
    return {"messages": [response]}


"""Build and return the chat graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState)

# Add chatbot node
workflow.add_node("call_model", call_model)
workflow.add_node("tools", tool_node)

# Add edges - start at chatbot and can end after chatbot
workflow.add_edge(START, "call_model")
workflow.add_conditional_edges("call_model", should_continue, ["tools", END])
workflow.add_edge("tools", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver())
graph.name = "ui_graph"

__all__ = ["graph"]
