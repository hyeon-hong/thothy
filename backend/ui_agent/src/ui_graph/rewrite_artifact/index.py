"""Main functionality for rewriting artifacts."""
import uuid
from typing import Any, Dict, Optional

from langchain.schema import AIMessage, LangChainConfig

from opencanvas.shared.utils.artifacts import is_artifact_markdown_content
from opencanvas.shared.utils.thinking import (
    extract_thinking_and_response_tokens,
    is_thinking_model,
)

from ...utils import (
    create_context_document_messages,
    format_reflections,
    get_model_config,
    get_model_from_config,
    is_using_o1_mini_model,
    optionally_get_system_prompt_from_config,
)
from .update_meta import optionally_update_artifact_meta
from .utils import (
    build_prompt,
    create_new_artifact_content,
    validate_state,
)


async def rewrite_artifact(
    state: Dict[str, Any],
    config: LangChainConfig,
) -> Dict[str, Any]:
    """Rewrite an artifact based on the current state and configuration."""
    model_config = get_model_config(config)
    small_model_with_config = (
        await get_model_from_config(config)
    ).with_config(run_name="rewrite_artifact_model_call")
    
    memories_as_string = await format_reflections(config)
    state_components = validate_state(state)
    current_artifact_content = state_components["current_artifact_content"]
    recent_human_message = state_components["recent_human_message"]

    artifact_meta_tool_call = await optionally_update_artifact_meta(state, config)
    artifact_type = artifact_meta_tool_call.type
    is_new_type = artifact_type != current_artifact_content.type

    artifact_content = (
        current_artifact_content.fullMarkdown
        if is_artifact_markdown_content(current_artifact_content)
        else current_artifact_content.code
    )

    formatted_prompt = build_prompt(
        artifact_content=artifact_content,
        memories_as_string=memories_as_string,
        is_new_type=is_new_type,
        artifact_meta=artifact_meta_tool_call,
    )

    user_system_prompt = optionally_get_system_prompt_from_config(config)
    full_system_prompt = (
        f"{user_system_prompt}\n{formatted_prompt}"
        if user_system_prompt
        else formatted_prompt
    )

    context_document_messages = await create_context_document_messages(config)
    is_o1_mini_model = is_using_o1_mini_model(config)
    new_artifact_response = await small_model_with_config.invoke([
        {
            "role": "user" if is_o1_mini_model else "system",
            "content": full_system_prompt,
        },
        *context_document_messages,
        recent_human_message,
    ])

    thinking_message: Optional[AIMessage] = None
    artifact_content_text = new_artifact_response.content

    if is_thinking_model(model_config["modelName"]):
        thinking, response = extract_thinking_and_response_tokens(artifact_content_text)
        thinking_message = AIMessage(
            id=f"thinking-{uuid.uuid4()}",
            content=thinking,
        )
        artifact_content_text = response

    new_artifact_content = create_new_artifact_content(
        artifact_type=artifact_type,
        state=state,
        current_artifact_content=current_artifact_content,
        artifact_meta=artifact_meta_tool_call,
        new_content=artifact_content_text,
    )

    return {
        "artifact": {
            **state["artifact"],
            "currentIndex": len(state["artifact"]["contents"]) + 1,
            "contents": [*state["artifact"]["contents"], new_artifact_content],
        },
        "messages": [thinking_message] if thinking_message else [],
        "_messages": [thinking_message] if thinking_message else [],
    } 