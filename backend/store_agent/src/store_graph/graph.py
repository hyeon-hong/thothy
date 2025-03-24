"""Store graph for managing store-related operations."""
from typing import Annotated, Literal, Sequence
from typing_extensions import TypedDict

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph, START
from langgraph.prebuilt import ToolNode
from langgraph.prebuilt import tools_condition
from langgraph.prebuilt.messages import MessageGraph
from pydantic import BaseModel, Field


class StoreState(TypedDict):
    """State for the store graph."""
    messages: Annotated[Sequence[BaseMessage], "add_messages"]


def grade_documents(state) -> Literal["generate", "rewrite"]:
    """Determines whether the retrieved documents are relevant to the question.
    
    Args:
        state: The current state containing messages
        
    Returns:
        str: Decision for whether documents are relevant ("generate") or not
        ("rewrite")
    """
    print("---CHECK RELEVANCE---")

    class Grade(BaseModel):
        """Binary score for relevance check."""
        binary_score: str = Field(
            description="Relevance score 'yes' or 'no'"
        )

    model = ChatOpenAI(
        temperature=0, 
        model="gpt-4-turbo-preview", 
        streaming=True
    )
    llm_with_tool = model.with_structured_output(Grade)

    prompt = PromptTemplate(
        template="""You are a grader assessing relevance of retrieved store \
information to a user question.
        
        Here is the retrieved information: \n\n {context} \n\n
        Here is the user question: {question} \n
        
        If the information contains keywords or semantic meaning related to the \
user's store-related question, grade it as relevant. Give a binary score 'yes' \
or 'no' to indicate relevance.""",
        input_variables=["context", "question"],
    )

    chain = prompt | llm_with_tool

    messages = state["messages"]
    question = messages[0].content
    docs = messages[-1].content

    scored_result = chain.invoke({"question": question, "context": docs})
    score = scored_result.binary_score

    if score == "yes":
        print("---DECISION: DOCS RELEVANT---")
        return "generate"
    else:
        print("---DECISION: DOCS NOT RELEVANT---")
        return "rewrite"


def agent(state):
    """Invokes the agent to generate a response based on current state.
    
    Args:
        state: The current state containing messages
        
    Returns:
        dict: Updated state with agent response
    """
    print("---CALL AGENT---")
    messages = state["messages"]
    model = ChatOpenAI(
        temperature=0, 
        streaming=True, 
        model="gpt-4-turbo-preview"
    )
    model = model.bind_tools(tools)  # tools will be defined in create_graph()
    response = model.invoke(messages)
    return {"messages": [response]}


def rewrite(state):
    """Transform the query to produce a better store-related question.
    
    Args:
        state: The current state containing messages
        
    Returns:
        dict: Updated state with rephrased question
    """
    print("---TRANSFORM QUERY---")
    messages = state["messages"]
    question = messages[0].content

    msg = [
        HumanMessage(
            content=f"""Look at the input and try to reason about the underlying \
semantic intent for this store-related query.
            
            Here is the initial question:
            \n ------- \n
            {question} 
            \n ------- \n
            
            Formulate an improved question that will help retrieve relevant \
store information:"""
        )
    ]

    model = ChatOpenAI(
        temperature=0, 
        model="gpt-4-turbo-preview", 
        streaming=True
    )
    response = model.invoke(msg)
    return {"messages": [response]}


def generate(state):
    """Generate answer based on retrieved store information.
    
    Args:
        state: The current state containing messages
        
    Returns:
        dict: Updated state with generated answer
    """
    print("---GENERATE---")
    messages = state["messages"]
    question = messages[0].content
    docs = messages[-1].content

    prompt = PromptTemplate(
        template="""You are a store assistant. Use the following retrieved store \
information to answer the question.
        If you don't know the answer, just say that you don't know. Keep the \
answer concise and helpful.
        
        Question: {question}
        Store Information: {context}
        
        Answer:""",
        input_variables=["context", "question"],
    )

    llm = ChatOpenAI(
        model="gpt-4-turbo-preview", 
        temperature=0, 
        streaming=True
    )
    chain = prompt | llm | StrOutputParser()
    
    response = chain.invoke({"context": docs, "question": question})
    return {"messages": [response]}


def create_graph() -> MessageGraph:
    """Create the store graph with agentic RAG pattern.
    
    Returns:
        A LangGraph message graph for store operations.
    """
    # Create retriever tool (this should be implemented based on your store data source)
    from langchain.tools.retriever import create_retriever_tool
    
    # TODO: Replace this with actual store data retriever implementation
    retriever_tool = create_retriever_tool(
        retriever=None,  # Add your store data retriever here
        name="retrieve_store_info",
        description="Search and return information about store products, \
inventory, orders, etc.",
    )
    
    global tools
    tools = [retriever_tool]

    # Define workflow
    workflow = StateGraph(StoreState)

    # Add nodes
    workflow.add_node("agent", agent)
    retrieve = ToolNode([retriever_tool])
    workflow.add_node("retrieve", retrieve)
    workflow.add_node("rewrite", rewrite)
    workflow.add_node("generate", generate)

    # Add edges
    workflow.add_edge(START, "agent")
    
    # Conditional edges from agent
    workflow.add_conditional_edges(
        "agent",
        tools_condition,
        {
            "tools": "retrieve",
            END: END,
        },
    )

    # Conditional edges from retrieve
    workflow.add_conditional_edges(
        "retrieve",
        grade_documents,
        {
            "generate": "generate",
            "rewrite": "rewrite",
        }
    )

    workflow.add_edge("generate", END)
    workflow.add_edge("rewrite", "agent")

    return workflow.compile()


graph = create_graph() 