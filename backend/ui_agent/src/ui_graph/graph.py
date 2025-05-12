"""Simple chat agent using LangGraph."""

import logging
import os
import uuid
from typing import Optional, Dict, Any, Annotated, Sequence, TypedDict

from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, BaseMessage
from langgraph.graph.message import add_messages
from langgraph.graph.ui import AnyUIMessage, ui_message_reducer, push_ui_message
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
    return {
        "messages": [response],
        "meta": state.get("meta") or {}
    }


class AgentState(TypedDict):  # noqa: D101
    messages: Annotated[Sequence[BaseMessage], add_messages]
    ui: Annotated[Sequence[AnyUIMessage], ui_message_reducer]
    meta: Optional[Dict[str, Any]] = {}


def build_meta_artifact_response(state: AgentState, tool_message: dict) -> dict:
    """
    Given the output from generate_shadcn_widget, return a dict with 'messages' and 'meta' fields.
    """

    logging.info(f"Tool message: {tool_message}")
    artifact = {
        "widget_name": tool_message.get("widget_name"),
        "description": tool_message.get("description"),
        "code": tool_message.get("code"),
    }
    return {
        "messages": state.get("messages"),
        "meta": {"artifact": artifact}
    }


async def meta_artifact_node(state: AgentState) -> dict:
    """
    Node that takes the output of the tool node and returns the meta-artifact structure.
    """
    logging.info(f"State: {state}")
    messages = state.get("messages", [])
    tool_message = None

    class WeatherOutput(TypedDict):
        city: str

    weather: WeatherOutput = (
        await ChatOpenAI(model="gpt-4o-mini")
        .with_structured_output(WeatherOutput)
        .with_config({"tags": ["nostream"]})
        .ainvoke(state["messages"])
    )

    message = AIMessage(
        id=str(uuid.uuid4()),
        content=f"Here's the weather for {weather['city']}",
    )

    # Emit UI elements associated with the message
    push_ui_message("weather", weather, message=message)
    return {"messages": [message]}

    return {
        "messages": state.get("messages"),
        "meta": {"artifact": "test"}
    }

    # Find the last ToolMessage in the messages list
    for msg in reversed(messages):
        # You may want to check for a more robust type or structure
        if isinstance(msg, dict) and msg.get("name") == "generate_shadcn_widget" and "artifact" in msg:
            tool_message = msg
            break

    if not tool_message:
        logging.warning("No ToolMessage with artifact found in messages.")
        return {
            "messages": messages,
            "meta": {}
        }

    logging.info(f"Tool message: {tool_message}")
    return build_meta_artifact_response(state, tool_message)


"""Build and return the chat graph."""

# Initialize graph builder with new state schema
workflow = StateGraph(AgentState)

# Add chatbot node
workflow.add_node("call_model", call_model)
workflow.add_node("tools", tool_node)
workflow.add_node("meta_artifact", meta_artifact_node)

# Add edges - start at chatbot and can end after chatbot
workflow.add_edge(START, "call_model")
workflow.add_conditional_edges("call_model", should_continue, ["tools", END])
workflow.add_edge("tools", "meta_artifact")
workflow.add_edge("meta_artifact", END)

# Compile graph
graph = workflow.compile()
graph.name = "ui_graph"

__all__ = ["graph"]
