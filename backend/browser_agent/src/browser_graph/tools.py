from langchain_core.runnables import chain as chain_decorator
import base64
import asyncio
import os
import shutil
from pathlib import Path

from browser_graph.graph import AgentState
from browser_graph.constants import SEARCH_WEBSITE
from browser_graph.utils import get_pdf_retrieval_ans_from_assistant


async def process_pdf(pdf_path, query, client=None):
    """Process a PDF file to extract information relevant to the query.
    
    If an OpenAI client is provided, this uses the Assistant API to analyze
    the PDF content via get_pdf_retrieval_ans_from_assistant.
    Otherwise, it returns a placeholder message.
    
    Args:
        pdf_path: Path to the PDF file
        query: The original user query
        client: Optional OpenAI client for API access
        
    Returns:
        str: Text summarizing the PDF's content relevant to the query
    """
    try:
        if client:
            # Use the Assistant API via the utility function
            return get_pdf_retrieval_ans_from_assistant(client, pdf_path, query)
        
        # Fallback if no client provided
        file_name = os.path.basename(pdf_path)
        file_size = os.path.getsize(pdf_path)
        file_size_kb = file_size / 1024
        
        return (
            f"PDF file '{file_name}' ({file_size_kb:.1f} KB) was downloaded. "
            f"To analyze this PDF, an OpenAI API client is needed."
        )
    except Exception as e:
        return f"Error processing PDF: {str(e)}"


async def click(state: AgentState):
    # - Click [Numerical_Label]
    page = state["page"]
    click_args = state["prediction"]["args"]
    if click_args is None or len(click_args) != 1:
        return f"Failed to click bounding box labeled as number {click_args}"
    bbox_id = click_args[0]
    try:
        bbox_id = int(bbox_id)
        bbox = state["bboxes"][bbox_id]
    except Exception:
        return f"Error: no bbox for : {bbox_id}"
    x, y = bbox["x"], bbox["y"]
    
    # Get the element type from the bounding box
    ele_type = bbox.get("type", "").lower()
    
    # Create a downloads directory if it doesn't exist
    downloads_dir = Path("downloads")
    downloads_dir.mkdir(exist_ok=True)
    
    # Note current files in downloads directory
    current_files_before = set(os.listdir(downloads_dir))
    
    # Perform the click
    await page.mouse.click(x, y)
    
    # Wait a bit for any downloads or page changes to take effect
    await page.wait_for_timeout(5000)  # 5 seconds
    
    # Check for new PDF downloads
    current_files_after = set(os.listdir(downloads_dir))
    new_files = current_files_after - current_files_before
    pdf_files = [f for f in new_files if f.lower().endswith('.pdf')]
    
    if pdf_files:
        pdf_file = pdf_files[0]
        pdf_path = downloads_dir / pdf_file
        
        # Process the PDF file if we have an input query
        client = state.get("openai_client")  # Check if client is in state
        if "input" in state:
            pdf_observation = await process_pdf(pdf_path, state["input"], client)
        else:
            pdf_observation = (
                "You downloaded a PDF file. To analyze it, provide "
                "a query and OpenAI client in the state."
            )
        
        # Save a copy of the PDF to session directory if available
        if "session_dir" in state:
            shutil.copy(pdf_path, state["session_dir"])
        
        return f"Clicked {bbox_id}. {pdf_observation}"
    
    # If it's a submit button, wait a bit longer for page to load
    if ele_type == "button":
        await page.wait_for_timeout(5000)  # additional 5 seconds
    
    return f"Clicked {bbox_id}"


