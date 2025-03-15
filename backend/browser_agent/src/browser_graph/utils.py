"""Utility functions for browser agent."""

import base64
import os
import json
import time
import uuid
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright

from backend.browser_agent.src.browser_graph.constants import SEARCH_WEBSITE
from browser_graph.graph import graph


def create_session_dir():
    """Create a unique session directory for saving outputs."""
    # Create a unique session ID with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    session_id = f"{timestamp}_{uuid.uuid4().hex[:8]}"

    # Create main outputs directory if it doesn't exist
    outputs_dir = Path("outputs")
    outputs_dir.mkdir(exist_ok=True)

    # Create session directory
    session_dir = outputs_dir / session_id
    session_dir.mkdir(exist_ok=True)

    # Create subdirectories for organization
    images_dir = session_dir / "images"
    images_dir.mkdir(exist_ok=True)

    return session_dir


async def get_browser():
    browser = await async_playwright().start()
    # We will set headless=False so we can watch the agent navigate the web.
    browser = await browser.chromium.launch(headless=False, args=None)
    page = await browser.new_page()
    _ = await page.goto(SEARCH_WEBSITE)
    return browser, page


def clear_terminal():
    """Clear the terminal screen in a cross-platform way."""
    os.system('cls' if os.name == 'nt' else 'clear')


def print_step_info(step_num, action, action_input):
    """Print step information in a formatted way."""
    print(f"\n{'='*70}")
    print(f"STEP {step_num}: {action}")
    print(f"{'-'*70}")
    if isinstance(action_input, list) and action_input:
        print(f"Input: {json.dumps(action_input, indent=2)}")
    else:
        print(f"Input: {action_input}")
    print(f"{'='*70}\n")


def save_debug_data(session_dir, step_num, img_data, url, action, action_input):
    """Save debug data including image and URL information."""
    # Save the image
    images_dir = session_dir / "images"
    img_path = images_dir / f"step_{step_num:03d}.png"

    with open(img_path, "wb") as f:
        f.write(base64.b64decode(img_data))

    # Convert URL to string if it's a Page object
    if hasattr(url, '__class__') and url.__class__.__name__ == 'Page':
        url_str = str(url)
    else:
        url_str = url

    # Handle action_input to make it JSON serializable
    serializable_action_input = action_input
    try:
        # Test if it's serializable
        json.dumps(action_input)
    except (TypeError, OverflowError):
        # If not serializable, convert to string
        serializable_action_input = str(action_input)

    # Save step metadata including URL and action
    step_data = {
        "step": step_num,
        "url": url_str,
        "action": action,
        "action_input": serializable_action_input,
        "timestamp": datetime.now().isoformat(),
        "image_path": str(img_path)
    }

    # Save step metadata to JSON file
    metadata_path = session_dir / f"step_{step_num:03d}_data.json"
    with open(metadata_path, "w") as f:
        json.dump(step_data, f, indent=2)

    # Also update the session log file with this step
    session_log_path = session_dir / "session_log.jsonl"
    with open(session_log_path, "a") as f:
        f.write(json.dumps(step_data) + "\n")

    print(f"[Debug data saved to {session_dir}]")

    return img_path


def save_session_summary(session_dir, query, final_answer, steps, elapsed_time):
    """Save a summary of the session for easy reference."""
    summary = {
        "query": query,
        "final_answer": final_answer,
        "steps_count": len(steps),
        "steps": steps,
        "elapsed_time_seconds": elapsed_time,
        "completed_at": datetime.now().isoformat()
    }

    summary_path = session_dir / "session_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    # Create a more human-readable version
    readable_path = session_dir / "README.md"
    with open(readable_path, "w") as f:
        f.write(f"# Browser Agent Session\n\n")
        f.write(f"## Query\n{query}\n\n")
        f.write(f"## Final Answer\n{final_answer}\n\n")
        f.write(f"## Statistics\n")
        f.write(f"- Steps: {len(steps)}\n")
        f.write(f"- Time: {elapsed_time:.2f} seconds\n")
        f.write(
            f"- Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"## Steps\n\n")
        for i, step in enumerate(steps, 1):
            f.write(f"{i}. {step}\n")

    print(f"[Session summary saved to {summary_path}]")


async def call_agent(question: str, page, max_steps: int = 150):
    # Create a unique session directory for this run
    session_dir = create_session_dir()

    # Start time for tracking
    start_time = time.time()

    # Initialize the session log file
    session_log_path = session_dir / "session_log.jsonl"
    with open(session_log_path, "w") as f:
        f.write(json.dumps({
            "session_start": datetime.now().isoformat(),
            "query": question
        }) + "\n")

    event_stream = graph.astream(
        {
            "page": page,
            "input": question,
            "scratchpad": [],
        },
        {
            "recursion_limit": max_steps,
        },
    )
    final_answer = None
    steps = []
    step_num = 0

    print("\n📋 BROWSER AGENT SESSION")
    print(f"📝 QUERY: {question}")
    print(f"🗂️ SESSION DIR: {session_dir}")
    print("🔄 Starting browser navigation...\n")

    async for event in event_stream:
        # We'll display an event stream here
        if "agent" not in event:
            # Check if the final answer is in the event
            if "final_answer" in event:
                final_answer = event["final_answer"]
            continue

        step_num += 1
        pred = event["agent"].get("prediction") or {}
        action = pred.get("action")
        action_input = pred.get("args")

        # Get current URL
        if callable(getattr(page, 'url', None)):
            current_url = await page.url()
        else:
            current_url = page

        # Clear terminal and print step information
        clear_terminal()

        # Store and print all steps so far
        step_description = f"{len(steps) + 1}. {action}: {action_input}"
        steps.append(step_description)

        print("STEPS SO FAR:")
        for i, step in enumerate(steps, 1):
            print(f"  {step}")
        print("\n")

        # Print URL information
        print(f"CURRENT URL: {current_url}")

        # Print detailed info about current step
        print_step_info(step_num, action, action_input)

        # Save debug data (image and URL)
        if "img" in event["agent"]:
            saved_path = save_debug_data(
                session_dir,
                step_num,
                event["agent"]["img"],
                current_url,
                action,
                action_input
            )
            print(f"[Step {step_num} image saved to {saved_path}]")

        # Check for ANSWER action
        if action == "ANSWER" and action_input:
            final_answer = action_input[0]
            break

    # Calculate elapsed time
    elapsed_time = time.time() - start_time

    # Save session summary
    save_session_summary(
        session_dir,
        question,
        final_answer,
        steps,
        elapsed_time
    )

    print("\n🏁 BROWSER AGENT COMPLETED")
    print(f"✅ FINAL ANSWER: {final_answer}")
    print(f"📁 Complete session data saved to: {session_dir}")
    return final_answer
