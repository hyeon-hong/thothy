from typing import Literal

from pydantic import BaseModel, Field
from typing_extensions import Annotated

import autogen
from autogen.cache import Cache

from dotenv import load_dotenv
import os

load_dotenv()

config_list = [
    {
        'model': 'gpt-3.5-turbo',
        'api_key': os.getenv("OPENAI_API_KEY"),
        'tags': ['tool', '3.5-tool'],
    }
]

llm_config = {
    "config_list": config_list,
    "timeout": 120,
}

chatbot = autogen.AssistantAgent(
    name="chatbot",
    system_message="For currency exchange tasks, only use the functions you have been provided with. Reply TERMINATE when the task is done.",
    llm_config=llm_config,
)

# create a UserProxyAgent instance named "user_proxy"
user_proxy = autogen.UserProxyAgent(
    name="user_proxy",
    is_termination_msg=lambda x: x.get("content", "") and x.get(
        "content", "").rstrip().endswith("TERMINATE"),
    human_input_mode="NEVER",
    max_consecutive_auto_reply=10,
)

CurrencySymbol = Literal["USD", "EUR"]


def exchange_rate(base_currency: CurrencySymbol, quote_currency: CurrencySymbol) -> float:
    if base_currency == quote_currency:
        return 1.0
    elif base_currency == "USD" and quote_currency == "EUR":
        return 1 / 1.1
    elif base_currency == "EUR" and quote_currency == "USD":
        return 1.1
    else:
        raise ValueError(f"Unknown currencies {
                         base_currency}, {quote_currency}")


class Currency(BaseModel):
    currency: Annotated[CurrencySymbol,
                        Field(..., description="Currency symbol")]
    amount: Annotated[float, Field(0, description="Amount of currency", ge=0)]


# another way to register a function is to use register_function instead of register_for_execution and register_for_llm decorators
def currency_calculator(
    base: Annotated[Currency, "Base currency: amount and currency symbol"],
    quote_currency: Annotated[CurrencySymbol, "Quote currency symbol"] = "USD",
) -> Currency:
    quote_amount = exchange_rate(base.currency, quote_currency) * base.amount
    return Currency(amount=quote_amount, currency=quote_currency)


autogen.agentchat.register_function(
    currency_calculator,
    caller=chatbot,
    executor=user_proxy,
    description="Currency exchange calculator.",
)

with Cache.disk() as cache:
    # start the conversation
    res = user_proxy.initiate_chat(
        chatbot, message="How much is 123.45 USD in EUR?", summary_method="reflection_with_llm", cache=cache
    )