async def type_text(state: AgentState):
    # - Type [Numerical_Label]; [Content]
    page = state["page"]
    type_args = state["prediction"]["args"]
    
    if (not isinstance(type_args, dict) or 
            "number" not in type_args or 
            "content" not in type_args):
        return "Error: Type requires a number and content"
    
    try:
        number = type_args["number"]
        try:
            number = int(number)
            bbox = state["bboxes"][number]
        except ValueError:
            return f"Error: no bbox for : {number}"
        
        content = type_args["content"]
        
        # Get element type to check if it's a textbox
        ele_tag_name = bbox.get("type", "").lower()
        
        # Warn if this doesn't seem to be a textbox but proceed anyway
        warning = ""
        if ele_tag_name not in ["input", "textarea"]:
            warning = (
                f"Note: The element {number} you're trying to type into "
                f"may not be a textbox (type is {ele_tag_name})."
            )
        
        # Click the element first
        x, y = bbox["x"], bbox["y"]
        await page.mouse.click(x, y)
        await page.wait_for_timeout(1000)
        
        # Clear existing text if any
        await page.keyboard.press("Control+a")
        await page.keyboard.press("Backspace")
        
        # Type the content
        await page.keyboard.type(content)
        
        # Press Enter to submit
        await page.keyboard.press("Enter")
        
        # Wait for potential page load
        await page.wait_for_timeout(5000)
        
        if warning:
            msg = f"Typed '{content}' into element {number}. {warning}"
            return msg
        return f"Typed '{content}' into element {number}"
        
    except Exception as e:
        return f"Error typing: {str(e)}"


async def scroll(state: AgentState):
    # - Scroll [Numerical_Label or WINDOW]; [up or down]
    page = state["page"]
    scroll_args = state["prediction"]["args"]
    
    if (not isinstance(scroll_args, dict) or 
            "number" not in scroll_args or 
            "content" not in scroll_args):
        return "Error: Scroll requires a number and direction (up or down)"
    
    try:
        element_number = scroll_args["number"]
        direction = scroll_args["content"]
        
        if element_number == "WINDOW":
            # Scroll the whole window
            if direction == "down":
                await page.evaluate(
                    "window.scrollBy(0, window.innerHeight * 2/3);"
                )
            else:
                await page.evaluate(
                    "window.scrollBy(0, -window.innerHeight * 2/3);"
                )
        else:
            # Scroll a specific element
            try:
                element_number = int(element_number)
                bbox = state["bboxes"][element_number]
            except ValueError:
                return f"Error: no bbox for : {element_number}"
            
            x, y = bbox["x"], bbox["y"]
            
            # Focus on the element
            await page.mouse.click(x, y)
            await page.wait_for_timeout(500)
            
            # Use alternative scrolling methods for elements
            if direction == "down":
                keys = "PageDown"
            else:
                keys = "PageUp"
                
            # Try to scroll using keyboard shortcuts
            await page.keyboard.press(keys)
            await page.wait_for_timeout(1000)
            
        msg = f"Scrolled {direction} on {element_number}"
        return msg
    
    except Exception as e:
        return f"Error scrolling: {str(e)}"


async def wait(state: AgentState):
    page = state["page"]
    await page.wait_for_timeout(5000)  # 5 seconds
    return "Waited for 5 seconds."


async def go_back(state: AgentState):
    page = state["page"]
    await page.go_back()
    return f"Navigated back a page to {page.url}."


async def go_search_website(state: AgentState):
    page = state["page"]
    await page.goto(SEARCH_WEBSITE)
    return "Navigated to search website."


