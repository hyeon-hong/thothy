from typing import Tuple
from langchain.tools import tool


@tool(response_format="content_and_artifact")
def analyze_ui(widget_name: str, description: str, score: int, analysis: str) -> Tuple[str, dict]:
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

    content = f"Successfully generated a score and analysis of the UI."
    return content, {
        "title": widget_name,
        "description": description,
        "score": score,
        "analysis": analysis
    }


__all__ = ["analyze_ui"]
