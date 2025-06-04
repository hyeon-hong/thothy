from typing import Annotated, List, TypedDict, Literal, Sequence
import operator  # Add this import
from pydantic import BaseModel, Field
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from langgraph.graph.ui import AnyUIMessage, ui_message_reducer


class Section(BaseModel):
    name: str = Field(
        description="Name for this section of the report.",
    )
    description: str = Field(
        description="Brief overview of the main topics and concepts to be covered in this section.",
    )
    research: bool = Field(
        description="Whether to perform web research for this section of the report."
    )
    content: str = Field(
        description="The content of the section."
    )


class Sections(BaseModel):
    sections: List[Section] = Field(
        description="Sections of the report.",
    )


class SearchQuery(BaseModel):
    search_query: str = Field(None, description="Query for web search.")


class Queries(BaseModel):
    queries: List[SearchQuery] = Field(
        description="List of search queries.",
    )


class Feedback(BaseModel):
    grade: Literal["pass", "fail"] = Field(
        description="Evaluation result indicating whether the response meets requirements ('pass') or needs revision ('fail')."
    )
    follow_up_queries: List[SearchQuery] = Field(
        description="List of follow-up search queries.",
    )


class ReportStateInput(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]  # Messages from frontend


class ReportStateOutput(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    ui: Annotated[Sequence[AnyUIMessage], ui_message_reducer]
    final_report: str  # Final report


def _keep_last_topic(left: str, right: str) -> str:
    """Reducer function to keep the last topic value - they should all be the same anyway."""
    return right if right else left


class ReportState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    ui: Annotated[Sequence[AnyUIMessage], ui_message_reducer]
    topic: Annotated[str, _keep_last_topic]  # Report topic - use reducer for concurrent updates
    feedback_on_report_plan: str  # Feedback on the report plan
    sections: list[Section]  # List of report sections
    # Use Annotated type with add reducer
    completed_sections: Annotated[list[Section], operator.add]
    # String of any completed sections from research to write final sections
    report_sections_from_research: str
    final_report: str  # Final report


class SectionState(TypedDict):
    topic: Annotated[str, _keep_last_topic]  # Report topic - use reducer for concurrent updates
    section: Section  # Report section
    search_iterations: int  # Number of search iterations done
    search_queries: list[SearchQuery]  # List of search queries
    source_str: str  # String of formatted source content from web search
    # String of any completed sections from research to write final sections
    report_sections_from_research: str
    # Use Annotated type with add reducer
    completed_sections: Annotated[list[Section], operator.add]


class SectionOutputState(TypedDict):
    completed_sections: Annotated[list[Section],
                                  operator.add]  # Use Annotated type here too
