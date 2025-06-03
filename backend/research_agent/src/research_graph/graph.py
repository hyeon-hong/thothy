from typing import Literal
import logging

from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langgraph.constants import Send
from langgraph.graph import START, END, StateGraph
from langgraph.types import Command
from langgraph.graph.ui import push_ui_message

from research_graph.state import (
    ReportStateInput,
    ReportStateOutput,
    Sections,
    ReportState,
    SectionState,
    SectionOutputState,
    Queries,
    Feedback
)

from research_graph.prompts import (
    report_planner_query_writer_instructions,
    report_planner_instructions,
    query_writer_instructions,
    section_writer_instructions,
    final_section_writer_instructions,
    section_grader_instructions,
    section_writer_inputs
)

from research_graph.configuration import Configuration
from research_graph.utils import (
    init_model_with_provider,
    format_sections,
    get_config_value,
    get_search_params,
    select_and_execute_search
)

# Set up logger with the specified name
logger = logging.getLogger("thothy-devlop")

# UI Component name for research agent
UI_COMPONENT_NAME = "research_graph"


async def generate_report_plan(state: ReportState, config: RunnableConfig):
    """Generate the initial report plan with sections.

    This node:
    1. Gets configuration for the report structure and search parameters
    2. Generates search queries to gather context for planning
    3. Performs web searches using those queries
    4. Uses an LLM to generate a structured plan with sections

    Args:
        state: Current graph state containing the report topic
        config: Configuration for models, search APIs, etc.

    Returns:
        Dict containing the generated sections
    """

    # Try to get topic from different possible sources
    topic = None

    # Method 1: Try to get from messages (standard chat flow)
    messages = state.get("messages", [])

    if messages and len(messages) > 0:
        try:
            topic = messages[-1].content
            logger.info(f"Topic extracted from messages: {topic}")
        except (AttributeError, IndexError) as e:
            logger.warning(f"Could not extract topic from messages: {e}")

    # Method 2: Try to get topic directly from state (alternative input format)
    if not topic:
        topic = state.get("topic")
        if topic:
            logger.info(f"Topic found directly in state: {topic}")

    # Method 3: Check if we have any string values in state that could be the topic
    if not topic:
        logger.info(
            f"Full state keys: {list(state.keys()) if hasattr(state, 'keys') else 'Not a dict'}")
        logger.info(f"Full state content: {state}")

        # Look for any string that might be the topic
        for key, value in state.items():
            if isinstance(value, str) and len(value) > 0 and key != "feedback_on_report_plan":
                topic = value
                logger.info(
                    f"Found potential topic in state['{key}']: {topic}")
                break

    if not topic:
        logger.error(
            "No topic found in any format! This indicates a problem with input processing.")
        raise ValueError(
            "No topic received. Please provide a topic for report generation.")

    logger.info(f"Final topic set: {topic}")

    feedback = state.get("feedback_on_report_plan", None)

    # Get configuration
    configurable = Configuration.from_runnable_config(config)
    report_structure = configurable.report_structure
    number_of_queries = configurable.number_of_queries
    search_api = get_config_value(configurable.search_api)

    # Get the config dict, default to empty
    search_api_config = configurable.search_api_config or {}
    params_to_pass = get_search_params(
        search_api, search_api_config)  # Filter parameters

    # Convert JSON object to string if necessary
    if isinstance(report_structure, dict):
        report_structure = str(report_structure)

    # Set writer model (model used for query writing)
    writer_provider = get_config_value(configurable.writer_provider)
    writer_model_name = get_config_value(configurable.writer_model)
    writer_model = init_model_with_provider(writer_model_name, writer_provider)
    structured_llm = writer_model.with_structured_output(Queries)

    # Format system instructions
    system_instructions_query = report_planner_query_writer_instructions.format(
        topic=topic, report_organization=report_structure, number_of_queries=number_of_queries)

    # Generate queries
    results = await structured_llm.ainvoke([SystemMessage(content=system_instructions_query),
                                            HumanMessage(content="Generate search queries that will help with planning the sections of the report.")])

    # Web search
    query_list = [query.search_query for query in results.queries]

    # Search the web with parameters
    source_str = await select_and_execute_search(search_api, query_list, params_to_pass)

    # Format system instructions
    system_instructions_sections = report_planner_instructions.format(
        topic=topic, report_organization=report_structure, context=source_str, feedback=feedback)

    # Get the planner
    planner_provider = get_config_value(configurable.planner_provider)
    planner_model = get_config_value(configurable.planner_model)

    # Report planner instructions
    planner_message = """Generate the sections of the report. Each section must have: name, description, research (boolean indicating if research is needed), and content fields.
                      Format your response as a valid JSON object containing a 'sections' array."""

    # Use structured output for all providers
    if planner_model == "claude-3-7-sonnet-latest":
        planner_llm = init_chat_model(model=planner_model,
                                      model_provider=planner_provider,
                                      max_tokens=20_000,
                                      thinking={"type": "enabled", "budget_tokens": 16_000})
    else:
        planner_llm = init_chat_model(model=planner_model,
                                      model_provider=planner_provider)

    # Generate the report sections with structured output
    structured_llm = planner_llm.with_structured_output(Sections)
    report_sections = await structured_llm.ainvoke([SystemMessage(content=system_instructions_sections),
                                                   HumanMessage(content=planner_message)])

    logger.info(f"report_sections: {report_sections}")

    # Get sections
    sections = report_sections.sections

    # Create AI messages with tool_calls for the LLM interactions
    # First AI message for query generation
    query_generation_message = AIMessage(
        content="Generated search queries for report planning",
        tool_calls=[{
            "id": "query_generation_001",
            "name": "generate_search_queries",
            "args": {
                "topic": topic,
                "queries": [query.search_query for query in results.queries],
                "number_of_queries": len(results.queries)
            }
        }]
    )

    # Second AI message for report sections generation
    sections_generation_message = AIMessage(
        content="Generated report sections structure",
        tool_calls=[{
            "id": "sections_generation_001",
            "name": "generate_report_sections",
            "args": {
                "topic": topic,
                "sections": [{"name": s.name, "description": s.description, "research": s.research} for s in sections],
                "total_sections": len(sections)
            }
        }]
    )

    # Push the report sections to the UI with message
    ui_message = AIMessage(
        content="Report sections generated successfully!"
    )

    push_ui_message(UI_COMPONENT_NAME, {
                    "topic": topic, "sections": sections}, message=ui_message)

    # Append all messages to existing messages
    current_messages = state.get("messages", [])
    updated_messages = list(
        current_messages) + [query_generation_message, sections_generation_message, ui_message]

    return {"topic": topic, "sections": sections, "messages": updated_messages}


