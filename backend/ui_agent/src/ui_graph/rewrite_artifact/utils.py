"""Utility functions for the rewrite artifact functionality."""
from typing import Any, Dict, Union

from opencanvas.shared.utils.artifacts import (
    get_artifact_content,
    is_artifact_code_content,
)
from opencanvas.shared.types import (
    ArtifactCodeV3,
    ArtifactMarkdownV3,
)

from ...prompts import (
    OPTIONALLY_UPDATE_META_PROMPT,
    UPDATE_ENTIRE_ARTIFACT_PROMPT,
)
from .schemas import OptionallyUpdateArtifactMeta


def validate_state(state: Dict[str, Any]) -> Dict[str, Any]:
    """Validate the state and return required components."""
    current_artifact_content = (
        get_artifact_content(state["artifact"]) if state.get("artifact") else None
    )
    if not current_artifact_content:
        raise ValueError("No artifact found")

    recent_human_message = next(
        (msg for msg in reversed(state["_messages"]) if msg.get_type() == "human"),
        None,
    )
    if not recent_human_message:
        raise ValueError("No recent human message found")

    return {"current_artifact_content": current_artifact_content, "recent_human_message": recent_human_message}


def build_meta_prompt(artifact_meta: OptionallyUpdateArtifactMeta) -> str:
    """Build the meta prompt for artifact updates."""
    title_section = (
        f"\nAnd its title is (do NOT include this in your response):\n{artifact_meta.title}"
        if artifact_meta.title and artifact_meta.type != "code"
        else ""
    )

    return OPTIONALLY_UPDATE_META_PROMPT.replace(
        "{artifactType}", artifact_meta.type
    ).replace("{artifactTitle}", title_section)


def build_prompt(
    artifact_content: str,
    memories_as_string: str,
    is_new_type: bool,
    artifact_meta: OptionallyUpdateArtifactMeta,
) -> str:
    """Build the complete prompt for artifact updates."""
    meta_prompt = build_meta_prompt(artifact_meta) if is_new_type else ""

    return (
        UPDATE_ENTIRE_ARTIFACT_PROMPT.replace("{artifactContent}", artifact_content)
        .replace("{reflections}", memories_as_string)
        .replace("{updateMetaPrompt}", meta_prompt)
    )


def get_language(
    artifact_meta: OptionallyUpdateArtifactMeta,
    current_artifact_content: Union[ArtifactCodeV3, ArtifactMarkdownV3],
) -> str:
    """Get the programming language for the artifact."""
    if artifact_meta.language:
        return artifact_meta.language
    
    return (
        current_artifact_content.language
        if is_artifact_code_content(current_artifact_content)
        else "other"
    )


def create_new_artifact_content(
    artifact_type: str,
    state: Dict[str, Any],
    current_artifact_content: Union[ArtifactCodeV3, ArtifactMarkdownV3],
    artifact_meta: OptionallyUpdateArtifactMeta,
    new_content: str,
) -> Union[ArtifactCodeV3, ArtifactMarkdownV3]:
    """Create new artifact content based on type and metadata."""
    base_content = {
        "index": len(state["artifact"]["contents"]) + 1,
        "title": artifact_meta.title or current_artifact_content.title,
    }

    if artifact_type == "code":
        return {
            **base_content,
            "type": "code",
            "language": get_language(artifact_meta, current_artifact_content),
            "code": new_content,
        }

    return {
        **base_content,
        "type": "text",
        "fullMarkdown": new_content,
    } 