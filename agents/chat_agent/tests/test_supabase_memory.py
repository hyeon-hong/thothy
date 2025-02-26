"""Test Supabase memory integration with Chat Agent."""

import os
import pytest
import asyncio

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langgraph.store.postgres import AsyncPostgresStore
from langgraph.prebuilt import create_react_agent

from chat_graph.graph import graph, Triple

# Load environment variables
load_dotenv()

# Test configuration
TEST_USER_ID = "test-user-123"
TEST_NAMESPACE = ("memories", TEST_USER_ID, "triples")


class TestSupabaseMemory:
    @pytest.mark.asyncio
    async def test_memory_persistence(self):
        """Test that memories are persisted in Supabase."""
        # Create test message
        test_message = HumanMessage(
            content="My name is Alice and I love pizza"
        )

        # Create test state
        state = {"messages": [test_message]}

        # Create test config
        config = {
            "configurable": {
                "thread_id": "test-thread-123",
                "user_id": TEST_USER_ID,
                "model": "gpt-4-turbo-preview",
            }
        }

        # Collect all events from the stream
        events = []
        async for event in graph.astream(state, config, stream_mode="values"):
            events.append(event)
            event["messages"][-1].pretty_print()
        print(f"events: {events}")

        # Verify we got a response
        assert len(events) > 0
        last_event = events[-1]
        assert "messages" in last_event

        # Wait a bit for background memory processing
        await asyncio.sleep(3)

        # Search for stored memories
        db_url = os.getenv('SUPABASE_URL')
        if not db_url:
            raise ValueError("SUPABASE_URL environment variable is not set")

        async with AsyncPostgresStore.from_conn_string(
            db_url,
            index={
                "dims": 1536,
                "embed": "openai:text-embedding-3-small",
            }
        ) as store:
            memories = await store.asearch(
                TEST_NAMESPACE,
                query="Alice"
            )
            print(f"memories: {memories}")

            # Verify memories were stored
            assert len(memories) > 0

            # Verify memory content
            found_name = False
            found_pizza = False

            for memory in memories:
                if isinstance(memory.value.get("data"), Triple):
                    triple = memory.value["data"]
                    if (triple.subject == "Alice" and
                            "name" in triple.predicate.lower()):
                        found_name = True
                    if "pizza" in triple.object.lower():
                        found_pizza = True

            assert found_name, "Name memory not found"
            assert found_pizza, "Pizza preference memory not found"

            # Clean up test data
            await store.adelete(namespace=TEST_NAMESPACE)

    @pytest.mark.asyncio
    async def test_memory_retrieval(self):
        """Test that stored memories can be retrieved and used."""
        # Get database URL
        db_url = os.getenv('SUPABASE_URL')
        if not db_url:
            raise ValueError("SUPABASE_URL environment variable is not set")

        async with AsyncPostgresStore.from_conn_string(
            db_url,
            index={
                "dims": 1536,
                "embed": "openai:text-embedding-3-small",
            }
        ) as store:
            # First store a memory
            test_triple = Triple(
                subject="Alice",
                predicate="likes",
                object="pizza",
                context="User mentioned food preferences"
            )
            await store.aupsert(
                namespace=TEST_NAMESPACE,
                key="test-memory",
                value={"data": test_triple}
            )

            # Create test message asking about preferences
            test_message = HumanMessage(
                content="What food do I like?"
            )

            # Create test state
            state = {"messages": [test_message]}

            # Create test config
            config = {
                "configurable": {
                    "user_id": TEST_USER_ID,
                    "model": "gpt-4-turbo-preview"
                }
            }

            # Run chatbot through graph
            events = []
            async for event in graph.astream(
                state,
                config,
                stream_mode="values"
            ):
                events.append(event)

            # Verify response mentions pizza
            assert len(events) > 0
            last_event = events[-1]
            assert "messages" in last_event
            assert any(
                "pizza" in msg.content.lower()
                for msg in last_event["messages"]
            ), "Stored preference not retrieved"

            # Clean up test data
            await store.adelete(namespace=TEST_NAMESPACE)

    @pytest.mark.asyncio
    async def test_memory_update(self):
        """Test that memories can be updated."""
        # Get database URL
        db_url = os.getenv('SUPABASE_URL')
        if not db_url:
            raise ValueError("SUPABASE_URL environment variable is not set")

        async with AsyncPostgresStore.from_conn_string(
            db_url,
            index={
                "dims": 1536,
                "embed": "openai:text-embedding-3-small",
            }
        ) as store:
            # First conversation about pizza
            state1 = {
                "messages": [
                    HumanMessage(content="I love pizza")
                ]
            }
            config = {
                "configurable": {
                    "user_id": TEST_USER_ID,
                    "model": "gpt-4-turbo-preview"
                }
            }

            # Run first conversation
            events1 = []
            async for event in graph.astream(
                state1,
                config,
                stream_mode="values"
            ):
                events1.append(event)
            await asyncio.sleep(2)  # Wait for processing

            # Second conversation updating preference
            state2 = {
                "messages": [
                    HumanMessage(content="Actually, I prefer sushi now")
                ]
            }

            # Run second conversation
            events2 = []
            async for event in graph.astream(
                state2,
                config,
                stream_mode="values"
            ):
                events2.append(event)
            await asyncio.sleep(2)  # Wait for processing

            # Search for food preferences
            memories = await store.asearch(
                namespace=TEST_NAMESPACE,
                query="food preference"
            )

            # Verify both memories exist
            found_pizza = False
            found_sushi = False

            for memory in memories:
                if isinstance(memory.value.get("data"), Triple):
                    triple = memory.value["data"]
                    if "pizza" in triple.object.lower():
                        found_pizza = True
                    if "sushi" in triple.object.lower():
                        found_sushi = True

            msg = "Both food preferences should be stored"
            assert found_pizza and found_sushi, msg

            # Clean up test data
            await store.adelete(namespace=TEST_NAMESPACE)