def human_feedback(state: ReportState, config: RunnableConfig) -> Command[Literal["generate_report_plan", "build_section_with_web_research"]]:
    """Get human feedback on the report plan and route to next steps.

    This node:
    1. Formats the current report plan for human review
    2. Gets feedback via an interrupt
    3. Routes to either:
       - Section writing if plan is approved
       - Plan regeneration if feedback is provided

    Args:
        state: Current graph state with sections to review
        config: Configuration for the workflow

    Returns:
        Command to either regenerate plan or start section writing
    """

    # Get sections
    topic = state["topic"]
    sections = state['sections']
    # sections_str = "\n\n".join(
    #     f"Section: {section.name}\n"
    #     f"Description: {section.description}\n"
    #     f"Research needed: {'Yes' if section.research else 'No'}\n"
    #     for section in sections
    # )

    # Get feedback on the report plan from interrupt
    # interrupt_message = f"""Please provide feedback on the following report plan.
    #                     \n\n{sections_str}\n
    #                     \nDoes the report plan meet your needs?\nPass 'true' to approve the report plan.\nOr, provide feedback to regenerate the report plan:"""

    # feedback = interrupt(interrupt_message)

    # If the user approves the report plan, kick off section writing
    # if isinstance(feedback, bool) and feedback is True:
    # Treat this as approve and kick off section writing
    # return Command(goto=[
    # print("Feedback",interrupt_message)
    return Command(goto=[
        Send("build_section_with_web_research", {
             "topic": topic, "section": s, "search_iterations": 0})
        for s in sections
        if s.research
    ])

    # If the user provides feedback, regenerate the report plan
    # elif isinstance(feedback, str):
    # Treat this as feedback
    # return Command(goto="generate_report_plan",
    #    update={"feedback_on_report_plan": feedback})
    # else:
    # raise TypeError(f"Interrupt value of type {type(feedback)} is not supported.")


