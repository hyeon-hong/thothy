from typing import Tuple
from langchain.tools import tool


@tool(response_format="content_and_artifact")
def generate_shadcn_widget(widget_name: str, description: str, artifact: str) -> Tuple[str, dict]:
    """
    Generate React code for a shadcn UI widget in JavaScript.

    Args:
        widget_name: The name of the widget/component (e.g., 'Button', 'Card')
        description: A description of the widget's purpose and features
        artifact: A string of JavaScript (React) code using shadcn UI components

    Returns:
        True if the widget was generated successfully, False otherwise
    """

    content = f"Successfully generated {widget_name} code."
    return content, {
        "widget_name": widget_name,
        "description": description,
        "code": artifact
    }


__all__ = ["generate_shadcn_widget"]
