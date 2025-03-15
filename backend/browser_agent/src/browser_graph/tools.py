from langchain_core.runnables import chain as chain_decorator
import base64
import asyncio
import platform

from browser_graph.graph import AgentState


async def click(state: AgentState):
    # - Click [Numerical_Label]
    page = state["page"]
    click_args = state["prediction"]["args"]
    if click_args is None or len(click_args) != 1:
        return f"Failed to click bounding box labeled as number {click_args}"
    bbox_id = click_args[0]
    bbox_id = int(bbox_id)
    try:
        bbox = state["bboxes"][bbox_id]
    except Exception:
        return f"Error: no bbox for : {bbox_id}"
    x, y = bbox["x"], bbox["y"]
    await page.mouse.click(x, y)
    # TODO: In the paper, they automatically parse any downloaded PDFs
    # We could add something similar here as well and generally
    # improve response format.
    return f"Clicked {bbox_id}"


async def type_text(state: AgentState):
    page = state["page"]
    type_args = state["prediction"]["args"]
    if type_args is None or len(type_args) != 2:
        return (
            f"Failed to type in element from bounding box labeled as number {type_args}"
        )
    bbox_id = type_args[0]
    bbox_id = int(bbox_id)
    bbox = state["bboxes"][bbox_id]
    x, y = bbox["x"], bbox["y"]
    text_content = type_args[1]
    await page.mouse.click(x, y)
    # Check if MacOS
    select_all = "Meta+A" if platform.system() == "Darwin" else "Control+A"
    await page.keyboard.press(select_all)
    await page.keyboard.press("Backspace")
    await page.keyboard.type(text_content)
    await page.keyboard.press("Enter")
    return f"Typed {text_content} and submitted"


async def scroll(state: AgentState):
    page = state["page"]
    scroll_args = state["prediction"]["args"]
    if scroll_args is None or len(scroll_args) != 2:
        return "Failed to scroll due to incorrect arguments."

    target, direction = scroll_args

    if target.upper() == "WINDOW":
        # Not sure the best value for this:
        scroll_amount = 500
        scroll_direction = (
            -scroll_amount if direction.lower() == "up" else scroll_amount
        )
        await page.evaluate(f"window.scrollBy(0, {scroll_direction})")
    else:
        # Scrolling within a specific element
        scroll_amount = 200
        target_id = int(target)
        bbox = state["bboxes"][target_id]
        x, y = bbox["x"], bbox["y"]
        scroll_direction = (
            -scroll_amount if direction.lower() == "up" else scroll_amount
        )
        await page.mouse.move(x, y)
        await page.mouse.wheel(0, scroll_direction)

    return f"Scrolled {direction} in {'window' if target.upper() == 'WINDOW' else 'element'}"


async def wait(state: AgentState):
    sleep_time = 5
    await asyncio.sleep(sleep_time)
    return f"Waited for {sleep_time}s."


async def go_back(state: AgentState):
    page = state["page"]
    await page.go_back()
    return f"Navigated back a page to {page.url}."


async def to_google(state: AgentState):
    page = state["page"]
    await page.goto("https://www.google.com/")
    return "Navigated to google.com."


async def extract_content(state: AgentState):
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
