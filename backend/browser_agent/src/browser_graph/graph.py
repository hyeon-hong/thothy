"""Graph definition for the browser agent."""

from typing import Annotated, Any, Dict, List, Tuple, Optional, Union, TypedDict, Callable

import json

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolExecutor, ToolNode, tools_condition

from browser_graph.prompts import (
    BROWSER_ACTION_PROMPT,
    BROWSER_AGENT_SYSTEM_PROMPT,
    PLAN_TASK_PROMPT,
    REFLECTION_PROMPT,
)
from browser_graph.state import BrowserState, get_empty_state, get_messages_from_state
from browser_graph.tools import (
    click_element,
    close_browser,
    get_and_annotate_page_elements,
    get_page_content,
    initialize_browser,
    navigate_to_url,
    press_key,
    scroll_page,
    take_screenshot,
    type_text,
)
from browser_graph.utils import (
    create_action_summary,
    create_ai_message,
    create_human_message,
    create_system_message,
    extract_json_from_string,
    format_action_history,
    is_url,
    safe_json_loads,
)


# List of available tools
TOOLS = [
    initialize_browser,
    navigate_to_url,
    take_screenshot,
    get_page_content,
    get_and_annotate_page_elements,
    click_element,
    type_text,
    scroll_page,
    press_key,
    close_browser
]


def validate_and_initialize(state: BrowserState) -> Dict[str, Any]:
    """Validate and initialize the state.
    
    Args:
        state: Current state
        
    Returns:
        Dict[str, Any]: Updated state
    """
    updates = {}
    
    # Add a system message if none exists
    messages = get_messages_from_state(state)
    if not messages or not any(isinstance(msg, SystemMessage) for msg in messages):
        updates["messages"] = [create_system_message(BROWSER_AGENT_SYSTEM_PROMPT)]
    
    # Add a human message with the task if none exists
    if state["task"] and (not messages or not any(isinstance(msg, HumanMessage) for msg in messages)):
        if "messages" in updates:
            updates["messages"].append(create_human_message(f"Task: {state['task']}"))
        else:
            updates["messages"] = [create_system_message(BROWSER_AGENT_SYSTEM_PROMPT), 
                                 create_human_message(f"Task: {state['task']}")]
    
    return updates


def initialize_browser_node(state: BrowserState) -> Dict[str, Any]:
    """Initialize the browser.
    
    Args:
        state: Current state
        
    Returns:
        Dict[str, Any]: Updated state
    """
    # Add a message indicating we're initializing the browser
    messages = get_messages_from_state(state)
    
    if not state["browser_context"]:
        new_message = create_ai_message("I'll help you accomplish this task. First, let me initialize the browser.")
        return {
            "messages": messages + [new_message],
            "browser_context": {"status": "initializing"}
        }
    
    return {}


def plan_task(state: BrowserState) -> Dict[str, Any]:
    """Plan the task.
    
    Args:
        state: Current state
        
    Returns:
        Dict[str, Any]: Updated state with plan
    """
    task = state["task"]
    url = state["url"]
    
    # Format the prompt
    prompt = PLAN_TASK_PROMPT.format(task=task, url=url)
    
    # Get the current messages
    messages = get_messages_from_state(state)
    
    # Create a new AI message with the plan
    new_message = create_ai_message(f"Let me plan how to approach this task:\n\n{prompt}")
    
    # Update the state with the new message
    return {"messages": messages + [new_message]}


def get_browser_state(state: BrowserState) -> Dict[str, Any]:
    """Get the current browser state.
    
    Args:
        state: Current state
        
    Returns:
        Dict[str, Any]: Updated state with browser information
    """
    updates = {}
    
    # If we don't have elements or screenshot, we need to get them
    if not state["elements"] or not state["annotated_screenshot"]:
        updates["browser_context"] = {"status": "refreshing"}
    
    return updates


