import os
import json
import agentops
from pprint import pprint, PrettyPrinter
from typing import Annotated
from tavily import TavilyClient
from pydantic import BaseModel, Field
from autogen import register_function, ConversableAgent, filter_config
import autogen
from dotenv import load_dotenv

load_dotenv()
# agentops.init(api_key=os.getenv("AGENTOPS_API_KEY"))
# agentops.start_session(tags=["autogen-tool-example"])

# Load environment variables

# Configure the language model
llm_config = {
    "config_list": [
        # {
        #     "model": "gemma2-9b-it",
        #     "api_key": os.getenv("GROQ_API_KEY"),
        #     "api_type": "groq",
        # }
        {
            "model": "gpt-4o-mini",
            "api_key": os.getenv("OPENAI_API_KEY"),
            "api_type": "openai",
        }
    ]
}
# llm_config = {
#     "cache_seed": 42,
#     "temperature": 0,
#     "timeout": 120,
#     "config_list": [
#         {
#             "model": "gemma2-9b-it",
#             "api_key": os.getenv("GROQ_API_KEY"),
#             "api_type": "groq",
#         },
#         {
#             "model": "gpt-4o-mini",
#             "api_key": os.getenv("OPENAI_API_KEY"),
#             "api_type": "openai",
#         }
#     ]
# }

# filter_dict = {"api_type": ["openai"]}
# llm_config["config_list"] = autogen.filter_config(
#     llm_config["config_list"], filter_dict
# )


# Define the input model for Tavily search
class TavilySearchInput(BaseModel):
    query: Annotated[str, Field(description="The search query string")]
    max_results: Annotated[
        int, Field(description="Maximum number of results to return", ge=1, le=10)
    ] = 5
    search_depth: Annotated[
        str,
        Field(
            description="Search depth: 'basic' or 'advanced'",
            choices=["basic", "advanced"],
        ),
    ] = "basic"


# Function to perform Tavily search
def tavily_search(
    input: Annotated[TavilySearchInput, "Input for Tavily search"]
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


# Create an assistant agent that can use the Tavily search tool
assistant = ConversableAgent(
    name="Assistant",
    system_message="You are a helpful AI assistant with access to internet search capabilities. You have access to the internet and can search the web. Reply TERMINATE when the task is done. You can use the tavily_search tool to search the web. You use input parameters of tavily_search function to describe the query.",
    llm_config=llm_config,
)

# Create a user proxy agent that can execute the Tavily search tool
user_proxy = ConversableAgent(
    name="User", human_input_mode="NEVER", llm_config=False)

# Register the Tavily search function with both agents
autogen.agentchat.register_function(
    tavily_search,
    caller=assistant,
    executor=user_proxy,
    # name="tavily_search",
    description="A tool to search the internet using the Tavily API",
)


if __name__ == "__main__":
    print("Tools:")
    print(json.dumps(assistant.llm_config["tools"], indent=2))

    assert user_proxy.function_map["tavily_search"]._origin == tavily_search

    # user_input = "What is the news about the stock market?"
    user_input = "Which companies are in the S&P 500?"

    # Initiate a chat between the user proxy and the assistant
    chat_result = user_proxy.initiate_chat(
        assistant,
        message=user_input,
        max_turns=2,
    )

    # print("Chat Result:")
    # print(json.dumps(chat_result, indent=2))
    for msg in chat_result.chat_history:
        print(f"msg: {msg}")
    # print(f"chat_result: {chat_result}")

    # agentops.end_session("Success")
