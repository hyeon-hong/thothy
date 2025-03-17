"""Test the news agent functionality."""

import asyncio
from news_graph.tools import fetch_hackernews_articles


async def test_fetch_hackernews_articles():
    """Test fetching Hacker News articles."""
    try:
        # Fetch top HN articles
        articles = await fetch_hackernews_articles(limit=5)
        # Print the articles with pretty print
        import pprint
        pprint.pprint(articles)

        if not articles:
            print("No Hacker News articles found")
            return

        print("Successfully fetched Hacker News articles")

    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    # Run the test
    asyncio.run(test_fetch_hackernews_articles())
