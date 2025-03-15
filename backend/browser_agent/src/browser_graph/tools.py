"""Tools for the browser agent to interact with web pages."""

import asyncio
import base64
import io
import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFont
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

from langchain_core.tools import tool


# Browser control tools
class BrowserTools:
    """Tools for controlling a browser using Playwright."""

    def __init__(self):
        """Initialize the browser tools."""
        self.browser = None
        self.context = None
        self.page = None
        self.elements_map = {}
        self.current_url = None

    async def initialize_browser(self, headless: bool = True) -> Dict[str, Any]:
        """Initialize the browser.
        
        Args:
            headless: Whether to run the browser in headless mode
            
        Returns:
            Dict[str, Any]: Browser context information
        """
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=headless)
        self.context = await self.browser.new_context(
            viewport={"width": 1280, "height": 800}
        )
        self.page = await self.context.new_page()
        return {"status": "initialized"}

    async def navigate_to_url(self, url: str) -> Dict[str, Any]:
        """Navigate to a URL.
        
        Args:
            url: URL to navigate to
            
        Returns:
            Dict[str, Any]: Navigation result
        """
        if not self.page:
            return {"error": "Browser not initialized"}

        try:
            await self.page.goto(url, wait_until="networkidle")
            self.current_url = url
            return {"status": "success", "url": url}
        except Exception as e:
            return {"error": str(e)}

    async def take_screenshot(self) -> str:
        """Take a screenshot of the current page.
        
        Returns:
            str: Base64 encoded screenshot
        """
        if not self.page:
            return ""

        screenshot_bytes = await self.page.screenshot()
        return base64.b64encode(screenshot_bytes).decode("utf-8")

    async def get_page_content(self) -> str:
        """Get the HTML content of the current page.
        
        Returns:
            str: HTML content
        """
        if not self.page:
            return ""

        return await self.page.content()

    async def get_page_elements(self) -> Dict[str, Dict[str, Any]]:
        """Get interactive elements on the page.
        
        Returns:
            Dict[str, Dict[str, Any]]: Dictionary of elements
        """
        if not self.page:
            return {}

        # Find clickable elements
        elements = await self.page.query_selector_all(
            "button, a, input, textarea, select, [role='button'], [tabindex]"
        )

        # Process elements and create a map
        self.elements_map = {}
        for i, element in enumerate(elements):
            element_id = f"element_{i}"
            # Get basic properties
            tag_name = await element.evaluate("el => el.tagName.toLowerCase()")
            text = await element.evaluate("el => el.textContent?.trim() || ''")
            rect = await element.bounding_box()
            
            if not rect:  # Skip if element has no bounding box (not visible)
                continue
                
            # Get element attributes
            attrs = await element.evaluate("""el => {
                const result = {};
                for (const attr of el.attributes) {
                    result[attr.name] = attr.value;
                }
                return result;
            }""")
            
            self.elements_map[element_id] = {
                "id": element_id,
                "tag": tag_name,
                "text": text,
                "rect": {
                    "x": rect["x"],
                    "y": rect["y"],
                    "width": rect["width"],
                    "height": rect["height"],
                },
                "attributes": attrs
            }
            
        return self.elements_map

    async def annotate_screenshot(self, screenshot_base64: str) -> str:
        """Annotate a screenshot with element markers.
        
        Args:
            screenshot_base64: Base64 encoded screenshot
            
        Returns:
            str: Base64 encoded annotated screenshot
        """
        if not self.elements_map:
            return screenshot_base64

        # Decode the screenshot
        img_data = base64.b64decode(screenshot_base64)
        image = Image.open(io.BytesIO(img_data))
        draw = ImageDraw.Draw(image)
        
        # Try to load a font, or use default
        try:
            font = ImageFont.truetype("Arial", 12)
        except IOError:
            font = ImageFont.load_default()
        
        # Add markers for each element
        for element_id, element in self.elements_map.items():
            rect = element["rect"]
            # Draw rectangle around element
            draw.rectangle(
                [
                    (rect["x"], rect["y"]),
                    (rect["x"] + rect["width"], rect["y"] + rect["height"])
                ],
                outline="red",
                width=2
            )
            # Add element ID text
            draw.text(
                (rect["x"], rect["y"] - 15),
                element_id,
                fill="red",
                font=font
            )
        
        # Convert back to base64
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")

    async def click_element(self, element_id: str) -> Dict[str, Any]:
        """Click an element by its ID.
        
        Args:
            element_id: Element ID to click
            
        Returns:
            Dict[str, Any]: Result of the click operation
        """
        if not self.page or not self.elements_map or element_id not in self.elements_map:
            return {"error": f"Element {element_id} not found"}

        element_info = self.elements_map[element_id]
        rect = element_info["rect"]
        try:
            # Click in the center of the element
            x = rect["x"] + rect["width"] / 2
            y = rect["y"] + rect["height"] / 2
            await self.page.mouse.click(x, y)
            return {"status": "success", "element": element_id}
        except Exception as e:
            return {"error": str(e)}

    async def type_text(self, element_id: str, text: str) -> Dict[str, Any]:
        """Type text into an element.
        
        Args:
            element_id: Element ID to type into
            text: Text to type
            
        Returns:
            Dict[str, Any]: Result of the typing operation
        """
        if not self.page or not self.elements_map or element_id not in self.elements_map:
            return {"error": f"Element {element_id} not found"}

        element_info = self.elements_map[element_id]
        if element_info["tag"] not in ["input", "textarea"]:
            return {"error": f"Element {element_id} is not a text input"}

        try:
            rect = element_info["rect"]
            # Click in the center of the element
            x = rect["x"] + rect["width"] / 2
            y = rect["y"] + rect["height"] / 2
            await self.page.mouse.click(x, y)
            # Clear existing text
            await self.page.keyboard.press("Control+A")
            await self.page.keyboard.press("Backspace")
            # Type new text
            await self.page.keyboard.type(text)
            return {"status": "success", "element": element_id, "text": text}
        except Exception as e:
            return {"error": str(e)}

    async def scroll_page(self, direction: str = "down", amount: int = 300) -> Dict[str, Any]:
        """Scroll the page.
        
        Args:
            direction: Direction to scroll ("up", "down", "left", "right")
            amount: Amount to scroll in pixels
            
        Returns:
            Dict[str, Any]: Result of the scroll operation
        """
        if not self.page:
            return {"error": "Browser not initialized"}

        try:
            if direction == "up":
                await self.page.evaluate(f"window.scrollBy(0, -{amount})")
            elif direction == "down":
                await self.page.evaluate(f"window.scrollBy(0, {amount})")
            elif direction == "left":
                await self.page.evaluate(f"window.scrollBy(-{amount}, 0)")
            elif direction == "right":
                await self.page.evaluate(f"window.scrollBy({amount}, 0)")
            else:
                return {"error": f"Invalid scroll direction: {direction}"}

            return {"status": "success", "direction": direction, "amount": amount}
        except Exception as e:
            return {"error": str(e)}

    async def press_key(self, key: str) -> Dict[str, Any]:
        """Press a keyboard key.
        
        Args:
            key: Key to press
            
        Returns:
            Dict[str, Any]: Result of the key press operation
        """
        if not self.page:
            return {"error": "Browser not initialized"}

        try:
            await self.page.keyboard.press(key)
            return {"status": "success", "key": key}
        except Exception as e:
            return {"error": str(e)}

    async def close_browser(self) -> Dict[str, Any]:
        """Close the browser.
        
        Returns:
            Dict[str, Any]: Result of the browser close operation
        """
        if self.browser:
            await self.browser.close()
            self.browser = None
            self.context = None
            self.page = None
            self.elements_map = {}
            return {"status": "closed"}
        return {"status": "already closed"}


