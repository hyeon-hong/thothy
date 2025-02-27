import uuid
import requests
import json
import time
from typing import Dict, Any, List


class TestLocalLangGraph:
    # Base URL for the LangGraph API
    BASE_URL = (
        "http://localhost:8000"  # Adjust if your server runs on different port
    )

    def get_headers(self) -> Dict[str, str]:
        """Get headers for API requests"""
        return {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def create_thread(self) -> Dict[str, Any]:
        """Create a new thread for conversation"""
        url = f"{self.BASE_URL}/threads"
        payload = {
            "thread_id": str(uuid.uuid4()),
            "metadata": {
                "purpose": "test_dialogue",
                "created_by": "test_suite"
            }
        }

        response = requests.post(
            url,
            headers=self.get_headers(),
            json=payload
        )
        response.raise_for_status()
        return response.json()

    def create_chat_message(self, content: str) -> Dict[str, Any]:
        """Create a chat message in the expected format"""
        return {
            "role": "user",
            "content": content
        }

    def create_chat_run(
        self, thread_id: str, input_message: str
    ) -> Dict[str, Any]:
        """Create a new chat run in the thread and wait for completion"""
        url = f"{self.BASE_URL}/threads/{thread_id}/runs/wait"
        
        # Format the message according to chat graph expectations
        message = self.create_chat_message(input_message)
        
        # Default configuration data
        config = {
            "configurable": {
                "user_id": "test-user",
                "supabase": "",
                "mem_assistant_id": "memory_graph",
                "model": "anthropic/claude-3-5-sonnet-20240620",
                "delay_seconds": 1,
                "system_prompt": (
                    "You are a helpful and friendly chatbot. "
                    "Get to know the user! Ask questions! Be spontaneous!"
                )
            }
        }
        
        payload = {
            "assistant_id": "chat_graph",  # Using graph_id as in OpenAPI
            "input": {
                "messages": [message]  # Send as list of messages
            },
            "metadata": {
                "type": "chat_message"
            },
            "config": config,  # Add configuration data
            # Queue concurrent runs instead of rejecting
            "multitask_strategy": "enqueue",
            "stream_mode": ["values"]  # Stream the values
        }

        try:
            response = requests.post(
                url,
                headers=self.get_headers(),
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 409:
                print("Concurrent run detected, retrying...")
                time.sleep(2)  # Wait briefly before retrying
                return self.create_chat_run(thread_id, input_message)
            elif e.response.status_code == 422:
                error_detail = json.loads(e.response.content).get('detail', '')
                print(f"Validation error: {error_detail}")
                raise
            else:
                print(f"HTTP error occurred: {e}")
                print(f"Response content: {e.response.content}")
                raise

    def get_thread_state(self, thread_id: str) -> Dict[str, Any]:
        """Get the current state of the thread"""
        url = f"{self.BASE_URL}/threads/{thread_id}/state"
        try:
            response = requests.get(
                url,
                headers=self.get_headers()
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            print(f"Error getting thread state: {e}")
            print(f"Response content: {e.response.content}")
            raise

    def wait_for_run_completion(self, thread_id: str, run_id: str):
        """Wait for a run to complete"""
        url = f"{self.BASE_URL}/threads/{thread_id}/runs/{run_id}/join"
        try:
            response = requests.get(
                url,
                headers=self.get_headers()
            )
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            print(f"Error waiting for run completion: {e}")
            print(f"Response content: {e.response.content}")
            raise

    def format_messages(self, messages: List[Dict[str, Any]]) -> str:
        """Format messages for display"""
        formatted = []
        for msg in messages:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            formatted.append(f"{role}: {content}")
        return "\n".join(formatted)

    def test_chat_dialogue(self):
        """Test creating a dialogue using the chat graph agent"""
        # Create a new thread
        thread = self.create_thread()
        thread_id = thread["thread_id"]
        print(f"Thread ID: {thread_id}")

        try:
            # Initial message
            initial_message = "My name is Alice and I love pizza."
            # Send message and wait for response
            response = self.create_chat_run(thread_id, initial_message)
            print("\nInitial Run Response:")
            print(json.dumps(response, indent=2))

            # Get the thread state after the message
            state = self.get_thread_state(thread_id)

            # Verify the response
            assert "values" in state, "Thread state should contain values"
            print("\nThread State After Initial Message:")
            if "messages" in state["values"]:
                print(self.format_messages(state["values"]["messages"]))
            else:
                print(json.dumps(state.get("values", {}), indent=2))

        except requests.exceptions.HTTPError as e:
            print(f"Error during conversation: {e}")
            if hasattr(e.response, 'content'):
                try:
                    error_detail = json.loads(e.response.content)
                    print(
                        f"Error details: {json.dumps(error_detail, indent=2)}"
                    )
                except json.JSONDecodeError:
                    print(f"Raw error content: {e.response.content}")
            raise
        except Exception as e:
            print(f"Unexpected error: {e}")
            raise


if __name__ == "__main__":
    # Run the test directly
    test = TestLocalLangGraph()
    test.test_chat_dialogue()
