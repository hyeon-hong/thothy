"""Test Supabase memory integration with Chat Agent."""

import os
import pytest
import asyncio
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langgraph.store.postgres import AsyncPostgresStore
from chat_graph.graph import chatbot, Triple

# Load environment variables
load_dotenv()

# Test configuration
TEST_USER_ID = "test-user-123"
TEST_NAMESPACE = ("memories", TEST_USER_ID, "triples")


class TestSupabaseMemory:
    # @pytest.fixture
    # async def supabase_store(self):
    #     """Create a Supabase store for testing."""
    #     # Get Supabase database URL from environment
    #     db_url = os.getenv('SUPABASE_URL')
    #     if not db_url:
    #         raise ValueError(
    #             "SUPABASE_URL environment variable is not set"
    #         )

    #     store = AsyncPostgresStore.from_conn_string(
    #         db_url,
    #         index={
    #             "dims": 1536,
    #             "embed": "openai:text-embedding-3-small",
    #         }
    #     )
    #     return store

    @pytest.mark.asyncio
    async def test_memory_persistence(
        self,
        # supabase_store: AsyncPostgresStore
    ):
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
                "user_id": TEST_USER_ID,
                "model": "gpt-4-turbo-preview"
            }
        }

        async with AsyncPostgresStore.from_conn_string(
            os.getenv('SUPABASE_URL'),
            index={
                "dims": 1536,
                "embed": "openai:text-embedding-3-small",
            }
        ) as store:

            # Run chatbot with Supabase store
            result = await chatbot(
                state,
                config,
                store=store
            )

            # Verify response was generated
            assert len(result["messages"]) > 0

            # Wait a bit for background memory processing
            await asyncio.sleep(2)

            # Search for stored memories
            memories = await store.asearch(TEST_NAMESPACE, "Alice")

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
            await store.adelete(TEST_NAMESPACE)

    @pytest.mark.asyncio
    async def test_memory_retrieval(
        self,
        supabase_store: AsyncPostgresStore
    ):
        """Test that stored memories can be retrieved and used."""
        # First store a memory
        test_triple = Triple(
            subject="Alice",
            predicate="likes",
            object="pizza",
            context="User mentioned food preferences"
        )
        await supabase_store.upsert(
            TEST_NAMESPACE,
            "test-memory",
            {"data": test_triple}
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

        # Run chatbot with Supabase store
        result = await chatbot(
            state,
            config,
            store=supabase_store
        )

        # Verify response mentions pizza
        assert any(
            "pizza" in msg.content.lower() for msg in result["messages"]
        ), "Stored preference not retrieved"

        # Clean up test data
        await supabase_store.delete(TEST_NAMESPACE)

    @pytest.mark.asyncio
    async def test_memory_update(
        self,
        supabase_store: AsyncPostgresStore
    ):
        """Test that memories can be updated."""
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

        await chatbot(
            state1,
            config,
            store=supabase_store
        )
        await asyncio.sleep(2)  # Wait for processing

        # Second conversation updating preference
        state2 = {
            "messages": [
                HumanMessage(content="Actually, I prefer sushi now")
            ]
        }

        await chatbot(
            state2,
            config,
            store=supabase_store
        )
        await asyncio.sleep(2)  # Wait for processing

        # Search for food preferences
        memories = await supabase_store.search(
            TEST_NAMESPACE,
            "food preference"
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
        await supabase_store.delete(TEST_NAMESPACE)
