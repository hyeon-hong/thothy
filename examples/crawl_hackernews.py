import asyncio
from crawl4ai import AsyncWebCrawler
from rich import print
from dotenv import load_dotenv
import os

load_dotenv()


async def crawl_hackernews():
    """Crawl Hacker News and get the latest 10 news items."""
    try:
        # Initialize the crawler
        async with AsyncWebCrawler(verbose=True) as crawler:
            # Crawl Hacker News homepage
            result = await crawler.arun("https://news.ycombinator.com")

            # Get the markdown content
            content = result.markdown_v2.raw_markdown

            # Print the crawled content
            print("\n=== Latest Hacker News ===\n")
            print(content)

            # Save the content to a file
            output_dir = "outputs"
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)

            output_file = os.path.join(output_dir, "hackernews.md")
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"\nContent saved to {output_file}")

    except Exception as e:
        print(f"Error crawling Hacker News: {str(e)}")


if __name__ == "__main__":
    asyncio.run(crawl_hackernews())
