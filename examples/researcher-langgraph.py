import os
import json
import asyncio
import operator
from typing import TypedDict, List, Annotated, Literal, Dict, Union, Optional
from datetime import datetime

from tavily import AsyncTavilyClient, TavilyClient

from langchain_core.tools import tool
from langchain_core.messages import AnyMessage, AIMessage, SystemMessage, HumanMessage, ToolMessage
from langchain_core.pydantic_v1 import BaseModel, Field, conlist
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END, add_messages

import importlib
import sys
sys.path.insert(0, os.getenv("LOCAL_DIRECTORY"))
generate_pdf = importlib.import_module("generate-pdf")

from langchain_core.runnables.config import RunnableConfig
config = RunnableConfig(recursion_limit=100)
print(config)

# Define the research state


class ResearchState(TypedDict):
    company: str
    company_keywords: str
    exclude_keywords: str
    report: str
    # Declare a dictionary where:
    # - The outer dictionary has string keys.
    # - The inner dictionary can have keys of different types (e.g., str, int).
    # - The inner dictionary values can be of different types (e.g., str, float).
    documents: Dict[str, Dict[Union[str, int], Union[str, float]]]
    RAG_docs: Dict[str, Dict[Union[str, int], Union[str, float]]]
    messages: Annotated[list[AnyMessage], add_messages]

# Define the structure for the model's response, which includes citations.


class Citation(BaseModel):
    source_id: str = Field(
        ...,
        description="The url of a SPECIFIC source which justifies the answer.",
    )
    quote: str = Field(
        ...,
        description="The VERBATIM quote from the specified source that justifies the answer.",
    )


class QuotedAnswer(BaseModel):
    """Answer the user question based only on the given sources, and cite the sources used."""
    answer: str = Field(
        ...,
        description="The answer to the user question, which is based only on the given sources. Include any relevant sources in the answer as markdown hyperlinks. For example: 'This is a sample text ([url website](url))'"
    )
    citations: List[Citation] = Field(
        ..., description="Citations from the given sources that justify the answer."
    )

# Add Tavily's arguments to enhance the web search tool's capabilities


class TavilyQuery(BaseModel):
    query: str = Field(description="web search query")
    topic: str = Field(
        description="type of search, should be 'general' or 'news'. Choose 'news' ONLY when the company you searching is publicly traded and is likely to be featured on popular news")
    days: int = Field(description="number of days back to run 'news' search")
    # raw_content: bool = Field(description="include raw content from found sources, use it ONLY if you need more information besides the summary content provided")
    domains: Optional[List[str]] = Field(
        default=None, description="list of domains to include in the research. Useful when trying to gather information from trusted and relevant domains")


# Define the args_schema for the tavily_search tool using a multi-query approach, enabling more precise queries for Tavily.
class TavilySearchInput(BaseModel):
    sub_queries: List[TavilyQuery] = Field(
        description="set of sub-queries that can be answered in isolation")


class TavilyExtractInput(BaseModel):
    urls: List[str] = Field(
        description="list of a single or several URLs for extracting raw content to gather additional information")


@tool("tavily_search", args_schema=TavilySearchInput, return_direct=True)
async def tavily_search(sub_queries: List[TavilyQuery]):
    """Perform searches for each sub-query using the Tavily search tool concurrently."""
    # Define a coroutine function to perform a single search with error handling
    async def perform_search(itm):
        try:
            # Add date to the query as we need the most recent results
            query_with_date = f"{itm.query} {datetime.now().strftime('%m-%Y')}"
            # Attempt to perform the search, hardcoding days to 7 (days will be used only when topic is news)
            response = await tavily_client.search(query=query_with_date, topic=itm.topic, days=itm.days, max_results=10)
            return response['results']
        except Exception as e:
            # Handle any exceptions, log them, and return an empty list
            print(f"Error occurred during search for query '{
                  itm.query}': {str(e)}")
            return []

    # Run all the search tasks in parallel
    search_tasks = [perform_search(itm) for itm in sub_queries]
    search_responses = await asyncio.gather(*search_tasks)

    # Combine the results from all the responses
    search_results = []
    for response in search_responses:
        search_results.extend(response)

    return search_results

