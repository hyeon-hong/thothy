import pytest
from store_agent.src.store_graph.graph import create_url_processing_graph


@pytest.fixture
def graph():
    """Create a graph instance for testing"""
    return create_url_processing_graph()


def test_url_processing_graph(graph):
    """Test the URL processing graph with example URLs"""
    # Test input state with empty lists/values for optional fields
    input_state = {
        "user_message": (
            "Please process these URLs: "
            "https://example.com https://example.org"
        ),
        "urls": [],  # Initialize empty list
        "content": [],  # Initialize empty list
        "chunks": [],  # Initialize empty list
        "summary": "",  # Initialize empty string
        "chunk_count": 0,  # Initialize with 0
        "namespace": (
            "default",
            "chunks"
        ),  # Initialize with default namespace
        "messages": []  # Required by MessageState
    }
    
    # Run the graph
    result = graph.invoke(input_state)
    
    # Basic assertions
    assert "summary" in result
    assert isinstance(result["summary"], str)
    assert "Number of URLs processed: 2" in result["summary"] 