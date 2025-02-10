import os
import pytest
from unittest.mock import Mock, patch

from autogen_core import SingleThreadedAgentRuntime
from autogen_ext.models.openai import OpenAIChatCompletionClient

from agents.magnetic_one_agent import main

pytestmark = pytest.mark.asyncio


async def test_magnetic_one_agent():
    # Mock environment variables
    with patch.dict(os.environ, {'OPENAI_API_KEY': 'test_key'}):
        # Mock the OpenAI client with complete_chat method
        mock_client = Mock()
        mock_client.complete_chat = Mock(return_value="Test response")

        # Mock the runtime
        mock_runtime = Mock(spec=SingleThreadedAgentRuntime)
        result = "Test execution result"
        mock_runtime.send_message.return_value.content = result

        # Mock DockerCommandLineCodeExecutor
        docker_patch = patch(
            'agents.magnetic_one_agent.DockerCommandLineCodeExecutor',
            return_value=Mock()
        )
        runtime_patch = patch(
            'agents.magnetic_one_agent.SingleThreadedAgentRuntime',
            return_value=mock_runtime
        )
        client_patch = patch(
            'agents.magnetic_one_agent.OpenAIChatCompletionClient',
            return_value=mock_client
        )

        with docker_patch, runtime_patch, client_patch:
            # Test callback
            callback_called = False

            def test_callback(msg):
                nonlocal callback_called
                callback_called = True
                assert msg == result

            # Run the agent
            response = await main(
                prompt="Test prompt",
                docker_image="python:3.9-slim",
                working_dir="/test",
                env_vars={"TEST": "value"},
                message_callback=test_callback
            )

            # Verify results
            assert response == result
            assert callback_called
            assert mock_runtime.start.called
            assert mock_runtime.stop.called
            assert mock_runtime.register_agent.called


async def test_magnetic_one_agent_error_handling():
    # Test error handling when runtime.start() raises an exception
    mock_runtime = Mock(spec=SingleThreadedAgentRuntime)
    mock_runtime.start.side_effect = Exception("Test error")

    with patch.dict(os.environ, {'OPENAI_API_KEY': 'test_key'}):
        # Mock DockerCommandLineCodeExecutor
        docker_patch = patch(
            'agents.magnetic_one_agent.DockerCommandLineCodeExecutor',
            return_value=Mock()
        )
        runtime_patch = patch(
            'agents.magnetic_one_agent.SingleThreadedAgentRuntime',
            return_value=mock_runtime
        )
        client_patch = patch(
            'agents.magnetic_one_agent.OpenAIChatCompletionClient',
            return_value=Mock()
        )

        with docker_patch, runtime_patch, client_patch:
            with pytest.raises(Exception) as exc_info:
                await main("Test prompt")

            assert str(exc_info.value) == "Test error"
            assert mock_runtime.stop.called
