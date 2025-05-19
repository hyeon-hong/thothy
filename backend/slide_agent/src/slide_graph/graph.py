"""Simple slide agent using LangGraph."""

import logging
import os
from typing import Optional, Annotated, Sequence, TypedDict
import json

from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, BaseMessage
from langgraph.graph.message import add_messages
from langgraph.graph.ui import AnyUIMessage, ui_message_reducer, push_ui_message
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from slide_graph.prompts import SYSTEM_PROMPT
from slide_graph.tools import generate_shadcn_widget


# Configure logging to hide INFO messages
logging.basicConfig(level=logging.INFO)

# Initialize global LLM
VLLM_API_URL = os.getenv("VLLM_API_URL")
llm: Optional[ChatOpenAI] = None

SLIDE_COMPONENT_NAME = "slide_graph"


class AgentState(TypedDict):  # noqa: D101
    messages: Annotated[Sequence[BaseMessage], add_messages]
    ui: Annotated[Sequence[AnyUIMessage], ui_message_reducer]


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


def should_continue(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    if last_message.tool_calls:
        return "tools"
    return END


def call_model(state: AgentState):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + \
        state["messages"]
    response = model_with_tools.invoke(messages)

    artifact = extract_artifact_from_response(response)
    artifact = "export default function App() { return " + artifact + " }"

    class Code(TypedDict):
        code: str
    code: Code = {
        "code": artifact
    }

    push_ui_message(SLIDE_COMPONENT_NAME, code, message=response)

    return {
        "messages": [response],
    }


def extract_artifact_from_response(response: AIMessage) -> Optional[str]:
    # 1. Get tool_calls from additional_kwargs
    tool_calls = response.additional_kwargs.get("tool_calls", [])
    for tool_call in tool_calls:
        # 2. Get the function arguments (as a JSON string)
        function = tool_call.get("function", {})
        arguments = function.get("arguments")
        if arguments:
            try:
                # 3. Parse the arguments JSON string
                args_dict = json.loads(arguments)
                # 4. Extract the artifact
                artifact = args_dict.get("artifact")
                if artifact:
                    return artifact
            except Exception as e:
                print(f"Error parsing tool call arguments: {e}")
    return None


"""Build and return the chat graph."""

# Initialize graph builder with new state schema
workflow = StateGraph(AgentState)

# Add chatbot node
workflow.add_node("call_model", call_model)
workflow.add_node("tools", tool_node)

# Add edges - start at chatbot and can end after chatbot
workflow.add_edge(START, "call_model")
workflow.add_conditional_edges("call_model", should_continue, ["tools", END])
workflow.add_edge("tools", END)

# Compile graph
graph = workflow.compile()
graph.name = SLIDE_COMPONENT_NAME

__all__ = ["graph"]
