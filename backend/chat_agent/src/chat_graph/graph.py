"""Chat agent using LangGraph with MCP tools."""

from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langchain.chat_models import init_chat_model
from langchain_core.messages import AIMessage

# --- MCP Client and Tools Setup ---

# You must ensure math_server.py exists and langchain_mcp_adapters is installed
client = MultiServerMCPClient(
    {
        "math": {
            "command": "python",
            # Update to the full absolute path to your math_server.py file
            "args": ["./examples/math_server.py"],
            "transport": "stdio",
        },
        "weather": {
            # Make sure you start your weather server on port 8000
            "url": "http://localhost:8000/mcp/",
            "transport": "streamable_http",
        }
    }
)

# Tools will be loaded asynchronously and cached
tools = None


async def get_tools():
    global tools
    if tools is None:
        tools = await client.get_tools()
    return tools

# --- Model Setup ---
model = init_chat_model("openai:gpt-4.1")

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
