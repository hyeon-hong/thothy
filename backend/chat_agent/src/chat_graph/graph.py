"""Chat agent using LangGraph with MCP tools."""

import logging
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
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
    client = MultiServerMCPClient(
        {
            "dart-mcp": {
                "command": "python",
                "args": ["dart.py"],
                "cwd": DART_MCP_REL_PATH,
                "env": {
                    "DART_API_KEY": DART_API_KEY
                },
                "transport": "stdio"
            }
        }
    )

    mcp_tools = await client.get_tools()
    model = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash", google_api_key=GOOGLE_API_KEY
    ).bind_tools(mcp_tools)

    async def call_model(state: MessagesState, config=None, *, store=None):
        response = await model.ainvoke(state["messages"])
        logging.info(f"response: {response}")
        ai_message = AIMessage(content=response.content)
        return {"messages": [ai_message]}

    # --- Build and return the chat graph ---
    workflow = StateGraph(MessagesState)

    # Add nodes
    workflow.add_node("call_model", call_model)
    workflow.add_node("tools", ToolNode(mcp_tools))

    # Add edges
    workflow.add_edge(START, "call_model")
    workflow.add_conditional_edges(
        "call_model",
        tools_condition,
    )
    workflow.add_edge("tools", "call_model")

    graph = workflow.compile()
    graph.name = "chat_graph"

    return graph

graph = async_to_sync(make_graph)()
