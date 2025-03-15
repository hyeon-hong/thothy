#!/usr/bin/env python3
"""Example usage of the browser agent."""

import asyncio
import json
import os
import sys
from typing import Dict, Any

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from browser_graph.graph import configure_and_get_graph
from browser_graph.state import get_empty_state
from browser_graph.utils import apply_nest_asyncio


async def main():
    """Run the browser agent example."""
    # Apply nest_asyncio to allow running async code in a Jupyter notebook or other async environment
    apply_nest_asyncio()
    
    # Configure the graph
    graph = configure_and_get_graph()
    
    # Prepare the initial state
    state = get_empty_state()
    
    # Set the task and initial URL
    state["task"] = "Search for the latest news on AI and summarize the top 3 results"
    state["url"] = "https://www.google.com"
    
    print(f"Starting browser agent with task: {state['task']}")
    print(f"Initial URL: {state['url']}")
    
    # Execute the graph
    result = await graph.ainvoke(state)
    
    # Print the final answer
    print("\nTask completed!")
    print("Final answer:", result.get("final_answer", "No final answer provided."))
    
    # Print a summary of actions taken
    action_history = result.get("action_history", [])
    print(f"\nActions taken: {len(action_history)}")
    for i, action in enumerate(action_history):
        action_type = action.get("type", "Unknown")
        details = action.get("details", {})
        print(f"{i+1}. {action_type}: {json.dumps(details)}")


if __name__ == "__main__":
    asyncio.run(main()) 