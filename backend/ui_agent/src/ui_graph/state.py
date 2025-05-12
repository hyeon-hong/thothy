from typing import List, Union, Optional, Dict, Any
from dataclasses import dataclass
from langchain_core.messages import BaseMessage, BaseMessageLike
from langgraph.graph import Annotation
from langgraph.prebuilt.messages import MessagesAnnotation, messages_state_reducer

# Constants
OC_SUMMARIZED_MESSAGE_KEY = "oc_summarized_message"

# Types
Messages = Union[List[Union[BaseMessage, BaseMessageLike]], BaseMessage, BaseMessageLike]

@dataclass
class CodeHighlight:
    code: str
    language: str
    start_line: int
    end_line: int

@dataclass
class TextHighlight:
    text: str
    markdown_blocks: List[str]
    plain_text: str

@dataclass
class ArtifactV3:
    id: str
    content: str
    type: str
    metadata: Dict[str, Any]

@dataclass
class SearchResult:
    url: str
    title: str
    snippet: str

def is_summary_message(msg: Any) -> bool:
    if not isinstance(msg, dict):
        return False
    
    if "additional_kwargs" in msg:
        return msg.get("additional_kwargs", {}).get(OC_SUMMARIZED_MESSAGE_KEY, False)
    
    if "kwargs" in msg:
        return msg.get("kwargs", {}).get("additional_kwargs", {}).get(OC_SUMMARIZED_MESSAGE_KEY, False)
    
    return False

def messages_reducer(state: List[BaseMessage], update: Messages) -> List[BaseMessage]:
    latest_msg = update[-1] if isinstance(update, list) else update
    
    if is_summary_message(latest_msg):
        # The state list has been updated by a summary message. Clear the existing state messages.
        return messages_state_reducer([], update)
    
    return messages_state_reducer(state, update)

# Enums
class LanguageOptions:
    ENGLISH = "english"
    SPANISH = "spanish"
    # Add other languages as needed

class ProgrammingLanguageOptions:
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    # Add other languages as needed

class ReadingLevelOptions:
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class ArtifactLengthOptions:
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"

# Main state annotation
OpenCanvasGraphAnnotation = Annotation.Root({
    # The full list of messages in the conversation
    **MessagesAnnotation.spec,
    
    # The list of messages passed to the model. Can include summarized messages,
    # and others which are NOT shown to the user.
    "_messages": Annotation(
        reducer=messages_reducer,
        default=list,
        type=List[BaseMessage]
    ),
    
    # The part of the artifact the user highlighted
    "highlighted_code": Annotation(type=Optional[CodeHighlight]),
    
    # The highlighted text
    "highlighted_text": Annotation(type=Optional[TextHighlight]),
    
    # The artifacts that have been generated in the conversation
    "artifact": Annotation(type=ArtifactV3),
    
    # The next node to route to
    "next": Annotation(type=Optional[str]),
    
    # The language to translate the artifact to
    "language": Annotation(type=Optional[LanguageOptions]),
    
    # The length of the artifact to regenerate to
    "artifact_length": Annotation(type=Optional[ArtifactLengthOptions]),
    
    # Whether or not to regenerate with emojis
    "regenerate_with_emojis": Annotation(type=Optional[bool]),
    
    # The reading level to adjust the artifact to
    "reading_level": Annotation(type=Optional[ReadingLevelOptions]),
    
    # Whether or not to add comments to the code artifact
    "add_comments": Annotation(type=Optional[bool]),
    
    # Whether or not to add logs to the code artifact
    "add_logs": Annotation(type=Optional[bool]),
    
    # The programming language to port the code artifact to
    "port_language": Annotation(type=Optional[ProgrammingLanguageOptions]),
    
    # Whether or not to fix bugs in the code artifact
    "fix_bugs": Annotation(type=Optional[bool]),
    
    # The ID of the custom quick action to use
    "custom_quick_action_id": Annotation(type=Optional[str]),
    
    # Whether or not to search the web for additional context
    "web_search_enabled": Annotation(type=Optional[bool]),
    
    # The search results to include in context
    "web_search_results": Annotation(type=Optional[List[SearchResult]]),
})

# Type for graph return values
OpenCanvasGraphReturnType = Dict[str, Any]  # Partial state of OpenCanvasGraphAnnotation 