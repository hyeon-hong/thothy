import asyncio
from typing_extensions import Annotated, TypedDict
from pydantic import BaseModel, Field
from langgraph.graph import START, StateGraph, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.runnables import RunnableConfig
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AnyMessage
from langchain.chat_models import init_chat_model
import langsmith
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os
import dotenv
from langgraph_sdk import get_client

from memory_agent import (
    constants,
    settings,
    utils,
)

# Load environment variables
dotenv.load_dotenv("../../.env", override=True)

# Get client
deployment_url = "http://127.0.0.1:2024"
client = get_client(url=deployment_url)


class ChatState(TypedDict):
    """The state of the chatbot."""

    messages: Annotated[List[AnyMessage], add_messages]
    user_memories: List[dict]


class ChatConfigurable(TypedDict):
    """The configurable fields for the chatbot."""

    user_id: str
    thread_id: str
    memory_service_url: str = ""
    model: str
    delay: Optional[float]


def _ensure_configurable(config: RunnableConfig) -> ChatConfigurable:
    """Ensure the configuration is valid."""

    return ChatConfigurable(
        user_id=config["configurable"]["user_id"],
        thread_id=config["configurable"]["thread_id"],
        mem_assistant_id=config["configurable"]["mem_assistant_id"],
        memory_service_url=config["configurable"].get(
            "memory_service_url", os.environ.get("MEMORY_SERVICE_URL", "")
        ),
        model=config["configurable"].get(
            "model", "gpt-4o-mini"
        ),
        delay=config["configurable"].get("delay", 1),
    )


PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful and friendly chatbot. Get to know the user!"
            " Ask questions! Be spontaneous!"
            "{user_info}\n\nSystem Time: {time}",
        ),
        ("placeholder", "{messages}"),
    ]
).partial(
    time=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
)


@langsmith.traceable
def format_query(messages: List[AnyMessage]) -> str:
    """Format the query for the user's memories."""

    # This is quite naive :)
    return " ".join([str(m.content) for m in messages if m.type == "human"][-5:])


async def query_memories(state: ChatState, config: RunnableConfig) -> ChatState:
    """Query the user's memories."""

    print("call query_memories()")

    configurable: ChatConfigurable = config["configurable"]
    user_id = configurable["user_id"]

    # Get index and embeddings
    index = utils.get_index()
    embeddings = utils.get_embeddings()

    # Join all human messages
    query = format_query(state["messages"])

    # Embed query
    vec = await embeddings.aembed_query(query)

    # Query Pinecone
    with langsmith.trace(
        "pinecone_query", inputs={"query": query, "user_id": user_id}
    ) as rt:
        response = index.query(
            vector=vec,
            filter={"user_id": {"$eq": str(user_id)}},
            include_metadata=True,
            top_k=10,
            namespace=settings.SETTINGS.pinecone_namespace,
        )
        rt.outputs["response"] = response

    # Extract memories
    memories = []
    if matches := response.get("matches"):
        memories = [m["metadata"][constants.PAYLOAD_KEY] for m in matches]
    print(f"memories: {memories}")

    return {
        "user_memories": memories,
    }


@langsmith.traceable
def format_memories(memories: List[dict]) -> str:
    """Format the user's memories."""

    # If no memories, return empty string
    if not memories:
        return ""

    # Join all memories
    memories = "\n".join(str(m) for m in memories)

    # Return formatted memories with a prompt format
    return f"""

## Memories

You have noted the following memorable events from previous interactions with the user.
<memories>
{memories}
</memories>
"""


async def bot(state: ChatState, config: RunnableConfig) -> ChatState:
    """Prompt the bot to resopnd to the user, incorporating memories (if provided)."""

    print("call bot()")

    # Get configurable
    configurable = _ensure_configurable(config)

    # Initialize model
    model = init_chat_model(configurable["model"])

    # Format memories
    chain = PROMPT | model
    memories = format_memories(state["user_memories"])

    # Invoke model
    m = await chain.ainvoke(
        {
            "messages": state["messages"],
            "user_info": memories,
        },
        config,
    )

    # Return messages
    return {
        "messages": [m],
    }