async def generate_queries(state: SectionState, config: RunnableConfig):
    """Generate search queries for researching a specific section.

    This node uses an LLM to generate targeted search queries based on the 
    section topic and description.

    Args:
        state: Current state containing section details
        config: Configuration including number of queries to generate

    Returns:
        Dict containing the generated search queries
    """

    # Get state
    topic = state["topic"]
    section = state["section"]

    # Get configuration
    configurable = Configuration.from_runnable_config(config)
    number_of_queries = configurable.number_of_queries

    # Generate queries
    writer_provider = get_config_value(configurable.writer_provider)
    writer_model_name = get_config_value(configurable.writer_model)
    writer_model = init_chat_model(
        model=writer_model_name, model_provider=writer_provider)
    structured_llm = writer_model.with_structured_output(Queries)

    # Format system instructions
    system_instructions = query_writer_instructions.format(topic=topic,
                                                           section_topic=section.description,
                                                           number_of_queries=number_of_queries)

    # Generate queries
    queries = await structured_llm.ainvoke([SystemMessage(content=system_instructions),
                                            HumanMessage(content="Generate search queries on the provided topic.")])

    # Convert queries to ai message format and append to existing messages
    current_messages = state.get("messages", [])
    updated_messages = list(current_messages) + [AIMessage(content=f"Generated search queries for {section.name}", tool_calls=[{
        "id": "query_generation_001",
        "name": "generate_search_queries",
        "args": {"queries": [query.search_query for query in queries.queries]}
    }])]

    return {"search_queries": queries.queries, "messages": updated_messages}


async def search_web(state: SectionState, config: RunnableConfig):
    """Execute web searches for the section queries.

    This node:
    1. Takes the generated queries
    2. Executes searches using configured search API
    3. Formats results into usable context

    Args:
        state: Current state with search queries
        config: Search API configuration

    Returns:
        Dict with search results and updated iteration count
    """

    # Get state
    search_queries = state["search_queries"]

    # Get configuration
    configurable = Configuration.from_runnable_config(config)
    search_api = get_config_value(configurable.search_api)
    # Get the config dict, default to empty
    search_api_config = configurable.search_api_config or {}
    params_to_pass = get_search_params(
        search_api, search_api_config)  # Filter parameters

    # Web search
    query_list = [query.search_query for query in search_queries]
    # print("\n-------Query List:----------",query_list)
    # Search the web with parameters
    source_str = await select_and_execute_search(search_api, query_list, params_to_pass)

    return {"source_str": source_str, "search_iterations": state["search_iterations"] + 1}


