"""Test to verify the browser agent works correctly."""

import asyncio
import time
import argparse

from browser_graph.utils import get_browser, call_agent_backup, call_agent


def get_query_options():
    """Provide different test queries to choose from."""
    return {
        "xkcd": "Please explain today's XKCD comic for me. Why is it funny?",
        "news": "Find and summarize the top 3 news stories about artificial intelligence today.",
        "weather": "What's the current weather in San Francisco?",
        "python": "Find the latest documentation about Python's asyncio module and explain how to use it.",
        "paris": "What are the top 5 tourist attractions in Paris?",
        "simple": "What is the capital of France?"
    }


async def main():
    """Run a test search query with the browser agent."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description="Test the browser agent with different queries")

    # Add list of query options
    query_options = get_query_options()
    query_choices = list(query_options.keys())

    parser.add_argument(
        '--query',
        choices=query_choices,
        default='xkcd',
        help='Query type to run'
    )

    args = parser.parse_args()

    # Get the selected query
    selected_query = query_options[args.query]

    print("\n" + "="*80)
    print("BROWSER AGENT TEST".center(80))
    print("="*80 + "\n")

    start_time = time.time()

    # Initialize browser and run query
    browser, page = await get_browser()

    print(f"Test query type: {args.query}")
    print(f"Starting browser agent with query: '{selected_query}'")
    print("This may take a moment...\n")

    # Run the agent
    # res = await call_agent_backup(selected_query, page)
    res = await call_agent(selected_query, page)

    # Calculate elapsed time
    elapsed = time.time() - start_time

    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY".center(80))
    print("="*80)
    print(f"Query: {selected_query}")
    print(f"Answer: {res}")
    print(f"Time taken: {elapsed:.2f} seconds")
    print("="*80 + "\n")

    # Clean up
    await browser.close()
    print("Browser closed. Test completed.")


if __name__ == "__main__":
    asyncio.run(main())
