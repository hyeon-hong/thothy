"""Test the blog agent functionality."""

import os
import asyncio
from dotenv import load_dotenv
from blog_graph.tools import fetch_hackernews_articles, post_blog

# Load environment variables
load_dotenv()

# Get user ID from environment
USER_ID = os.getenv("BLOG_AGENT_USER_ID")
if not USER_ID:
    raise ValueError("BLOG_AGENT_USER_ID environment variable is not set")


async def test_create_blog_with_hn():
    """Test creating a blog post with Hacker News content."""
    try:
        # Fetch top HN articles
        articles = await fetch_hackernews_articles(limit=5)
        
        if not articles:
            print("No Hacker News articles found")
            return
        
        # Create blog content from HN articles
        title = "Today's Top Stories from Hacker News"
        content = "<h1>Latest from Hacker News</h1>\n\n"
        
        for article in articles:
            content += (
                f"<h2><a href='{article['url']}'>{article['title']}</a></h2>\n"
            )
            content += (
                f"<p>Posted by {article['by']} | {article['score']} points | "
                f"{article['descendants']} comments</p>\n\n"
            )
        
        # Create the blog post
        result = await post_blog(
            title=title,
            content=content,
            user_id=USER_ID
        )
        
        print("Successfully created blog post:")
        print(f"Title: {result['title']}")
        print(f"ID: {result['id']}")
        print(f"Created at: {result['created_at']}")
        
    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    # Run the test
    asyncio.run(test_create_blog_with_hn()) 