from typing import Tuple
from langchain.tools import tool
import subprocess
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import chromedriver_autoinstaller
from pathlib import Path
import time
import http.server
import socketserver
import threading
import os


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
    # TODO: Implement remote screenshot and build with docker container
    screenshot_path = local_take_screenshot_and_build(code)
    content = f"Successfully took screenshot of the code. {screenshot_path}"

    # 2. Return the content
    return content, {
        "title": "Screenshot",
        "description": "Screenshot",
        "code": code
    }


def local_take_screenshot_and_build(code: str) -> str:
    """
    Overwrite App.tsx with the given code, build the app, and take a screenshot of the built index.html.
    Returns the path to the screenshot.
    """
    web_dir = Path(__file__).parent / "web"
    app_path = web_dir / "src" / "App.tsx"
    dist_dir = web_dir / "dist"
    screenshot_path = dist_dir / "screenshot.png"

    # 1. Overwrite App.tsx
    with open(app_path, "w") as f:
        f.write(code)

    # 2. Build the app
    subprocess.run(["pnpm", "run", "build"], cwd=web_dir, check=True)

    # 3. Set up a simple HTTP server
    os.chdir(dist_dir)

    # Define handler
    handler = http.server.SimpleHTTPRequestHandler

    # Find an available port
    with socketserver.TCPServer(("", 0), handler) as httpd:
        port = httpd.server_address[1]

        # Start the server in a separate thread
        server_thread = threading.Thread(target=httpd.serve_forever)
        server_thread.daemon = True
        server_thread.start()

        try:
            # 4. Take screenshot using Selenium
            chromedriver_autoinstaller.install()
            options = Options()
            options.add_argument("--headless")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            driver = webdriver.Chrome(options=options)
            driver.set_window_size(1280, 800)

            # Use localhost instead of file://
            driver.get(f"http://localhost:{port}/")
            time.sleep(3)  # Wait longer for the page to fully load with CSS/JS
            driver.save_screenshot(str(screenshot_path))
            driver.quit()
        finally:
            # 5. Shut down the server
            httpd.shutdown()
            server_thread.join(timeout=5)

    # 6. Return the screenshot path
    return str(screenshot_path)


__all__ = ["take_screenshot"]
