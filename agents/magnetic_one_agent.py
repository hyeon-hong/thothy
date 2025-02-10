import os
from typing import Optional, Dict, Callable
from dataclasses import dataclass

from autogen_core import (
    AgentId,
    SingleThreadedAgentRuntime,
)
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.teams.magentic_one import MagenticOne
from autogen_ext.code_executors.docker import DockerCommandLineCodeExecutor


@dataclass
class Message:
    content: str


async def main(
    prompt: str,
    docker_image: Optional[str] = None,
    working_dir: Optional[str] = None,
    env_vars: Optional[Dict[str, str]] = None,
    message_callback: Optional[Callable[[str], None]] = None
) -> str:
    """Run the Magnetic One agent with the given prompt.

    Args:
        prompt: The input prompt/request
        docker_image: Optional Docker image to use for code execution
        working_dir: Optional working directory inside Docker
        env_vars: Optional environment variables for Docker
        message_callback: Optional callback for progress messages

    Returns:
        The response content from the agent
    """
    # Create a runtime
    runtime = SingleThreadedAgentRuntime()

    # Configure the code executor
    code_executor = DockerCommandLineCodeExecutor(
        image=docker_image or "python:3.9",
        working_dir=working_dir or "/workspace",
        env=env_vars or {},
    )

    # Register the MagenticOne agent
    await MagenticOne.register(
        runtime,
        "magnetic_one_agent",
        lambda: MagenticOne(
            model_client=OpenAIChatCompletionClient(
                model="gpt-4o-mini",
                api_key=os.getenv("OPENAI_API_KEY")
            ),
            code_executor=code_executor
        ),
    )

    try:
        # Start processing messages
        runtime.start()

        # Send message to the agent
        magnetic_agent = AgentId("magnetic_one_agent", "default")
        response = await runtime.send_message(
            Message(prompt),
            magnetic_agent
        )

        # Call the callback if provided
        if message_callback:
            message_callback(response.content)

        return response.content

    finally:
        await runtime.stop()