async def write_section(state: SectionState, config: RunnableConfig) -> Command[Literal[END, "search_web"]]:
    """Write a section of the report and evaluate if more research is needed.

    This node:
    1. Writes section content using search results
    2. Evaluates the quality of the section
    3. Either:
       - Completes the section if quality passes
       - Triggers more research if quality fails

    Args:
        state: Current state with search results and section info
        config: Configuration for writing and evaluation

    Returns:
        Command to either complete section or do more research
    """

    # Get state
    topic = state["topic"]
    section = state["section"]
    source_str = state["source_str"]

    # Get configuration
    configurable = Configuration.from_runnable_config(config)

    # Format system instructions
    section_writer_inputs_formatted = section_writer_inputs.format(topic=topic,
                                                                   section_name=section.name,
                                                                   section_topic=section.description,
                                                                   context=source_str,
                                                                   section_content=section.content)

    # Generate section
    writer_provider = get_config_value(configurable.writer_provider)
    writer_model_name = get_config_value(configurable.writer_model)
    writer_model = init_chat_model(
        model=writer_model_name, model_provider=writer_provider)

    section_content = await writer_model.ainvoke([SystemMessage(content=section_writer_instructions),
                                                  HumanMessage(content=section_writer_inputs_formatted)])

    # Write content to the section object
    section.content = section_content.content

    # Grade prompt
    section_grader_message = ("Grade the report and consider follow-up questions for missing information. "
                              "If the grade is 'pass', return empty strings for all follow-up queries. "
                              "If the grade is 'fail', provide specific search queries to gather missing information.")

    section_grader_instructions_formatted = section_grader_instructions.format(topic=topic,
                                                                               section_topic=section.description,
                                                                               section=section.content,
                                                                               number_of_follow_up_queries=configurable.number_of_queries)

    # Use planner model for reflection
    planner_provider = get_config_value(configurable.planner_provider)
    planner_model = get_config_value(configurable.planner_model)

    if planner_model == "claude-3-7-sonnet-latest":
        # Allocate a thinking budget for claude-3-7-sonnet-latest as the planner model
        reflection_model = init_chat_model(model=planner_model,
                                           model_provider=planner_provider,
                                           max_tokens=20_000,
                                           thinking={"type": "enabled", "budget_tokens": 16_000}).with_structured_output(Feedback)
    else:
        reflection_model = init_chat_model(model=planner_model,
                                           model_provider=planner_provider).with_structured_output(Feedback)
    # Generate feedback
    feedback = await reflection_model.ainvoke([SystemMessage(content=section_grader_instructions_formatted),
                                               HumanMessage(content=section_grader_message)])

    # If the section is passing or the max search depth is reached, publish the section to completed sections
    if feedback.grade == "pass" or state["search_iterations"] >= configurable.max_search_depth:
        # Push the completed section to UI with message
        ui_message = AIMessage(
            content=f"Section '{section.name}' completed successfully!"
        )
        push_ui_message(UI_COMPONENT_NAME, {
            "section_update": {
                "name": section.name,
                "content": section.content,
                "status": "completed"
            }
        }, message=ui_message)

        # Publish the section to completed sections
        return Command(
            update={"completed_sections": [section]},
            goto=END
        )

    # Update the existing section with new content and update search queries
    else:
        # Push the section status to UI indicating more research is needed
        ui_message = AIMessage(
            content=f"Section '{section.name}' needs more research (iteration {state['search_iterations'] + 1})"
        )
        push_ui_message(UI_COMPONENT_NAME, {
            "section_update": {
                "name": section.name,
                "content": section.content,
                "status": "needs_more_research",
                "iteration": state["search_iterations"] + 1
            }
        }, message=ui_message)

        return Command(
            update={"search_queries": feedback.follow_up_queries,
                    "section": section},
            goto="search_web"
        )


async def write_final_sections(state: SectionState, config: RunnableConfig):
    """Write sections that don't require research using completed sections as context.

    This node handles sections like conclusions or summaries that build on
    the researched sections rather than requiring direct research.

    Args:
        state: Current state with completed sections as context
        config: Configuration for the writing model

    Returns:
        Dict containing the newly written section
    """

    # Get configuration
    configurable = Configuration.from_runnable_config(config)

    # Get state
    topic = state["topic"]
    section = state["section"]
    completed_report_sections = state["report_sections_from_research"]

    # Format system instructions
    system_instructions = final_section_writer_instructions.format(
        topic=topic, section_name=section.name, section_topic=section.description, context=completed_report_sections)

    # Generate section
    writer_provider = get_config_value(configurable.writer_provider)
    writer_model_name = get_config_value(configurable.writer_model)
    writer_model = init_chat_model(
        model=writer_model_name, model_provider=writer_provider)

    section_content = await writer_model.ainvoke([SystemMessage(content=system_instructions),
                                                  HumanMessage(content="Generate a report section based on the provided sources.")])

    # Write content to section
    section.content = section_content.content

    # Push the section content to the UI with message
    ui_message = AIMessage(
        content=f"Section '{section.name}' generated successfully!"
    )
    push_ui_message(UI_COMPONENT_NAME, {
        "section_update": {
            "name": section.name,
            "content": section.content,
            "status": "completed"
        }
    }, message=ui_message)

    # Write the updated section to completed sections
    return {"completed_sections": [section]}


