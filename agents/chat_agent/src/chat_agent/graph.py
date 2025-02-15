"""Simple chat agent using LangGraph."""

import os
import uuid
from dotenv import load_dotenv

from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.memory import InMemoryStore
from langgraph.store.base import BaseStore


load_dotenv()
llm = ChatOpenAI(model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))
in_memory_store = InMemoryStore(
    index={
        "embed": OpenAIEmbeddings(model="text-embedding-3-small"),
        "dims": 1536,
    }
)


def chatbot(state: MessagesState, config: RunnableConfig, *, store: BaseStore) -> dict:
    """Chat node that processes messages and generates responses."""
    user_id = config["configurable"]["user_id"]
    # print(f"user_id: {user_id}")
    namespace = ("memories", user_id)
    memories = store.search(namespace, query=str(
        state["messages"][-1].content))
    info = "\n".join([d.value["data"] for d in memories])
    system_msg = f"You are a helpful assistant talking to the user. User info: {info}"

    # Store new memories if the user asks the model to remember
    last_message = state["messages"][-1]
    if "remember" in last_message.content.lower():
        memory = "User name is Bob"
        store.put(namespace, str(uuid.uuid4()), {"data": memory})

    response = llm.invoke(
        [{"role": "system", "content": system_msg}] + state["messages"]
    )
    return {"messages": response}


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
    return graph_builder.compile(checkpointer=MemorySaver(), store=in_memory_store)


# Create the graph
graph = build_chat_graph()
graph.name = "chat_agent"

__all__ = ["graph"]
