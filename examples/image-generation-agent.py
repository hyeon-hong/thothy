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
import requests
import tweepy


async def get_stock_price(ticker: str,
                          date: Annotated[str, "Date in YYYY/MM/DD"]) -> float:
    # Returns a random stock price for demonstration purposes.
    return random.uniform(10, 200)


async def post_image_to_x(prompt: str) -> str:
    # Load environment variables
    load_dotenv()

    # Twitter API credentials from environment variables
    client = tweepy.Client(
        consumer_key=os.getenv("TWITTER_API_KEY"),
        consumer_secret=os.getenv("TWITTER_API_SECRET"),
        access_token=os.getenv("TWITTER_ACCESS_TOKEN"),
        access_token_secret=os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
    )

    # Initialize API v1.1 for media upload
    auth = tweepy.OAuth1UserHandler(
        os.getenv("TWITTER_API_KEY"),
        os.getenv("TWITTER_API_SECRET"),
        os.getenv("TWITTER_ACCESS_TOKEN"),
        os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
    )
    api = tweepy.API(auth)

    try:
        # Generate the image first
        image_data = await generate_image(prompt)

        # Create a temporary file to store the image
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"generated_image_{timestamp}.png"

        with open(filename, 'wb') as f:
            f.write(image_data)

        # Upload media
        media = api.media_upload(filename=filename)

        # Create tweet with media
        tweet_text = f"AI Generated Image 🎨\nPrompt: {prompt}"
        response = client.create_tweet(
            text=tweet_text,
            media_ids=[media.media_id]
        )

        # Clean up - remove the temporary file
        os.remove(filename)

        return f"Successfully posted image to X/Twitter with tweet ID: {response.data['id']}"

    except Exception as e:
        return f"Error posting to X/Twitter: {str(e)}"


async def generate_image(prompt: str) -> bytes:
    # API endpoint
    url = "https://api.thothy.ai/thothy-image-create"

    # Prepare the form data
    files = {
        "positive_prompt": (None, prompt),
        "negative_prompt": (None, "no low quality, no watermark, no text")
    }

    try:
        # Make the POST request
        response = requests.post(url, files=files)

        # Check if request was successful
        if response.status_code == 200:
            return response.content
        else:
            raise Exception(f"Error generating image: HTTP {
                            response.status_code}")

    except Exception as e:
        raise Exception(f"Error generating image: {str(e)}")


# Create a function tool.
stock_price_tool = FunctionTool(
    get_stock_price, description="Get the stock price.")

image_generation_tool = FunctionTool(
    generate_image, description="Generate an image.")


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
    # result = await stock_price_tool.run_json({"ticker": "AAPL", "date": "2021/01/01"}, cancellation_token)
    await image_generation_tool.run_json(
        {"prompt": "Draw a beautiful image of a cat"}, cancellation_token)

    # Print the result.
    # print(stock_price_tool.return_value_as_string(result))


async def main(prompt: str):
    # Load environment variables from .env file
    load_dotenv()

    # Create a runtime
    runtime = SingleThreadedAgentRuntime()

    # Create the tools
    tools: List[Tool] = [
        FunctionTool(
            get_stock_price, description="Get the stock price."
        ),
        FunctionTool(
            generate_image, description="Generate an image."
        )
    ]

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
            Message(prompt),
            tool_use_agent
        )
        print(response.content)

    finally:
        # Ensure runtime is stopped even if an error occurs
        await runtime.stop()

if __name__ == "__main__":
    asyncio.run(run_tool())
    # asyncio.run(main("Generate a beautiful image of a cat"))
