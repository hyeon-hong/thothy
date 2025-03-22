"""Define the configurable parameters for the staff bot."""

import os
from dataclasses import dataclass, fields
from typing import Any, Optional

from langchain_core.runnables import RunnableConfig

from staff_graph.prompts import SYSTEM_PROMPT


@dataclass(kw_only=True)
class StaffConfigurable:
    """The configurable fields for the staff assistant."""

    user_id: str = "default"
    model: str = "anthropic/claude-3-5-sonnet-20240620"
    delay_seconds: int = 1
    system_prompt: str = SYSTEM_PROMPT
    agent_id: str = "default"  # Default to staff agent

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "StaffConfigurable":
        """Load configuration."""
        configurable = (
            config["configurable"] if config and "configurable" in config
            else {}
        )

        # config["configurable"] should has user_id, project_id, team_id,
        # staff_id, agent_id and it will be populated from the namespace
        # If each field is not provided, set each field as "default".
        if "project_id" not in configurable:
            configurable["project_id"] = "default"
        if "team_id" not in configurable:
            configurable["team_id"] = "default"
        if "staff_id" not in configurable:
            configurable["staff_id"] = "default"
        if "agent_id" not in configurable:
            configurable["agent_id"] = "staff"
        if "user_id" not in configurable:
            configurable["user_id"] = "default"

        values: dict[str, Any] = {
            f.name: os.environ.get(f.name.upper(), configurable.get(f.name))
            for f in fields(cls)
            if f.init
        }

        return cls(**{k: v for k, v in values.items() if v})
