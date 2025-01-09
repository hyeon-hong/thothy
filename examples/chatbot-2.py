import os
import autogen
from autogen import ConversableAgent
from dotenv import load_dotenv

load_dotenv()
llm_config = {
    "config_list": [
        {
            "model": "gpt-4o-mini",
            "temperature": 0.9,
            "api_key": os.environ.get("OPENAI_API_KEY"),
            "api_type": "openai",
            "tags": ["openai"],
        },
        {
            "model": "llama3.2-vision",
            "base_url": os.environ.get("OLLAMA_BASE_URL"),
            "temperature": 0.9,
            "api_type": "openai",
            "tags": ["llama"],
        },
    ],
}
filter_dict = {"tags": ["llama"]}
filtered_config_list = autogen.filter_config(
    llm_config["config_list"], filter_dict)
llm_config = {"config_list": filtered_config_list}

cathy = ConversableAgent(
    "cathy",
    system_message="""
    Your name is Cathy and you are a part of a duo of comedians.
    """,
    llm_config=llm_config,
    human_input_mode="NEVER",  # Never ask for human input.
)

joe = ConversableAgent(
    "joe",
    system_message="""
    Your name is Joe and you are a part of a duo of comedians.
    """,
    llm_config=llm_config,
    human_input_mode="NEVER",  # Never ask for human input.
)

result = joe.initiate_chat(
    cathy, message="Cathy, tell me a joke.", max_turns=2)
