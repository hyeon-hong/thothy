import asyncio
import logging
import json
import argparse
from crawl4ai import (
    AsyncWebCrawler,
    BrowserConfig,
    CrawlerRunConfig,
    CacheMode,
    JsonCssExtractionStrategy,
)


class AmazonClothesCrawler:
    def __init__(self, output_file="amazon_clothes.md"):
        # Set up logging
        logging.basicConfig(
            level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
        )
        self.logger = logging.getLogger(__name__)
        self.output_file = output_file

        # Define extraction schema for Amazon products
        self.schema = {
            "name": "Amazon Clothes Products",
            "baseSelector": (
                "div.s-result-item[data-component-type='s-search-result']"
            ),
            "fields": [
                {
                    "name": "name",
                    "selector": "h2 span",
                    "type": "text",
                },
                {
                    "name": "url",
                    "selector": "h2 a",
                    "type": "attribute",
                    "attribute": "href",
                },
                {
                    "name": "image_url",
                    "selector": "img.s-image",
                    "type": "attribute",
                    "attribute": "src",
                },
                {
                    "name": "price",
                    "selector": "span.a-price-whole",
                    "type": "text",
                },
                {
                    "name": "rating",
                    "selector": "span.a-icon-alt",
                    "type": "text",
                },
                {
                    "name": "reviews_count",
                    "selector": "span.a-size-base.s-underline-text",
                    "type": "text",
                },
            ],
        }

        self.products = []

    async def start_crawling(self, max_products=100):
        self.logger.info("Starting Amazon clothes crawler")

        # Configure browser settings
        browser_config = BrowserConfig(
            headless=True,
            verbose=True,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/91.0.4472.124 Safari/537.36"
            ),
        )

        # Configure crawler settings
        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.ENABLED,
            extraction_strategy=JsonCssExtractionStrategy(self.schema, verbose=True),
        )

        base_url = "https://www.amazon.com/s?k=clothes&rh=n%3A7141123011"
        page = 1
        consecutive_failures = 0

        async with AsyncWebCrawler(config=browser_config) as crawler:
            while len(self.products) < max_products:
                self.logger.info(f"------- Processing page {page} -------")
                url = f"{base_url}&page={page}"
                self.logger.info(f"URL: {url}")

                try:
                    # Crawl single page
                    self.logger.info(f"Crawling page {page}...")
                    result = await crawler.arun(url=url, config=run_config)

                    # Convert extracted content to a list of dictionaries
                    converted_content = json.loads(
                        result.extracted_content
                    )

                    # Check if page has products
                    if not result or not converted_content:
                        msg = f"No products found on page {page}"
                        self.logger.warning(msg)
                        consecutive_failures += 1
                        if consecutive_failures >= 3:
                            msg = "Three consecutive failures. Stopping."
                            self.logger.error(msg)
                            break
                        page += 1
                        continue

                    # Reset failure counter on successful extraction
                    consecutive_failures = 0
                    products_found = len(converted_content)
                    self.logger.info(
                        f"Found {products_found} products on page {page}"
                    )

                    # Process each product from this page
                    self.logger.info(
                        f"Processing products from page {page}..."
                    )
                    products_added = 0

                    for product_data in converted_content:
                        # Check if we've reached max products
                        if len(self.products) >= max_products:
                            self.logger.info(
                                f"Reached {max_products} products. "
                                f"Stopping crawl."
                            )
                            break

                        try:
                            # Add page URL to product data
                            product_data["page_url"] = url

                            # Clean and validate product data
                            if self._is_valid_product(product_data):
                                clean_product = self._clean_product_data(
                                    product_data
                                )
                                self.products.append(clean_product)
                                products_added += 1

                                # Log progress
                                name = clean_product["name"][:15]
                                count = len(self.products)
                                self.logger.info(
                                    f"Added: {name}... "
                                    f"({count}/{max_products})"
                                )
                        except Exception as e:
                            self.logger.error(
                                f"Error processing product: "
                                f"{str(e)}"
                            )
                            continue

                    self.logger.info(
                        f"Added {products_added} products from page {page}"
                    )

                    # Break page loop if max_products reached
                    if len(self.products) >= max_products:
                        self.logger.info(
                            f"Target of {max_products} products reached. "
                            f"Stopping crawl."
                        )
                        break

                    page += 1
                    self.logger.info(
                        f"Moving to page {page}. "
                        f"Total products so far: {len(self.products)}"
                    )

                except Exception as e:
                    self.logger.error(f"Error on page {page}: {str(e)}")
                    consecutive_failures += 1
                    if consecutive_failures >= 3:
                        msg = "Three consecutive errors. Stopping."
                        self.logger.error(msg)
                        break
                    page += 1

        total = len(self.products)
        self.logger.info(f"Crawling finished. Products collected: {total}")
        self._save_to_markdown()

    def _is_valid_product(self, product):
        """Validate if product data is complete enough to be included."""
        if not isinstance(product, dict):
            self.logger.info(f"product is not a dict: {product}")
            return False
        required = ("name", "price", "image_url")
        result = all(product.get(field) for field in required)
        self.logger.info(f"is_valid_product: {result}")
        return result

    def _clean_product_data(self, product):
        """Clean and normalize product data."""
        # Create a copy to avoid modifying the original
        cleaned = product.copy()

        # Clean URL
        if cleaned.get("url"):
            if not cleaned["url"].startswith("http"):
                cleaned["url"] = "https://www.amazon.com" + cleaned["url"]
        else:
            # Ensure URL exists, use page_url as fallback if available
            cleaned["url"] = cleaned.get("page_url", "https://www.amazon.com")

        # Clean price
        price = cleaned.get("price", "N/A")
        cleaned["price"] = price if price != "N/A" else "N/A"

        # Clean rating
        rating = cleaned.get("rating", "N/A")
        if rating != "N/A":
            cleaned["rating"] = rating.split(" out of")[0]

        # Ensure all required fields exist
        for field in ["price", "rating", "reviews_count"]:
            if field not in cleaned:
                cleaned[field] = "N/A"

        return cleaned

    def _save_to_markdown(self):
        """Save crawled products to a markdown file."""
        self.logger.info(f"Saving results to {self.output_file}")

        with open(self.output_file, "w", encoding="utf-8") as f:
            f.write("# Amazon Clothes Products\n\n")

            for idx, product in enumerate(self.products, 1):
                f.write(f"## {idx}. {product['name']}\n\n")
                f.write(f"![Product Image]({product['image_url']})\n\n")
                f.write(f"- **Price:** ${product['price']}\n")
                f.write(f"- **Rating:** {product['rating']}\n")
                f.write(f"- **Reviews:** {product['reviews_count']}\n")
                
                # Product URL - safely access it
                product_url = product.get('url', 'https://www.amazon.com')
                f.write(
                    f"- **Product URL:** [View on Amazon]({product_url})\n"
                )
                
                # Add page URL where this product was found
                if product.get("page_url"):
                    page_url = product["page_url"]
                    f.write(
                        f"- **Found on:** [{page_url}]({page_url})\n"
                    )
                f.write("\n---\n\n")

        self.logger.info("Results saved successfully")


def parse_arguments():
    """Parse command line arguments for the crawler."""
    parser = argparse.ArgumentParser(
        description="Amazon Clothes Crawler - Scrape clothes products from Amazon"
    )
    parser.add_argument(
        "-o", 
        "--output", 
        default="amazon_clothes.md",
        help="Output file path (default: amazon_clothes.md)"
    )
    parser.add_argument(
        "-m", 
        "--max-products", 
        type=int, 
        default=100,
        help="Maximum number of products to crawl (default: 100)"
    )
    parser.add_argument(
        "-v", 
        "--verbose", 
        action="store_true",
        help="Enable verbose logging"
    )
    return parser.parse_args()


if __name__ == "__main__":
    # Parse command-line arguments
    args = parse_arguments()
    
    # Configure logging level based on verbose flag
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        print(f"Verbose mode enabled. Arguments: {args}")
    
    # Initialize crawler with output file
    crawler = AmazonClothesCrawler(output_file=args.output)
    
    # Run the crawler with specified max products
    asyncio.run(crawler.start_crawling(max_products=args.max_products))
