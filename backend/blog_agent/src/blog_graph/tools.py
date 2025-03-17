"""Blog agent tools."""

from typing import Dict, Any, List
import os
import aiohttp
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Supabase environment variables are not set")

supabase: Client = create_client(supabase_url, supabase_key)


async def fetch_hackernews_articles(limit: int = 5) -> List[Dict[str, Any]]:
    """
    Fetch the latest articles from Hacker News.

    Args:
        limit: Number of articles to fetch (default: 5)

    Returns:
        List of articles with title, url, and other metadata
    """
    async with aiohttp.ClientSession() as session:
        # Fetch top story IDs
        hn_api_base = 'https://hacker-news.firebaseio.com/v0'
        top_stories_url = f'{hn_api_base}/topstories.json'
        async with session.get(top_stories_url) as response:
            story_ids = await response.json()
            story_ids = story_ids[:limit]  # Get only the top N stories

        # Fetch details for each story
        stories = []
        for story_id in story_ids:
            story_url = f'{hn_api_base}/item/{story_id}.json'
            async with session.get(story_url) as response:
                story = await response.json()
                if story and 'title' in story:
                    stories.append({
                        'id': story.get('id'),
                        'title': story.get('title'),
                        'url': story.get('url'),
                        'score': story.get('score'),
                        'by': story.get('by'),
                        'time': datetime.fromtimestamp(
                            story.get('time', 0)
                        ).isoformat(),
                        'descendants': story.get('descendants', 0)  # comments
                    })

        return stories


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


__all__ = ["fetch_hackernews_articles", "post_blog"] 