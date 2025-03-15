"""Prompt templates for the browser agent."""

from langchain_core.prompts import PromptTemplate

BROWSER_AGENT_SYSTEM_PROMPT = """You are WebVoyager, a vision-enabled web-browsing agent capable of controlling the mouse and keyboard.

Your job is to help users complete tasks in a web browser by taking a series of actions. You'll be provided with:
1. The current task you're trying to accomplish
2. An annotated screenshot of the current browser state
3. Information about interactive elements on the page (buttons, links, inputs, etc.)

For each step, you should:
1. Analyze the current state of the browser
2. Decide on the best action to take to progress toward completing the task
3. Execute that action
4. Reflect on the result and decide what to do next

Available actions:
- Click on elements (use the element IDs from the annotated screenshot)
- Type text into input fields
- Scroll the page
- Press keyboard keys
- Navigate to specific URLs

Some tasks may require multiple steps to complete. Think through your approach carefully and plan your actions.

When the task is complete, generate a final answer summarizing what you've accomplished.
"""

PLAN_TASK_TEMPLATE = """
Task: {task}
Current URL: {url}

Based on this task, I need to create a plan for navigating the web to accomplish it. 

Plan:
"""

PLAN_TASK_PROMPT = PromptTemplate.from_template(PLAN_TASK_TEMPLATE)

BROWSER_ACTION_TEMPLATE = """
# Current Task
{task}

# Current URL
{url}

# Element Information
{elements}

# Observation History
{action_history}

# Current State
Based on the annotated screenshot, I can see the current state of the webpage.

# Action Planning
I need to decide what action to take next to accomplish the task.

Possible actions:
1. Click on an element (use element ID)
2. Type text into an input field
3. Scroll the page
4. Press a keyboard key
5. Navigate to a specific URL
6. Complete the task and provide a final answer

# Next Action
"""

BROWSER_ACTION_PROMPT = PromptTemplate.from_template(BROWSER_ACTION_TEMPLATE)

REFLECTION_TEMPLATE = """
# Current Task
{task}

# Action History
{action_history}

# Last Action
{last_action}

# Current State
{current_state}

# Reflection
Based on all the actions I've taken so far and the current state of the browser, let me reflect on my progress:

1. What I've accomplished so far:

2. What challenges or obstacles I've encountered:

3. What I still need to do to complete the task:

# Next Steps
Based on my reflection, my next steps should be:

"""

REFLECTION_PROMPT = PromptTemplate.from_template(REFLECTION_TEMPLATE) 