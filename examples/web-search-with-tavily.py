import os
from tavily import TavilyClient
from dotenv import load_dotenv
import json

load_dotenv()

tavily_api_key = os.getenv("TAVILY_API_KEY")

tavily_client = TavilyClient(api_key=tavily_api_key)

# response = tavily_client.search("Who is Leo Messi?")
response = tavily_client.get_search_context(
    query="What happened during the Burning Man floods?")

print(json.dumps(response, indent=2, sort_keys=True, ensure_ascii=False))

# client = TavilyClient(api_key=api_key)
# print(client)

# # Perform the search
# response = client.search(
#     query="What is the capital of France?",
#     max_results=10,
#     search_depth=1,
# )

# # Format the results
# formatted_results = []
# for result in response.get("results", []):
#     formatted_results.append(
#         f"Title: {result['title']}\\nURL: {
#             result['url']}\\nContent: {result['content']}\\n"
#     )

# print("\\n".join(formatted_results))
