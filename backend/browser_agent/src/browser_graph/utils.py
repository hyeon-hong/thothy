"""Utility functions for browser agent."""

from PIL import Image
import numpy as np
import logging
import re
import base64
import os
import json
import time
import uuid
from datetime import datetime
from pathlib import Path
from playwright.async_api import async_playwright
from IPython import display


from browser_graph.constants import SEARCH_WEBSITE
# Removing the circular import - will import locally when needed
# from browser_graph.graph import graph
from browser_graph.utils_webarena import (
    fetch_browser_info,
    fetch_page_accessibility_tree,
    parse_accessibility_tree,
    clean_accesibility_tree
)


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


def save_debug_data(
    session_dir, step_num, img_data, url, action, action_input
):
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


def save_session_summary(
    session_dir, query, final_answer, steps, elapsed_time
):
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
        f.write("# Browser Agent Session\n\n")
        f.write(f"## Query\n{query}\n\n")
        f.write(f"## Final Answer\n{final_answer}\n\n")
        f.write("## Statistics\n")
        f.write(f"- Steps: {len(steps)}\n")
        f.write(f"- Time: {elapsed_time:.2f} seconds\n")
        f.write(
            f"- Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## Steps\n\n")
        for i, step in enumerate(steps, 1):
            f.write(f"{i}. {step}\n")

    print(f"[Session summary saved to {summary_path}]")


async def call_agent(question: str, page, max_steps: int = 150):
    """Call the agent and return the final answer."""

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
    
    # Import graph locally to avoid circular imports
    from browser_graph.graph import graph

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
        # clear_terminal()

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
        if "ANSWER" in action:
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


async def call_agent_backup(question: str, page, max_steps: int = 150):
    """Call the agent and return the final answer."""
    
    # Import graph locally to avoid circular imports
    from browser_graph.graph import graph

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

    async for event in event_stream:
        """We'll display an event stream here"""

        if "agent" not in event:
            continue

        pred = event["agent"].get("prediction") or {}
        action = pred.get("action")
        action_input = pred.get("args")

        display.clear_output(wait=False)

        steps.append(f"{len(steps) + 1}. {action}: {action_input}")
        print("\n".join(steps))
        display.display(display.Image(base64.b64decode(event["agent"]["img"])))

        if "ANSWER" in action:
            final_answer = action_input[0]
            break

    return final_answer


def resize_image(image_path):
    image = Image.open(image_path)
    width, height = image.size

    if min(width, height) < 512:
        return image
    elif width < height:
        new_width = 512
        new_height = int(height * (new_width / width))
    else:
        new_height = 512
        new_width = int(width * (new_height / height))

    resized_image = image.resize((new_width, new_height), Image.LANCZOS)
    resized_image.save(image_path)
    # return resized_image


# base64 encoding
# Code from OpenAI Document
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


