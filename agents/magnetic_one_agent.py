from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_ext.teams.magentic_one import MagenticOne

from autogen_agentchat.ui import Console
import os


async def main(task: str) -> None:
    client = OpenAIChatCompletionClient(
        model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY")
    )
    m1 = MagenticOne(client=client)
    result = await Console(m1.run_stream(task=task))
    return result
