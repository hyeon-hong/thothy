import asyncio
import os
from datetime import datetime
from typing import Set
from urllib.parse import urljoin, urlparse
from rich import print
from crawl4ai import AsyncWebCrawler, CrawlResult
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import argparse

load_dotenv()


class URLCache:
    """Global cache for storing crawled URLs across crawler instances."""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(URLCache, cls).__new__(cls)
            cls._instance.urls = set()
        return cls._instance
    
    def add(self, url: str) -> None:
        """Add URL to cache."""
        self.urls.add(url)
    
    def contains(self, url: str) -> bool:
        """Check if URL exists in cache."""
        return url in self.urls
    
    def clear(self) -> None:
        """Clear the cache."""
        self.urls.clear()

    def get_stats(self) -> dict:
        """Get cache statistics."""
        return {
            "total_cached_urls": len(self.urls)
        }

class RecursiveCrawler:
    def __init__(self, max_depth: int = 2, max_pages: int = 10):
        """Initialize the recursive crawler.

        Args:
            max_depth: Maximum depth for recursive crawling
            max_pages: Maximum number of pages to crawl
        """
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.crawled_urls: Set[str] = set()
        self.results: list[tuple[str, str, CrawlResult]] = []  # [(url, title, result)]
        self.url_cache = URLCache()  # Global URL cache
        self.pending_urls: Set[str] = set()  # New: Track URLs to be crawled

    def _is_same_domain(self, base_url: str, url: str) -> bool:
        """Check if URL is from the same domain as base_url."""
        base_domain = urlparse(base_url).netloc
        url_domain = urlparse(url).netloc
        return base_domain == url_domain

    def _normalize_url(self, base_url: str, url: str) -> str:
        """Normalize URL by joining with base URL if needed."""
        return urljoin(base_url, url)

    async def crawl_recursive(self, url: str, depth: int = 0, base_url: str = None):
        """Recursively crawl URLs starting from the given URL."""
        if depth >= self.max_depth or len(self.crawled_urls) >= self.max_pages:
            return

        if base_url is None:
            base_url = url

        # Check both local and global cache
        if (url in self.crawled_urls) or self.url_cache.contains(url):
            print(f"Skipping already crawled URL: {url}")
            if url in self.pending_urls:
                self.pending_urls.remove(url)
            return

        try:
            print(f"\nCrawling {url}")
            print(f"Depth: {depth}")
            print(f"Remaining pages to crawl: {len(self.pending_urls)}")
            print(f"Already crawled: {len(self.crawled_urls)}")
            
            async with AsyncWebCrawler(verbose=True) as crawler:
                result = await crawler.arun(url)

                # Store the result with metadata
                title = result.metadata.get("title", "Untitled")
                self.results.append((url, title, result))
                self.crawled_urls.add(url)
                self.url_cache.add(url)
                if url in self.pending_urls:
                    self.pending_urls.remove(url)

                # Extract links from HTML content
                links = set()
                if result.cleaned_html:
                    soup = BeautifulSoup(result.cleaned_html, "html.parser")
                    for a_tag in soup.find_all("a", href=True):
                        href = a_tag["href"]
                        if href.startswith("#") or href.startswith("javascript:"):
                            continue
                        if href.startswith(("mailto:", "tel:")):
                            continue
                        links.add(href)

                metadata_links = result.metadata.get("links", [])
                links.update(metadata_links)

                # Process each link
                for link in links:
                    if len(self.crawled_urls) >= self.max_pages:
                        break

                    normalized_url = self._normalize_url(base_url, link)
                    if (
                        normalized_url not in self.crawled_urls
                        and not self.url_cache.contains(normalized_url)
                        and self._is_same_domain(base_url, normalized_url)
                    ):
                        self.pending_urls.add(normalized_url)
                        await self.crawl_recursive(normalized_url, depth + 1, base_url)

        except Exception as e:
            print(f"Error crawling {url}: {str(e)}")
            if url in self.pending_urls:
                self.pending_urls.remove(url)

    def generate_markdown(self) -> str:
        """Generate a merged markdown file from all crawled results."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        markdown = f"""# Crawl Results
