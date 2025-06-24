"""Chat agent using LangGraph with MCP tools."""

from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import AIMessage
import os

# --- MCP Client and Tools Setup ---

# Use a relative path for dart-mcp directory
DART_MCP_REL_PATH = os.path.join(os.path.dirname(__file__), '../../mcp/dart-mcp')
DART_API_KEY = os.environ.get("DART_API_KEY", "")

client = MultiServerMCPClient(
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

tools = None


async def get_tools():
    global tools
    if tools is None:
        tools = await client.get_tools()
    return tools

# --- Model Setup ---

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
model = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=GOOGLE_API_KEY)


# --- Node Function ---

async def call_model(state: MessagesState, config=None, *, store=None):
    loaded_tools = await get_tools()
    response = await model.bind_tools(loaded_tools).ainvoke(state["messages"])
    ai_message = AIMessage(content=response.content)
    return {"messages": [ai_message]}


# --- Build and return the chat graph ---

workflow = StateGraph(MessagesState)
workflow.add_node("call_model", call_model)
workflow.add_node("tools", ToolNode([]))  # Placeholder, will be set at runtime
workflow.add_edge(START, "call_model")
workflow.add_conditional_edges(
    "call_model",
    tools_condition,
)
workflow.add_edge("tools", "call_model")
workflow.add_edge("call_model", END)

graph = workflow.compile()
graph.name = "chat_graph"
