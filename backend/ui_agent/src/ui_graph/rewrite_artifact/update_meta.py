"""Functions for updating artifact metadata."""
from typing import Any, Dict

from langchain.schema import LangChainConfig

from opencanvas.shared.utils.artifacts import (
    get_artifact_content,
    format_artifact_content,
)
from ...prompts import GET_TITLE_TYPE_REWRITE_ARTIFACT
from ...utils import (
    format_reflections,
    get_model_from_config,
    is_using_o1_mini_model,
)
from .schemas import OptionallyUpdateArtifactMeta


async def optionally_update_artifact_meta(
    state: Dict[str, Any],
    config: LangChainConfig,
) -> OptionallyUpdateArtifactMeta:
    """Optionally update the artifact metadata based on the current state and configuration."""
    tool_calling_model = (
        await get_model_from_config(config, is_tool_calling=True)
        .with_structured_output(
            OptionallyUpdateArtifactMeta,
            name="optionally_update_artifact_meta",
        )
        .with_config(run_name="optionally_update_artifact_meta")
    )

    memories_as_string = await format_reflections(config)

    current_artifact_content = (
        get_artifact_content(state["artifact"]) if state.get("artifact") else None
    )
    if not current_artifact_content:
        raise ValueError("No artifact found")

    optionally_update_artifact_meta_prompt = (
        GET_TITLE_TYPE_REWRITE_ARTIFACT.replace(
            "{artifact}",
            format_artifact_content(current_artifact_content, include_title=True)
        ).replace("{reflections}", memories_as_string)
    )

    recent_human_message = next(
        (msg for msg in reversed(state["_messages"]) if msg.get_type() == "human"),
        None,
    )
    if not recent_human_message:
        raise ValueError("No recent human message found")

    is_o1_mini_model = is_using_o1_mini_model(config)
    optionally_update_artifact_response = await tool_calling_model.invoke([
        {
            "role": "user" if is_o1_mini_model else "system",
            "content": optionally_update_artifact_meta_prompt,
        },
        recent_human_message,
    ])

    return optionally_update_artifact_response 