import os
import requests
from typing import Any, Dict, Optional, Tuple
from pydantic import BaseModel, Field
from langchain.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults

FINANCIAL_DATASETS_API_KEY = os.getenv("FINANCIAL_DATASETS_API_KEY")
BASE_URL = "https://api.financialdatasets.ai"
SEARXNG_URL = os.getenv("SEARXNG_URL")


def call_financial_dataset_api(endpoint: str, params: Dict[str, str]) -> Any:
    if not FINANCIAL_DATASETS_API_KEY:
        raise RuntimeError("FINANCIAL_DATASETS_API_KEY is not set")
    url = f"{BASE_URL}{endpoint}"
    response = requests.get(url, params=params, headers={
        "X-API-KEY": FINANCIAL_DATASETS_API_KEY
    })
    if not response.ok:
        try:
            res = response.json()
        except Exception:
            res = response.text
        raise RuntimeError(
            f"Failed to fetch data from {endpoint}. Response: {res}")
    return response.json()


class IncomeStatementsInput(BaseModel):
    ticker: str = Field(...,
                        description="The ticker of the stock. Example: 'AAPL'")
    period: Optional[str] = Field(
        "annual", description="The time period of the income statement. Example: 'annual'")
    limit: Optional[int] = Field(
        5, description="The number of income statements to return. Example: 5")


@tool("income_statements", args_schema=IncomeStatementsInput, response_format="content_and_artifact")
def income_statements_tool(input: IncomeStatementsInput = None, **kwargs) -> Tuple[str, dict]:
    """Retrieves income statements for a specified company, showing detailed financial performance over a chosen time period."""
    try:
        if input is None:
            input = IncomeStatementsInput(**kwargs)
        data = call_financial_dataset_api(
            "/financials/income-statements",
            {
                "ticker": input.ticker,
                "period": input.period or "annual",
                "limit": str(input.limit or 5),
            },
        )
        return str(data), {"title": "Income Statements", "income_statements": data}
    except Exception as e:
        return f"An error occurred while fetching income statements: {e}", {}


class BalanceSheetsInput(BaseModel):
    ticker: str = Field(...,
                        description="The ticker of the stock. Example: 'AAPL'")
    period: Optional[str] = Field(
        "annual", description="The time period of the balance sheet. Example: 'annual'")
    limit: Optional[int] = Field(
        5, description="The number of balance sheets to return. Example: 5")


@tool("balance_sheets", args_schema=BalanceSheetsInput, response_format="content_and_artifact")
def balance_sheets_tool(input: BalanceSheetsInput = None, **kwargs) -> Tuple[str, dict]:
    """Fetches balance sheets for a given company, providing a snapshot of its financial position at specific points in time."""
    try:
        if input is None:
            input = BalanceSheetsInput(**kwargs)
        data = call_financial_dataset_api(
            "/financials/balance-sheets",
            {
                "ticker": input.ticker,
                "period": input.period or "annual",
                "limit": str(input.limit or 5),
            },
        )
        return str(data), {"title": "Balance Sheets", "balance_sheets": data}
    except Exception as e:
        return f"An error occurred while fetching balance sheets: {e}", {}


class CashFlowStatementsInput(BaseModel):
    ticker: str = Field(...,
                        description="The ticker of the stock. Example: 'AAPL'")
    period: Optional[str] = Field(
        "annual", description="The period of the cash flow statement. Example: 'annual'")
    limit: Optional[int] = Field(
        5, description="The number of cash flow statements to return. Example: 5")


@tool("cash_flow_statements", args_schema=CashFlowStatementsInput, response_format="content_and_artifact")
def cash_flow_statements_tool(input: CashFlowStatementsInput = None, **kwargs) -> Tuple[str, dict]:
    """Obtains cash flow statements for a company, detailing the inflows and outflows of cash from operating, investing, and financing activities."""
    try:
        if input is None:
            input = CashFlowStatementsInput(**kwargs)
        data = call_financial_dataset_api(
            "/financials/cash-flow-statements",
            {
                "ticker": input.ticker,
                "period": input.period or "annual",
                "limit": str(input.limit or 5),
            },
        )
        return str(data), {"title": "Cash Flow Statements", "cash_flow_statements": data}
    except Exception as e:
        return f"An error occurred while fetching cash flow statements: {e}", {}


