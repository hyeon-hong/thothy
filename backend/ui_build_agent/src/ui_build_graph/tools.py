from typing import Tuple
from langchain.tools import tool
import subprocess
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import chromedriver_autoinstaller
from pathlib import Path
import time


@tool(response_format="content_and_artifact")
def take_screenshot(code: str) -> Tuple[str, dict]:
    """
    Take a screenshot of a code.

    Args:
        code: A string of JavaScript (React) code using shadcn UI components

    Returns:
        True if the screenshot was taken successfully, False otherwise
    """

    # 1. Take screenshot and build
    screenshot_path = take_screenshot_and_build(code)
    content = f"Successfully took screenshot of the code. {screenshot_path}"

    # 2. Return the content
    return content, {
        "title": "Screenshot",
        "description": "Screenshot",
        "code": code
    }


def take_screenshot_and_build(code: str) -> str:
    """
    Overwrite App.tsx with the given code, build the app, and take a screenshot of the built index.html.
    Returns the path to the screenshot.
    """
    web_dir = Path(__file__).parent / "web"
    app_path = web_dir / "src" / "App.tsx"
    dist_dir = web_dir / "dist"
    index_html = dist_dir / "index.html"
    screenshot_path = dist_dir / "screenshot.png"

    # 1. Overwrite App.tsx
    with open(app_path, "w") as f:
        f.write(code)

    # 2. Build the app
    subprocess.run(["pnpm", "run", "build"], cwd=web_dir, check=True)

    # 3. Take screenshot using Selenium
    chromedriver_autoinstaller.install()
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(1280, 800)
    driver.get(f"file://{index_html}")
    time.sleep(2)  # Wait for the page to load
    driver.save_screenshot(str(screenshot_path))
    driver.quit()

    # 4. Return the screenshot path
    return str(screenshot_path)


__all__ = ["take_screenshot"]
