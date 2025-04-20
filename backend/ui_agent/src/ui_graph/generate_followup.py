"""Generate a followup message after generating or updating an artifact."""
from typing import Any, Dict

from langchain.schema import LangChainConfig

from opencanvas.shared.utils.artifacts import (
    get_artifact_content,
    is_artifact_markdown_content,
)

from ...utils import (
    ensure_store_in_config,
    format_reflections,
    get_model_from_config,
)
from ..prompts import FOLLOWUP_ARTIFACT_PROMPT


async def generate_followup(
    state: Dict[str, Any],
    config: LangChainConfig,
) -> Dict[str, Any]:
    """Generate a followup message after generating or updating an artifact."""
    print("call generate_followup()")

    small_model = await get_model_from_config(
        config,
        max_tokens=250,
        # We say tool calling is true here because that'll cause it to use a small model
        is_tool_calling=True,
    )

    store = ensure_store_in_config(config)
    assistant_id = config.configurable.get("assistant_id")
    if not assistant_id:
        raise ValueError("`assistant_id` not found in configurable")

    memory_namespace = ["memories", assistant_id]
    memory_key = "reflection"
    memories = await store.get(memory_namespace, memory_key)
    memories_as_string = (
        format_reflections(memories.value, only_content=True)
        if memories and memories.value
        else "No reflections found."
    )

    current_artifact_content = (
        get_artifact_content(state["artifact"]) if state.get("artifact") else None
    )

    artifact_content = (
        current_artifact_content.fullMarkdown
        if current_artifact_content and is_artifact_markdown_content(current_artifact_content)
        else current_artifact_content.code
        if current_artifact_content
        else None
    )

    formatted_prompt = (
        FOLLOWUP_ARTIFACT_PROMPT.replace(
            "{artifactContent}",
            artifact_content or "No artifacts generated yet."
        )
        .replace("{reflections}", memories_as_string)
        .replace(
            "{conversation}",
            "\n\n".join(
                f"<{msg.get_type()}>\n{msg.content}\n</{msg.get_type()}>"
                for msg in state["_messages"]
            )
        )
    )

    # TODO: Include the chat history as well.
    response = await small_model.invoke([
        {"role": "user", "content": formatted_prompt},
    ])
    print("response: ", response)

    return {
        "messages": [response],
        "_messages": [response],
    } 