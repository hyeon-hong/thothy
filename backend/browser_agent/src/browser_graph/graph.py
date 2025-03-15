from langgraph.graph import END, START, StateGraph
from langchain_core.runnables import RunnableLambda
import re
import base64
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from langchain_core.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
    PromptTemplate,
)
from langchain_core.prompts.image import ImagePromptTemplate
from browser_graph.prompts import SYSTEM_PROMPT, SYSTEM_PROMPT_TEXT_ONLY
from browser_graph.states import AgentState
from browser_graph.tools import click
from browser_graph.tools import type_text  # noqa: E501
from browser_graph.tools import scroll
from browser_graph.tools import wait
from browser_graph.tools import go_back
from browser_graph.tools import go_search_website
from browser_graph.tools import crawl_website
from browser_graph.utils import (
    extract_information,
    get_webarena_accessibility_tree,
    get_web_element_rect
)


async def annotate(state):
    """Annotate the page with visual markers or get accessibility tree"""
    # Check if we're in text-only mode
    text_only = state.get("text_only", False)

    if text_only:
        # Use accessibility tree for text-only mode
        accessibility_tree, obs_info = await get_webarena_accessibility_tree(
            state["page"]
        )
        return {
            **state,
            "accessibility_tree": accessibility_tree,
            "accessibility_info": obs_info,
            # For consistency with visual mode
            "bboxes": obs_info
        }
    else:
        # Use visual annotation for standard mode
        # Take a screenshot of the page
        screenshot = await state["page"].screenshot()
        img_base64 = base64.b64encode(screenshot).decode()
        
        # Use get_web_element_rect to mark elements on the page
        rects, web_elements, web_elements_text = get_web_element_rect(
            state["page"], fix_color=True
        )
        
        # Return the updated state
        return {
            **state,
            "img": img_base64,
            "bboxes": web_elements,
            "web_elements_text": web_elements_text
        }


def format_descriptions(state):
    """Format element descriptions for the model prompt"""
    # Handle text-only mode with accessibility tree
    if state.get("text_only", False) and "accessibility_tree" in state:
        return {
            **state,
            "bbox_descriptions": state["accessibility_tree"]
        }

    # Handle visual mode with bounding boxes
    # Use web_elements_text if available (when using get_web_element_rect)
    if "web_elements_text" in state:
        return {
            **state,
            "bbox_descriptions": state["web_elements_text"]
        }
    
    # Fallback to the original processing for compatibility
    labels = []
    for i, bbox in enumerate(state["bboxes"]):
        text = bbox.get("ariaLabel") or ""
        if not text.strip():
            text = bbox["text"]
        el_type = bbox.get("type")
        labels.append(f'{i} (<{el_type}/>): "{text}"')
    bbox_descriptions = "\nValid Bounding Boxes:\n" + "\n".join(labels)

    return {**state, "bbox_descriptions": bbox_descriptions}


def parse(text: str) -> dict:
    action_prefix = "Action: "

    # Check if the last line is an action
    lines = text.strip().split("\n")
    last_line = lines[-1] if lines else ""

    # Try to find an explicit action in the last few lines
    if last_line.startswith(action_prefix):
        action_block = last_line
    else:
        # If no action format is found, but there's meaningful content,
        # interpret it as an answer
        return {"action": "ANSWER", "args": [text.strip()]}

    action_str = action_block[len(action_prefix):]

    # Use the extract_information function from utils.py
    action_key, info = extract_information(action_str)

    # Handle case where extraction fails
    if action_key is None:
        # Default case for unrecognized actions
        split_output = action_str.split(" ", 1)
        if len(split_output) == 1:
            action, action_input = split_output[0], None
        else:
            action, action_input = split_output
        action = action.strip()
        if action_input is not None:
            action_input = [
                inp.strip().strip("[]")
                for inp in action_input.strip().split(";")
            ]
        return {"action": action, "args": action_input}

    # For click, wait, goback, google actions - info is a tuple
    if action_key in ["click", "wait", "goback", "google"]:
        # For these actions, info is a tuple of groups from regex match
        if action_key == "google":
            action_key = "Search"  # Map to Search tool
        return {"action": action_key.capitalize(), "args": info}
    else:
        # For type, scroll, answer actions - info is a dict
        return {"action": action_key.capitalize(), "args": info}


