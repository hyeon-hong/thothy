from typing import Annotated, Sequence, TypedDict
from langgraph.graph import StateGraph, END, START
from langgraph.graph.ui import AnyUIMessage, ui_message_reducer, push_ui_message
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph.message import add_messages
from langchain_core.messages import SystemMessage, AIMessage, BaseMessage
from langgraph.prebuilt import ToolNode
from data_graph.tools import ALL_TOOLS_LIST

UI_COMPONENT_NAME = "data_graph"


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    ui: Annotated[Sequence[AnyUIMessage], ui_message_reducer]


def call_model(state: AgentState) -> dict:
    """Call the model"""

    # Get the messages
    messages = state["messages"]

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
        "4. Provide clear date context in your response to the user (e.g., 'Here's GOOGL's price history from February 1, 2025 to March 1, 2025...')\n\n"
        "Use the web_search_tool for searching anything except for financial data, company facts, or price-related queries. "
        "For all financial data, company facts, or price-related queries, use the appropriate financial tools.\n\n"
        "After using the web_search_tool, extract only the company stock symbol (ticker) or today's date/time from the results and remove any other information."
    )
    system_message = SystemMessage(content=system_message_content)

    # Get the LLM
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-preview-05-20", temperature=0)

    # Bind the tools to the LLM
    llm_with_tools = llm.bind_tools(ALL_TOOLS_LIST)

    # Invoke the LLM
    response = llm_with_tools.invoke([system_message] + messages)

    # Push the response to the UI
    push_ui_message(UI_COMPONENT_NAME, {}, message=response)

    # Return the result
    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    """LangGraph routing function that determines the next step in the research flow.
    Controls the research loop by deciding whether to continue gathering information
    or to finalize the summary based on the configured maximum number of research loops.
    Args:
        state: Current graph state containing the research loop count
    Returns:
        String literal indicating the next node to visit ("tools" or "END")
    """

    # Get the messages
    messages = state["messages"]

    # Get the last message
    last_message = messages[-1] if messages else None

    # If the last message is not an AI message or doesn't have tool calls, we're done
    if not isinstance(last_message, AIMessage) or not getattr(last_message, "tool_calls", None):
        return END

    # Get the tool calls from the last message
    tool_calls = getattr(last_message, "tool_calls", [])
    if not tool_calls:
        return END

    # If the tool calls are for the price snapshot tool, we need to continue
    return "tools"


# Create the workflow
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("call_model", call_model)
workflow.add_node("tools", ToolNode(ALL_TOOLS_LIST, messages_key="messages"))

# Add edges
workflow.add_edge(START, "call_model")
workflow.add_conditional_edges(
    "call_model", should_continue, ["tools", END])
workflow.add_edge("tools", "call_model")

# Compile the graph
graph = workflow.compile()
graph.name = "data_graph"


# Return the graph
__all__ = ["graph"]