class MemorableEvent(BaseModel):
    """A memorable event."""

    description: str
    participants: List[str] = Field(
        description="Names of participants in the event and their relationship to the user."
    )


async def post_messages(state: ChatState, config: RunnableConfig) -> ChatState:
    """Post the messages to the user."""

    print("call post_messages()")

    # Get configurable
    configurable = _ensure_configurable(config)

    # Get client
    langgraph_client = get_client(url=configurable["memory_service_url"])

    # Get thread id
    thread_id = config["configurable"]["thread_id"]

    # Hash "memory_{thread_id}" to get a new uuid5 for the memory id
    memory_thread_id = uuid.uuid5(uuid.NAMESPACE_URL, f"memory_{thread_id}")

    # Get or create memory thread
    try:
        await langgraph_client.threads.get(thread_id=memory_thread_id)
    except Exception:
        await langgraph_client.threads.create(thread_id=memory_thread_id)

    # Create run
    await langgraph_client.runs.create(
        memory_thread_id,
        assistant_id=configurable["mem_assistant_id"],
        input={
            "messages": state["messages"],
        },
        config={
            "configurable": {
                "user_id": configurable["user_id"],
            },
        },
        # multitask_strategy="rollback",
        multitask_strategy="enqueue",
    )

    # Return messages
    return {
        "messages": [],
    }


# Create builder
builder = StateGraph(ChatState, ChatConfigurable)

# Add nodes
builder.add_node(query_memories)
builder.add_node(bot)
builder.add_node(post_messages)

# Add edges
builder.add_edge(START, "query_memories")
builder.add_edge("query_memories", "bot")
builder.add_edge("bot", "post_messages")

# Compile graph
chat_graph = builder.compile(checkpointer=MemorySaver())


async def create_mem_assistant():
    mem_assistant = await client.assistants.create(
        graph_id="memory",
        config={
            "configurable": {
                # seconds wait before considering a thread as "completed"
                "delay": 4,
                "schemas": {
                    "MemorableEvent": {
                        "system_prompt": "Extract any memorable events from the user's"
                        " messages that you would like to remember.",
                        "update_mode": "insert",
                        "function": MemorableEvent.schema(),
                    },
                },
            }
        },
    )

    mem_assistant = (await client.assistants.search(graph_id="memory"))[0]

    user_id = str(uuid.uuid4())
    thread_id = str(uuid.uuid4())

    await client.threads.create(thread_id=thread_id)

    class Chat:
        def __init__(self, user_id: str, thread_id: str):
            self.thread_id = thread_id
            self.user_id = user_id

        async def __call__(self, query: str) -> str:
            chunks = chat_graph.astream_events(
                input={
                    "messages": [("user", query)],
                },
                config={
                    "configurable": {
                        "user_id": self.user_id,
                        "thread_id": self.thread_id,
                        "memory_service_url": deployment_url,
                        "mem_assistant_id": mem_assistant["assistant_id"],
                        "delay": 4,
                    }
                },
                version="v2",
            )
            res = ""
            async for event in chunks:
                if event.get("event") == "on_chat_model_stream":
                    tok = event["data"]["chunk"].content
                    print(tok, end="")
                    res += tok
            return res

    chat = Chat(user_id, thread_id)

    _ = await chat("Hi there")

    _ = await chat(
        "I've been planning a surprise party for my friend steve. "
        "He has been having a rough month and I want it to be special."
    )

    # _ = await chat(
    #     "Steve really likes crocheting. Maybe I can do something with that? Or is that dumb... "
    # )

    # _ = await chat("He's also into capoeira...")

    # _ = await chat(
    #     "Oh that's a cool idea. One time i took classes from this studio nearby. Wonder if they have any recs. "
    # )

    # _ = await chat("Idk. Anyways - how are you doing?")

    # _ = await chat("My name is Ken btw")

    # # wait for 60 seconds to see the memory agent in action

    # # await asyncio.sleep(60)

    # thread_id_2 = uuid.uuid4()

    # chat2 = Chat(user_id, thread_id_2)

    # _ = await chat2("Remember me?")

    # _ = await chat2("wdy remember??")

    # _ = await chat2("Oh planning is going alright!")


if __name__ == "__main__":
    asyncio.run(create_mem_assistant())
