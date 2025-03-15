import os
from langsmith import Client
from langgraph.graph import END, START, StateGraph
from langchain_core.runnables import RunnableLambda
import re
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
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


# Pull the prompt template directly from the hub
# This returns a ChatPromptTemplate object
# prompt = hub.pull("wfh/web-voyager")
client = Client(api_key=os.getenv("LANGSMITH_API_KEY"))
prompt = client.pull_prompt("wfh/web-voyager", include_model=True)
# Breaking the long commented prompt template into multiple lines
# prompt = ChatPromptTemplate.from_template(
#     """
# Imagine you are a robot browsing the web, just like humans. Now you need 
# to complete a task. In each iteration, you will receive an Observation that
# includes a screenshot of a webpage and some texts. This screenshot will
# feature Numerical Labels placed in the TOP LEFT corner of each Web Element. Carefully analyze the visual
# information to identify the Numerical Label corresponding to the Web Element that requires interaction, then follow
# the guidelines and choose one of the following actions:

# 1. Click a Web Element.
# 2. Delete existing content in a textbox and then type content.
# 3. Scroll up or down.
# 4. Wait 
# 5. Go back
# 7. Return to google to start over.
# 8. Respond with the final answer

# Correspondingly, Action should STRICTLY follow the format:

# - Click [Numerical_Label] 
# - Type [Numerical_Label]; [Content] 
# - Scroll [Numerical_Label or WINDOW]; [up or down] 
# - Wait 
# - GoBack
# - Google
# - ANSWER; [content]

# Key Guidelines You MUST follow:

# * Action guidelines *
# 1) Execute only one action per iteration.
# 2) When clicking or typing, ensure to select the correct bounding box.
# 3) Numeric labels lie in the top-left corner of their corresponding bounding boxes and are colored the same.

# * Web Browsing Guidelines *
# 1) Don't interact with useless web elements like Login, Sign-in, donation that appear in Webpages
# 2) Select strategically to minimize time wasted.

# Your reply should strictly follow the format:

# Thought: {{Your brief thoughts (briefly summarize the info that will help ANSWER)}}
# Action: {{One Action format you choose}}
# Then the User will provide:
# Observation: {{A labeled screenshot Given by User}}
#     """
# )


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
    print("call select_tool()")
    print("state: ", state)
    # Any time the agent completes, this function
    # is called to route the output to a tool or
    # to the end user.
    action = state["prediction"]["action"]
    print("action: ", action)
    if action == "ANSWER":
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
