from langgraph.graph import StateGraph, END, START
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, AIMessage
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict, Union

from .tools import ALL_TOOLS_LIST


# Define the state for the graph
class GraphState(BaseModel):
    """State for the graph"""

    messages: List[Any] = Field(default_factory=list)
    requested_stock_purchase_details: Optional[Dict[str, Any]] = None


def call_model(state: GraphState) -> Dict[str, Any]:
    """Call the model"""

    # Get the messages
    messages = state.messages

    # Get the system message
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

    # Get the LLM
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    # Bind the tools to the LLM
    llm_with_tools = llm.bind_tools(ALL_TOOLS_LIST)

    # Invoke the LLM
    result = llm_with_tools.invoke([system_message] + messages)

    # Return the result
    return {"messages": result}


def should_continue(state: GraphState) -> Union[str, List[str]]:
    """LangGraph routing function that determines the next step in the research flow.

    Controls the research loop by deciding whether to continue gathering information
    or to finalize the summary based on the configured maximum number of research loops.

    Args:
        state: Current graph state containing the research loop count

    Returns:
        String literal indicating the next node to visit ("tools" or "END")
    """

    # If the last message is not an AI message or doesn't have tool calls, we're done
    messages = state.messages
    last_message = messages[-1] if messages else None
    if not isinstance(last_message, AIMessage) or not getattr(last_message, "tool_calls", None):
        return END

    # Get the tool calls from the last message
    tool_calls = getattr(last_message, "tool_calls", [])
    if not tool_calls:
        raise RuntimeError(
            "Expected tool_calls to be an array with at least one element")

    # If the tool calls are for the price snapshot tool, we need to continue
    routes = []
    for tc in tool_calls:
        routes.append("tools")

    # Otherwise, we're done
    return routes


def find_company_ticker(company_name: str) -> str:
    """Find the company ticker"""

    # Placeholder: In production, use a web search tool or LLM to extract ticker
    # For now, just return the company name as ticker for demo
    return company_name.upper()


def build_graph():
    """Build the graph"""

    # Create the workflow
    workflow = StateGraph(GraphState)

    # Add nodes
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", lambda state: state)

    # Add edges
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges("agent", should_continue, ["tools", END])
    workflow.add_edge("tools", "agent")

    # Compile the graph
    return workflow.compile()


# Build the graph
graph = build_graph()
