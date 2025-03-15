from typing import List, Optional
from typing_extensions import TypedDict

from langchain_core.messages import BaseMessage
from playwright.async_api import Page


class BBox(TypedDict):
    x: float
    y: float
    text: str
    type: str
    ariaLabel: str


class Prediction(TypedDict):
    action: str
    args: Optional[List[str]]


# This represents the state of the agent
# as it proceeds through execution
class AgentState(TypedDict):
    page: Page  # The Playwright web page lets us interact with the web environment
    input: str  # User request
    img: str  # b64 encoded screenshot
    # The bounding boxes from the browser annotation function
    bboxes: List[BBox]
    prediction: Prediction  # The Agent's output
    # A system message (or messages) containing the intermediate steps
    scratchpad: List[BaseMessage]
    observation: str  # The most recent response from a tool
    task: str
    url: str


async def get_empty_state():
    """Create and return an empty initial state for the browser agent.

    This function initializes a browser page and returns the basic state structure
    needed to begin browser agent operations.

    Returns:
        AgentState: An initialized state with a browser page ready for interaction.
    """
    from playwright.async_api import async_playwright

    # Start Playwright and create a browser page
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=False)
    context = await browser.new_context(viewport={"width": 1280, "height": 800})
    page = await context.new_page()

    # Create an empty initial state
    return {
        "page": page,
        "input": "",
        "img": "",
        "bboxes": [],
        "prediction": {"action": "", "args": []},
        "scratchpad": [],
        "observation": "",
        "task": "",
        "url": ""
    }