def gather_completed_sections(state: ReportState):
    """Format completed sections as context for writing final sections.

    This node takes all completed research sections and formats them into
    a single context string for writing summary sections.

    Args:
        state: Current state with completed sections

    Returns:
        Dict with formatted sections as context
    """

    # List of completed sections
    completed_sections = state["completed_sections"]

    # Format completed section to str to use as context for final sections
    completed_report_sections = format_sections(completed_sections)

    return {"report_sections_from_research": completed_report_sections}


def compile_final_report(state: ReportState):
    """Compile all sections into the final report."""

    # Get sections
    sections = state["sections"]
    completed_sections = {
        s.name: s.content for s in state["completed_sections"]}

    # Update sections with completed content while maintaining original order
    for section in sections:
        # Using parentheses and providing a default value  # Fixed parentheses and added default
        section.content = completed_sections.get(section.name, "")

    # Compile final report
    all_sections = "\n\n".join([s.content for s in sections])

    # Create a simple AI message for the UI message
    ui_message = AIMessage(content="Research report generated successfully!")

    # Send the report data to frontend
    report_data = {"content": all_sections}
    push_ui_message(UI_COMPONENT_NAME, report_data, message=ui_message)

    return ReportStateOutput(final_report=all_sections)


def initiate_final_section_writing(state: ReportState):
    """Create parallel tasks for writing non-research sections.

    This edge function identifies sections that don't need research and
    creates parallel writing tasks for each one.

    Args:
        state: Current state with all sections and research context

    Returns:
        List of Send commands for parallel section writing
    """

    # Kick off section writing in parallel via Send() API for any sections that do not require research
    return [
        Send("write_final_sections", {"topic": state["topic"], "section": s,
             "report_sections_from_research": state["report_sections_from_research"]})
        for s in state["sections"]
        if not s.research
    ]

# Add this fallback node at the end of the file, before compiling the graph


def fallback_handler(state: ReportState) -> ReportStateOutput:
    """Handle errors and provide a fallback response."""
    print("Executing fallback handler")
    # Get whatever information we have
    topic = state.get("topic", "")

    # Create a fallback report
    fallback_report = f"""
# Report on {topic}

## Introduction
This is a fallback report generated due to an error in the report generation process.

## Key Points
- The requested topic was: {topic}
- Due to technical limitations, a full report could not be generated
- Please try again with a more specific topic or different configuration
    """

    return ReportStateOutput(final_report=fallback_report)

# Report section sub-graph --


# Add nodes
section_builder = StateGraph(SectionState, output=SectionOutputState)
section_builder.add_node("generate_queries", generate_queries)
section_builder.add_node("search_web", search_web)
section_builder.add_node("write_section", write_section)

# Add edges
section_builder.add_edge(START, "generate_queries")
section_builder.add_edge("generate_queries", "search_web")
section_builder.add_edge("search_web", "write_section")

# Outer graph for initial report plan compiling results from each section --


# Add Nodes
builder = StateGraph(ReportState, input=ReportStateInput,
                     output=ReportStateOutput, config_schema=Configuration)
builder.add_node("generate_report_plan", generate_report_plan)
builder.add_node("human_feedback", human_feedback)
builder.add_node("build_section_with_web_research", section_builder.compile())
builder.add_node("gather_completed_sections", gather_completed_sections)
builder.add_node("write_final_sections", write_final_sections)
builder.add_node("compile_final_report", compile_final_report)

# Add edges
builder.add_edge(START, "generate_report_plan")
builder.add_edge("generate_report_plan", "human_feedback")
builder.add_edge("build_section_with_web_research",
                 "gather_completed_sections")
builder.add_edge("gather_completed_sections", END)

# builder.add_conditional_edges("gather_completed_sections",
#                               initiate_final_section_writing, ["write_final_sections"])
# builder.add_edge("write_final_sections", "compile_final_report")
# builder.add_edge("compile_final_report", END)

graph = builder.compile()
