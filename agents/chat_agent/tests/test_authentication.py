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
    # Get email from command line
    # email = getpass("Enter your email: ")
    email = "myemail@gmail.com"
    base_email = email.split("@")
    password = "secure-password"  # CHANGEME
    email1 = f"{base_email[0]}1@{base_email[1]}"
    email2 = f"{base_email[0]}2@{base_email[1]}"

    async def sign_up(email: str, password: str):
        """Create a new user account."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_API_URL}/auth/v1/signup",
                json={"email": email, "password": password},
                headers={"apiKey": SUPABASE_ANON_KEY},
            )
            print(f"response.json(): {response.json()}")
            assert response.status_code == 200
            return response.json()

    # Create two test users
    print(f"Creating test users: {email1} and {email2}")
    await sign_up(email1, password)
    await asyncio.sleep(5)
    await sign_up(email2, password)

    async def login(email: str, password: str):
        """Get an access token for an existing user."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_API_URL}/auth/v1/token?grant_type=password",
                json={
                    "email": email,
                    "password": password
                },
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json"
                },
            )
            print(f"response.json(): {response.json()}")
            assert response.status_code == 200
            return response.json()["access_token"]

    # Log in as user 1
    user1_token = await login(email1, password)
    user1_client = get_client(
        url="http://localhost:2024",
        headers={"Authorization": f"Bearer {user1_token}"},
    )

    # Create a thread as user 1
    thread = await user1_client.threads.create()
    print(f"✅ User 1 created thread: {thread['thread_id']}")

    # Try to access without a token
    unauthenticated_client = get_client(url="http://localhost:2024")
    try:
        await unauthenticated_client.threads.create()
        print("❌ Unauthenticated access should fail!")
    except Exception as e:
        print("✅ Unauthenticated access blocked:", e)

    # Try to access user 1's thread as user 2
    user2_token = await login(email2, password)
    user2_client = get_client(
        url="http://localhost:2024",
        headers={"Authorization": f"Bearer {user2_token}"},
    )

    try:
        await user2_client.threads.get(thread["thread_id"])
        print("❌ User 2 shouldn't see User 1's thread!")
    except Exception as e:
        print("✅ User 2 blocked from User 1's thread:", e)


if __name__ == "__main__":
    asyncio.run(test_authentication())
