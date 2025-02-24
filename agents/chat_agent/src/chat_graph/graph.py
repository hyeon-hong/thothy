"""Simple chat agent using LangGraph."""

import uuid

from langchain.chat_models import init_chat_model
from langchain_core.runnables import RunnableConfig
from langchain_openai import OpenAIEmbeddings

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.memory import InMemoryStore
from langgraph.store.base import BaseStore
from langmem import ReflectionExecutor, create_memory_store_manager


llm = init_chat_model("gpt-4o-mini", model_provider="openai", temperature=0)

# Create memory manager to extract memories from conversations
memory_manager = create_memory_store_manager(
    "anthropic:claude-3-5-sonnet-latest",
    namespace=("memories",),
)

# Wrap memory_manager to handle deferred background processing
executor = ReflectionExecutor(memory_manager)

in_memory_store = InMemoryStore(
    index={
        "dims": 1536,
        "embed": OpenAIEmbeddings(model="text-embedding-3-small"),
    }
)


def chatbot(state: MessagesState, config: RunnableConfig, *, store: BaseStore) -> dict:
    """Chat node that processes messages and generates responses."""

    # Get user_id from config
    user_id = config["configurable"]["user_id"]
    # print(f"user_id: {user_id}")
    namespace = ("memories", user_id)

    # Search
    memories = store.search(namespace, query=str(
        state["messages"][-1].content))
    info = "\n".join([d.value["data"] for d in memories])
    system_msg = f"You are a helpful assistant talking to the user. User info: {info}"

    response = llm.invoke(
        [{"role": "system", "content": system_msg}] + state["messages"]
    )
    to_process = {"messages": [
        {"role": "user", "content": state["messages"][-1].content}] + [response]}
    executor.submit(to_process, after_seconds=0.5)

    return {"messages": response}


"""Build and return the chat graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState)

# Add chatbot node
workflow.add_node("chatbot", chatbot)

# Add edges - start at chatbot and can end after chatbot
workflow.add_edge(START, "chatbot")
workflow.add_edge("chatbot", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver(), store=in_memory_store)
graph.name = "chat_agent"

__all__ = ["graph"]
