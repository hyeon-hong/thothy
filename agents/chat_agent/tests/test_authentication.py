import asyncio
import os
import httpx
from getpass import getpass
from langgraph_sdk import get_client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

SUPABASE_API_URL = os.environ.get("SUPABASE_API_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

if not SUPABASE_API_URL or not SUPABASE_ANON_KEY:
    raise ValueError(
        "SUPABASE_API_URL and SUPABASE_ANON_KEY must be set in .env file"
    )


async def test_authentication():

if __name__ == "__main__":
    asyncio.run(test_authentication())
