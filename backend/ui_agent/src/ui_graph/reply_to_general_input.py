from typing import Dict, List, Optional, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.func import entrypoint, task
from langchain_core.runnables import RunnableConfig

from opencanvas_shared.utils.artifacts import get_artifact_content
from .utils import (
    create_context_document_messages,
    ensure_store_in_config,
    format_artifact_content_with_template,
    format_reflections,
    get_model_from_config,
    is_using_o1_mini_model,
)
from .prompts import CURRENT_ARTIFACT_PROMPT, NO_ARTIFACT_PROMPT


class OpenCanvasGraphState(TypedDict):
    """State definition for the OpenCanvas graph."""
    messages: List[BaseMessage]
    _messages: List[BaseMessage]
    artifact: Optional[Dict]


@task
def call_model(state: OpenCanvasGraphState, config: RunnableConfig):
    """Call model with the current state and configuration."""
    small_model = get_model_from_config(config)

    prompt = """You are an AI assistant tasked with responding to the users question.
    
The user has generated artifacts in the past. Use the following artifacts as context when responding to the users question.

You also have the following reflections on style guidelines and general memories/facts about the user to use when generating your response.
<reflections>
{reflections}
</reflections>

{currentArtifactPrompt}"""

    current_artifact_content = (
        get_artifact_content(state["artifact"]) if state.get(
            "artifact") else None
    )

    store = ensure_store_in_config(config)
    assistant_id = config.get("configurable", {}).get("assistant_id")
    if not assistant_id:
        raise ValueError("`assistant_id` not found in configurable")

    memory_namespace = ["memories", assistant_id]
    memory_key = "reflection"
    memories = store.get(memory_namespace, memory_key)
    memories_as_string = (
        format_reflections(
            memories.value) if memories and memories.value else "No reflections found."
    )

    formatted_prompt = prompt.format(
        reflections=memories_as_string,
        currentArtifactPrompt=(
            format_artifact_content_with_template(
                CURRENT_ARTIFACT_PROMPT, current_artifact_content)
            if current_artifact_content
            else NO_ARTIFACT_PROMPT
        ),
    )

    context_document_messages = create_context_document_messages(config)
    is_o1_mini_model = is_using_o1_mini_model(config)

    response = small_model.invoke(
        [
            {"role": "system" if not is_o1_mini_model else "user",
                "content": formatted_prompt},
            *context_document_messages,
            *state["_messages"],
        ]
    )

    return response


@entrypoint()
def reply_to_general_input(
    state: OpenCanvasGraphState, config: RunnableConfig
) -> OpenCanvasGraphState:
    """Generate responses to questions. Does not generate artifacts."""
    print("call reply_to_general_input()")

    response = call_model(state, config).result()

    return {
        "messages": [response],
        "_messages": [response],
        "artifact": state.get("artifact"),
    }
