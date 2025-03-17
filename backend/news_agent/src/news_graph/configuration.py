"""Configuration for the news agent."""

from pydantic import BaseModel


class NewsConfigurable(BaseModel):
    """Configuration for the news agent."""
    user_id: str

    @classmethod
    def from_runnable_config(cls, config: dict) -> "NewsConfigurable":
        """Create a NewsConfigurable from a runnable config."""
        return cls(**config) 