# Create browser tools instance
browser_tools = BrowserTools()


@tool
async def initialize_browser(headless: bool = True) -> str:
    """Initialize the browser for web navigation.

    Args:
        headless: Whether to run the browser in headless mode

    Returns:
        str: Result of browser initialization
    """
    result = await browser_tools.initialize_browser(headless)
    return json.dumps(result)


@tool
async def navigate_to_url(url: str) -> str:
    """Navigate to a specific URL.

    Args:
        url: URL to navigate to

    Returns:
        str: Result of navigation
    """
    result = await browser_tools.navigate_to_url(url)
    return json.dumps(result)


@tool
async def take_screenshot() -> str:
    """Take a screenshot of the current page.

    Returns:
        str: Base64 encoded screenshot
    """
    return await browser_tools.take_screenshot()


@tool
async def get_page_content() -> str:
    """Get the HTML content of the current page.

    Returns:
        str: HTML content
    """
    return await browser_tools.get_page_content()


@tool
async def get_and_annotate_page_elements() -> str:
    """Get interactive elements on the page and create an annotated screenshot.

    Returns:
        str: JSON string with elements and annotated screenshot
    """
    elements = await browser_tools.get_page_elements()
    screenshot = await browser_tools.take_screenshot()
    annotated_screenshot = await browser_tools.annotate_screenshot(screenshot)
    
    return json.dumps({
        "elements": elements,
        "screenshot": screenshot,
        "annotated_screenshot": annotated_screenshot
    })


@tool
async def click_element(element_id: str) -> str:
    """Click an element by its ID.

    Args:
        element_id: Element ID to click

    Returns:
        str: Result of the click operation
    """
    result = await browser_tools.click_element(element_id)
    return json.dumps(result)


@tool
async def type_text(element_id: str, text: str) -> str:
    """Type text into an element.

    Args:
        element_id: Element ID to type into
        text: Text to type

    Returns:
        str: Result of the typing operation
    """
    result = await browser_tools.type_text(element_id, text)
    return json.dumps(result)


@tool
async def scroll_page(direction: str = "down", amount: int = 300) -> str:
    """Scroll the page.

    Args:
        direction: Direction to scroll ("up", "down", "left", "right")
        amount: Amount to scroll in pixels

    Returns:
        str: Result of the scroll operation
    """
    result = await browser_tools.scroll_page(direction, amount)
    return json.dumps(result)


@tool
async def press_key(key: str) -> str:
    """Press a keyboard key.

    Args:
        key: Key to press (e.g., "Enter", "Escape", "ArrowDown")

    Returns:
        str: Result of the key press operation
    """
    result = await browser_tools.press_key(key)
    return json.dumps(result)


@tool
async def close_browser() -> str:
    """Close the browser.

    Returns:
        str: Result of the browser close operation
    """
    result = await browser_tools.close_browser()
    return json.dumps(result) 