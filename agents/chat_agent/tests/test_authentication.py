import asyncio
from langgraph_sdk import get_client


async def test_authentication():
    # Try without a token (should fail)
    client = get_client(url="http://localhost:2024")
    try:
        thread = await client.threads.create()
        print("❌ Should have failed without token!")
    except Exception as e:
        print("✅ Correctly blocked access:", e)

    # Try with a valid token
    client = get_client(
        url="http://localhost:2024", headers={"Authorization": "Bearer user1-token"}
    )

    # Create a thread and chat
    thread = await client.threads.create()
    print(f"✅ Created thread as Alice: {thread['thread_id']}")

    response = await client.runs.create(
        thread_id=thread["thread_id"],
        assistant_id="chat_graph",
        input={"messages": [{"role": "user", "content": "Hello!"}]},
    )
    print("✅ Bot responded:")
    print(response)


if __name__ == "__main__":
    asyncio.run(test_authentication())
