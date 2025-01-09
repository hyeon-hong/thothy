import os
import autogen
from autogen import ConversableAgent
from dotenv import load_dotenv

load_dotenv()
llm_config = {
    "config_list": [
        {
            "model": "gpt-4o-mini",
            "api_key": os.environ.get("OPENAI_API_KEY"),
            "api_type": "openai",
            "tags": ["openai"],
        },
        {
            "model": "llama3.2-vision",
            "base_url": os.environ.get("OLLAMA_BASE_URL"),
            "api_type": "openai",
            "tags": ["llama"],
        },
    ],
}
filter_dict = {"tags": ["llama"]}
filtered_config_list = autogen.filter_config(
    llm_config["config_list"], filter_dict)
llm_config = {"config_list": filtered_config_list}

chatbot = ConversableAgent(
    "chatbot",
    llm_config=llm_config,
    code_execution_config=False,
    function_map=None,
    human_input_mode="NEVER",
)

reply = chatbot.generate_reply(
    messages=[{"content": "Tell me a joke.", "role": "user"}])
print(reply)
