"""Simple chat agent using LangGraph."""

import logging
import os
from typing import Optional, Annotated, Sequence, TypedDict, Tuple
import json
import base64

from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.graph.message import add_messages
from langgraph.graph.ui import AnyUIMessage, ui_message_reducer, push_ui_message
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from ui_build_graph.prompts import get_coding_prompt
from ui_build_graph.tools import take_screenshot, analyze_ui


# Configure logging to hide INFO messages
logging.basicConfig(level=logging.INFO)

# Initialize global LLM
VLLM_API_URL = os.getenv("VLLM_API_URL")
llm: Optional[ChatOpenAI] = None

UI_COMPONENT_NAME = "ui_build_graph"


class AgentState(TypedDict):  # noqa: D101
    messages: Annotated[Sequence[BaseMessage], add_messages]
    ui: Annotated[Sequence[AnyUIMessage], ui_message_reducer]


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


screenshot_tool_node = ToolNode([take_screenshot])
analyze_ui_tool_node = ToolNode([analyze_ui])

model = get_llm()
model_with_tools = model.bind_tools([take_screenshot],
                                    tool_choice="take_screenshot",
                                    strict=True)

model_with_analysis_tools = model.bind_tools([analyze_ui],
                                             tool_choice="analyze_ui",
                                             strict=True)


def should_continue(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    if last_message.tool_calls:
        return "tools"
    return END


def call_model(state: AgentState):
    messages = [{"role": "system", "content": get_coding_prompt()}] + \
        state["messages"]
    response = model_with_tools.invoke(messages)

    artifact = extract_artifact_from_response(response)

    class Code(TypedDict):
        code: str
    code: Code = {
        "code": artifact
    }

    push_ui_message(UI_COMPONENT_NAME, code, message=response)

    return {
        "messages": [response],
    }


def call_model_with_analysis(state: AgentState):
    messages = [{"role": "system", "content": get_coding_prompt()}] + \
        state["messages"]

    # Check if we have a screenshot to include in the analysis
    web_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
    dist_dir = os.path.join(web_dir, "dist")
    screenshot_path = os.path.join(dist_dir, "screenshot.png")

    # If the screenshot exists, add it to the messages as an image
    if os.path.exists(screenshot_path):
        with open(screenshot_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode('utf-8')

        # Get calendar image path (assuming it's in the same directory as screenshot)
        calendar_path = os.path.join(dist_dir, "calendar.png")
        if os.path.exists(calendar_path):
            with open(calendar_path, "rb") as calendar_file:
                base64_calendar = base64.b64encode(
                    calendar_file.read()).decode('utf-8')
        else:
            base64_calendar = None

            # Create a message with the image
            image_message_content = [
                {
                    "type": "text",
                    "text": "Here is the screenshot of the UI component and a calendar image. Please describe the difference between the two images, if any. If there is a small difference, please say no difference."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{base64_image}"
                    }
                }
            ]

            # Add calendar image if available
            if base64_calendar:
                image_message_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{base64_calendar}"
                    }
                })

            # Add the image message to the conversation
            image_message = HumanMessage(content=image_message_content)
            messages.append(image_message)

    response = model_with_analysis_tools.invoke(messages)

    score, analysis = extract_score_and_analysis_from_response(response)

    class Score(TypedDict):
        score: int
        analysis: str

    score: Score = {
        "score": score,
        "analysis": analysis
    }

    push_ui_message(UI_COMPONENT_NAME, score, message=response)

    return {
        "messages": [response],
    }


def extract_score_and_analysis_from_response(response: AIMessage) -> Optional[Tuple[int, str]]:
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
                print(f"Error parsing tool call arguments: {e}")
    return None


def extract_artifact_from_response(response: AIMessage) -> Optional[str]:
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
                print(f"Error parsing tool call arguments: {e}")
    return None


"""Build and return the chat graph."""

# Initialize graph builder with new state schema
workflow = StateGraph(AgentState)

# Add chatbot node
workflow.add_node("call_model", call_model)
workflow.add_node("call_model_with_analysis", call_model_with_analysis)
workflow.add_node("screenshot_tool", screenshot_tool_node)
workflow.add_node("analyze_ui_tool", analyze_ui_tool_node)

# Add edges - start at chatbot and can end after chatbot
workflow.add_edge(START, "call_model")
workflow.add_edge("call_model", "screenshot_tool")
workflow.add_edge("screenshot_tool", "call_model_with_analysis")
workflow.add_edge("call_model_with_analysis", "analyze_ui_tool")
workflow.add_edge("analyze_ui_tool", END)

# Compile graph
graph = workflow.compile()
graph.name = UI_COMPONENT_NAME

__all__ = ["graph"]
