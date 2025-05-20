from typing import Tuple
from langchain.tools import tool


@tool(response_format="content_and_artifact")
def take_screenshot(code: str) -> Tuple[str, dict]:
    """
    Take a screenshot of a code.

    Args:
        code: A string of JavaScript (React) code using shadcn UI components

    Returns:
        True if the screenshot was taken successfully, False otherwise
    """

    content = "Successfully took screenshot of the code."
    return content, {
        "title": "Screenshot",
        "description": "Screenshot",
        "code": code
    }


__all__ = ["take_screenshot"]
