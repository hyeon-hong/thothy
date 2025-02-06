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
import random
import os
from dotenv import load_dotenv

from autogen_core import CancellationToken
from typing_extensions import Annotated


async def get_stock_price(ticker: str,
                          date: Annotated[str, "Date in YYYY/MM/DD"]) -> float:
    # Returns a random stock price for demonstration purposes.
    return random.uniform(10, 200)


# Create a function tool.
stock_price_tool = FunctionTool(
    get_stock_price, description="Get the stock price.")


@dataclass
class Message:
    content: str


class ToolUseAgent(RoutedAgent):
    def __init__(self, model_client: ChatCompletionClient,
                 tool_schema: List[ToolSchema], tool_agent_type: str) -> None:
        super().__init__("An agent with tools")
        self._system_messages: List[LLMMessage] = [
            SystemMessage(content="You are a helpful AI assistant.")]
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
    result = await stock_price_tool.run_json({"ticker": "AAPL", "date": "2021/01/01"}, cancellation_token)

    # Print the result.
    print(stock_price_tool.return_value_as_string(result))


async def main():
    # Load environment variables from .env file
    load_dotenv()

    # Create a runtime
    runtime = SingleThreadedAgentRuntime()

    # Create the tools
    tools: List[Tool] = [FunctionTool(
        get_stock_price, description="Get the stock price."
    )]

    # Register the agents
    await ToolAgent.register(runtime, "tool_executor_agent",
                             lambda: ToolAgent("tool executor agent", tools))

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
            "tool_executor_agent"
        ),
    )

    try:
        # Start processing messages
        runtime.start()

        # Send a direct message to the tool agent
        tool_use_agent = AgentId("tool_use_agent", "default")
        response = await runtime.send_message(
            Message("What is the stock price of NVDA on 2024/06/01?"),
            tool_use_agent
        )
        print(response.content)

    finally:
        # Ensure runtime is stopped even if an error occurs
        await runtime.stop()

if __name__ == "__main__":
    # asyncio.run(run_tool())
    asyncio.run(main())
