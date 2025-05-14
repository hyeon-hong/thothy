from langgraph.graph import StateGraph, END, START
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, AIMessage, ToolMessage
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict, Union
from .tools import ALL_TOOLS_LIST, price_snapshot_tool
import os


# Define the state for the graph
class GraphState(BaseModel):
    messages: List[Any] = Field(default_factory=list)
    requested_stock_purchase_details: Optional[Dict[str, Any]] = None


def call_model(state: GraphState) -> Dict[str, Any]:
    messages = state.messages
    system_message_content = (
        "You're an expert financial analyst, tasked with answering the users questions "
        "about a given company or companies. You do not have up to date information on "
        "the companies, so you must call tools when answering users questions. "
        "All financial data tools require a company ticker to be passed in as a parameter. If you "
        "do not know the ticker or today's date, you should use the web search tool to find it.\n\n"
        "When handling time-related queries, carefully interpret relative time references as follows:\n"
        "- 'Last month' means the previous calendar month (e.g., if today is March 13, 2025, 'last month' refers to February 1-28, 2025)\n"
        "- 'Last week' means the 7 days before the current date\n"
        "- 'Last year' means the previous calendar year\n"
        "- 'Year to date' or 'YTD' means from January 1 of the current year until today\n"
        "- 'Last quarter' means the previous 3 months\n"
        "- 'Last 30 days' means a 30-day window ending today\n\n"
        "For price history and financial data tools, when no explicit dates are provided:\n"
        "1. First check if the query contains time period indicators (e.g., 'last month', 'past 3 years', etc.)\n"
        "2. For relative time references, calculate the appropriate start and end dates based on the current date\n"
        "3. Pass these calculated dates to the appropriate tool rather than relying on default values\n"
        "4. Provide clear date context in your response to the user (e.g., 'Here's GOOGL's price history from February 1, 2025 to March 1, 2025...')"
    )
    system_message = SystemMessage(content=system_message_content)
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    llm_with_tools = llm.bind_tools(ALL_TOOLS_LIST)
    result = llm_with_tools.invoke([system_message] + messages)
    return {"messages": result}


def should_continue(state: GraphState) -> Union[str, List[str]]:
    messages = state.messages
    requested = state.requested_stock_purchase_details
    last_message = messages[-1] if messages else None
    if not isinstance(last_message, AIMessage) or not getattr(last_message, "tool_calls", None):
        return END
    if requested:
        return "execute_purchase"
    tool_calls = getattr(last_message, "tool_calls", [])
    if not tool_calls:
        raise RuntimeError("Expected tool_calls to be an array with at least one element")
    routes = []
    for tc in tool_calls:
        if tc["name"] == "purchase_stock":
            routes.append("prepare_purchase_details")
        else:
            routes.append("tools")
    return routes


def prepare_purchase_details(state: GraphState) -> Dict[str, Any]:
    messages = state.messages
    last_message = messages[-1] if messages else None
    if not isinstance(last_message, AIMessage):
        raise RuntimeError("Expected the last message to be an AI message")
    tool_calls = getattr(last_message, "tool_calls", [])
    purchase_stock_tool = next((tc for tc in tool_calls if tc["name"] == "purchase_stock"), None)
    if not purchase_stock_tool:
        raise RuntimeError("Expected the last AI message to have a purchase_stock tool call")
    args = purchase_stock_tool["args"]
    max_purchase_price = args.get("maxPurchasePrice")
    company_name = args.get("companyName")
    ticker = args.get("ticker")
    if not ticker:
        if not company_name:
            tool_messages = [
                ToolMessage(
                    content=f"Please provide the missing information for the {tc['name']} tool.",
                    tool_call_id=tc["id"]
                ) for tc in tool_calls
            ]
            return {
                "messages": messages + tool_messages + [
                    AIMessage(content="Please provide either the company ticker or the company name to purchase stock.")
                ]
            }
        else:
            ticker = find_company_ticker(company_name)
    if not max_purchase_price:
        price_snapshot = price_snapshot_tool.invoke({"ticker": ticker})
        max_purchase_price = price_snapshot["snapshot"]["price"]
    return {
        "requested_stock_purchase_details": {
            "ticker": ticker,
            "quantity": args.get("quantity", 1),
            "maxPurchasePrice": max_purchase_price,
        }
    }


def find_company_ticker(company_name: str) -> str:
    # Placeholder: In production, use a web search tool or LLM to extract ticker
    # For now, just return the company name as ticker for demo
    return company_name.upper()


def purchase_approval(state: GraphState) -> None:
    messages = state.messages
    last_message = messages[-1] if messages else None
    if not isinstance(last_message, ToolMessage):
        raise RuntimeError("Please confirm the purchase before executing.")


def should_execute(state: GraphState) -> str:
    messages = state.messages
    last_message = messages[-1] if messages else None
    if not isinstance(last_message, ToolMessage):
        raise RuntimeError("Please confirm the purchase before executing.")
    content = last_message.content
    approve = False
    try:
        approve = bool(eval(content).get("approve"))
    except Exception:
        pass
    return "execute_purchase" if approve else "agent"


def execute_purchase(state: GraphState) -> Dict[str, Any]:
    details = state.requested_stock_purchase_details
    if not details:
        raise RuntimeError("Expected requested_stock_purchase_details to be present")
    ticker = details["ticker"]
    quantity = details["quantity"]
    max_purchase_price = details["maxPurchasePrice"]
    tool_call_id = f"tool_{os.urandom(4).hex()}"
    return {
        "messages": [
            AIMessage(
                content=None,
                tool_calls=[{
                    "name": "execute_purchase",
                    "id": tool_call_id,
                    "args": {
                        "ticker": ticker,
                        "quantity": quantity,
                        "maxPurchasePrice": max_purchase_price,
                    },
                }]
            ),
            ToolMessage(
                content='{"success": true}',
                tool_call_id=tool_call_id
            ),
            AIMessage(
                content=f"Successfully purchased {quantity} share(s) of {ticker} at ${max_purchase_price}/share."
            ),
        ]
    }


def build_graph():
    workflow = StateGraph(GraphState)
    workflow.add_node("agent", call_model)
    workflow.add_edge(START, "agent")
    workflow.add_node("tools", lambda state: state)  # Placeholder for tool node
    workflow.add_node("prepare_purchase_details", prepare_purchase_details)
    workflow.add_node("purchase_approval", purchase_approval)
    workflow.add_node("execute_purchase", execute_purchase)
    workflow.add_edge("prepare_purchase_details", "purchase_approval")
    workflow.add_edge("execute_purchase", END)
    workflow.add_edge("tools", "agent")
    workflow.add_conditional_edges("purchase_approval", should_execute, ["agent", "execute_purchase"])
    workflow.add_conditional_edges("agent", should_continue, ["tools", END, "prepare_purchase_details"])
    return workflow.compile()


graph = build_graph() 