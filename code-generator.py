import autogen
import os
from dotenv import load_dotenv
import json
from autogen.coding import LocalCommandLineCodeExecutor

load_dotenv()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

config_list = [
    {
        "model": "gpt-4o-mini",
        "api_key": OPENAI_API_KEY,
    }
]

gpt4_config = {
    "cache_seed": 42,
    "temperature": 0,
    "config_list": config_list,
    "timeout": 120,
}

executor = LocalCommandLineCodeExecutor(
    timeout=10,
    work_dir="outputs",
)

initializer = autogen.UserProxyAgent(
    name="Init",
    code_execution_config={
        "use_docker": False,
    },
)

html_code_generator = autogen.AssistantAgent(
    name="HTML_Code_Generator",
    description="""
    HTML code generator to meet the requirement.
    """,
    llm_config=gpt4_config,
    system_message="""
    You are the Coder. Given a topic,
    write the code to meet the topic.
    You write the code to solve tasks.
    Wrap the code in a code block that specifies the script type.
    The user can't modify your code.
    So do not suggest incomplete code which requires others to modify.
    Don't use a code block
    if it's not intended to be executed by the executor.
    Don't include multiple code blocks in one response.
    Do not ask others to copy and paste the result.
    Check the execution result returned by the executor.
    If the result indicates there is an error,
    fix the error and output the code again.
    Suggest the full code instead of partial code or code changes.
    If the error can't be fixed or if the task is not solved
    even after the code is executed successfully,
    analyze the problem, revisit your assumption,
    collect additional info you need, and
    think of a different approach to try.
    """,
)

html_code_executor = autogen.UserProxyAgent(
    name="HTML_Code_Executor",
    description="""
    Code executor to run a HTML code written by the Coder and
    report the result.
    """,
    system_message="""
    Execute the code written by the Coder and
    report the result.
    """,
    human_input_mode="NEVER",
    code_execution_config={"executor": executor},
)

html_code_reviewer = autogen.AssistantAgent(
    name="HTML_Code_Reviewer",
    description="""
    Code reviewer to review the code written by the Coder and
    make sure it's correct.
    """,
    llm_config=gpt4_config,
    system_message="""
    You are the code reviewer.
    Please review the code written by the Coder and make sure it's correct.
    If it's not correct, fix it and output the code again.
    Suggest the full code instead of partial code or code changes.
    If the error can't be fixed or if the task is not solved
    even after the code is executed successfully,
    analyze the problem, revisit your assumption,
    collect additional info you need, and
    think of a different approach to try.
    If you think the task is solved, output only "OK".
    """,
)

python_code_generator = autogen.AssistantAgent(
    name="Python_Code_Generator",
    description="""
    Python code generator to meet the requirement.
    """,
    llm_config=gpt4_config,
    system_message="""
    You are the Coder. Given a topic,
    write the code to meet the topic.
    You write the code to solve tasks.
    Wrap the code in a code block that specifies the script type.
    The user can't modify your code.
    So do not suggest incomplete code which requires others to modify.
    Don't use a code block
    if it's not intended to be executed by the executor.
    Don't include multiple code blocks in one response.
    Do not ask others to copy and paste the result.
    Check the execution result returned by the executor.
    If the result indicates there is an error,
    fix the error and output the code again.
    Suggest the full code instead of partial code or code changes.
    If the error can't be fixed or if the task is not solved
    even after the code is executed successfully,
    analyze the problem, revisit your assumption,
    collect additional info you need, and
    think of a different approach to try.
    """,
)

python_code_executor = autogen.UserProxyAgent(
    name="Python_Code_Executor",
    description="""
    Code executor to execute a python code written by the Coder and
    report the result.
    """,
    system_message="""
    Execute the code written by the Coder and
    report the result.
    """,
    human_input_mode="NEVER",
    code_execution_config={"executor": executor},
)

python_code_reviewer = autogen.AssistantAgent(
    name="Python_Code_Reviewer",
    description="""
    Code reviewer to review the code written by the Coder and
    make sure it's correct.
    """,
    llm_config=gpt4_config,
    system_message="""
    You are the code reviewer.
    Please review the code written by the Coder and make sure it's correct.
    If it's not correct, fix it and output the code again.
    Suggest the full code instead of partial code or code changes.
    If the error can't be fixed or if the task is not solved
    even after the code is executed successfully,
    analyze the problem, revisit your assumption,
    collect additional info you need, and
    think of a different approach to try.
    If you think the task is solved, output only "OK".
    """,
)


def state_transition(last_speaker, groupchat):
    messages = groupchat.messages

    # Initial state
    if last_speaker is initializer:
        return html_code_generator
    # HTML code generation
    elif last_speaker is html_code_generator:
        return html_code_executor
    # HTML code execution
    elif last_speaker is html_code_executor:
        return html_code_reviewer
    # HTML code review
    elif last_speaker is html_code_reviewer:
        if messages[-1]["content"] == "OK":
            return python_code_generator
        else:
            return html_code_generator
    # Python code generation
    elif last_speaker is python_code_generator:
        return python_code_executor
    # Python code execution
    elif last_speaker is python_code_executor:
        if messages[-1]["content"] == "exitcode: 1":
            return python_code_generator
        else:
            return python_code_reviewer
    # Python code review
    elif last_speaker is python_code_reviewer:
        print(json.dumps(messages, indent=2, ensure_ascii=False))
        if messages[-1]["content"] == "OK":
            return None
        else:
            return python_code_generator


groupchat = autogen.GroupChat(
    agents=[initializer,
            html_code_generator,
            html_code_executor,
            html_code_reviewer,
            python_code_generator,
            python_code_executor,
            python_code_reviewer],
    messages=[],
    max_round=20,
    speaker_selection_method=state_transition,
)
manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=gpt4_config)

initializer.initiate_chat(
    manager,
    message="""
    Topic: Generate a landing page for a SaaS product that builds AI agents.

    Requirement:

    # Generate HTML code and run it.

    Generate these items as an HTML file.

    - Introduction: Introduce the product.
      * Title: "Thothy"
      * Description: "Assign your jobs to AI agents."
    - Features: List the features of the product.
      * 24/7 Running Agents
      * Monitor Agents Activity
      * Make Your Own AI Agents Service
    - Pricing: List the pricing of the product.
      * Not yet decided
    - Contact: List the contact information of the product.
      * ai.thothy@gmail.com

    - No sign up/in form. """ +
    # - Generate each page as an one HTML file.

    """
    - The landing page is made by HTML, CSS, and JavaScript.
    - The landing page should be a single page.
    - The landing page should be responsive.
    - The landing page should be mobile friendly.
    - The landing page should be desktop friendly.

    # Generate python code and run it.

    Generate the code which saves the HTML file
    of which name is "index.html".
    Run the code to save the HTML file.
    """,
    max_turns=20,
)