def interpret_browser_state(state: BrowserState) -> Dict[str, Any]:
    """Interpret the current browser state and decide on next action.
    
    Args:
        state: Current state
        
    Returns:
        Dict[str, Any]: Updated state with interpretation
    """
    task = state["task"]
    url = state["url"]
    elements = json.dumps(state["elements"], indent=2) if state["elements"] else "No elements detected"
    action_history = format_action_history(state["action_history"])
    
    # Format the prompt
    prompt = BROWSER_ACTION_PROMPT.format(
        task=task, 
        url=url, 
        elements=elements, 
        action_history=action_history
    )
    
    # Get the current messages
    messages = get_messages_from_state(state)
    
    # Create a new AI message with the interpretation
    new_message = create_ai_message(
        f"Based on the current browser state, I'll decide on the next action:\n\n{prompt}"
    )
    
    # Update the state with the new message
    return {"messages": messages + [new_message]}


def execute_action(state: BrowserState) -> Dict[str, Any]:
    """Execute the chosen action based on the agent's decision.
    
    Args:
        state: Current state
        
    Returns:
        Dict[str, Any]: Updated state with action result
    """
    # Get the last AI message
    messages = get_messages_from_state(state)
    last_message = next((m for m in reversed(messages) if isinstance(m, AIMessage)), None)
    
    if not last_message:
        return {}
    
    # Extract the action from the message
    content = last_message.content
    
    # Simple heuristic parsing for actions
    # In a real implementation, you would use more robust extraction methods
    
    # Check for URL navigation
    if "navigate to" in content.lower() and state["url"]:
        # Extract URL using regex or simple parsing
        # For simplicity, we're using a placeholder logic here
        url_parts = content.lower().split("navigate to")
        if len(url_parts) > 1:
            target_url = url_parts[1].strip().split()[0].strip()
            if is_url(target_url):
                return {
                    "action_history": state["action_history"] + [
                        create_action_summary("navigate", {"url": target_url}, {"status": "executing"})
                    ],
                    "url": target_url
                }
    
    # Check for element clicking
    if "click" in content.lower() and state["elements"]:
        # Extract element ID
        for element_id in state["elements"].keys():
            if element_id in content:
                return {
                    "action_history": state["action_history"] + [
                        create_action_summary("click", {"element": element_id}, {"status": "executing"})
                    ]
                }
    
    # Check for typing
    if "type" in content.lower() and state["elements"]:
        # Extract element ID and text
        for element_id in state["elements"].keys():
            if element_id in content:
                # Very simple text extraction - in real implementation use more robust methods
                text_parts = content.lower().split("type")
                if len(text_parts) > 1:
                    text = text_parts[1].strip().split('"')[1] if '"' in text_parts[1] else text_parts[1].strip()
                    return {
                        "action_history": state["action_history"] + [
                            create_action_summary("type", {"element": element_id, "text": text}, {"status": "executing"})
                        ]
                    }
    
    # Check for scrolling
    if "scroll" in content.lower():
        direction = "down"  # Default
        if "up" in content.lower():
            direction = "up"
        elif "down" in content.lower():
            direction = "down"
        elif "left" in content.lower():
            direction = "left"
        elif "right" in content.lower():
            direction = "right"
            
        return {
            "action_history": state["action_history"] + [
                create_action_summary("scroll", {"direction": direction}, {"status": "executing"})
            ]
        }
    
    # Check for task completion
    if "complete" in content.lower() or "finished" in content.lower() or "done" in content.lower():
        # Extract the final answer
        return {
            "final_answer": content,
            "is_complete": True
        }
    
    # Default - no recognized action
    return {}


def reflect_on_actions(state: BrowserState) -> Dict[str, Any]:
    """Reflect on the actions taken so far.
    
    Args:
        state: Current state
        
    Returns:
        Dict[str, Any]: Updated state with reflection
    """
    if len(state["action_history"]) > 0 and len(state["action_history"]) % 5 == 0:
        # Every 5 actions, perform a reflection
        task = state["task"]
        action_history = format_action_history(state["action_history"])
        last_action = format_action_history([state["action_history"][-1]]) if state["action_history"] else "No actions yet"
        current_state = f"URL: {state['url']}"
        
        # Format the prompt
        prompt = REFLECTION_PROMPT.format(
            task=task,
            action_history=action_history,
            last_action=last_action,
            current_state=current_state
        )
        
        # Get the current messages
        messages = get_messages_from_state(state)
        
        # Create a new AI message with the reflection
        new_message = create_ai_message(
            f"Let me reflect on my progress so far:\n\n{prompt}"
        )
        
        # Update the state with the new message
        return {"messages": messages + [new_message]}
    
    return {}