class CompanyFactsInput(BaseModel):
    ticker: str = Field(...,
                        description="The ticker of the company. Example: 'AAPL'")


@tool("company_facts", args_schema=CompanyFactsInput, response_format="content_and_artifact")
def company_facts_tool(input: CompanyFactsInput = None, **kwargs) -> Tuple[str, dict]:
    """Provides key facts and information about a specified company."""
    try:
        if input is None:
            input = CompanyFactsInput(**kwargs)
        data = call_financial_dataset_api(
            "/company/facts",
            {"ticker": input.ticker},
        )
        return str(data), {"title": "Company Facts", "company_facts": data}
    except Exception as e:
        return f"An error occurred while fetching company facts: {e}", {}


class PriceSnapshotInput(BaseModel):
    ticker: str = Field(...,
                        description="The ticker of the company. Example: 'AAPL'")


@tool("price_snapshot", args_schema=PriceSnapshotInput, response_format="content_and_artifact")
def price_snapshot_tool(input: PriceSnapshotInput = None, **kwargs) -> Tuple[str, dict]:
    """Retrieves the current stock price and related market data for a given company."""
    try:
        if input is None:
            input = PriceSnapshotInput(**kwargs)
        data = call_financial_dataset_api(
            "/prices/snapshot",
            {"ticker": input.ticker},
        )
        return str(data), {"title": "Price Snapshot", "price_snapshot": data}
    except Exception as e:
        return f"An error occurred while fetching price snapshots: {e}", {}


class PricesInput(BaseModel):
    ticker: str = Field(...,
                        description="The ticker of the company. Example: 'AAPL'")
    interval: Optional[str] = Field(
        None, description="The interval of the prices. Example: 'day'")
    interval_multiplier: Optional[str] = Field(
        None, description="The interval multiplier of the prices. Example: '1'")
    start_date: Optional[str] = Field(
        None, description="The start date of the prices in YYYY-MM-DD format. If not provided, defaults to one month ago.")
    end_date: Optional[str] = Field(
        None, description="The end date of the prices in YYYY-MM-DD format. If not provided, defaults to today's date.")


@tool("prices", args_schema=PricesInput, response_format="content_and_artifact")
def prices_tool(input: PricesInput = None, **kwargs) -> Tuple[str, dict]:
    """Retrieves historical stock price data for a specific ticker between two dates."""

    try:
        # If input is None, use kwargs to create a new PricesInput instance
        if input is None:
            input = PricesInput(**kwargs)

        # Get the start and end dates
        from datetime import datetime, timedelta
        start_date = input.start_date
        end_date = input.end_date

        # If start and end dates are not provided, set them to one month ago and today's date respectively
        if not start_date or not end_date:
            current_date = datetime.now()
            end_date = end_date or current_date.strftime("%Y-%m-%d")
            if not start_date:
                one_month_ago = current_date - timedelta(days=30)
                start_date = one_month_ago.strftime("%Y-%m-%d")

        # Call the financial dataset API
        data = call_financial_dataset_api(
            "/prices",
            {
                "ticker": input.ticker,
                "interval": input.interval or "day",
                "interval_multiplier": input.interval_multiplier or "1",
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        # Return the data
        return str(data), {"title": "Prices", "prices": data}

    except Exception as e:
        return f"An error occurred while fetching prices: {e}", {}


@tool("web_search", args_schema=None, response_format="content_and_artifact")
def web_search_tool(query: str) -> Tuple[str, dict]:
    """Search the web using Tavily and return the top result(s)."""
    try:
        tavily = TavilySearchResults(max_results=1)
        results = tavily.invoke(query)
        if not results:
            return "No results found.", {"title": "Web Search", "web_search": "No results found."}
        # Tavily returns a list of dicts with 'title', 'url', and 'content'
        top = results[0]
        content = f"{top.get('title', '')}: {top.get('url', '')}\n{top.get('content', '')}"
        return content, {"title": "Web Search", "web_search": top}
    except Exception as e:
        return f"Web search error: {e}", {}


ALL_TOOLS_LIST = [
    income_statements_tool,
    balance_sheets_tool,
    cash_flow_statements_tool,
    company_facts_tool,
    price_snapshot_tool,
    prices_tool,
    web_search_tool,
]

__all__ = ["ALL_TOOLS_LIST"]