Generated on: {timestamp}

Total pages crawled: {len(self.results)}

"""
        # Add table of contents
        markdown += "## Table of Contents\n\n"
        for i, (url, title, _) in enumerate(self.results, 1):
            # Create an anchor link from title
            anchor = title.lower().replace(" ", "-")
            markdown += f"{i}. [{title}](#{anchor})\n"

        markdown += "\n## Content\n\n"

        # Add content for each crawled page
        for url, title, result in self.results:
            markdown += f"### {title}\n\n"
            markdown += f"**URL**: {url}\n\n"
            markdown += (
                f"**Crawled on**: {result.metadata.get('timestamp', 'Unknown')}\n\n"
            )

            # Add any additional metadata
            if "description" in result.metadata:
                markdown += f"**Description**: {result.metadata['description']}\n\n"

            markdown += "**Content**:\n\n"
            markdown += result.markdown_v2.raw_markdown
            markdown += "\n\n---\n\n"

        return markdown


async def crawl_website(
    url: str,
    output_file: str = None,
    max_depth: int = 2,
    max_pages: int = 10,
    clear_cache: bool = False
):
    """Crawl a website recursively and save results to a markdown file.
    
    Args:
        url: The URL to crawl
        output_file: Path to output file (optional)
        max_depth: Maximum depth for recursive crawling
        max_pages: Maximum number of pages to crawl
        clear_cache: Whether to clear the global URL cache before crawling
    """
    try:
        # Show initial statistics
        cache = URLCache()
        if clear_cache:
            cache.clear()
            
        print("\n=== Crawl Statistics ===")
        print(f"Starting URL: {url}")
        print(f"Maximum depth: {max_depth}")
        print(f"Maximum pages: {max_pages}")
        print(f"URLs in cache: {len(cache.urls)}")
        print("=======================\n")
            
        # Create crawler instance
        crawler = RecursiveCrawler(max_depth=max_depth, max_pages=max_pages)
        
        # Perform recursive crawl
        await crawler.crawl_recursive(url)
        
        # Show final statistics
        print("\n=== Final Statistics ===")
        print(f"Total pages crawled: {len(crawler.crawled_urls)}")
        print(f"Total unique URLs in cache: {len(cache.urls)}")
        print("=======================\n")
        
        # Generate markdown content
        markdown_content = crawler.generate_markdown()
        
        # Determine output file path
        if output_file is None:
            output_dir = "outputs"
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
                
            domain = urlparse(url).netloc
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = os.path.join(
                output_dir,
                f"crawl_{domain}_{timestamp}.md"
            )
        else:
            # Ensure output directory exists
            output_dir = os.path.dirname(output_file)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)
        
        # Save content
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(markdown_content)
            
        print(f"Crawl results saved to {output_file}")
        
    except Exception as e:
        print(f"Error during crawl: {str(e)}")


def main():
    """Main entry point for the crawler command line interface."""
    parser = argparse.ArgumentParser(
        description="Recursively crawl a website and save content to markdown."
    )
    
    parser.add_argument(
        "url",
        help="URL to start crawling from"
    )
    
    parser.add_argument(
        "-o", "--output",
        help="Output file path (default: outputs/crawl_<domain>_<timestamp>.md)",
        default=None
    )
    
    parser.add_argument(
        "-d", "--depth",
        help="Maximum crawl depth (default: 2)",
        type=int,
        default=2
    )
    
    parser.add_argument(
        "-p", "--pages",
        help="Maximum number of pages to crawl (default: 10)",
        type=int,
        default=10
    )
    
    parser.add_argument(
        "--clear-cache",
        help="Clear URL cache before crawling",
        action="store_true"
    )
    
    args = parser.parse_args()
    
    asyncio.run(
        crawl_website(
            url=args.url,
            output_file=args.output,
            max_depth=args.depth,
            max_pages=args.pages,
            clear_cache=args.clear_cache
        )
    )


if __name__ == "__main__":
    main()
