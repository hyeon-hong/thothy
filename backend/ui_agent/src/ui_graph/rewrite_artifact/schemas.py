"""Schemas for the rewrite artifact functionality."""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

from opencanvas.shared.constants import PROGRAMMING_LANGUAGES


class ArtifactType(str, Enum):
    TEXT = "text"
    CODE = "code"


class OptionallyUpdateArtifactMeta(BaseModel):
    """Update the artifact meta information, if necessary."""
    type: ArtifactType = Field(description="The type of the artifact content.")
    title: Optional[str] = Field(
        None,
        description="The new title to give the artifact. ONLY update this if the user is making a request which changes the subject/topic of the artifact."
    )
    language: str = Field(
        description="The language of the code artifact. This should be populated with the programming language if the user is requesting code to be written, or 'other', in all other cases."
    )

    class Config:
        use_enum_values = True
        validate_assignment = True

    @classmethod
    def get_programming_languages(cls) -> list[str]:
        """Get list of valid programming languages."""
        return [lang["language"] for lang in PROGRAMMING_LANGUAGES] 