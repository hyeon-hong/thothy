"""Define the configurable parameters for the blog bot."""

import os
import copy as copy_module
from dataclasses import dataclass, fields, asdict
from typing import Any, Optional, Iterator, Tuple

from langchain_core.runnables import RunnableConfig


@dataclass(kw_only=True)
class BlogConfigurable:
    """The configurable fields for the blog bot."""

    project_id: str = "default"
    team_id: str = "default"
    staff_id: str = "default"
    agent_id_list: str = "default"
    user_id: str = "default"
    graph_name: str = "blog_graph"

    model: str = "openai:gpt-4o-mini"
    delay_seconds: int = 1

    def copy(self) -> "BlogConfigurable":
        """Create a copy of this configurable."""
        return copy_module.deepcopy(self)

    def __copy__(self):
        """Support for copy.copy()."""
        return self.__class__(**asdict(self))

    def __deepcopy__(self, memo):
        """Support for copy.deepcopy()."""
        return self.__class__(**copy_module.deepcopy(asdict(self), memo))

    def items(self) -> Iterator[Tuple[str, Any]]:
        """Support dictionary-like access with items() method."""
        return asdict(self).items()

    def get(self, key: str, default: Any = None) -> Any:
        """Support dictionary-like access with get() method."""
        return asdict(self).get(key, default)

    def __getitem__(self, key: str) -> Any:
        """Support dictionary-like access with [] operator."""
        return asdict(self)[key]

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "BlogConfigurable":
        """Load configuration."""
        configurable = (
            config["configurable"] if config and "configurable" in config
            else {}
        )

        # config["configurable"] should has user_id, project_id, team_id,
        # and agent_id_list and it will be populated from the namespace
        # If each field is not provided, set each field as "default".
        if "project_id" not in configurable:
            configurable["project_id"] = "default"
        if "team_id" not in configurable:
            configurable["team_id"] = "default"
        if "staff_id" not in configurable:
            configurable["staff_id"] = "default"
        if "agent_id_list" not in configurable:
            configurable["agent_id_list"] = "default"
        if "user_id" not in configurable:
            configurable["user_id"] = "default"

        values: dict[str, Any] = {
            f.name: os.environ.get(f.name.upper(), configurable.get(f.name))
            for f in fields(cls)
            if f.init
        }

        return cls(**{k: v for k, v in values.items() if v})
