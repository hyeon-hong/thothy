# Amazon Clothes Crawler

This Python script crawls Amazon's clothing section and extracts product information including names, prices, ratings, reviews, and image URLs. The data is saved in a markdown formatted file.

## Requirements

- Python 3.7+
- Chrome browser installed
- ChromeDriver (installed automatically via webdriver-manager)

## Installation

1. Clone this repository
2. Install the required packages:
```bash
pip install -r requirements.txt
```

## Usage

Simply run the script:
```bash
python amazon_clothes_crawler.py
```

The script will:
1. Start Chrome in headless mode
2. Crawl Amazon's clothing section
3. Extract data for up to 100 products
4. Save the results in `amazon_clothes.md`

## Output

The script generates a markdown file (`amazon_clothes.md`) containing:
- Product name
- Product image
- Price
- Rating
- Number of reviews
- Product URL

## Note

Please be mindful of Amazon's terms of service and rate limiting when using this crawler. The script includes random delays between requests to avoid overwhelming the server. 