# interact with webpage and add rectangles on elements
def get_web_element_rect(browser, fix_color=True):
    if fix_color:
        selected_function = "getFixedColor"
        # color_you_like = '#5210da'
    else:
        selected_function = "getRandomColor"

    js_script = """
        let labels = [];

        function markPage() {
            var bodyRect = document.body.getBoundingClientRect();

            var items = Array.prototype.slice.call(
                document.querySelectorAll('*')
            ).map(function(element) {
                var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                var vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
                
                var rects = [...element.getClientRects()].filter(bb => {
                var center_x = bb.left + bb.width / 2;
                var center_y = bb.top + bb.height / 2;
                var elAtCenter = document.elementFromPoint(center_x, center_y);

                return elAtCenter === element || element.contains(elAtCenter) 
                }).map(bb => {
                const rect = {
                    left: Math.max(0, bb.left),
                    top: Math.max(0, bb.top),
                    right: Math.min(vw, bb.right),
                    bottom: Math.min(vh, bb.bottom)
                };
                return {
                    ...rect,
                    width: rect.right - rect.left,
                    height: rect.bottom - rect.top
                }
                });

                var area = rects.reduce((acc, rect) => acc + rect.width * rect.height, 0);

                return {
                element: element,
                include: 
                    (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") ||
                    (element.tagName === "BUTTON" || element.tagName === "A" || (element.onclick != null) || window.getComputedStyle(element).cursor == "pointer") ||
                    (element.tagName === "IFRAME" || element.tagName === "VIDEO" || element.tagName === "LI" || element.tagName === "TD" || element.tagName === "OPTION")
                ,
                area,
                rects,
                text: element.textContent.trim().replace(/\s{2,}/g, ' ')
                };
            }).filter(item =>
                item.include && (item.area >= 20)
            );

            // Only keep inner clickable items
            // first delete button inner clickable items
            const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"], div[role="button"]'));

            //items = items.filter(x => !buttons.some(y => y.contains(x.element) && !(x.element === y) ));
            items = items.filter(x => !buttons.some(y => items.some(z => z.element === y) && y.contains(x.element) && !(x.element === y) ));
            items = items.filter(x => 
                !(x.element.parentNode && 
                x.element.parentNode.tagName === 'SPAN' && 
                x.element.parentNode.children.length === 1 && 
                x.element.parentNode.getAttribute('role') &&
                items.some(y => y.element === x.element.parentNode)));

            items = items.filter(x => !items.some(y => x.element.contains(y.element) && !(x == y)))

            // Function to generate random colors
            function getRandomColor(index) {
                var letters = '0123456789ABCDEF';
                var color = '#';
                for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            }

            function getFixedColor(index) {
                var color = '#000000'
                return color
            }
            //function getFixedColor(index){
            //    var colors = ['#FF0000', '#00FF00', '#0000FF', '#000000']; // Red, Green, Blue, Black
            //    return colors[index % 4];
            //}
            

            // Lets create a floating border on top of these elements that will always be visible
            items.forEach(function(item, index) {
                item.rects.forEach((bbox) => {
                newElement = document.createElement("div");
                var borderColor = COLOR_FUNCTION(index);
                newElement.style.outline = `2px dashed ${borderColor}`;
                newElement.style.position = "fixed";
                newElement.style.left = bbox.left + "px";
                newElement.style.top = bbox.top + "px";
                newElement.style.width = bbox.width + "px";
                newElement.style.height = bbox.height + "px";
                newElement.style.pointerEvents = "none";
                newElement.style.boxSizing = "border-box";
                newElement.style.zIndex = 2147483647;
                // newElement.style.background = `${borderColor}80`;
                
                // Add floating label at the corner
                var label = document.createElement("span");
                label.textContent = index;
                label.style.position = "absolute";
                //label.style.top = "-19px";
                label.style.top = Math.max(-19, -bbox.top) + "px";
                //label.style.left = "0px";
                label.style.left = Math.min(Math.floor(bbox.width / 5), 2) + "px";
                label.style.background = borderColor;
                label.style.color = "white";
                label.style.padding = "2px 4px";
                label.style.fontSize = "12px";
                label.style.borderRadius = "2px";
                newElement.appendChild(label);
                
                document.body.appendChild(newElement);
                labels.push(newElement);
                // item.element.setAttribute("-ai-label", label.textContent);
                });
            })

            // For the first way
            // return [labels, items.map(item => ({
            //     rect: item.rects[0] // assuming there's at least one rect
            // }))];

            // For the second way
            return [labels, items]
        }
        return markPage();""".replace("COLOR_FUNCTION", selected_function)
    rects, items_raw = browser.execute_script(js_script)

    # format_ele_text = [f"[{web_ele_id}]: \"{items_raw[web_ele_id]['text']}\";" for web_ele_id in range(len(items_raw)) if items_raw[web_ele_id]['text'] ]
    format_ele_text = []
    for web_ele_id in range(len(items_raw)):
        label_text = items_raw[web_ele_id]['text']
        ele_tag_name = items_raw[web_ele_id]['element'].tag_name
        ele_type = items_raw[web_ele_id]['element'].get_attribute("type")
        ele_aria_label = items_raw[web_ele_id]['element'].get_attribute(
            "aria-label")
        input_attr_types = ['text', 'search', 'password', 'email', 'tel']

        if not label_text:
            if (ele_tag_name.lower() == 'input' and ele_type in input_attr_types) or ele_tag_name.lower() == 'textarea' or (ele_tag_name.lower() == 'button' and ele_type in ['submit', 'button']):
                if ele_aria_label:
                    format_ele_text.append(
                        f"[{web_ele_id}]: <{ele_tag_name}> \"{ele_aria_label}\";")
                else:
                    format_ele_text.append(
                        f"[{web_ele_id}]: <{ele_tag_name}> \"{label_text}\";")

        elif label_text and len(label_text) < 200:
            if not ("<img" in label_text and "src=" in label_text):
                if ele_tag_name in ["button", "input", "textarea"]:
                    if ele_aria_label and (ele_aria_label != label_text):
                        format_ele_text.append(
                            f"[{web_ele_id}]: <{ele_tag_name}> \"{label_text}\", \"{ele_aria_label}\";")
                    else:
                        format_ele_text.append(
                            f"[{web_ele_id}]: <{ele_tag_name}> \"{label_text}\";")
                else:
                    if ele_aria_label and (ele_aria_label != label_text):
                        format_ele_text.append(
                            f"[{web_ele_id}]: \"{label_text}\", \"{ele_aria_label}\";")
                    else:
                        format_ele_text.append(
                            f"[{web_ele_id}]: \"{label_text}\";")

    format_ele_text = '\t'.join(format_ele_text)
    return rects, [web_ele['element'] for web_ele in items_raw], format_ele_text


