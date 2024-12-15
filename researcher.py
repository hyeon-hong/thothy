import asyncio
from langchain_core.messages import SystemMessage
import sys
import os

from dotenv import load_dotenv
import importlib

load_dotenv(".env")
sys.path.insert(0, os.getenv("LOCAL_DIRECTORY"))
researcher_langgraph = importlib.import_module("researcher-langgraph")
print(f"researcher_langgraph: {researcher_langgraph}")


async def main():
    company = "Athena Intelligence"
    company_keywords = "data analyst, AI-native analyst platform"
    # (Optional) exclude_keywords: Use this field when you need to differentiate the company from others with the same name in a different industry
    # or when you want to exclude specific types of documents or information. Leave it as an empty string ("") if not needed.
    exclude_keywords = "wildfire"
    # You may uncomment your_additional_guidelines and HumanMessage and update the content with some guidelines of your own
    # your_additional_guidelines=f"Note that the {company} is ... / focus on ...."
    messages = [
        SystemMessage(
            content="You are an expert researcher ready to begin the information gathering process.")
        # ,HumanMessage(content=your_additional_guidelines)
    ]
    async for s in researcher_langgraph.app.astream({"company": company, "company_keywords": company_keywords, "exclude_keywords": exclude_keywords, "messages": messages}, stream_mode="values"):
        message = s["messages"][-1]
        if isinstance(message, tuple):
            print(message)
        else:
            message.pretty_print()


if __name__ == "__main__":
    asyncio.run(main())
