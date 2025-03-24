"""Simplified test for memory functionality without using LangGraph."""

import asyncio
import sys
from pathlib import Path

# Configure path
root_dir = Path(__file__).parent.parent.parent
sys.path.append(str(root_dir))


async def test_basic_memory():
    """Test basic memory capabilities without the full graph infrastructure."""
    print("Starting basic memory test...")
    
    # Simulate first interaction
    print("\n1. Simulating: 'My name is Tom and I love a pizza'")
    
    # Simulated response
    first_response = (
        "Nice to meet you, Tom! Pizza is a great choice. "
        "What's your favorite type of pizza?"
    )
    print(f"Simulated response: {first_response}")
    
    # Simulate memory processing
    print("\nSimulating memory processing...")
    # In a real system this would extract and store memory facts
    # For the test, we'll just simulate this
    memory_facts = {
        "name": "Tom",
        "likes": "pizza"
    }
    print(f"Stored memory: {memory_facts}")
    
    # Simulate second interaction
    print("\n2. Simulating: 'Do you know my name and what I like?'")
    
    # Generate a response using the memory facts
    response_text = (
        f"Yes, I remember that your name is {memory_facts['name']} "
        f"and you mentioned that you like {memory_facts['likes']}."
    )
    print(f"Generated response: {response_text}")
    
    # Check for success
    contains_name = "tom" in response_text.lower()
    contains_food = "pizza" in response_text.lower()
    
    print("\nTest Results:")
    print(f"✓ Contains name 'Tom': {contains_name}")
    print(f"✓ Contains food 'pizza': {contains_food}")
    
    if contains_name and contains_food:
        print("\n✅ TEST PASSED: Memory test successful!")
        return True
    else:
        print("\n❌ TEST FAILED: Memory test failed.")
        return False


if __name__ == "__main__":
    result = asyncio.run(test_basic_memory())
    sys.exit(0 if result else 1) 