def extract_information(text):
    patterns = {
        "click": r"Click \[?(\d+)\]?",
        "type": r"Type \[?(\d+)\]?[; ]+\[?(.[^\]]*)\]?",
        # "delete_and_type": r"Delete_and_Type \[?(\d+)\]?[; ]+\[?(.[^\]]*)\]?",
        "scroll": r"Scroll \[?(\d+|WINDOW)\]?[; ]+\[?(up|down)\]?",
        "wait": r"^Wait",
        "goback": r"^GoBack",
        "google": r"^Google",
        "answer": r"ANSWER[; ]+\[?(.[^\]]*)\]?"
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, text)
        if match:
            if key in ["click", "wait", "goback", "google"]:
                # no content
                return key, match.groups()
            else:
                return key, {"number": match.group(1), "content": match.group(2)} if key in ["type", "scroll"] else {"content": match.group(1)}
    return None, None


def clip_message(msg, max_img_num):
    clipped_msg = []
    img_num = 0
    for idx in range(len(msg)):
        curr_msg = msg[len(msg) - 1 - idx]
        if curr_msg['role'] != 'user':
            clipped_msg = [curr_msg] + clipped_msg
        else:
            if type(curr_msg['content']) == str:
                clipped_msg = [curr_msg] + clipped_msg
            elif img_num < max_img_num:
                img_num += 1
                clipped_msg = [curr_msg] + clipped_msg
            else:
                curr_msg_clip = {
                    'role': curr_msg['role'],
                    'content': curr_msg['content'][0]["text"]
                }
                clipped_msg = [curr_msg_clip] + clipped_msg
    return clipped_msg


def clip_message_and_obs(msg, max_img_num):
    clipped_msg = []
    img_num = 0
    for idx in range(len(msg)):
        curr_msg = msg[len(msg) - 1 - idx]
        if curr_msg['role'] != 'user':
            clipped_msg = [curr_msg] + clipped_msg
        else:
            if type(curr_msg['content']) == str:
                clipped_msg = [curr_msg] + clipped_msg
            elif img_num < max_img_num:
                img_num += 1
                clipped_msg = [curr_msg] + clipped_msg
            else:
                msg_no_pdf = curr_msg['content'][0]["text"].split("Observation:")[0].strip(
                ) + "Observation: A screenshot and some texts. (Omitted in context.)"
                msg_pdf = curr_msg['content'][0]["text"].split("Observation:")[0].strip(
                ) + "Observation: A screenshot, a PDF file and some texts. (Omitted in context.)"
                curr_msg_clip = {
                    'role': curr_msg['role'],
                    'content': msg_no_pdf if "You downloaded a PDF file" not in curr_msg['content'][0]["text"] else msg_pdf
                }
                clipped_msg = [curr_msg_clip] + clipped_msg
    return clipped_msg


