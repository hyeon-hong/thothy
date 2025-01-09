import os
from crawl4ai import AsyncWebCrawler
from dotenv import load_dotenv
from typing_extensions import Annotated
import asyncio
import autogen
from autogen.cache import Cache
from autogen.coding import LocalCommandLineCodeExecutor

load_dotenv()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

config_list = [
    {
        "model": "gpt-4o-mini",
        "api_key": OPENAI_API_KEY,
    }
]

gpt4_config = {
    "cache_seed": 42,
    "temperature": 0,
    "config_list": config_list,
    "timeout": 120,
}

chatbot = autogen.AssistantAgent(
    name="chatbot",
    system_message="""
    For searching the web, only use the functions you have been provided with.
    Reply TERMINATE when the task is done.
    """,
    llm_config=gpt4_config,
)

executor = LocalCommandLineCodeExecutor(
    timeout=10,
    work_dir="outputs",
)

web_crawler = autogen.UserProxyAgent(
    name="web_crawler",
    system_message="A proxy for the user for crawling the web.",
    is_termination_msg=lambda x: x.get("content", "") and x.get(
        "content", "").rstrip().endswith("TERMINATE"),
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
    code_execution_config={"executor": executor},
)


@web_crawler.register_for_execution()
@chatbot.register_for_llm(description="crawl the web")
async def crawl_web(url: Annotated[str, "The URL to crawl."]) -> str:
    async with AsyncWebCrawler(verbose=True) as crawler:
        result = await crawler.arun(url)
        # Soone will be change to result.markdown
        print(result.markdown_v2.raw_markdown)
        return result.markdown_v2.raw_markdown


autogen.agentchat.register_function(
    crawl_web,
    caller=chatbot,
    executor=web_crawler,
    description="crawl the web",
)


async def main():
    with Cache.disk() as cache:
        await chatbot.a_initiate_chat(
            web_crawler,
            message="""
            Crawl https://news.ycombinator.com.
            Select the most commented 5 articles about the topic of "AI".
            """,
            cache=cache,
        )

if __name__ == "__main__":
    asyncio.run(main())
