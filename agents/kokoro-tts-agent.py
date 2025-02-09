import asyncio
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_core.tools import FunctionTool, Tool, ToolSchema
from autogen_core.tool_agent import ToolAgent, tool_agent_caller_loop
from autogen_core.models import (
    ChatCompletionClient,
    LLMMessage,
    SystemMessage,
    UserMessage,
)
from autogen_core import (
    AgentId,
    MessageContext,
    RoutedAgent,
    SingleThreadedAgentRuntime,
    message_handler,
)
from typing import List
from dataclasses import dataclass
import os

from autogen_core import CancellationToken
import soundfile as sf

from tools.audio.tts import generate_kokoro_audio


def generate_kokoro_tts_audio(text: str) -> str:
    # Generate the audio
    generator = generate_kokoro_audio(text)

    for i, (gs, ps, audio) in enumerate(generator):
        # i => index
        print(i)
        # gs => graphemes/text
        print(gs)
        # ps => phonemes
        print(ps)

    # Create outputs directory if it doesn't exist
    if not os.path.exists('outputs'):
        os.makedirs('outputs')

    # save each audio file
    sf.write(f'outputs/{i}.wav', audio, 24000)


kokoro_tts_tool = FunctionTool(
    generate_kokoro_tts_audio, description="Generate a text-to-speech audio.")


@dataclass
class Message:
    content: str


class ToolUseAgent(RoutedAgent):
    def __init__(self, model_client: ChatCompletionClient,
                 tool_schema: List[ToolSchema], tool_agent_type: str) -> None:
        super().__init__("An agent with tools")
        self._system_messages: List[LLMMessage] = [
            SystemMessage(content="You are a text-to-speech agent.")]
        self._model_client = model_client
        self._tool_schema = tool_schema
        self._tool_agent_id = AgentId(tool_agent_type, self.id.key)

    @message_handler
    async def handle_user_message(self, message: Message,
                                  ctx: MessageContext) -> Message:
        # Create a session of messages.
        session: List[LLMMessage] = self._system_messages + \
            [UserMessage(content=message.content, source="user")]

        # Run the caller loop to handle tool calls.
        messages = await tool_agent_caller_loop(
            self,
            tool_agent_id=self._tool_agent_id,
            model_client=self._model_client,
            input_messages=session,
            tool_schema=self._tool_schema,
            cancellation_token=ctx.cancellation_token,
        )

        # Return the final response.
        assert isinstance(messages[-1].content, str)
        return Message(content=messages[-1].content)


async def run_tool():
    # Run the tool.
    cancellation_token = CancellationToken()
    await kokoro_tts_tool.run_json(
        {"text": "Hello, world!"}, cancellation_token)


async def main(prompt: str):
    # Create a runtime
    runtime = SingleThreadedAgentRuntime()

    # Create the tools
    tools: List[Tool] = [
        kokoro_tts_tool
    ]

    # Register the agents
    await ToolAgent.register(runtime, "kokoro_tts_agent",
                             lambda: ToolAgent("kokoro tts agent", tools))

    await ToolUseAgent.register(
        runtime,
        "tool_use_agent",
        lambda: ToolUseAgent(
            OpenAIChatCompletionClient(
                model="gpt-4o-mini",
                # Get API key from environment
                api_key=os.getenv("OPENAI_API_KEY")
            ),
            [tool.schema for tool in tools],
            "kokoro_tts_agent"
        ),
    )

    try:
        # Start processing messages
        runtime.start()

        # Send a direct message to the tool agent
        tool_use_agent = AgentId("tool_use_agent", "default")
        response = await runtime.send_message(
            Message(prompt),
            tool_use_agent
        )
        print(response.content)

    finally:
        # Ensure runtime is stopped even if an error occurs
        await runtime.stop()

if __name__ == "__main__":
    # asyncio.run(run_tool())
    asyncio.run(
        main("Generate a text-to-speech audio for the following text: "
             "Hello, world! This is a test of the text-to-speech agent."))