def clip_message_and_obs_text_only(msg, max_tree_num):
    clipped_msg = []
    tree_num = 0
    for idx in range(len(msg)):
        curr_msg = msg[len(msg) - 1 - idx]
        if curr_msg['role'] != 'user':
            clipped_msg = [curr_msg] + clipped_msg
        else:
            if tree_num < max_tree_num:
                tree_num += 1
                clipped_msg = [curr_msg] + clipped_msg
            else:
                msg_no_pdf = curr_msg['content'].split("Observation:")[0].strip(
                ) + "Observation: An accessibility tree. (Omitted in context.)"
                msg_pdf = curr_msg['content'].split("Observation:")[0].strip(
                ) + "Observation: An accessibility tree and a PDF file. (Omitted in context.)"
                curr_msg_clip = {
                    'role': curr_msg['role'],
                    'content': msg_no_pdf if "You downloaded a PDF file" not in curr_msg['content'] else msg_pdf
                }
                clipped_msg = [curr_msg_clip] + clipped_msg
    return clipped_msg


def print_message(json_object, save_dir=None):
    remove_b64code_obj = []
    for obj in json_object:
        if obj['role'] != 'user':
            # print(obj)
            logging.info(obj)
            remove_b64code_obj.append(obj)
        else:
            if type(obj['content']) == str:
                # print(obj)
                logging.info(obj)
                remove_b64code_obj.append(obj)
            else:
                print_obj = {
                    'role': obj['role'],
                    'content': obj['content']
                }
                for item in print_obj['content']:
                    if item['type'] == 'image_url':
                        item['image_url'] = {
                            "url": "data:image/png;base64,{b64_img}"}
                # print(print_obj)
                logging.info(print_obj)
                remove_b64code_obj.append(print_obj)
    if save_dir:
        with open(os.path.join(save_dir, 'interact_messages.json'), 'w', encoding='utf-8') as fw:
            json.dump(remove_b64code_obj, fw, indent=2)
    # return remove_b64code_obj


def get_webarena_accessibility_tree(browser, save_file=None):
    browser_info = fetch_browser_info(browser)
    accessibility_tree = fetch_page_accessibility_tree(
        browser_info, browser, current_viewport_only=True)
    content, obs_nodes_info = parse_accessibility_tree(accessibility_tree)
    content = clean_accesibility_tree(content)
    if save_file:
        with open(save_file + '.json', 'w', encoding='utf-8') as fw:
            json.dump(obs_nodes_info, fw, indent=2)
        with open(save_file + '.txt', 'w', encoding='utf-8') as fw:
            fw.write(content)

    return content, obs_nodes_info


def compare_images(img1_path, img2_path):
    img1 = Image.open(img1_path)
    img2 = Image.open(img2_path)

    img1_array = np.asarray(img1)
    img2_array = np.asarray(img2)

    difference = np.abs(img1_array - img2_array)

    total_difference = np.sum(difference)

    return total_difference


def get_pdf_retrieval_ans_from_assistant(client, pdf_path, task):
    # print("You download a PDF file that will be retrieved using the Assistant API.")
    logging.info(
        "You download a PDF file that will be retrieved using the Assistant API.")
    file = client.files.create(
        file=open(pdf_path, "rb"),
        purpose='assistants'
    )
    # print("Create assistant...")
    logging.info("Create assistant...")
    assistant = client.beta.assistants.create(
        instructions="You are a helpful assistant that can analyze the content of a PDF file and give an answer that matches the given task, or retrieve relevant content that matches the task.",
        model="gpt-4-1106-preview",
        tools=[{"type": "retrieval"}],
        file_ids=[file.id]
    )
    thread = client.beta.threads.create()
    message = client.beta.threads.messages.create(
        thread_id=thread.id,
        role="user",
        content=task,
        file_ids=[file.id]
    )
    run = client.beta.threads.runs.create(
        thread_id=thread.id,
        assistant_id=assistant.id
    )
    while True:
        # Retrieve the run status
        run_status = client.beta.threads.runs.retrieve(
            thread_id=thread.id, run_id=run.id)
        if run_status.status == 'completed':
            break
        time.sleep(2)
    messages = client.beta.threads.messages.list(thread_id=thread.id)
    messages_text = messages.data[0].content[0].text.value
    file_deletion_status = client.beta.assistants.files.delete(
        assistant_id=assistant.id,
        file_id=file.id
    )
    # print(file_deletion_status)
    logging.info(file_deletion_status)
    assistant_deletion_status = client.beta.assistants.delete(assistant.id)
    # print(assistant_deletion_status)
    logging.info(assistant_deletion_status)
    return messages_text
