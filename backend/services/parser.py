from __future__ import annotations

from io import BytesIO, StringIO
from typing import BinaryIO

import pandas as pd
import yfinance as yf


REQUIRED_COLUMNS = {"ticker", "quantity", "buy_price"}


class PortfolioParserError(ValueError):
    """Raised when the uploaded portfolio CSV is invalid."""


def _read_csv(file: str | bytes | BinaryIO) -> pd.DataFrame:
    """Read CSV content from a file path, bytes, or file-like object."""
    if isinstance(file, bytes):
        return pd.read_csv(BytesIO(file))

    if isinstance(file, str):
        stripped = file.strip()
        if "\n" in stripped or "," in stripped:
            return pd.read_csv(StringIO(stripped))
        return pd.read_csv(file)

    return pd.read_csv(file)


def _validate_columns(dataframe: pd.DataFrame) -> None:
    """Ensure the CSV has all columns required by the app."""
    missing_columns = REQUIRED_COLUMNS - set(dataframe.columns)

    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        required = ", ".join(sorted(REQUIRED_COLUMNS))
        raise PortfolioParserError(
            f"CSV is missing required column(s): {missing}. Required columns: {required}."
        )


def _clean_holdings(dataframe: pd.DataFrame) -> pd.DataFrame:
    """Normalize ticker symbols and numeric fields before calculations."""
    cleaned = dataframe.copy()

    cleaned["ticker"] = cleaned["ticker"].astype(str).str.strip().str.upper()
    cleaned["quantity"] = pd.to_numeric(cleaned["quantity"], errors="coerce")
    cleaned["buy_price"] = pd.to_numeric(cleaned["buy_price"], errors="coerce")

    invalid_rows = cleaned[
        cleaned["ticker"].eq("")
        | cleaned["quantity"].isna()
        | cleaned["buy_price"].isna()
        | cleaned["quantity"].le(0)
        | cleaned["buy_price"].le(0)
    ]

    if not invalid_rows.empty:
        row_numbers = ", ".join(str(index + 2) for index in invalid_rows.index)
        raise PortfolioParserError(
            f"CSV contains invalid data on row(s): {row_numbers}. "
            "Ticker must not be empty, quantity must be positive, and buy_price must be positive."
        )

    return cleaned[["ticker", "quantity", "buy_price"]]


def fetch_stock_data(ticker: str) -> dict:
    """Fetch market data for one ticker using a single yfinance Ticker object."""
    yahoo_ticker = ticker if "." in ticker else f"{ticker}.NS"
    stock = yf.Ticker(yahoo_ticker)
    history = stock.history(period="1d")

    if history.empty:
        print(f"Warning: No data for {ticker}")
        return {}

    info = stock.info

    return {
        "current_price": float(history["Close"].iloc[-1]),
        "sector": info.get("sector"),
        "beta": info.get("beta"),
        "long_name": info.get("longName"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
    }


def parse_portfolio_csv(
    file: str | bytes | BinaryIO,
    *,
    fetch_prices: bool = True,
) -> list[dict]:
    """
    Convert a portfolio CSV into calculated holdings.

    Expected CSV columns:
    ticker, quantity, buy_price
    """
    dataframe = _read_csv(file)
    _validate_columns(dataframe)
    cleaned = _clean_holdings(dataframe)

    holdings: list[dict] = []

    for row in cleaned.to_dict(orient="records"):
        ticker = row["ticker"]
        quantity = float(row["quantity"])
        buy_price = float(row["buy_price"])
        invested_value = quantity * buy_price
        stock_data = fetch_stock_data(ticker) if fetch_prices else {}
        current_price = stock_data.get("current_price")
        if current_price is None:
            current_price = buy_price
        current_value = quantity * current_price if current_price is not None else None
        profit_loss = (
            current_value - invested_value if current_value is not None else None
        )
        profit_loss_percent = (
            round((profit_loss / invested_value) * 100, 2)
            if profit_loss is not None
            else None
        )

        holdings.append(
            {
                "ticker": ticker,
                "quantity": quantity,
                "buy_price": buy_price,
                "invested_value": round(invested_value, 2),
                "current_price": round(current_price, 2)
                if current_price is not None
                else None,
                "current_value": round(current_value, 2)
                if current_value is not None
                else None,
                "profit_loss": round(profit_loss, 2)
                if profit_loss is not None
                else None,
                "profit_loss_percent": profit_loss_percent,
                "sector": stock_data.get("sector"),
                "beta": stock_data.get("beta"),
                "long_name": stock_data.get("long_name"),
                "fifty_two_week_high": stock_data.get("fifty_two_week_high"),
                "fifty_two_week_low": stock_data.get("fifty_two_week_low"),
                "weight_percent": None,
            }
        )

    total_value = sum(
        holding["current_value"]
        for holding in holdings
        if holding["current_value"] is not None
    )

    for holding in holdings:
        holding["weight_percent"] = (
            round((holding["current_value"] / total_value) * 100, 2)
            if holding["current_value"] is not None and total_value > 0
            else None
        )

    return holdings
