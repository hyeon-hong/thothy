import os
from typing import Optional, Callable, List
from dataclasses import dataclass
from pathlib import Path
import soundfile as sf
import numpy as np

from autogen_core import (
    AgentId,
    MessageContext,
    RoutedAgent,
    SingleThreadedAgentRuntime,
    message_handler,
    CancellationToken,
)
from autogen_core.models import (
    ChatCompletionClient,
    LLMMessage,
    SystemMessage,
    UserMessage,
)
from autogen_core.tools import FunctionTool, Tool, ToolSchema
from autogen_core.tool_agent import ToolAgent, tool_agent_caller_loop
from autogen_ext.models.openai import OpenAIChatCompletionClient

from tools.audio.tts import generate_kokoro_audio


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


def generate_kokoro_tts_audio(text: str) -> str:
    """Generate audio using Kokoro TTS."""
    # Create outputs directory if it doesn't exist
    outputs_dir = Path("outputs")
    outputs_dir.mkdir(exist_ok=True)

    # Generate the audio
    generator = generate_kokoro_audio(text)

    # List to store all audio segments
    audio_segments = []

    for i, (gs, ps, audio) in enumerate(generator):
        # i => index
        print(i)
        # gs => graphemes/text
        print(gs)
        # ps => phonemes
        print(ps)

        # Append the audio segment
        audio_segments.append(audio)

    # Concatenate all audio segments
    if audio_segments:
        combined_audio = np.concatenate(audio_segments)

        # Save the combined audio file
        output_file = outputs_dir / "combined_audio.wav"
        sf.write(str(output_file), combined_audio, 24000)
        return str(output_file)

    return ""


kokoro_tts_tool = FunctionTool(
    generate_kokoro_tts_audio,
    description="Generate a text-to-speech audio."
)


async def main(
    prompt: str,
    message_callback: Optional[Callable[[str], None]] = None
) -> str:
    """Run the Kokoro TTS agent with the given prompt.

    Args:
        prompt: The text to convert to speech
        message_callback: Optional callback for progress messages

    Returns:
        The response content from the agent
    """
    # Create a runtime
    runtime = SingleThreadedAgentRuntime()

    # Create the tools
    tools: List[Tool] = [kokoro_tts_tool]

    # Register the agents
    await ToolAgent.register(
        runtime,
        "kokoro_tts_agent",
        lambda: ToolAgent("kokoro tts agent", tools)
    )

    await ToolUseAgent.register(
        runtime,
        "tool_use_agent",
        lambda: ToolUseAgent(
            OpenAIChatCompletionClient(
                model="gpt-4o-mini",
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

        # Call the callback if provided
        if message_callback:
            message_callback(response.content)

        return response.content

    finally:
        # Ensure runtime is stopped even if an error occurs
        await runtime.stop()
