"""Generate a new artifact based on the user's query."""
from typing import Dict, Any

from langchain.tools import tool
from langchain_core.runnables import RunnableConfig

from ..utils import (
    create_context_document_messages,
    get_model_from_config,
)
from .schemas import ArtifactToolSchema
from .utils import create_artifact_content
from ..prompts import NEW_ARTIFACT_PROMPT


async def generate_artifact(
    state: Dict[str, Any],
    config: RunnableConfig
) -> Dict[str, Any]:
    """Generate a new artifact based on the user's query."""

    small_model = await get_model_from_config(
        config,
        {"temperature": 0.5}
    )

    @tool(schema=ArtifactToolSchema)
    def generate_artifact_tool(_: str) -> str:
        """Generate an artifact based on the user's request."""
        return ""

    model_with_artifact_tool = small_model.bind_tools(
        [generate_artifact_tool],
        strict=True,
        tool_choice=generate_artifact_tool.name
    )

    context_document_messages = await create_context_document_messages(config)

    response = await model_with_artifact_tool.invoke(
        [
            {
                "role": "system",
                "content": NEW_ARTIFACT_PROMPT,
            },
            *context_document_messages,
            *state["_messages"]
        ],
        {"run_name": "generate_artifact"}
    )

    args = response.tool_calls[0].args if response.tool_calls else None
    if not args:
        raise ValueError("No args found in response")

    new_artifact_content = create_artifact_content(args)
    new_artifact = {
        "current_index": 1,
        "contents": [new_artifact_content]
    }

    return {"artifact": new_artifact}
