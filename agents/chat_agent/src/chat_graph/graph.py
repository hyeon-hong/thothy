"""Simple chat agent using LangGraph."""

from pydantic import BaseModel

from langchain.chat_models import init_chat_model
from langchain_core.runnables import RunnableConfig

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.store.memory import InMemoryStore
from langgraph.store.base import BaseStore

from langmem import ReflectionExecutor, create_memory_store_manager
from chat_graph.configuration import ChatConfigurable


llm = init_chat_model("gpt-4o-mini", model_provider="openai", temperature=0)


# Create memory manager to extract memories from conversations
class Triple(BaseModel):
    """Store all new facts, preferences, and relationships as triples."""
    subject: str
    predicate: str
    object: str
    context: str | None = None


namespace = ("memories", "{user_id}", "triples")

in_memory_store = InMemoryStore(
    index={
        "dims": 1536,
        "embed": "openai:text-embedding-3-small",
    }
)

memory_manager = create_memory_store_manager(
    "anthropic:claude-3-5-sonnet-latest",
    schemas=[Triple],
    enable_inserts=True,
    enable_deletes=True,
    instructions="Extract user preferences and any other useful information",
    namespace=namespace,
)

# Wrap memory_manager to handle deferred background processing
executor = ReflectionExecutor(memory_manager)


def chatbot(state: MessagesState, config: ChatConfigurable, *, store: BaseStore) -> dict:
    """Chat node that processes messages and generates responses."""

    # Get user_id from config
    configurable = ChatConfigurable.from_runnable_config(config)
    user_id = configurable.user_id
    print(f"Processing chat for user_id: {user_id}")
    # Use the same namespace format as defined above
    namespace = ("memories", user_id)

    # Search
    memories = store.search(namespace, query=str(
        state["messages"][-1].content))
    print(f"Found {len(memories)} existing memories")
    info = "\n".join([d.value.get("data", "") for d in memories if d.value])
    system_msg = f"You are a helpful assistant talking to the user. User info: {info}"

    response = llm.invoke(
        [{"role": "system", "content": system_msg}] + state["messages"]
    )
    to_process = {"messages": [
        {"role": "user", "content": state["messages"][-1].content}] + [response]}
    print("Submitting memory processing task...")
    executor.submit(to_process, after_seconds=0.5)
    print("Memory processing task submitted")

    return {"messages": response}


"""Build and return the chat graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, ChatConfigurable)

# Add chatbot node
workflow.add_node("chatbot", chatbot)

# Add edges - start at chatbot and can end after chatbot
workflow.add_edge(START, "chatbot")
workflow.add_edge("chatbot", END)

# Compile graph
graph = workflow.compile(checkpointer=MemorySaver(), store=in_memory_store)
graph.name = "chat_agent"

__all__ = ["graph"]
