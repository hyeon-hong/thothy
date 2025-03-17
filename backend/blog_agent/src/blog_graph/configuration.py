"""Configuration for the blog agent."""

from pydantic import BaseModel


class BlogConfigurable(BaseModel):
    """Configuration for the blog agent."""
    user_id: str

    @classmethod
    def from_runnable_config(cls, config: dict) -> "BlogConfigurable":
        """Create a BlogConfigurable from a runnable config."""
        return cls(**config) 