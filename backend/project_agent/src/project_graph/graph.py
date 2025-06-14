"""Simple project agent using LangGraph."""

from typing import Literal
from langchain.chat_models import init_chat_model
from langchain_core.messages import AIMessage
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.store.base import BaseStore
from langgraph.types import Command, interrupt
from langgraph.prebuilt.interrupt import (
    ActionRequest,
    HumanInterrupt,
    HumanInterruptConfig,
    HumanResponse,
)

from project_graph.configuration import ProjectConfigurable
from blog_graph.graph import graph as blog_graph
from chat_graph.graph import graph as chat_graph
from news_graph.graph import graph as news_graph
from thothy.backend.libs.utils import (  # type: ignore
    initialize_store
)

# Initialize store with reconnection capability
store = initialize_store()
llm = init_chat_model("gpt-4o-mini", model_provider="openai", temperature=0.8)


async def start_node(
    state: MessagesState,
    config: ProjectConfigurable
) -> dict:
    """Start node that just returns the current state without any processing."""
    return state


async def project_assistant(
    state: MessagesState,
    config: ProjectConfigurable,
    *,
    store: BaseStore
) -> dict:
    """Project assistant node that processes messages and generates responses."""
    # Get configurable values
    configurable = ProjectConfigurable.from_runnable_config(config)
    graph_name = configurable.graph_name

    # Route to the appropriate agent based on graph_name
    if graph_name == "blog_graph":
        # Call blog agent
        result = await blog_graph.ainvoke(state, config)
    elif graph_name == "news_graph":
        # Call news agent
        result = await news_graph.ainvoke(state, config)
    elif graph_name == "chat_graph":
        # Call chat agent
        result = await chat_graph.ainvoke(state, config)
    else:
        raise ValueError(f"Invalid graph_name: {graph_name}")

    response = result["messages"][-1]

    # Wrap response with AIMessage type and return as list
    if not isinstance(response, AIMessage):
        response = AIMessage(content=str(response.content) if hasattr(
            response, 'content') else str(response))

    return {"messages": [response]}


async def project_feedback(state: MessagesState, config: ProjectConfigurable) -> Command[Literal["start_node"]]:
    """Get human feedback on the project response and handle user interaction."""

    # Get the latest message and response
    messages = state.get("messages", [])
    if not messages:
        return Command(goto="start_node")

    latest_response = messages[-1]
    user_message = messages[-2] if len(messages) > 1 else None

    # Get configurable values for context
    configurable = ProjectConfigurable.from_runnable_config(config)
    project_id = configurable.project_id
    graph_name = configurable.graph_name

    action_request = ActionRequest(
        action="Review Project Response",
        args={
            "project_id": project_id,
            "graph_name": graph_name,
            "user_request": user_message.content if user_message else "",
            "agent_response": latest_response.content if hasattr(latest_response, 'content') else str(latest_response),
        }
    )

    interrupt_config = HumanInterruptConfig(
        allow_ignore=True,
        allow_respond=True,
        allow_edit=False,
        allow_accept=True
    )

    description = f"""Project Agent ({graph_name}) has completed processing your request. 
    
You can:
- Accept the response as-is
- Provide additional feedback or follow-up questions
- Ignore to end the conversation

Project ID: {project_id}
Agent Type: {graph_name}"""

    request = HumanInterrupt(
        action_request=action_request,
        config=interrupt_config,
        description=description
    )

    human_response: HumanResponse = interrupt([request])[0]

    if human_response.get("type") == "accept":
        return Command(goto="start_node")
    elif human_response.get("type") == "response":
        # Add the human response as a new message and continue processing
        new_message = AIMessage(
            content=f"Follow-up: {human_response.get('args', '')}")
        return Command(
            update={"messages": [new_message]},
            goto="project_assistant"
        )
    elif human_response.get("type") == "ignore":
        return Command(goto="start_node")
    else:
        return Command(goto="start_node")


"""Build and return the project graph."""

# Initialize graph builder with state schema
workflow = StateGraph(MessagesState, ProjectConfigurable)

# Add nodes
workflow.add_node("start_node", start_node)
workflow.add_node("project_assistant", project_assistant)
workflow.add_node("project_feedback", project_feedback)

# Add edges - start at start_node, then project_assistant, then feedback, then back to start_node
workflow.add_edge(START, "start_node")
workflow.add_edge("start_node", "project_assistant")
workflow.add_edge("project_assistant", "project_feedback")
workflow.add_edge("project_feedback", "start_node")

# Compile graph
graph = workflow.compile(store=store)
graph.name = "project_graph"
