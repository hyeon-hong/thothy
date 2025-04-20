"""Main graph definition for the Open Canvas application."""

from typing import Dict, Any, Union
from langgraph.graph import END, StateGraph
from langgraph.prebuilt.messages import Command, Send

from .state import OpenCanvasGraphAnnotation
from .generate_artifact import generate_artifact
from .nodes import generate_followup
from .nodes.rewrite_artifact import rewrite_artifact
from .nodes import reply_to_general_input
from .nodes import rewrite_code_artifact_theme
from .utils import create_ai_message_from_web_results

# Constants
DEFAULT_INPUTS = {
    "messages": [],
    "_messages": [],
    "highlighted_code": None,
    "highlighted_text": None,
    "artifact": None,
    "next": None,
    "language": None,
    "artifact_length": None,
    "regenerate_with_emojis": None,
    "reading_level": None,
    "add_comments": None,
    "add_logs": None,
    "port_language": None,
    "fix_bugs": None,
    "custom_quick_action_id": None,
    "web_search_enabled": None,
    "web_search_results": None,
}

# ~ 4 chars per token, max tokens of 75000. 75000 * 4 = 300000
CHARACTER_MAX = 300000


def route_node(state: Dict[str, Any]) -> Send:
    """Route to the next node based on state."""
    print("call route_node()")
    print("state.next: ", state.get("next"))

    if not state.get("next"):
        raise ValueError("'next' state field not set.")

    return Send(state["next"], state)


def clean_state(_: Dict[str, Any]) -> Dict[str, Any]:
    """Reset state to default values."""
    return DEFAULT_INPUTS.copy()


def simple_token_calculator(state: Dict[str, Any]) -> Union[str, str]:
    """Calculate if we need to summarize based on total characters."""
    total_chars = 0
    for msg in state["_messages"]:
        if isinstance(msg.content, str):
            total_chars += len(msg.content)
        else:
            # Handle multi-modal content
            all_content = [
                c["text"] for c in msg.content
                if "text" in c
            ]
            total_chars += sum(len(c) for c in all_content)

    if total_chars > CHARACTER_MAX:
        return "summarizer"
    return END


def conditionally_generate_title(state: Dict[str, Any]) -> Union[str, str]:
    """Conditionally route to the 'generateTitle' node."""
    print("call conditionally_generate_title()")

    if len(state["messages"]) > 2:
        # Do not generate if there are more than two messages
        return simple_token_calculator(state)
    return "generateTitle"


def route_post_web_search(state: Dict[str, Any]) -> Union[Send, Command]:
    """Route after web search based on results."""
    # Check if there are multiple artifacts
    includes_artifacts = len(state.get("artifact", {}).get("contents", [])) > 1

    if not state.get("web_search_results"):
        return Send(
            "rewriteArtifact" if includes_artifacts else "generateArtifact",
            {**state, "web_search_enabled": False}
        )

    # Create message from web search results
    web_search_results_message = create_ai_message_from_web_results(
        state["web_search_results"]
    )

    return Command(
        goto="rewriteArtifact" if includes_artifacts else "generateArtifact",
        update={
            "web_search_enabled": False,
            "messages": [web_search_results_message],
            "_messages": [web_search_results_message],
        }
    )


# Build the graph
builder = StateGraph(OpenCanvasGraphAnnotation)

# Start node & edge
builder.add_edge("START", "generateArtifact")

# Add nodes
builder.add_node("generateArtifact", generate_artifact)
builder.add_node("rewriteArtifact", rewrite_artifact)
builder.add_node("generateFollowup", generate_followup)
builder.add_node("replyToGeneralInput", reply_to_general_input)

# Add edges
builder.add_edge("generateArtifact", "generateFollowup")
builder.add_edge("rewriteArtifact", "generateFollowup")
builder.add_edge("generateFollowup", "END")
builder.add_edge("replyToGeneralInput", "END")

# Compile the graph
graph = builder.compile()