# Create a function to generate the appropriate prompt based on mode
def create_prompt(text_only=False):
    """Create the appropriate prompt template based on mode"""
    # Select the appropriate system prompt
    system_template = SYSTEM_PROMPT_TEXT_ONLY if text_only else SYSTEM_PROMPT

    # Create system message component
    system_message = SystemMessagePromptTemplate(
        prompt=PromptTemplate(
            template=system_template,
            input_variables=[]
        )
    )

    # Create scratchpad placeholder
    scratchpad_placeholder = MessagesPlaceholder(
        variable_name='scratchpad',
        optional=True
    )

    # For text-only mode, we only need a text prompt
    if text_only:
        human_message = HumanMessagePromptTemplate(
            prompt=PromptTemplate(
                input_variables=['bbox_descriptions', 'input'],
                template="{bbox_descriptions}\n\n{input}"
            )
        )
    else:
        # For visual mode, we need an image and text
        human_message = HumanMessagePromptTemplate(
            prompt=[
                ImagePromptTemplate(
                    input_variables=['img'],
                    template={'url': 'data:image/png;base64, {img}'}
                ),
                PromptTemplate(
                    input_variables=['bbox_descriptions'],
                    template='{bbox_descriptions}'
                ),
                PromptTemplate(
                    input_variables=['input'],
                    template='{input}'
                )
            ]
        )

    # Create the ChatPromptTemplate with all required parameters
    if text_only:
        return ChatPromptTemplate(
            messages=[system_message, scratchpad_placeholder, human_message],
            input_variables=['bbox_descriptions', 'input'],
            optional_variables=['scratchpad'],
            partial_variables={'scratchpad': []}
        )
    else:
        return ChatPromptTemplate(
            messages=[system_message, scratchpad_placeholder, human_message],
            input_variables=['bbox_descriptions', 'img', 'input'],
            optional_variables=['scratchpad'],
            partial_variables={'scratchpad': []}
        )


def create_agent(text_only=False):
    """Create the appropriate agent chain based on mode"""
    # Create the appropriate prompt
    prompt = create_prompt(text_only)

    # Create the language model
    llm = ChatOpenAI(model="gpt-4o", max_tokens=4096)

    # Create and return the agent chain
    return (
        RunnableLambda(lambda state: {**state, "text_only": text_only})
        | annotate
        | RunnablePassthrough.assign(
            prediction=format_descriptions
            | prompt
            | llm
            | StrOutputParser()
            | parse
        )
    )


# Create agents for both modes (default to visual mode)
agent = create_agent(text_only=False)
agent_text_only = create_agent(text_only=True)

# We'll use the visual agent as the default
default_agent = agent


def update_scratchpad(state: AgentState):
    """After a tool is invoked, we want to update
    the scratchpad so the agent is aware of its previous steps"""

    old = state.get("scratchpad")
    if old:
        txt = old[0].content
        last_line = txt.rsplit("\n", 1)[-1]
        step = int(re.match(r"\d+", last_line).group()) + 1
    else:
        txt = "Previous action observations:\n"
        step = 1
    txt += f"\n{step}. {state['observation']}"

    return {**state, "scratchpad": [SystemMessage(content=txt)]}


def select_tool(state: AgentState):
    # Any time the agent completes, this function
    # is called to route the output to a tool or
    # to the end user.
    action = state["prediction"]["action"]

    # End the chain if an answer is provided
    if "ANSWER" in action:
        return END

    # Return to agent for retry
    if action == "retry":
        return "agent"

    # Map the remaining actions to the appropriate tools
    tool_map = {
        "Click": "Click",
        "Type": "Type",
        "Scroll": "Scroll",
        "Wait": "Wait",
        "GoBack": "GoBack",
        "Google": "Search",  # Map Google action to Search tool
        "Search": "Search",  # Direct mapping
        "Crawl": "Crawl"
    }

    # Return the tool name if it exists, otherwise default to the action
    return tool_map.get(action, action)


def final_answer(state):
    if "prediction" in state and "args" in state["prediction"]:
        args = state["prediction"]["args"]
        final_text = args[0] if args else ""
        return {**state, "final_answer": final_text}
    return state


def select_agent(state):
    """Select the appropriate agent based on text_only flag"""
    return "agent_text_only" if state.get("text_only", False) else "agent"


graph_builder = StateGraph(AgentState)

# Define tools
tools = {
    "Click": click,
    "Type": type_text,
    "Scroll": scroll,
    "Wait": wait,
    "GoBack": go_back,
    "Search": go_search_website,  # This corresponds to "Google" in run.py
    "Crawl": crawl_website,
}

# Add nodes for both agent types
graph_builder.add_node("agent", agent)
graph_builder.add_node("agent_text_only", agent_text_only)
graph_builder.add_node("update_scratchpad", update_scratchpad)
graph_builder.add_node("ANSWER", final_answer)

# Add tool nodes
for node_name, tool in tools.items():
    graph_builder.add_node(
        node_name,
        # The lambda ensures the function's string output
        # is mapped to the "observation"
        # key in the AgentState
        RunnableLambda(tool) | (lambda observation: {
            "observation": observation}),
    )

# Add edges
# First decide which agent to use based on text_only flag
graph_builder.add_conditional_edges(
    START,
    lambda state: (
        "agent_text_only" if state.get("text_only", False) else "agent"
    )
)

# From each agent, route to tools based on prediction
graph_builder.add_conditional_edges("agent", select_tool)
graph_builder.add_conditional_edges("agent_text_only", select_tool)

# Add tool-related edges
for tool_name in tools:
    graph_builder.add_edge(tool_name, "update_scratchpad")

# After updating scratchpad, route back to the original agent
graph_builder.add_conditional_edges(
    "update_scratchpad",
    lambda state: (
        "agent_text_only" if state.get("text_only", False) else "agent"
    )
)
graph_builder.add_edge("ANSWER", END)

# Compile the graph
graph = graph_builder.compile()

# Export the graph
__all__ = ["graph"]
