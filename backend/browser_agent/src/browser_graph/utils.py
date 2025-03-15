"""Utility functions for the browser agent."""

import asyncio
import base64
import json
import re
from typing import Any, Dict, List, Optional, Union

import nest_asyncio
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage


def format_action_history(action_history: List[Dict[str, Any]]) -> str:
    """Format the action history into a readable string.
    
    Args:
        action_history: List of action history items
        
    Returns:
        str: Formatted action history
    """
    if not action_history:
        return "No actions taken yet."
    
    formatted = []
    for i, action in enumerate(action_history):
        action_type = action.get("type", "Unknown")
        details = action.get("details", {})
        result = action.get("result", {})
        
        formatted_action = f"Action {i+1}: {action_type}"
        
        if details:
            details_str = ", ".join(f"{k}={v}" for k, v in details.items())
            formatted_action += f" ({details_str})"
            
        if result:
            if isinstance(result, dict):
                result_str = ", ".join(f"{k}={v}" for k, v in result.items())
                formatted_action += f" → Result: {result_str}"
            else:
                formatted_action += f" → Result: {result}"
                
        formatted.append(formatted_action)
        
    return "\n".join(formatted)


def extract_json_from_string(s: str) -> Optional[Dict[str, Any]]:
    """Extract a JSON object from a string.
    
    Args:
        s: String potentially containing JSON
        
    Returns:
        Optional[Dict[str, Any]]: Extracted JSON object or None
    """
    json_pattern = r'```json\s*(.*?)\s*```|{.*}'
    match = re.search(json_pattern, s, re.DOTALL)
    
    if match:
        json_str = match.group(1) if match.group(1) else match.group(0)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            pass
    
    return None


def create_action_summary(action: str, details: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
    """Create a summary of an action for the action history.
    
    Args:
        action: Action type
        details: Action details
        result: Action result
        
    Returns:
        Dict[str, Any]: Action summary
    """
    return {
        "type": action,
        "details": details,
        "result": result,
        "timestamp": asyncio.get_event_loop().time()
    }


def escape_html(text: str) -> str:
    """Escape HTML characters.
    
    Args:
        text: Text to escape
        
    Returns:
        str: Escaped text
    """
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def safe_json_loads(s: str) -> Union[Dict[str, Any], str]:
    """Safely load JSON from a string.
    
    Args:
        s: String to parse as JSON
        
    Returns:
        Union[Dict[str, Any], str]: Parsed JSON or original string if parsing fails
    """
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        return s


def apply_nest_asyncio():
    """Apply nest_asyncio to allow nested asyncio event loops.
    
    This is needed for running async Playwright code in environments
    like Jupyter notebooks or other async contexts.
    """
    try:
        nest_asyncio.apply()
    except RuntimeError:
        # Already applied
        pass


def create_system_message(content: str) -> SystemMessage:
    """Create a system message.
    
    Args:
        content: Message content
        
    Returns:
        SystemMessage: Created message
    """
    return SystemMessage(content=content)


def create_human_message(content: str) -> HumanMessage:
    """Create a human message.
    
    Args:
        content: Message content
        
    Returns:
        HumanMessage: Created message
    """
    return HumanMessage(content=content)


def create_ai_message(content: str) -> AIMessage:
    """Create an AI message.
    
    Args:
        content: Message content
        
    Returns:
        AIMessage: Created message
    """
    return AIMessage(content=content)


def is_url(text: str) -> bool:
    """Check if text is a URL.
    
    Args:
        text: Text to check
        
    Returns:
        bool: Whether text is a URL
    """
    url_pattern = re.compile(
        r'^(https?|ftp)://'  # scheme
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|'  # ip
        r'\[?[A-F0-9]*:[A-F0-9:]+\]?)'  # ipv6
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    return bool(url_pattern.match(text)) 