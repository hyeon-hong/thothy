"""UI build agent"""

import logging
import os
import json
import base64
from typing import Optional, Annotated, Sequence, TypedDict, Tuple, Literal

from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langgraph.graph.message import add_messages
from langgraph.graph.ui import AnyUIMessage, ui_message_reducer, push_ui_message
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode

from slide_build_graph.prompts import get_coding_prompt
from slide_build_graph.tools import take_screenshot_tool, analyze_ui_tool

# Set the name of the UI component
UI_COMPONENT_NAME = "slide_build_graph"

# Configure logging to hide INFO messages
logging.basicConfig(level=logging.INFO)

# Initialize global LLM
VLLM_API_URL = os.getenv("VLLM_API_URL")
llm: Optional[ChatOpenAI] = None


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    ui: Annotated[Sequence[AnyUIMessage], ui_message_reducer]
    score: int  # Default will be 0
    analysis: Optional[str]
    original_ui: Optional[str]
    new_ui: Optional[str]
    error: Optional[str]


def get_llm() -> ChatOpenAI:
    """Get or initialize the LLM with shadcn tools bound."""

    global llm
    if llm is None:
        # base_llm = ChatOpenAI(
        #     model="Qwen/Qwen2.5-1.5B-Instruct",
        #     base_url=VLLM_API_URL,
        #     temperature=0.5
        # )
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.5
        )
    return llm


screenshot_tool_node = ToolNode([take_screenshot_tool])
analyze_ui_tool_node = ToolNode([analyze_ui_tool])

model = get_llm()


def generate_code(state: AgentState):
    """Generate code for the UI component"""

    # Initialize score to 0 if not present
    if "score" not in state:
        state["score"] = 0

    # Get previous analysis if it exists
    previous_analysis = ""
    if state.get("analysis"):
        previous_analysis = f"\n\nPrevious analysis: {state.get('analysis')}"

    # Get the messages
    system_prompt = get_coding_prompt()
    if previous_analysis:
        system_prompt += previous_analysis

    messages = [{"role": "system", "content": system_prompt}] + \
        state["messages"]

    # Extract image data from user messages if present
    original_image = None
    for message in state["messages"]:
        if isinstance(message, HumanMessage) and isinstance(message.content, list):
            for content_item in message.content:
                if isinstance(content_item, dict) and content_item.get("type") == "image_url":
                    image_url = content_item.get(
                        "image_url", {}).get("url", "")
                    if image_url.startswith("data:image/"):
                        # Extract base64 image data
                        original_image = image_url.split(
                            "base64,")[1] if "base64," in image_url else None
                        break

    # Bind the take_screenshot tool to the model
    model_with_tools = model.bind_tools([take_screenshot_tool],
                                        tool_choice="take_screenshot_tool",
                                        strict=True)

    # Invoke the model with the take_screenshot tool
    response = model_with_tools.invoke(messages)

    # Extract the artifact
    artifact = extract_artifact(response)

    # Set the code
    class Code(TypedDict):
        code: str
    code: Code = {
        "code": artifact,
        "original_ui": original_image
    }

    # Push the artifact to the UI
    push_ui_message(UI_COMPONENT_NAME, code, message=response)

    # Return the messages and the user image if found
    return {
        "messages": [response],
        "original_ui": original_image
    }


def analyze_ui(state: AgentState):
    """Analyze the UI component"""

    # Initialize score to 0 if not present
    if "score" not in state:
        state["score"] = 0

    # Get the messages
    messages = [{"role": "system", "content": get_coding_prompt()}] + \
        state["messages"]

    # If the last message is "Error", go to generate_code node
    if state["messages"][-1].content == "Error":
        return "generate_code"

    # Check if we have a screenshot to include in the analysis
    web_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
    dist_dir = os.path.join(web_dir, "dist")
    screenshot_path = os.path.join(dist_dir, "screenshot.png")

    # Get previous analysis if it exists
    previous_analysis = ""
    if state.get("analysis"):
        previous_analysis = f"\n\nPrevious analysis: {state.get('analysis')}"

    # If the screenshot exists, add it to the messages as an image
    if os.path.exists(screenshot_path):
        with open(screenshot_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')

        # Get user image data for calendar comparison (if available)
        original_image = state.get("original_ui")

        # Create a message with the images
        image_message_content = [
            {
                "type": "text",
                "text": f"Here is the screenshot image of the UI component and a original image. Please describe the difference between the two images, if any. If you feel there is no difference, please set score to 10. And if you feel there is a difference, please set score from 0 to 9 as the difference is. More difference, lower score. More similar, higher score. {previous_analysis}"
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{base64_image}"
                }
            }
        ]

        # Add calendar image if available
        if original_image:
            image_message_content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{original_image}"
                }
            })

        # Add the image message to the conversation
        image_message = HumanMessage(content=image_message_content)
        messages.append(image_message)

    # Bind the analyze_ui tool to the model
    model_with_analysis_tools = model.bind_tools([analyze_ui_tool],
                                                 tool_choice="analyze_ui_tool",
                                                 strict=True)
    # Invoke the model with the analyze_ui tool
    response = model_with_analysis_tools.invoke(messages)

    # Extract the score and analysis
    score_result, analysis = extract_score_and_analysis(response)

    # Create result data for UI display
    score_data = {
        "score": score_result,
        "analysis": analysis,
        "original_ui": original_image,
        "new_ui": base64_image
    }

    # Push the score and analysis to the UI
    push_ui_message(UI_COMPONENT_NAME, score_data, message=response)

    # Return the messages and properly typed values for state
    return {
        "messages": [response],
        "score": score_result,   # This is now the integer value
        "analysis": analysis,
        "original_ui": original_image,
        "new_ui": base64_image
    }


