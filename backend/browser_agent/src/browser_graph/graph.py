from langgraph.graph import END, START, StateGraph
from langchain_core.runnables import RunnableLambda
import re
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
from browser_graph.prompts import WEB_VOYAGER_PROMPT
from browser_graph.states import AgentState
from browser_graph.tools import mark_page
from browser_graph.tools import click
from browser_graph.tools import type_text  # noqa: E501
from browser_graph.tools import scroll
from browser_graph.tools import wait
from browser_graph.tools import go_back
from browser_graph.tools import go_search_website
from browser_graph.tools import crawl_website


async def annotate(state):
    marked_page = await mark_page.with_retry().ainvoke(state["page"])
    return {**state, **marked_page}


def format_descriptions(state):
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


# Create system message component
system_message = SystemMessagePromptTemplate(
    prompt=PromptTemplate(
        template=WEB_VOYAGER_PROMPT,
        input_variables=[]
    )
)

# Create scratchpad placeholder
scratchpad_placeholder = MessagesPlaceholder(
    variable_name='scratchpad',
    optional=True
)

# Create human message component with image and text
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
prompt = ChatPromptTemplate(
    messages=[system_message, scratchpad_placeholder, human_message],
    input_variables=['bbox_descriptions', 'img', 'input'],
    optional_variables=['scratchpad'],
    partial_variables={'scratchpad': []}
)

llm = ChatOpenAI(model="gpt-4o", max_tokens=4096)
agent = annotate | RunnablePassthrough.assign(
    prediction=format_descriptions
    | prompt  # Using the ChatPromptTemplate directly
    | llm
    | StrOutputParser()
    | parse
)


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
    if "ANSWER" in action:
        return END
    if action == "retry":
        return "agent"

    return action


def final_answer(state):
    if "prediction" in state and "args" in state["prediction"]:
        args = state["prediction"]["args"]
        final_text = args[0] if args else ""
        return {**state, "final_answer": final_text}
    return state


graph_builder = StateGraph(AgentState)

# Define tools
tools = {
    "Click": click,
    "Type": type_text,
    "Scroll": scroll,
    "Wait": wait,
    "GoBack": go_back,
    "Search": go_search_website,
    "Crawl": crawl_website,
}

# Add nodes
graph_builder.add_node("agent", agent)
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
# START -> agent
# agent -> select_tool
# select_tool -> various tools/ANSWER/END
# tools -> update_scratchpad
# update_scratchpad -> agent
# ANSWER -> END
graph_builder.add_edge(START, "agent")
graph_builder.add_conditional_edges("agent", select_tool)

# Add tool-related edges
for tool_name in tools:
    graph_builder.add_edge(tool_name, "update_scratchpad")

graph_builder.add_edge("update_scratchpad", "agent")
graph_builder.add_edge("ANSWER", END)

# Compile the graph
graph = graph_builder.compile()

# Export the graph
__all__ = ["graph"]
