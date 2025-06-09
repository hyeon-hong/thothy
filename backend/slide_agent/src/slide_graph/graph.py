"""Simple slide agent using LangGraph."""

import uuid
from typing import Optional, List, TypedDict

from langchain.chat_models import init_chat_model
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END
from langgraph.store.base import BaseStore

from slide_graph.configuration import SlideConfigurable
from slide_graph.api.routers.presentation.handlers.generate_presentation_requirements import (
    GeneratePresentationRequirementsHandler,
)
from slide_graph.api.routers.presentation.handlers.generate_titles import (
    PresentationTitlesGenerateHandler,
)
from slide_graph.api.routers.presentation.models import (
    GeneratePresentationRequirementsRequest,
    GenerateTitleRequest,
)
from slide_graph.api.sql_models import PresentationSqlModel
from slide_graph.api.services.logging import LoggingService
from slide_graph.api.models import LogMetadata


class PresentationState(TypedDict):
    """State for the presentation workflow."""
    # Input parameters
    prompt: Optional[str]
    n_slides: int
    language: str
    documents: Optional[List[str]]
    research_reports: Optional[List[str]]
    images: Optional[List[str]]

    # Intermediate and output data
    presentation_id: Optional[str]
    presentation: Optional[PresentationSqlModel]
    error: Optional[str]


llm: Optional[ChatGoogleGenerativeAI] = None


def get_llm() -> ChatGoogleGenerativeAI:
    """Get or initialize the LLM asynchronously."""
    global llm
    if llm is None:
        llm = init_chat_model(
            model="gemini-2.5-flash-preview-05-20", model_provider="google_genai")
    return llm


async def create_presentation_node(
    state: PresentationState,
    config: SlideConfigurable,
    *,
    store: BaseStore
) -> dict:
    """Node that creates a presentation using the GeneratePresentationRequirementsHandler."""

    try:
        # Generate a unique presentation ID
        presentation_id = str(uuid.uuid4())

        # Create the request object
        request_data = GeneratePresentationRequirementsRequest(
            prompt=state.get("prompt"),
            n_slides=state["n_slides"],
            language=state["language"],
            documents=state.get("documents"),
            research_reports=state.get("research_reports"),
            images=state.get("images")
        )

        # Create handler and call it
        handler = GeneratePresentationRequirementsHandler(
            presentation_id, request_data)

        # Create mock logging service and metadata for the handler
        # Note: In a real implementation, you'd want to properly initialize these
        logging_service = LoggingService()
        log_metadata = LogMetadata(
            presentation_id=presentation_id,
            endpoint="/ppt/create"
        )

        # Call the handler
        presentation = await handler.post(logging_service, log_metadata)

        return {
            "presentation_id": presentation_id,
            "presentation": presentation,
            "error": None
        }

    except Exception as e:
        return {
            "error": f"Failed to create presentation: {str(e)}"
        }


async def generate_titles_node(
    state: PresentationState,
    config: SlideConfigurable,
    *,
    store: BaseStore
) -> dict:
    """Node that generates titles for the presentation using PresentationTitlesGenerateHandler."""

    try:
        # Check if we have a presentation ID from the previous step
        if not state.get("presentation_id"):
            return {"error": "No presentation ID available from previous step"}

        # Create the request object
        request_data = GenerateTitleRequest(
            presentation_id=state["presentation_id"]
        )

        # Create handler and call it
        handler = PresentationTitlesGenerateHandler(request_data)

        # Create mock logging service and metadata for the handler
        logging_service = LoggingService()
        log_metadata = LogMetadata(
            presentation_id=state["presentation_id"],
            endpoint="/ppt/titles/generate"
        )

        # Call the handler
        presentation = await handler.post(logging_service, log_metadata)

        return {
            "presentation": presentation,
            "error": None
        }

    except Exception as e:
        return {
            "error": f"Failed to generate titles: {str(e)}"
        }


"""Build and return the slide graph."""

# Initialize graph builder with state schema
workflow = StateGraph(PresentationState, SlideConfigurable)

# Add nodes
workflow.add_node("create_presentation", create_presentation_node)
workflow.add_node("generate_titles", generate_titles_node)

# Add edges - create presentation first, then generate titles
workflow.add_edge(START, "create_presentation")
workflow.add_edge("create_presentation", "generate_titles")
workflow.add_edge("generate_titles", END)

# Compile graph
graph = workflow.compile()
graph.name = "slide_graph"
