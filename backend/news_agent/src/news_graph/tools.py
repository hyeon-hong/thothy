"""News agent tools."""

from typing import Dict, Any, List
import aiohttp
from datetime import datetime


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


__all__ = ["fetch_hackernews_articles"]