def check_score(state: AgentState) -> Literal["__end__", "generate_code"]:
    """Check the score and determine if we should end or regenerate code."""
    # Get the score value, which might be a dict or int depending on how it was set
    score_value = state["score"]

    # Handle the case where score is a dictionary with a "score" key
    if isinstance(score_value, dict) and "score" in score_value:
        score_value = score_value["score"]

    # Now compare the integer value
    if score_value >= 8:
        return END
    else:
        return "generate_code"


def check_error(state: AgentState) -> Literal["generate_code", "analyze_ui"]:
    """Check if the last message is "Error", and if so, go to generate_code node."""
    last_message = state["messages"][-1]
    logging.info("last_message: %s", last_message)

    # Check for error in both AIMessage and ToolMessage types
    has_error = False

    if isinstance(last_message, AIMessage) and isinstance(last_message.content, str) and last_message.content.startswith("Error"):
        has_error = True
    elif isinstance(last_message, ToolMessage) and isinstance(last_message.content, str) and last_message.content.startswith("Error"):
        has_error = True

    if has_error:
        state["error"] = last_message.content
        logging.error("Error detected: %s", last_message.content)
        push_ui_message(UI_COMPONENT_NAME,
                        {"error": state["error"]},
                        message=last_message)
        return "generate_code"

    return "analyze_ui"


def extract_score_and_analysis(response: AIMessage) -> Optional[Tuple[int, str]]:
    # 1. Get tool_calls from additional_kwargs
    tool_calls = response.additional_kwargs.get("tool_calls", [])
    for tool_call in tool_calls:
        # 2. Get the function arguments (as a JSON string)
        function = tool_call.get("function", {})
        arguments = function.get("arguments")
        if arguments:
            try:
                # 3. Parse the arguments JSON string
                args_dict = json.loads(arguments)
                # 4. Extract the artifact
                score = args_dict.get("score")
                analysis = args_dict.get("analysis")
                if score and analysis:
                    return score, analysis
            except Exception as e:
                logging.error("Error parsing tool call arguments: %s", e)
    return None


def extract_artifact(response: AIMessage) -> Optional[str]:
    # 1. Get tool_calls from additional_kwargs
    tool_calls = response.additional_kwargs.get("tool_calls", [])
    for tool_call in tool_calls:
        # 2. Get the function arguments (as a JSON string)
        function = tool_call.get("function", {})
        arguments = function.get("arguments")
        if arguments:
            try:
                # 3. Parse the arguments JSON string
                args_dict = json.loads(arguments)
                # 4. Extract the artifact
                artifact = args_dict.get("artifact")
                if artifact:
                    return artifact
            except Exception as e:
                logging.error("Error parsing tool call arguments: %s", e)
    return None


"""Build and return the UI build graph."""

# Initialize graph builder with new state schema
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("generate_code", generate_code)
workflow.add_node("analyze_ui", analyze_ui)
workflow.add_node("screenshot_tool", screenshot_tool_node)
workflow.add_node("analyze_ui_tool", analyze_ui_tool_node)
workflow.add_node("check_score", check_score)
workflow.add_node("check_error", check_error)

# Add edges - start at generate_code
workflow.add_edge(START, "generate_code")
workflow.add_edge("generate_code", "screenshot_tool")
workflow.add_conditional_edges(
    "screenshot_tool",
    check_error,
    ["generate_code", "analyze_ui"]
)
workflow.add_edge("analyze_ui", "analyze_ui_tool")
workflow.add_conditional_edges(
    "analyze_ui_tool",
    check_score,
    ["generate_code", END]
)

# Compile graph
graph = workflow.compile()
graph.name = UI_COMPONENT_NAME

__all__ = ["graph"]
