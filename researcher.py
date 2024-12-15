import asyncio
import json
from rich import print_json, print
import autogen
from datetime import datetime
import os
from typing import Annotated, Optional, List
from tavily import TavilyClient, AsyncTavilyClient

from pydantic import BaseModel, Field
from autogen import register_function, ConversableAgent
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

llm_config = {
    "cache_seed": 42,
    "temperature": 0,
    "timeout": 120,
    "config_list": [
        {
            "model": "gemma2-9b-it",
            "api_key": os.getenv("GROQ_API_KEY"),
            "api_type": "groq",
        },
        {
            "model": "gpt-4o-mini",
            "temperature": 0,
            "api_key": os.getenv("OPENAI_API_KEY"),
            "api_type": "openai",
        }
    ]
}

filter_dict = {"api_type": ["openai"]}
llm_config["config_list"] = autogen.filter_config(
    llm_config["config_list"], filter_dict
)


# Define the Tavily search agent
# tavily_search_agent_caller = ConversableAgent(
#     name="Tavily_Search_Agent_Caller",
#     system_message="You are a helpful AI assistant with access "
#     "to internet search capabilities.",
#     llm_config=llm_config,
# )

# tavily_search_agent_executor = ConversableAgent(
#     name="Tavily_Search_Agent_Executor",
#     system_message="A proxy for the user for searching the web.",
#     human_input_mode="NEVER",
#     llm_config=False,
# )

tavily_search_agent_caller = ConversableAgent(
    name="Tavily_Search_Agent_Caller",
#     system_message=f"""Today's date is {datetime.now().strftime('%d/%m/%Y')}.\n
# You are an expert researcher tasked with gathering information for a weekly report on recent developments in portfolio companies.\n
# Your current objective is to gather documents about any significant events that occurred in the past week for the following company: {state['company']}.\n
# The user has provided the following company keywords: {state['company_keywords']} to help you find documents relevant to the correct company.\n     
# **Instructions:**\n
# - Use the 'tavily_search' tool to search for relevant documents
# - Focus on gathering documents by making appropriate tool calls
# - If you believe you have gathered enough information, state 'I have gathered enough information and am ready to proceed.'
# """
    system_message="""Today is date is 15/12/2024.\n
You are an expert researcher tasked with gathering information for a weekly report on recent developments in portfolio companies.\n
Your current objective is to gather documents about any significant events that occurred in the past week for the following company: samsung.\n
The user has provided the following company keywords: electronics, semiconductors to help you find documents relevant to the correct company.\n     
**Instructions:**\n
- Use the 'tavily_search' tool to search for relevant documents
- Focus on gathering documents by making appropriate tool calls
- If you believe you have gathered enough information, state 'I have gathered enough information and am ready to proceed.'
""",
    llm_config=llm_config,
)

tavily_search_agent_executor = ConversableAgent(
    name="Tavily_Search_Agent_Executor",
    system_message="A proxy for the user for searching the web.",
    human_input_mode="NEVER",
    llm_config=False,
)


# class TavilySearchInput(BaseModel):
#     query: Annotated[str, Field(description="The search query string")]
#     max_results: Annotated[
#         int,
#         Field(
#             description="Maximum number of results to return",
#             ge=1,
#             le=10,
#         ),
#     ] = 5
#     search_depth: Annotated[
#         str,
#         Field(
#             description="Search depth: 'basic' or 'advanced'",
#             choices=["basic", "advanced"],
#         ),
#     ] = "basic"


# def tavily_search(
#     input: Annotated[TavilySearchInput, "Input for Tavily search"]
# ) -> str:
#     # Initialize the Tavily client with your API key
#     tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

#     # Perform the search
#     response = tavily_client.search(
#         query=input.query,
#         max_results=input.max_results,
#         search_depth=input.search_depth,
#     )
#     print(response)

#     # Format the results
#     formatted_results = []
#     for result in response.get("results", []):
#         formatted_results.append(
#             f"Title: {result['title']}\\nURL: {
#                 result['url']}\\nContent: {result['content']}\\n"
#         )

#     return "\\n".join(formatted_results)

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


# Define the args_schema for the tavily_search tool
# using a multi-query approach, enabling more precise queries for Tavily.
class TavilySearchInput(BaseModel):
    sub_queries: List[TavilyQuery] = Field(
        description="set of sub-queries that can be answered in isolation")


class TavilyExtractInput(BaseModel):
    urls: List[str] = Field(
        description="list of a single or several URLs for extracting "
        "raw content to gather additional information")


async def tavily_search(
    sub_queries: Annotated[List[TavilyQuery], "List of TavilyQuery objects"]
) -> List[dict]:
    print(f"sub_queries: {sub_queries}")

    """
    Perform searches for each sub-query
    using the Tavily search tool concurrently.
    """
    # Define a coroutine function to perform a single search
    # with error handling
    async def perform_search(itm):
        try:
            # Convert dict to TavilyQuery object
            query_obj = TavilyQuery.model_validate(itm)
            print(f"query_obj: {query_obj}")

            # Now use query_obj instead of itm
            query_with_date = f"{query_obj.query} {
                datetime.now().strftime('%m-%Y')}"
            tavily_client = AsyncTavilyClient(
                api_key=os.getenv("TAVILY_API_KEY"))
            response = await tavily_client.search(
                query=query_with_date,
                topic=query_obj.topic,
                days=query_obj.days,
                max_results=10,
            )
            return response['results']
        except Exception as e:
            print(f"Error occurred during search for query '{itm}': {str(e)}")
            return []

    # Run all the search tasks in parallel
    search_tasks = [perform_search(itm) for itm in sub_queries]
    print(f"search_tasks: {search_tasks}")
    search_responses = await asyncio.gather(*search_tasks)

    # Combine the results from all the responses
    search_results = []
    for response in search_responses:
        search_results.extend(response)

    return search_results


register_function(
    tavily_search,
    caller=tavily_search_agent_caller,
    executor=tavily_search_agent_executor,
    name="tavily_search",
    description="A tool to search the internet or web using the Tavily API",
)


def test_tavily_search():
    # Initiate a chat between the user proxy and the assistant
    chat_result = tavily_search_agent_executor.initiate_chat(
        tavily_search_agent_caller,
        message="Research the company samsung",
        max_turns=2,
    )

    try:
        # If it's JSON, use print_json
        if isinstance(chat_result, str):
            print_json(chat_result)
        else:
            # If it's a Python object, convert to JSON first
            print_json(json.dumps(chat_result))
    except Exception as e:
        # Fallback to rich's print for non-JSON content
        print(chat_result)


if __name__ == "__main__":
    print(tavily_search_agent_caller.llm_config["tools"])
    test_tavily_search()
