from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import random


class AmazonClothesCrawler:
    def __init__(self):
        # Initialize Chrome options
        self.options = webdriver.ChromeOptions()
        self.options.add_argument('--headless')  # Run in headless mode
        self.options.add_argument('--disable-gpu')
        self.options.add_argument('--no-sandbox')
        self.options.add_argument('--disable-dev-shm-usage')
        user_agent = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                     'AppleWebKit/537.36 (KHTML, like Gecko) '
                     'Chrome/91.0.4472.124 Safari/537.36')
        self.options.add_argument(f'user-agent={user_agent}')
        
        self.driver = webdriver.Chrome(options=self.options)
        self.products = []
        
    def start_crawling(self, max_products=100):
        base_url = "https://www.amazon.com/s?k=clothes&rh=n%3A7141123011"
        page = 1
        
        while len(self.products) < max_products:
            url = f"{base_url}&page={page}"
            try:
                self.driver.get(url)
                time.sleep(random.uniform(2, 4))  # Random delay to avoid detection
                
                # Wait for product grid to load
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.s-result-item"))
                )
                
                # Extract products from current page
                products = self.driver.find_elements(
                    By.CSS_SELECTOR,
                    "div.s-result-item[data-component-type='s-search-result']"
                )
                
                for product in products:
                    if len(self.products) >= max_products:
                        break
                        
                    try:
                        product_data = self._extract_product_data(product)
                        if product_data:
                            self.products.append(product_data)
                            print(f"Crawled {len(self.products)} products")
                    except Exception as e:
                        print(f"Error extracting product data: {str(e)}")
                        continue
                
                page += 1
                
            except TimeoutException:
                print(f"Timeout on page {page}, moving to next page")
                page += 1
                continue
            except Exception as e:
                print(f"Error on page {page}: {str(e)}")
                break
                
        self.driver.quit()
        self._save_to_markdown()
        
    def _extract_product_data(self, product):
        try:
            # Extract product name
            name_element = product.find_element(By.CSS_SELECTOR, "h2 span")
            name = name_element.text.strip()
            
            # Extract product URL and image URL
            link_element = product.find_element(By.CSS_SELECTOR, "h2 a")
            product_url = "https://www.amazon.com" + link_element.get_attribute("href")
            
            image_element = product.find_element(By.CSS_SELECTOR, "img.s-image")
            image_url = image_element.get_attribute("src")
            
            # Extract price
            try:
                price_element = product.find_element(
                    By.CSS_SELECTOR, "span.a-price-whole"
                )
                price = price_element.text.strip()
            except NoSuchElementException:
                price = "N/A"
                
            # Extract rating and reviews count
            try:
                rating_element = product.find_element(By.CSS_SELECTOR, "span.a-icon-alt")
                rating = rating_element.get_attribute("innerHTML").split(" out of")[0]
                
                reviews_element = product.find_element(
                    By.CSS_SELECTOR, "span.a-size-base.s-underline-text"
                )
                reviews_count = reviews_element.text.strip()
            except NoSuchElementException:
                rating = "N/A"
                reviews_count = "N/A"
            
            return {
                "name": name,
                "url": product_url,
                "image_url": image_url,
                "price": price,
                "rating": rating,
                "reviews_count": reviews_count
            }
        except Exception as e:
            print(f"Error extracting individual product: {str(e)}")
            return None
            
    def _save_to_markdown(self):
        with open("amazon_clothes.md", "w", encoding="utf-8") as f:
            f.write("# Amazon Clothes Products\n\n")
            
            for idx, product in enumerate(self.products, 1):
                f.write(f"## {idx}. {product['name']}\n\n")
                f.write(f"![Product Image]({product['image_url']})\n\n")
                f.write(f"- **Price:** ${product['price']}\n")
                f.write(f"- **Rating:** {product['rating']}\n")
                f.write(f"- **Reviews:** {product['reviews_count']}\n")
                f.write(f"- **Product URL:** [View on Amazon]({product['url']})\n\n")
                f.write("---\n\n")


if __name__ == "__main__":
    crawler = AmazonClothesCrawler()
    crawler.start_crawling(max_products=100) 