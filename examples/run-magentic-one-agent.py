import asyncio
from agents.magnetic_one_agent import main


async def run():
    response = await main(
        prompt="Hello! Please help me write a simple Python script.",
        docker_image="python:3.9-slim",
        work_dir="/tmp",
    )
    print(response)


if __name__ == "__main__":
    asyncio.run(run())
