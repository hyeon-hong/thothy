"""Configuration settings for the browser agent."""

import os
from typing import Dict, Any, Optional

# Default configuration
DEFAULT_CONFIG: Dict[str, Any] = {
    # Model configuration
    "model": {
        "name": "gpt-4-vision-preview",
        "temperature": 0.2,
        "max_tokens": 4096,
    },
    
    # Browser configuration
    "browser": {
        "headless": True,
        "viewport_width": 1280,
        "viewport_height": 800,
        "timeout": 30000,  # ms
    },
    
    # Agent configuration
    "agent": {
        "max_iterations": 50,
        "reflection_interval": 5,  # Reflect every 5 actions
    },
    
    # Logging configuration
    "logging": {
        "enabled": True,
        "level": "INFO",
        "save_screenshots": True,
        "screenshot_dir": "screenshots",
    }
}


def get_config(override_config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Get the configuration with optional overrides.
    
    Args:
        override_config: Configuration to override defaults
        
    Returns:
        Dict[str, Any]: Final configuration
    """
    config = DEFAULT_CONFIG.copy()
    
    # Apply environment variable overrides
    if os.environ.get("BROWSER_AGENT_HEADLESS"):
        config["browser"]["headless"] = os.environ.get("BROWSER_AGENT_HEADLESS").lower() == "true"
    
    if os.environ.get("BROWSER_AGENT_MODEL"):
        config["model"]["name"] = os.environ.get("BROWSER_AGENT_MODEL")
    
    # Apply override configuration
    if override_config:
        _deep_merge(config, override_config)
    
    return config


def _deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> None:
    """Deep merge two dictionaries.
    
    Args:
        base: Base dictionary to merge into
        override: Dictionary with values to override
    """
    for key, value in override.items():
        if key in base and isinstance(base[key], dict) and isinstance(value, dict):
            _deep_merge(base[key], value)
        else:
            base[key] = value 