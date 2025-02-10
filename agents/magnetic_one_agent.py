from autogen_ext.models.openai._openai_client import BaseOpenAIChatCompletionClient
from autogen_ext.code_executors.local import LocalCommandLineCodeExecutor
from autogen_ext.agents.web_surfer import MultimodalWebSurfer
from autogen_ext.agents.magentic_one import MagenticOneCoderAgent
from autogen_ext.agents.file_surfer import FileSurfer
from autogen_core.models import ChatCompletionClient
from autogen_core.code_executor import CodeExecutor
from autogen_core import CancellationToken
from autogen_agentchat.teams import MagenticOneGroupChat
from autogen_agentchat.base import ChatAgent
from autogen_agentchat.agents import CodeExecutorAgent, UserProxyAgent
from typing import Awaitable, Callable, List, Optional, Union
import warnings
import os
from typing import Optional, Dict, Callable
from dataclasses import dataclass

from autogen_core import (
    AgentId,
    SingleThreadedAgentRuntime,
)
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.code_executors.docker import DockerCommandLineCodeExecutor


@dataclass
class Message:
    content: str


SyncInputFunc = Callable[[str], str]
AsyncInputFunc = Callable[[str, Optional[CancellationToken]], Awaitable[str]]
InputFuncType = Union[SyncInputFunc, AsyncInputFunc]


class TempMagenticOne(MagenticOneGroupChat):
    def __init__(
        self,
        client: ChatCompletionClient,
        hil_mode: bool = False,
        input_func: InputFuncType | None = None,
        code_executor: CodeExecutor | None = None,
    ):
        self.client = client
        self._validate_client_capabilities(client)

        if code_executor is None:
            warnings.warn(
                "Instantiating MagenticOne without a code_executor is deprecated. Provide a code_executor to clear this warning (e.g., code_executor=LocalCommandLineCodeExecutor() ).",
                DeprecationWarning,
                stacklevel=2,
            )
            code_executor = LocalCommandLineCodeExecutor()

        fs = FileSurfer("FileSurfer", model_client=client)
        ws = MultimodalWebSurfer("WebSurfer", model_client=client)
        coder = MagenticOneCoderAgent("Coder", model_client=client)
        executor = CodeExecutorAgent(
            "ComputerTerminal", code_executor=code_executor)

        agents: List[ChatAgent] = [fs, ws, coder, executor]
        if hil_mode:
            user_proxy = UserProxyAgent("User", input_func=input_func)
            agents.append(user_proxy)
        super().__init__(agents, model_client=client)

    def _validate_client_capabilities(self, client: ChatCompletionClient) -> None:
        capabilities = client.model_info
        required_capabilities = ["function_calling", "json_output"]

        if not all(capabilities.get(cap) for cap in required_capabilities):
            warnings.warn(
                "Client capabilities for MagenticOne must include vision, " "function calling, and json output.",
                stacklevel=2,
            )

        if not isinstance(client, BaseOpenAIChatCompletionClient):
            warnings.warn(
                "MagenticOne performs best with OpenAI GPT-4o model either " "through OpenAI or Azure OpenAI.",
                stacklevel=2,
            )


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
        work_dir=working_dir or "/workspace",
        env=env_vars or {},
    )

    # Create and register the agent
    agent = TempMagenticOne(
        client=OpenAIChatCompletionClient(
            model="gpt-4o-mini",
            api_key=os.getenv("OPENAI_API_KEY")
        ),
        code_executor=code_executor
    )
    runtime.register_agent(AgentId("magnetic_one_agent", "default"), agent)

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