async def crawl_website(state: AgentState):
    """Extract the main content from the current webpage.

    This function uses both Newspaper3k and Trafilatura libraries to extract
    the main content, title, authors, publish date, and other relevant 
    information from the current webpage. It tries both libraries and returns
    the best result.

    Returns:
        str: A summary of the extracted content or an error message.
    """
    import importlib.util
    import subprocess
    import sys
    import json

    page = state["page"]

    # Check and install required packages if necessary
    required_packages = ['newspaper3k', 'trafilatura']
    for package in required_packages:
        if importlib.util.find_spec(package) is None:
            try:
                subprocess.check_call([
                    sys.executable, "-m", "pip", "install", package
                ])
                print(f"Installed {package} successfully.")
            except subprocess.CalledProcessError:
                error_msg = f"Failed to install {package}. Cannot extract content."
                return error_msg

    # Now import the libraries (after ensuring they're installed)
    import newspaper
    import trafilatura

    # Get the current URL and HTML content
    current_url = await page.url()
    html_content = await page.content()

    result = {
        "title": "",
        "authors": [],
        "publish_date": "",
        "text": "",
        "summary": "",
        "keywords": [],
        "source": "Unknown"
    }

    # Try Newspaper3k first (good for news articles)
    try:
        article = newspaper.Article(current_url)
        article.set_html(html_content)
        article.parse()
        # This provides summary and keywords but might take time
        article.nlp()

        if article.title:
            result["title"] = article.title
        if article.authors:
            result["authors"] = article.authors
        if article.publish_date:
            result["publish_date"] = article.publish_date.strftime("%Y-%m-%d")
        if article.text:
            result["text"] = article.text
        if article.summary:
            result["summary"] = article.summary
        if article.keywords:
            result["keywords"] = article.keywords
        result["source"] = "Newspaper3k"
    except Exception as e:
        print(f"Newspaper3k extraction failed: {str(e)}")

    # If Newspaper3k didn't get good content, try Trafilatura
    if not result["text"] or len(result["text"]) < 100:
        try:
            extracted = trafilatura.extract(
                html_content,
                output_format='json',
                include_comments=False,
                include_links=True,
                include_images=False,
                include_tables=False,
                with_metadata=True
            )

            if extracted:
                extracted_json = json.loads(extracted)
                if extracted_json.get("title") and not result["title"]:
                    result["title"] = extracted_json["title"]
                if extracted_json.get("author") and not result["authors"]:
                    result["authors"] = [extracted_json["author"]]
                if extracted_json.get("date") and not result["publish_date"]:
                    result["publish_date"] = extracted_json["date"]
                if extracted_json.get("text"):
                    result["text"] = extracted_json["text"]
                    # Generate a summary if Newspaper didn't provide one
                    if not result["summary"]:
                        # Use the first few sentences as a summary
                        sentences = result["text"].split(". ")
                        summary = ". ".join(
                            sentences[:min(5, len(sentences))]
                        )
                        # Add period if needed
                        if not result["text"].endswith("."):
                            summary += "."
                        result["summary"] = summary
                result["source"] = "Trafilatura"
        except Exception as e:
            print(f"Trafilatura extraction failed: {str(e)}")

    # Check if we successfully extracted content
    if not result["text"]:
        return "Failed to extract content from this page."

    # Format the output for the agent
    output = []
    output.append(f"TITLE: {result['title']}")
    if result["authors"]:
        output.append(f"AUTHORS: {', '.join(result['authors'])}")
    if result["publish_date"]:
        output.append(f"DATE: {result['publish_date']}")
    if result["keywords"]:
        output.append(f"KEYWORDS: {', '.join(result['keywords'])}")
    output.append("")
    if result["summary"]:
        output.append("SUMMARY:")
        output.append(result["summary"])
        output.append("")
    output.append("FULL TEXT:")
    # Only include first portion of the text if it's very long
    text_to_include = result["text"]
    if len(text_to_include) > 2000:
        truncated_text = text_to_include[:2000] + "... (content truncated)"
        text_to_include = truncated_text
    output.append(text_to_include)

    return "\n".join(output)


# Some javascript we will run on each step
# to take a screenshot of the page, select the
# elements to annotate, and add bounding boxes
with open("./mark_page.js") as f:
    mark_page_script = f.read()


@chain_decorator
async def mark_page(page):
    await page.evaluate(mark_page_script)
    for _ in range(10):
        try:
            bboxes = await page.evaluate("markPage()")
            break
        except Exception:
            # May be loading...
            asyncio.sleep(3)
    screenshot = await page.screenshot()
    # Ensure the bboxes don't follow us around
    await page.evaluate("unmarkPage()")
    return {
        "img": base64.b64encode(screenshot).decode(),
        "bboxes": bboxes,
    }