def check_completion(state: BrowserState) -> Union[Tuple[str, Any], str]:
    """Check if the task is complete.
    
    Args:
        state: Current state
        
    Returns:
        Union[Tuple[str, Any], str]: Next node to execute or END
    """
    if state["is_complete"]:
        return END
    
    if state.get("error"):
        return "handle_error"
    
    # Execute the browser agent loop
    return "get_browser_state"


def handle_error(state: BrowserState) -> Dict[str, Any]:
    """Handle errors.
    
    Args:
        state: Current state
        
    Returns:
        Dict[str, Any]: Updated state with error handling
    """
    error = state.get("error", "Unknown error")
    
    # Get the current messages
    messages = get_messages_from_state(state)
    
    # Create a new AI message with the error handling
    new_message = create_ai_message(
        f"I encountered an error: {error}. Let me try to recover and continue with the task."
    )
    
    # Update the state with the new message
    return {
        "messages": messages + [new_message],
        "error": None  # Clear the error
    }


def create_graph(tools: List[Any] = None) -> StateGraph:
    """Create the browser agent graph.
    
    Args:
        tools: List of tools to use
        
    Returns:
        StateGraph: Browser agent graph
    """
    if tools is None:
        tools = TOOLS
    
    # Create the tool executor
    tool_executor = ToolExecutor(tools)
    
    # Create the tool node
    tool_node = ToolNode(tools)
    
    # Create the graph
    workflow = StateGraph(BrowserState)
    
    # Add nodes
    workflow.add_node("validate_and_initialize", validate_and_initialize)
    workflow.add_node("initialize_browser", initialize_browser_node)
    workflow.add_node("plan_task", plan_task)
    workflow.add_node("get_browser_state", get_browser_state)
    workflow.add_node("tools", tool_node)
    workflow.add_node("interpret_browser_state", interpret_browser_state)
    workflow.add_node("execute_action", execute_action)
    workflow.add_node("reflect_on_actions", reflect_on_actions)
    workflow.add_node("handle_error", handle_error)
    
    # Add edges
    workflow.add_edge("validate_and_initialize", "initialize_browser")
    workflow.add_edge("initialize_browser", "plan_task")
    workflow.add_edge("plan_task", "get_browser_state")
    
    # Tool execution loop
    workflow.add_edge("get_browser_state", "tools")
    workflow.add_edge("tools", "interpret_browser_state")
    workflow.add_edge("interpret_browser_state", "execute_action")
    workflow.add_edge("execute_action", "reflect_on_actions")
    workflow.add_edge("reflect_on_actions", "check_completion")
    
    # Error handling
    workflow.add_edge("handle_error", "get_browser_state")
    
    # Add conditional edges
    workflow.add_conditional_edges(
        "check_completion",
        check_completion,
        {
            "get_browser_state": "get_browser_state",
            "handle_error": "handle_error",
            END: END
        }
    )
    
    # Set the entry point
    workflow.set_entry_point("validate_and_initialize")
    
    return workflow


def configure_and_get_graph(
    model_name: str = "gpt-4-vision-preview",
    temperature: float = 0.2,
    tools: List[Any] = None,
) -> StateGraph:
    """Configure and get the browser agent graph.
    
    Args:
        model_name: Name of the OpenAI model to use
        temperature: Temperature for the model
        tools: List of tools to use
        
    Returns:
        StateGraph: Configured browser agent graph
    """
    if tools is None:
        tools = TOOLS
    
    graph = create_graph(tools)
    return graph.compile() 