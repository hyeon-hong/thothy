"""Simple chat agent using LangGraph."""

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.runnables import RunnableConfig
from langgraph.graph import MessagesState, StateGraph, START, END

load_dotenv()
llm = ChatOpenAI(model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))


def chatbot(state: MessagesState, config: RunnableConfig) -> dict:
    """Chat node that processes messages and generates responses."""
    user_id = config["configurable"]["user_id"]
    print(f"user_id: {user_id}")

    # Invoke LLM with current messages and return response
    return {"messages": [llm.invoke(state["messages"])]}


def build_chat_graph():
    """Build and return the chat graph."""
    # Initialize graph builder with state schema
    graph_builder = StateGraph(MessagesState)

    # Add chatbot node
    graph_builder.add_node("chatbot", chatbot)

    # Add edges - start at chatbot and can end after chatbot
    graph_builder.add_edge(START, "chatbot")
    graph_builder.add_edge("chatbot", END)

    # Compile graph
    return graph_builder.compile()


# Create the graph
graph = build_chat_graph()
graph.name = "chat_agent"

__all__ = ["graph"]
