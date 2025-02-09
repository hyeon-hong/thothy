import autogen
from typing import Dict, Any, Optional
from queue import Queue
import json
import ast

class WorkflowManager:
    def __init__(self, queue: Queue):
        self.queue = queue
        self.agent_history = []
        
    def update_history(self, recipient, messages, sender, config):
        """Keep track of agent messages"""
        message = {
            "sender": sender.name,
            "recipient": recipient.name,
            "message": messages[-1]["content"] if messages else "",
            "type": "message"
        }
        self.agent_history.append(message)
        self.queue.put(message)

    def execute_agent_code(self, code: str, prompt: str, config: Optional[Dict[str, Any]] = None):
        try:
            # Parse and execute the agent code
            parsed_code = ast.parse(code)
            
            # Create a safe execution environment
            local_vars = {}
            exec(code, {"autogen": autogen}, local_vars)
            
            # Find the agent variables in the local scope
            agents = {
                name: var for name, var in local_vars.items() 
                if isinstance(var, autogen.ConversableAgent)
            }
            
            # Register history tracking for all agents
            for agent in agents.values():
                agent.register_reply(
                    [autogen.Agent, None],
                    reply_func=self.update_history,
                    config={"callback": None},
                )
            
            # Find the initiating agent (usually user_proxy)
            user_proxy = next(
                (agent for name, agent in agents.items() if "user_proxy" in name.lower()),
                None
            )
            
            if not user_proxy:
                raise ValueError("No user proxy agent found in the code")
            
            # Find the assistant agent
            assistant = next(
                (agent for name, agent in agents.items() if name != user_proxy.name),
                None
            )
            
            if not assistant:
                raise ValueError("No assistant agent found in the code")
            
            # Initiate the chat
            user_proxy.initiate_chat(
                assistant,
                message=prompt,
                **config if config else {}
            )
            
            # Send completion message
            self.queue.put({
                "type": "completion",
                "history": self.agent_history
            })
            
        except Exception as e:
            self.queue.put({
                "type": "error",
                "error": str(e)
            })
            raise e 