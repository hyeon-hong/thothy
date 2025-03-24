"""Test that staff_graph stores and retrieves user memories properly."""

import asyncio
import sys
import os
from pathlib import Path

# Configure path
root_dir = Path(__file__).parent.parent.parent
sys.path.append(str(root_dir))

# Disable LangSmith tracing for tests
os.environ["LANGCHAIN_TRACING_V2"] = "false"
os.environ["LANGCHAIN_PROJECT"] = ""
os.environ["LANGCHAIN_API_KEY"] = ""
os.environ["LANGCHAIN_ENDPOINT"] = ""


async def test_staff_memory():
    """Test the staff agent's memory capabilities."""
    # Import here to avoid import issues
    import importlib
    from langgraph.checkpoint.memory import MemorySaver
    from backend.staff_agent.src.staff_graph.configuration import StaffConfigurable
    
    # Import the graph module but don't use the singleton
    staff_graph_module = importlib.import_module("backend.staff_agent.src.staff_graph.graph")
    
    # Create a test-specific instance of the graph
    print("Creating test-specific graph instance...")
    test_graph = staff_graph_module.workflow.compile(
        checkpointer=MemorySaver(),
        store=staff_graph_module.store.store
    )
    test_graph.name = "test_staff_graph"
    
    print("Starting staff memory test...")
    
    # Configure test parameters
    config = StaffConfigurable(
        user_id="test_user_123",
        project_id="test_project_456",
        team_id="test_team_789",
        staff_id="test_staff_001",
        agent_id="chat"  # Using chat agent for the test
    )
    
    # First interaction - provide personal information
    print("\n1. Sending: 'My name is Tom and I love a pizza'")
    first_message = {"messages": [
        {"role": "user", "content": "My name is Tom and I love a pizza"}
    ]}
    
    first_response = await test_graph.ainvoke(first_message, {"configurable": config})
    print(f"Response: {first_response['messages'][-1]['content']}")
    
    # Allow time for background memory processing
    print("\nWaiting for memory processing...")
    await asyncio.sleep(3)
    
    # Second interaction - test if information was remembered
    print("\n2. Sending: 'Do you know my name and what I like?'")
    conversation_history = first_message["messages"] + [first_response["messages"][-1]]
    second_message = {"messages": conversation_history + [
        {"role": "user", "content": "Do you know my name and what I like?"}
    ]}
    
    second_response = await test_graph.ainvoke(second_message, {"configurable": config})
    response_text = second_response["messages"][-1]["content"]
    print(f"Response: {response_text}")
    
    # Check for success
    contains_name = "tom" in response_text.lower()
    contains_food = "pizza" in response_text.lower()
    
    print("\nTest Results:")
    print(f"✓ Contains name 'Tom': {contains_name}")
    print(f"✓ Contains food 'pizza': {contains_food}")
    
    if contains_name and contains_food:
        print("\n✅ TEST PASSED: Agent successfully remembered user information!")
        return True
    else:
        print("\n❌ TEST FAILED: Agent did not remember all user information.")
        return False


if __name__ == "__main__":
    result = asyncio.run(test_staff_memory())
    sys.exit(0 if result else 1) 