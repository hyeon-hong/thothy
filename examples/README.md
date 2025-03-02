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

## Command Line Options

The script supports several command-line arguments to customize its behavior:

```bash
# Specify a custom output file
python amazon_clothes_crawler.py --output custom_output.md

# Limit the number of products to crawl
python amazon_clothes_crawler.py --max-products 50

# Enable verbose logging
python amazon_clothes_crawler.py --verbose

# Combine multiple options
python amazon_clothes_crawler.py --output amazon_winter.md --max-products 200 --verbose
```

### Available Options

| Option | Short Form | Description | Default |
|--------|------------|-------------|---------|
| `--output` | `-o` | Output file path | `amazon_clothes.md` |
| `--max-products` | `-m` | Maximum number of products to crawl | `100` |
| `--verbose` | `-v` | Enable verbose logging | `False` |

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