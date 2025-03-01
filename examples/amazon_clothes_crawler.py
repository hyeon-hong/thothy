import asyncio
import logging
import json
from crawl4ai import (
    AsyncWebCrawler,
    BrowserConfig,
    CrawlerRunConfig,
    CacheMode,
    JsonCssExtractionStrategy,
)


class AmazonClothesCrawler:
    def __init__(self):
        # Set up logging
        logging.basicConfig(
            level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
        )
        self.logger = logging.getLogger(__name__)

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
                url = f"{base_url}&page={page}"
                self.logger.info(f"Processing page {page}, URL: {url}")

                try:
                    result = await crawler.arun(url=url, config=run_config)
                    # Convert result.extracted_content to a list of dictionaries
                    converted_extracted_content = json.loads(result.extracted_content)
                    self.logger.info(
                        f"result.extracted_content: {converted_extracted_content}"
                    )

                    if not result or not converted_extracted_content:
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
                    products_found = len(converted_extracted_content)
                    self.logger.info(f"Found {products_found} products")

                    # Process extracted products
                    for product_data in converted_extracted_content:
                        self.logger.info(f"product_data: {product_data}")

                        if len(self.products) >= max_products:
                            # If enough products, stop
                            self.logger.info(
                                f"Reached {max_products} " f"products. Stopping."
                            )
                            break

                        try:
                            # Clean and validate product data
                            if self._is_valid_product(product_data):
                                self.logger.info(f"Processing product: {product_data}")

                                clean_product = self._clean_product_data(product_data)
                                print(f"clean_product: {clean_product}")

                                self.products.append(clean_product)
                                name_preview = clean_product["name"][:50]
                                self.logger.info(f"Crawled: {name_preview}...")

                                progress = f"{len(self.products)}/{max_products}"
                                self.logger.info(f"Progress: {progress}")
                            else:
                                self.logger.info(
                                    f"Skipping product: {product_data["name"]}"
                                )
                        except json.JSONDecodeError as e:
                            self.logger.error(f"Failed to parse product data: {str(e)}")
                            continue

                    # Break page loop if max_products reached
                    if len(self.products) >= max_products:
                        break

                    page += 1

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
        output_file = "amazon_clothes.md"
        self.logger.info(f"Saving results to {output_file}")

        with open(output_file, "w", encoding="utf-8") as f:
            f.write("# Amazon Clothes Products\n\n")

            for idx, product in enumerate(self.products, 1):
                f.write(f"## {idx}. {product['name']}\n\n")
                f.write(f"![Product Image]({product['image_url']})\n\n")
                f.write(f"- **Price:** ${product['price']}\n")
                f.write(f"- **Rating:** {product['rating']}\n")
                f.write(f"- **Reviews:** {product['reviews_count']}\n")
                url = product["url"]
                f.write(f"- **Product URL:** [View on Amazon]({url})\n\n")
                f.write("---\n\n")

        self.logger.info("Results saved successfully")


if __name__ == "__main__":
    crawler = AmazonClothesCrawler()
    asyncio.run(crawler.start_crawling(max_products=100))
