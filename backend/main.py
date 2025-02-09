from agents.kokoro_tts_agent import main as kokoro_main
import os
import sys
from pathlib import Path
import asyncio
import json
import uuid
import importlib
import traceback
from threading import Thread
from queue import Queue
from typing import Optional, Dict, Any, Union

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

# Add project root to Python path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Now we can import from agents

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Queue for message streaming
message_queues: Dict[str, Queue] = {}

# Create outputs directory if it doesn't exist
outputs_dir = PROJECT_ROOT / "outputs"
outputs_dir.mkdir(exist_ok=True)

# Mount the outputs directory to serve audio files
app.mount("/outputs", StaticFiles(directory=str(outputs_dir)), name="outputs")


class AgentConfig(BaseModel):
    code: str
    prompt: str
    config: Optional[Dict[str, Any]] = None


class KokoroTTSRequest(BaseModel):
    text: str
    config: Optional[Dict[str, Any]] = None


def execute_agent_code(
    code: str,
    prompt: str,
    config: Optional[Dict[str, Any]],
    queue: Queue
) -> None:
    """Execute agent code in a separate thread."""
    try:
        # Create a temporary module to execute the code
        module = type('module', (), {})()

        # Execute the code in the module's context
        exec(code, module.__dict__)

        # Get the main function
        if not hasattr(module, 'main'):
            raise ValueError("Code must define a 'main' function")

        # Create a callback to handle messages
        def message_callback(message: str):
            queue.put({
                "type": "message",
                "content": message
            })

        # Run the main function
        response = asyncio.run(
            module.main(
                prompt,
                message_callback,
                **(config or {})
            )
        )

        # Send completion message
        queue.put({
            "type": "completion",
            "content": response
        })

    except Exception as e:
        # Get the full traceback
        error_traceback = traceback.format_exc()

        # Send error message
        queue.put({
            "type": "error",
            "content": f"Error executing agent code: {str(e)}\n{error_traceback}"
        })
        raise e


async def execute_kokoro_tts(text: str, queue: Queue, config: Optional[Dict[str, Any]] = None):
    try:
        # Create a callback to handle messages
        def message_callback(message: str):
            queue.put({
                "type": "message",
                "content": message
            })

        # Run the Kokoro TTS agent
        response = await kokoro_main(text, message_callback)

        # Send completion message
        queue.put({
            "type": "completion",
            "content": response
        })
    except Exception as e:
        queue.put({
            "type": "error",
            "content": str(e)
        })
        raise e


@app.post("/api/run-agent")
async def run_agent(agent_config: AgentConfig):
    try:
        # Create a unique session ID
        session_id = str(uuid.uuid4())

        # Create a new queue for this session
        message_queues[session_id] = Queue()

        # Start agent execution in a separate thread
        thread = Thread(
            target=execute_agent_code,
            args=(
                agent_config.code,
                agent_config.prompt,
                agent_config.config,
                message_queues[session_id]
            )
        )
        thread.start()

        return {"session_id": session_id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()

    if session_id not in message_queues:
        await websocket.close()
        return

    queue = message_queues[session_id]

    try:
        while True:
            if not queue.empty():
                message = queue.get()
                await websocket.send_text(json.dumps(message))

                # If this is the final message, close the connection
                if message.get("type") == "completion":
                    break
            await asyncio.sleep(0.1)
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
    finally:
        if session_id in message_queues:
            del message_queues[session_id]
        await websocket.close()


@app.post("/api/run/kokoro-tts-agent")
async def run_kokoro_tts(request: KokoroTTSRequest):
    try:
        # Create a unique session ID
        session_id = str(uuid.uuid4())

        # Create a new queue for this session
        message_queues[session_id] = Queue()

        # Start agent execution in a separate thread
        thread = Thread(
            target=lambda: asyncio.run(execute_kokoro_tts(
                request.text,
                message_queues[session_id],
                request.config
            ))
        )
        thread.start()

        return {"session_id": session_id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
