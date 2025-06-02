"""Blog agent tools."""

import logging
from typing import Dict, Any
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url:
    raise ValueError("Supabase URL is not set")
if not supabase_key:
    raise ValueError("Supabase key is not set")

logging.info(f"supabase_url: {supabase_url}")
logging.info(f"supabase_key: {supabase_key}")

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
    logging.warning(f"supabase_key: {supabase_key}")
    logging.warning(f"supabase_url: {supabase_url}")
    logging.warning(f"supabase: {supabase}")

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
        logging.warning(f"post_blog title: {title}")
        logging.warning(f"post_blog content: {content}")
        logging.warning(f"post_blog user_id: {user_id}")
        blog_data = {
            "title": title,
            "content": content,
            "user_id": user_id,
        }

        # Insert blog post into Supabase
        result = supabase.table('blogs').insert(blog_data).execute()
        logging.warning(f"post_blog result: {result}")

        if not result.data:
            raise Exception("Failed to create blog post")

        return result.data[0]

    except Exception as e:
        raise Exception(f"Error posting blog: {str(e)}")


__all__ = ["post_blog"]
