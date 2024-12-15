from typing import List, Literal, Optional
from tavily import TavilyClient

from pydantic import BaseModel, Field
from typing_extensions import Annotated

import autogen
from autogen.cache import Cache

from dotenv import load_dotenv
import os

load_dotenv()

config_list = [
    # {
    #     'model': 'gpt-3.5-turbo',
    #     'api_key': os.getenv("OPENAI_API_KEY"),
    #     'tags': ['tool', '3.5-tool'],
    # }
    {
        "model": "gpt-3.5-turbo",
        "api_key": os.getenv("OPENAI_API_KEY"),
        "api_type": "openai",
    }
]

llm_config = {
    "config_list": config_list,
    "timeout": 120,
}

chatbot = autogen.AssistantAgent(
    name="chatbot",
    # system_message="You are a helpful assistant. Only use the tools you have been provided with. Reply TERMINATE when the task is done.",
    system_message="You are a helpful assistant. You have access to the internet and can search the web. Reply TERMINATE when the task is done. You can use the tavily_search tool to search the web. You use input parameters of tavily_search function to describe the query.",
    llm_config=llm_config,
)

# create a UserProxyAgent instance named "user_proxy"
user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    is_termination_msg=lambda x: x.get("content", "") and x.get(
        "content", "").rstrip().endswith("TERMINATE"),
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
)

# Define the input model for Tavily search


# class TavilySearchInput(BaseModel):
#     query: Annotated[str, Field(description="The search query string")]
#     max_results: Annotated[
#         int, Field(description="Maximum number of results to return", ge=1, le=10)
#     ] = 5
#     search_depth: Annotated[
#         str,
#         Field(
#             description="Search depth: 'basic' or 'advanced'",
#             choices=["basic", "advanced"],
#         ),
#     ] = "basic"

# Add Tavily's arguments to enhance the web search tool's capabilities
class TavilyQuery(BaseModel):
    # query: str = Field(description="web search query")
    query: Annotated[str, Field(description="web search query")]
    topic: Annotated[
        str,
        Field(
            description="type of search, should be 'general' or 'news'. "
            "Choose 'news' ONLY when the company you searching is publicly traded "
            "and is likely to be featured on popular news"
        ),
    ]
    days: Annotated[
        int,
        Field(
            description="number of days back to run 'news' search",
            ge=1,
            le=30,
        ),
    ]
    # raw_content: bool = Field(description="include raw content
    # from found sources, use it ONLY if you need more information
    # besides the summary content provided")
    domains: Optional[List[str]] = Field(
        default=None,
        description="list of domains to include in the research. "
        "Useful when trying to gather information from trusted and "
        "relevant domains"
    )


class TavilySearchInput(BaseModel):
    sub_queries: List[TavilyQuery] = Field(
        description="set of sub-queries that can be answered in isolation")


def tavily_search(
    input: Annotated[TavilySearchInput, "Input for Tavily search"],
) -> str:
    # Initialize the Tavily client with your API key
    print(f"input: {input}")
    client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

    # Perform the search
    response = client.search(
        query=input.query,
        max_results=input.max_results,
        search_depth=input.search_depth,
    )

    # Format the results
    formatted_results = []
    for result in response.get("results", []):
        formatted_results.append(
            f"Title: {result['title']}\nURL: {
                result['url']}\nContent: {result['content']}\n"
        )

    return "\n".join(formatted_results)


autogen.agentchat.register_function(
    tavily_search,
    caller=chatbot,
    executor=user_proxy,
    # description="Currency exchange calculator.",
    description="A tool to search the internet using the Tavily API",
)

with Cache.disk() as cache:
    # start the conversation
    res = user_proxy.initiate_chat(
        chatbot,
        message="What is the news about the stock market?",
        summary_method="reflection_with_llm",
        cache=cache,
        max_turns=2,
    )
