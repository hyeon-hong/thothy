import asyncio
from agents.magnetic_one_agent import main


async def run():
    response = await main(
        task="Get the latest 10 news from hacker news site."
    )
    print(response)


if __name__ == "__main__":
    asyncio.run(run())
