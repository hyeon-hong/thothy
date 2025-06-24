"""Chat agent using LangGraph with MCP tools."""

from typing import Any, Union, Literal
from pydantic import BaseModel
from langchain_core.messages import AnyMessage
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import AIMessage
import os
from asgiref.sync import async_to_sync

# --- MCP Client Config ---
DART_MCP_REL_PATH = os.path.join(
    os.path.dirname(__file__), '../../../mcp/dart-mcp')
print(
    f"[DEBUG] DART_MCP_REL_PATH resolved to: {os.path.abspath(DART_MCP_REL_PATH)}")
DART_API_KEY = os.environ.get("DART_API_KEY", "")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")


async def make_graph():
    mcp_client = MultiServerMCPClient(
        {
            "dart-mcp": {
                "command": "uv",
                "args": ["--directory", DART_MCP_REL_PATH, "run", "dart.py"],
                "env": {
                    "DART_API_KEY": DART_API_KEY
                },
                "transport": "stdio"
            }
        }
    )

    mcp_tools = await mcp_client.get_tools()
    # logging.info(f"Available tools: {[tool.name for tool in mcp_tools]}")

    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", temperature=0
    ).bind_tools(mcp_tools)

    async def call_model(state: MessagesState):
        """Call the model with the state."""

        response = await model.ainvoke(state["messages"])
        # logging.info(f"response: {response}")

        return {"messages": [response]}

    def should_continue(state: MessagesState) -> Literal["tools", "__end__"]:
        """Determine if the model should continue or not."""
        # logging.info(f"state: {state}")

        # Get the messages
        messages = state["messages"]

        # Get the last message
        last_message = messages[-1] if messages else None
        # logging.info(f"last_message: {last_message}")

        # If the last message is not an AI message or doesn't have tool calls, we're done
        if not isinstance(last_message, AIMessage) or not getattr(last_message, "tool_calls", None):
            # logging.info(
            #     "last_message is not an AI message or doesn't have tool calls")
            return END

        # Get the tool calls from the last message
        tool_calls = getattr(last_message, "tool_calls", [])
        # logging.info(f"tool_calls: {tool_calls}")

        if not tool_calls:
            # logging.info("last_message doesn't have tool calls")
            return END

        # If the tool calls are for the price snapshot tool, we need to continue
        # logging.info("last_message has tool calls")
        return "tools"

    # --- Build and return the chat graph ---
    workflow = StateGraph(MessagesState)

    # Add nodes
    workflow.add_node("call_model", call_model)
    workflow.add_node("tools", ToolNode(mcp_tools))

    # Add edges
    workflow.add_edge(START, "call_model")
    workflow.add_conditional_edges(
        "call_model", should_continue, ["tools", END])
    workflow.add_edge("tools", END)

    graph = workflow.compile()
    graph.name = "chat_graph"

    return graph

graph = async_to_sync(make_graph)()
