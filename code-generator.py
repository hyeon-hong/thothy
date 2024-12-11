import autogen
import os
from dotenv import load_dotenv

# Put your api key in the environment variable OPENAI_API_KEY
load_dotenv()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

config_list = [
    {
        "model": "gpt-4o-mini",
        "api_key": OPENAI_API_KEY,
    }
]

gpt4_config = {
    "cache_seed": 42,  # change the cache_seed for different trials
    "temperature": 0,
    "config_list": config_list,
    "timeout": 120,
}

initializer = autogen.UserProxyAgent(
    name="Init",
    code_execution_config={
        "use_docker": False,
    },
)

coder = autogen.AssistantAgent(
    name="Code_Generator",
    description="""
    Code generator to meet the requirement.
    """,
    llm_config=gpt4_config,
    system_message="""
    You are the Coder. Given a topic, \
    write the code to meet the requirement. \
    You write the code to solve tasks. \
    Wrap the code in a code block that specifies the script type. \
    The user can't modify your code. \
    So do not suggest incomplete code which requires others to modify. \
    Don't use a code block \
    if it's not intended to be executed by the executor. \
    Don't include multiple code blocks in one response. \
    Do not ask others to copy and paste the result. \
    Check the execution result returned by the executor. \
    If the result indicates there is an error, \
    fix the error and output the code again. \
    Suggest the full code instead of partial code or code changes. \
    If the error can't be fixed or if the task is not solved \
    even after the code is executed successfully, \
    analyze the problem, revisit your assumption, \
    collect additional info you need, and \
    think of a different approach to try.
    """,
)

executor = autogen.UserProxyAgent(
    name="Code_Executor",
    description="""
    Code executor to execute the code written by the Coder and \
    report the result.
    """,
    system_message="""
    Execute the code written by the Coder and \
    report the result.
    """,
    human_input_mode="NEVER",
    code_execution_config={
        "last_n_messages": 3,
        "work_dir": "paper",
        "use_docker": False,
    },
)

# General Code Reviewer
scientist = autogen.AssistantAgent(
    name="Code_Reviewer",
    description="""
    Code reviewer to review the code written by the Coder and \
    make sure it's correct.
    """,
    llm_config=gpt4_config,
    system_message="""
    You are the code reviewer. \
    Please review the code written by the Coder and make sure it's correct. \
    If it's not correct, fix it and output the code again. \
    Suggest the full code instead of partial code or code changes. \
    If the error can't be fixed or if the task is not solved \
    even after the code is executed successfully, \
    analyze the problem, revisit your assumption, \
    collect additional info you need, and \
    think of a different approach to try.
    """,
)


def state_transition(last_speaker, groupchat):
    messages = groupchat.messages

    if last_speaker is initializer:
        # init -> retrieve
        return coder
    elif last_speaker is coder:
        # retrieve: action 1 -> action 2
        return executor
    elif last_speaker is executor:
        if messages[-1]["content"] == "exitcode: 1":
            # retrieve --(execution failed)--> retrieve
            return coder
        else:
            # retrieve --(execution success)--> research
            return scientist
    elif last_speaker == "Scientist":
        # research -> end
        return None


groupchat = autogen.GroupChat(
    agents=[initializer, coder, executor, scientist],
    messages=[],
    max_round=20,
    speaker_selection_method=state_transition,
)
manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=gpt4_config)

initializer.initiate_chat(
    manager,
    # message="Topic: LLM applications papers from last week. Requirement: 5 - 10 papers from different domains.",
    message="Topic: AI agent builder SaaS landing page.",
)
