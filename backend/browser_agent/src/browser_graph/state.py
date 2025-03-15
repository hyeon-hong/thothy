"""State definitions for the browser agent graph."""

from typing import Annotated, List, Optional, TypedDict, Dict, Any
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages, get_messages_history

# Define the state schema for our browser agent
class BrowserState(TypedDict):
    """State for the browser agent."""
    # The task the agent is trying to accomplish
    task: str
    # The current URL the agent is on
    url: str
    # History of messages exchanged between components
    messages: Annotated[List[BaseMessage], add_messages]
    # The browser context for Playwright
    browser_context: Optional[Dict[str, Any]]
    # Current screenshot (base64 encoded)
    screenshot: Optional[str]
    # Annotated screenshot with element markers (base64 encoded)
    annotated_screenshot: Optional[str]
    # Mapping of element IDs to their properties
    elements: Optional[Dict[str, Dict[str, Any]]]
    # Current page HTML content
    page_content: Optional[str]
    # Action history
    action_history: List[Dict[str, Any]]
    # Final result/answer
    final_answer: Optional[str]
    # Error message (if any)
    error: Optional[str]
    # Whether the task is complete
    is_complete: bool

def get_state_dict() -> Dict[str, Any]:
    """Get the initial state dictionary for the browser agent.
    
    Returns:
        Dict[str, Any]: Initial state dictionary
    """
    return {
        "task": "",
        "url": "",
        "messages": [],
        "browser_context": None,
        "screenshot": None,
        "annotated_screenshot": None,
        "elements": None,
        "page_content": None,
        "action_history": [],
        "final_answer": None,
        "error": None,
        "is_complete": False,
    }

def get_empty_state() -> BrowserState:
    """Get an empty state for the browser agent.
    
    Returns:
        BrowserState: Empty state
    """
    return get_state_dict()  # type: ignore

def get_messages_from_state(state: BrowserState) -> List[BaseMessage]:
    """Extract message history from state.
    
    Args:
        state: Current state
        
    Returns:
        List[BaseMessage]: List of messages
    """
    return get_messages_history(state, "messages") 