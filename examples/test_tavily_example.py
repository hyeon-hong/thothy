from langchain_community.tools.tavily_search import TavilySearchResults

import getpass
import os

from dotenv import load_dotenv

load_dotenv()


def _set_env(var: str):
    if not os.environ.get(var):
        os.environ[var] = getpass.getpass(f"{var}: ")


_set_env("TAVILY_API_KEY")

tool = TavilySearchResults(max_results=2)
tools = [tool]
result = tool.invoke("What's a 'node' in LangGraph?")
print(result)