# Code for adding Tavily Extract as a tool (found it more useful to use Tavily Extract in a separate node)
# @tool("tavily_extract", args_schema=TavilyExtractInput, return_direct=True)
# async def tavily_extract(urls: TavilyExtractInput):
#     """Extract raw content from urls to gather additional information."""
#     try:
#         response = await tavily_client.extract(urls=urls)
#         return response['results']
#     except Exception as e:
#         # Handle any exceptions, log them, and return an empty list
#         print(f"Error occurred during extract: {str(e)}")
#         return []


tools = [tavily_search]
tools_by_name = {tool.name: tool for tool in tools}
tavily_client = AsyncTavilyClient()


# Define an async custom research tool node to store Tavily's search results for improved processing and later on filtering
async def tool_node(state: ResearchState):
    docs = state.get('documents', {})
    docs_str = ""
    msgs = []
    for tool_call in state["messages"][-1].tool_calls:
        tool = tools_by_name[tool_call["name"]]
        new_docs = await tool.ainvoke(tool_call["args"])
        for doc in new_docs:
            # Make sure that this document was not retrieved before
            if not docs or doc['url'] not in docs:
                docs[doc['url']] = doc
                docs_str += json.dumps(doc)
            # For Tavily Extract tool, checking if raw_content was retrieved a document
            # if doc.get('raw_content', None) and doc['url'] in docs:
            #     docs[doc['url']]['raw_content'] = doc['raw_content'] # add raw content retrieved by extract
            #     docs_str += json.dumps(doc)
        msgs.append(ToolMessage(content=f"Found the following new documents/information: {
                    docs_str}", tool_call_id=tool_call["id"]))
    return {"messages": msgs, "documents": docs}

# Invoke a model with research tools to gather data about the company


def research_model(state: ResearchState):
    prompt = f"""Today's date is {datetime.now().strftime('%d/%m/%Y')}.\n
You are an expert researcher tasked with gathering information for a weekly report on recent developments in portfolio companies.\n
Your current objective is to gather documents about any significant events that occurred in the past week for the following company: {state['company']}.\n
The user has provided the following company keywords: {state['company_keywords']} to help you find documents relevant to the correct company.\n
**Instructions:**\n
- Use the 'tavily_search' tool to search for relevant documents
- Focus on gathering documents by making appropriate tool calls
- If you believe you have gathered enough information, state 'I have gathered enough information and am ready to proceed.'
"""
    messages = state['messages'] + [SystemMessage(content=prompt)]
    model = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    response = model.bind_tools(tools).invoke(messages)
    return {"messages": [response]}


# Define the function that decides whether to continue research using tools or proceed to writing the report
def should_continue(state: ResearchState) -> Literal["tools", "curate"]:
    messages = state['messages']
    last_message = messages[-1]
    # If the LLM makes a tool call, then we route to the "tools" node
    if last_message.tool_calls:
        return "tools"
    # Otherwise, we stop (reply to the user with citations)
    return "curate"


async def select_and_process(state: ResearchState):
    msg = "Curating Documents ...\n"
    prompt = f"""You are an expert researcher specializing in analyzing portfolio companies.\n
Your current task is to review a list of documents and select the most relevant URLs related to recent developments for the following company: {state['company']}.\n
Be aware that some documents may refer to other companies with similar or identical names, potentially leading to conflicting information.\n
Your objective is to choose the documents that pertain to the correct company and provide the most consistent and synchronized information, using the following keywords provided by the user to help identify the correct company as a guide:{state['company_keywords']}.\n"""
    # Optionally include exclusion keywords if provided by the user
    if state['exclude_keywords'] != "":
        prompt += f"""Additionally, if any form of the following exclusion words are present in the documents, do not include them and filter out those documents: {
            state['exclude_keywords']}.\n"""
    # Append the list of gathered documents to the prompt
    prompt += f"""\nHere is the list of documents gathered for your review:\n{
        state['documents']}\n\n"""

    # Use the model to filter documents and obtain relevant URLs structured as TavilyExtractInput
    messages = [SystemMessage(content=prompt)]
    model = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    relevant_urls = model.with_structured_output(
        TavilyExtractInput).invoke(messages)

    # Create a dictionary of relevant documents based on the URLs returned by the model
    RAG_docs = {url: state['documents'][url]
                for url in relevant_urls.urls if url in state['documents']}

    try:
        # Extract raw content from the selected URLs using the Tavily client
        response = await tavily_client.extract(urls=relevant_urls.urls)

        # Save the raw content into the RAG_docs dictionary for each URL
        msg += "Extracted raw content for:\n"
        for itm in response['results']:
            url = itm['url']
            msg += f"{url}\n"
            raw_content = itm['raw_content']
            RAG_docs[url]['raw_content'] = raw_content
    except Exception as e:
        print(f"Error occurred during Tavily Extract request")

    msg += f"ֿֿ\n\nState of RAG documents that will be used for the report:\n\n{
        RAG_docs}"

    return {"messages": [AIMessage(content=msg)], "RAG_docs": RAG_docs}

