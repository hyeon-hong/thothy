"""Utility functions for artifact generation."""
from typing import Union, Dict, Any

from opencanvas.shared.types import (
    ArtifactCodeV3,
    ArtifactMarkdownV3,
)
from ..prompts import NEW_ARTIFACT_PROMPT


def format_new_artifact_prompt(memories_as_string: str, model_name: str) -> str:
    """Format the new artifact prompt with memories and model-specific instructions."""
    disable_chain_of_thought = (
        "\n\nIMPORTANT: Do NOT preform chain of thought beforehand. Instead, go STRAIGHT to "
        "generating the tool response. This is VERY important."
        if "claude" in model_name
        else ""
    )
    return NEW_ARTIFACT_PROMPT.replace(
        "{reflections}", memories_as_string
    ).replace(
        "{disableChainOfThought}", disable_chain_of_thought
    )


def create_artifact_content(
    tool_call: Dict[str, Any]
) -> Union[ArtifactCodeV3, ArtifactMarkdownV3]:
    """Create an artifact content object from tool call arguments."""
    artifact_type = tool_call.get("type")

    if artifact_type == "code":
        return {
            "index": 1,
            "type": "code",
            "title": tool_call.get("title"),
            "code": tool_call.get("artifact"),
            "language": tool_call.get("language", "other")
        }

    return {
        "index": 1,
        "type": "text",
        "title": tool_call.get("title"),
        "full_markdown": tool_call.get("artifact")
    } 