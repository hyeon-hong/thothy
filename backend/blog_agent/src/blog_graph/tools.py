"""Blog agent tools."""

from typing import Dict, Any
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
# Check the development mode for supabase_key
if os.getenv("BLOG_AGENT_DEVELOPMENT_MODE") == "true":
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
else:
    supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Supabase environment variables are not set")

supabase: Client = create_client(supabase_url, supabase_key)


async def post_blog(
    title: str,
    content: str,
    user_id: str,
) -> Dict[str, Any]:
    """
    Post a new blog entry to Thothy using Supabase.

    Args:
        title: Blog post title
        content: Blog post content (HTML format)
        user_id: ID of the user creating the post (must be a valid UUID)

    Returns:
        Dictionary containing the created blog post data

    Raises:
        ValueError: If required fields are missing or invalid
        Exception: If there's an error posting to Supabase
    """
    if not title.strip():
        raise ValueError("Blog title cannot be empty")

    if not content.strip():
        raise ValueError("Blog content cannot be empty")

    if not user_id:
        raise ValueError("User ID is required")

    # Validate UUID format
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise ValueError("Invalid user ID format. Must be a valid UUID.")

    try:
        # Prepare blog post data
        blog_data = {
            "title": title,
            "content": content,
            "user_id": user_id,
        }

        # Insert blog post into Supabase
        result = supabase.table('blogs').insert(blog_data).execute()

        if not result.data:
            raise Exception("Failed to create blog post")

        return result.data[0]

    except Exception as e:
        raise Exception(f"Error posting blog: {str(e)}")


__all__ = ["post_blog"]