# Define the function to write the report based on the retrieved documents.


def write_report(state: ResearchState):
    # Create the prompt
    prompt = f"""Today's date is {datetime.now().strftime('%d/%m/%Y')}\n.
You are an expert researcher, writing a weekly report about recent events in portfolio companies.\n
Your task is to write an in-depth, well-written, and detailed report on the following company: {state['company']}. in markdown syntax\n
Here are all the documents you should base your answer on:\n{state['RAG_docs']}\n"""
    # messages = [state['messages'][-1]] + [SystemMessage(content=prompt)]
    # Create a system message with the constructed prompt (no need to include entire chat history)
    messages = [SystemMessage(content=prompt)]
    model = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    response = model.with_structured_output(QuotedAnswer).invoke(messages)
    full_report = response.answer
    # Add Citations Section to the report
    full_report += "\n\n### Citations\n"
    for citation in response.citations:
        doc = state['RAG_docs'].get(citation.source_id)
        full_report += f"- [{doc.get('title', citation.source_id)
                             }]({citation.source_id}): \"{citation.quote}\"\n"
    # We return a list, because this will get added to the existing list
    return {"messages": [AIMessage(content=f"Generated Report:\n{full_report}")], "report": full_report}


def generete_pdf(state: ResearchState):
    directory = "outputs"
    file_name = f"{state['company']} Weekly Report {
        datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    # Check if the directory exists
    if not os.path.exists(directory):
        # Create the directory
        os.makedirs(directory)
    msg = generate_pdf.generate_pdf_from_md(state['report'], filename=f'{
                               directory}/{file_name}.pdf')
    return {"messages": [AIMessage(content=msg)]}


# Define a graph
workflow = StateGraph(ResearchState)

# Add nodes
workflow.add_node("research", research_model)
workflow.add_node("tools", tool_node)
workflow.add_node("curate", select_and_process)
workflow.add_node("write", write_report)
workflow.add_node("publish", generete_pdf)
# Set the entrypoint as route_query
workflow.set_entry_point("research")

# Determine which node is called next
workflow.add_conditional_edges(
    "research",
    # Next, we pass in the function that will determine which node is called next.
    should_continue,
)

# Add a normal edge from `tools` to `research`.
# This means that after `tools` is called, `research` node is called next in  order to determine if we should keep  or move to the 'curate' step
workflow.add_edge("tools", "research")
workflow.add_edge("curate", "write")
# Option in the future, to add another step and filter the documents retrieved using rerhank before writing the report
workflow.add_edge("write", "publish")
# Option in the future, to add another step and filter the documents retrieved using rerhank before writing the report
workflow.add_edge("publish", END)

app = workflow.compile()
