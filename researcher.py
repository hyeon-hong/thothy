import os
from typing import Annotated
from tavily import TavilyClient
from pydantic import BaseModel, Field
from autogen import register_function, ConversableAgent
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

llm_config = {
    "config_list": [
        {
            "model": "gemma2-9b-it",
            "api_key": os.getenv("GROQ_API_KEY"),
            "api_type": "groq",
        }
    ]
}

assistant = ConversableAgent(
    name="Assistant",
    system_message="You are a helpful AI assistant with access "
    "to internet search capabilities.",
    llm_config=llm_config,
)

user_proxy = ConversableAgent(
    name="User",
    system_message="A proxy for the user for searching the web.",
    human_input_mode="NEVER",
    llm_config=False,
)


class TavilySearchInput(BaseModel):
    query: Annotated[str, Field(description="The search query string")]
    max_results: Annotated[
        int,
        Field(
            description="Maximum number of results to return",
            ge=1,
            le=10,
        ),
    ] = 5
    search_depth: Annotated[
        str,
        Field(
            description="Search depth: 'basic' or 'advanced'",
            choices=["basic", "advanced"],
        ),
    ] = "basic"


def tavily_search(
    input: Annotated[TavilySearchInput, "Input for Tavily search"]
) -> str:
    # Initialize the Tavily client with your API key
    tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

    # Perform the search
    response = tavily_client.search(
        query=input.query,
        max_results=input.max_results,
        search_depth=input.search_depth,
    )
    print(response)

    # Format the results
    formatted_results = []
    for result in response.get("results", []):
        formatted_results.append(
            f"Title: {result['title']}\\nURL: {result['url']}\\nContent: {result['content']}\\n"
        )

    return "\\n".join(formatted_results)


register_function(
    tavily_search,
    caller=assistant,
    executor=user_proxy,
    name="tavily_search",
    description="A tool to search the internet using the Tavily API",
)


def main():
    while True:
        user_input = input("User: ")

        if user_input.lower() in ["exit", "quit", "bye"]:
            print("Chatbot: Goodbye! Have a great day!")
            break

        # Initiate a chat between the user proxy and the assistant
        chat_result = user_proxy.initiate_chat(
            assistant,
            message=user_input,
            max_turns=2,
        )

        # Extract the assistant's reply from the chat history
        reply = next(
            (
                msg["content"]
                for msg in chat_result.chat_history
                if msg.get("name") == "Assistant"
            ),
            "I apologize, but I couldn't generate a response.",
        )

        print(f"Chatbot: {reply}")


if __name__ == "__main__":
    main()
