import logging
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
import base64


@tool(response_format="content_and_artifact")
def take_screenshot_tool(code: str) -> Tuple[str, dict]:
    """
    Take a screenshot of a code.

    Args:
        code: A string of JavaScript (React) code using shadcn UI components

    Returns:
        True if the screenshot was taken successfully, False otherwise
    """

    # 1. Take screenshot and build
    response = _local_take_screenshot_and_build(code)
    logging.info("response: %s", response)
    if isinstance(response, str) and response.startswith("Error"):
        return response, {}

    content = f"Successfully took screenshot of the code. {response}"

    # 2. Return the content
    return content, {
        "title": "Screenshot",
        "description": "Screenshot",
        "code": code
    }


def _local_take_screenshot_and_build(code: str) -> str:
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
    result = subprocess.run(
        ["pnpm", "run", "build"],
        cwd=web_dir,
        capture_output=True,
        text=True,
        check=False
    )
    logging.info("result: %s", result)

    if result.returncode != 0:
        # Look for TypeScript errors
        ts_errors = []
        error_message = ""
        
        # Check both stdout and stderr for error messages
        output = result.stdout + "\n" + result.stderr
        
        if "error TS" in output:
            ts_errors = [line for line in output.split('\n') if "error TS" in line]
            logging.info("ts_errors: %s", ts_errors)
            logging.error("TypeScript errors detected: %s", ts_errors)
            for error in ts_errors[:5]:  # Show first 5 errors
                logging.error("  - %s", error.strip())
            error_message = f"TypeScript errors: {'; '.join(ts_errors[:3])}"
        else:
            logging.error("Build failed: %s", output)
            # Truncate long error messages
            error_message = f"Build failed: {output[:200]}"

        return f"Error: {error_message}"

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
        except Exception as e:
            logging.error("Screenshot error: %s", str(e))
            return f"Error: Failed to take screenshot: {str(e)}"
        finally:
            # 5. Shut down the server
            httpd.shutdown()
            server_thread.join(timeout=5)

    # 6. Return the screenshot path
    return str(screenshot_path)


def _get_image_base64(image_path: str) -> str:
    """
    Encode image file to base64 string.

    Args:
        image_path: Path to the image file

    Returns:
        Base64 encoded string of the image
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


@tool(response_format="content_and_artifact")
def analyze_ui_tool(widget_name: str, description: str, score: int, analysis: str) -> Tuple[str, dict]:
    """
    Generate a score and analysis of a UI.

    Args:
        widget_name: The name of the widget/component (e.g., 'Button', 'Card')
        description: A description of the widget's purpose and features
        score: The score of the UI
        analysis: A detailed analysis of the UI

    Returns:
        A tuple containing the score and analysis of the UI
    """

    # Get the screenshot path from the most recent screenshot
    web_dir = Path(__file__).parent / "web"
    dist_dir = web_dir / "dist"
    screenshot_path = dist_dir / "screenshot.png"

    # Check if screenshot exists
    image_content = None
    if screenshot_path.exists():
        image_content = _get_image_base64(str(screenshot_path))

    content = "Successfully generated a score and analysis of the UI."
    return content, {
        "title": widget_name,
        "description": description,
        "score": score,
        "analysis": analysis,
        "image_base64": image_content
    }


__all__ = ["take_screenshot_tool", "analyze_ui_tool"]
