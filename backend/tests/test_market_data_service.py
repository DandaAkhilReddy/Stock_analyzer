"""Tests for MarketDataService — FMP API wrapper."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.core.exceptions import ExternalAPIError, StockNotFoundError
from app.models.analysis import HistoricalPrice, TechnicalSnapshot
from app.services.market_data_service import (
    MarketDataService,
    _format_market_cap,
    _safe_float,
    _safe_int,
)


# ---------------------------------------------------------------------------
# Unit tests for helper functions
# ---------------------------------------------------------------------------


class TestFormatMarketCap:
    """Tests for _format_market_cap."""

    def test_none_returns_none(self) -> None:
        assert _format_market_cap(None) is None

    def test_trillions(self) -> None:
        assert _format_market_cap(2.8e12) == "2.8T"

    def test_billions(self) -> None:
        assert _format_market_cap(150e9) == "150.0B"

    def test_millions(self) -> None:
        assert _format_market_cap(500e6) == "500.0M"

    def test_small_number(self) -> None:
        assert _format_market_cap(50000) == "50000"


class TestSafeFloat:
    """Tests for _safe_float."""

    def test_none_returns_none(self) -> None:
        assert _safe_float(None) is None

    def test_valid_float(self) -> None:
        assert _safe_float(185.5) == 185.5

    def test_valid_int(self) -> None:
        assert _safe_float(100) == 100.0

    def test_nan_returns_none(self) -> None:
        assert _safe_float(float("nan")) is None

    def test_inf_returns_none(self) -> None:
        assert _safe_float(float("inf")) is None

    def test_string_returns_none(self) -> None:
        assert _safe_float("not a number") is None

    def test_numeric_string(self) -> None:
        assert _safe_float("185.5") == 185.5


class TestSafeInt:
    """Tests for _safe_int."""

    def test_none_returns_none(self) -> None:
        assert _safe_int(None) is None

    def test_valid_int(self) -> None:
        assert _safe_int(45000000) == 45000000

    def test_valid_float_truncates(self) -> None:
        assert _safe_int(45000000.7) == 45000000

    def test_nan_returns_none(self) -> None:
        assert _safe_int(float("nan")) is None

    def test_string_returns_none(self) -> None:
        assert _safe_int("not a number") is None


# ---------------------------------------------------------------------------
# Mock FMP API responses
# ---------------------------------------------------------------------------

_MOCK_QUOTE: list[dict] = [
    {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "price": 185.50,
        "previousClose": 184.20,
        "open": 184.80,
        "dayHigh": 186.10,
        "dayLow": 184.00,
        "volume": 45000000,
        "marketCap": 2.8e12,
        "pe": 28.5,
        "eps": 6.51,
        "yearHigh": 199.62,
        "yearLow": 164.08,
    }
]

_MOCK_PROFILE: list[dict] = [
    {
        "companyName": "Apple Inc.",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "city": "Cupertino",
        "state": "California",
        "country": "United States",
        "fullTimeEmployees": 164000,
        "description": "Apple designs consumer electronics.",
        "ceo": "Tim Cook",
        "lastDiv": 0.96,
    }
]

_MOCK_HISTORICAL: dict = {
    "symbol": "AAPL",
    "historical": [
        {
            "date": "2025-01-10",
            "open": 184.0,
            "high": 186.0,
            "low": 183.0,
            "close": 185.5,
            "volume": 45000000,
        }
    ],
}

_MOCK_SEARCH: list[dict] = [
    {"symbol": "MSFT", "name": "Microsoft Corporation"}
]


def _mock_response(json_data: object, status_code: int = 200) -> httpx.Response:
    """Create a mock httpx.Response."""
    import json

    return httpx.Response(
        status_code=status_code,
        content=json.dumps(json_data).encode(),
        request=httpx.Request("GET", "https://example.com"),
    )


# ---------------------------------------------------------------------------
# MarketDataService.get_quote
# ---------------------------------------------------------------------------


class TestGetQuote:
    """Tests for MarketDataService.get_quote."""

    @pytest.mark.asyncio
    async def test_returns_dict_with_ticker(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=(_MOCK_QUOTE[0], _MOCK_PROFILE[0]),
        ):
            result = await service.get_quote("AAPL")
        assert result["ticker"] == "AAPL"

    @pytest.mark.asyncio
    async def test_returns_correct_price(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=(_MOCK_QUOTE[0], _MOCK_PROFILE[0]),
        ):
            result = await service.get_quote("AAPL")
        assert result["current_price"] == pytest.approx(185.50)

    @pytest.mark.asyncio
    async def test_returns_company_name(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=(_MOCK_QUOTE[0], _MOCK_PROFILE[0]),
        ):
            result = await service.get_quote("AAPL")
        assert result["company_name"] == "Apple Inc."

    @pytest.mark.asyncio
    async def test_returns_formatted_market_cap(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=(_MOCK_QUOTE[0], _MOCK_PROFILE[0]),
        ):
            result = await service.get_quote("AAPL")
        assert result["market_cap"] == "2.8T"

    @pytest.mark.asyncio
    async def test_returns_headquarters(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=(_MOCK_QUOTE[0], _MOCK_PROFILE[0]),
        ):
            result = await service.get_quote("AAPL")
        assert "Cupertino" in result["headquarters"]
        assert "California" in result["headquarters"]

    @pytest.mark.asyncio
    async def test_returns_employee_count_formatted(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=(_MOCK_QUOTE[0], _MOCK_PROFILE[0]),
        ):
            result = await service.get_quote("AAPL")
        assert result["employees"] == "164,000"

    @pytest.mark.asyncio
    async def test_raises_stock_not_found_when_no_price(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=({}, {}),
        ):
            with pytest.raises(StockNotFoundError):
                await service.get_quote("INVALID")

    @pytest.mark.asyncio
    async def test_raises_external_api_error_on_exception(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            side_effect=ExternalAPIError("FMP API", "network down"),
        ):
            with pytest.raises(ExternalAPIError):
                await service.get_quote("AAPL")


# ---------------------------------------------------------------------------
# MarketDataService.get_historical
# ---------------------------------------------------------------------------


class TestGetHistorical:
    """Tests for MarketDataService.get_historical."""

    @pytest.mark.asyncio
    async def test_returns_list_of_historical_prices(self) -> None:
        service = MarketDataService()
        with patch.object(
            service, "_get_json", return_value=_MOCK_HISTORICAL
        ):
            result = await service.get_historical("AAPL")
        assert len(result) == 1
        assert isinstance(result[0], HistoricalPrice)

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_data(self) -> None:
        service = MarketDataService()
        with patch.object(
            service, "_get_json", return_value={"historical": []}
        ):
            result = await service.get_historical("AAPL")
        assert result == []

    @pytest.mark.asyncio
    async def test_raises_external_api_error_on_exception(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_get_json",
            side_effect=ExternalAPIError("FMP API", "timeout"),
        ):
            with pytest.raises(ExternalAPIError):
                await service.get_historical("AAPL")


# ---------------------------------------------------------------------------
# MarketDataService.get_technicals
# ---------------------------------------------------------------------------


class TestGetTechnicals:
    """Tests for MarketDataService.get_technicals."""

    @pytest.mark.asyncio
    async def test_returns_technical_snapshot(self) -> None:
        mock_snap = TechnicalSnapshot(sma_20=183.5, rsi_14=62.3)
        service = MarketDataService()
        with patch.object(
            service, "_compute_technicals", return_value=mock_snap
        ):
            result = await service.get_technicals("AAPL")
        assert isinstance(result, TechnicalSnapshot)
        assert result.sma_20 == pytest.approx(183.5)

    @pytest.mark.asyncio
    async def test_returns_empty_snapshot_on_failure(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_compute_technicals",
            side_effect=ValueError("not enough data"),
        ):
            result = await service.get_technicals("AAPL")
        assert isinstance(result, TechnicalSnapshot)
        assert result.sma_20 is None


# ---------------------------------------------------------------------------
# MarketDataService.resolve_ticker
# ---------------------------------------------------------------------------


class TestResolveTicker:
    """Tests for MarketDataService.resolve_ticker."""

    @pytest.mark.asyncio
    async def test_short_alpha_returns_as_is(self) -> None:
        service = MarketDataService()
        result = await service.resolve_ticker("AAPL")
        assert result == "AAPL"

    @pytest.mark.asyncio
    async def test_lowercased_short_alpha_uppercased(self) -> None:
        service = MarketDataService()
        result = await service.resolve_ticker("msft")
        assert result == "MSFT"

    @pytest.mark.asyncio
    async def test_company_name_triggers_search(self) -> None:
        service = MarketDataService()
        with patch.object(
            service, "_search_ticker", return_value=_MOCK_SEARCH
        ):
            result = await service.resolve_ticker("MICROSOFT")
        assert result == "MSFT"

    @pytest.mark.asyncio
    async def test_no_results_raises_stock_not_found(self) -> None:
        service = MarketDataService()
        with patch.object(service, "_search_ticker", return_value=[]):
            with pytest.raises(StockNotFoundError):
                await service.resolve_ticker("XYZNONEXIST")

    @pytest.mark.asyncio
    async def test_numeric_input_triggers_search(self) -> None:
        service = MarketDataService()
        mock_results = [{"symbol": "BRK.A"}]
        with patch.object(
            service, "_search_ticker", return_value=mock_results
        ):
            result = await service.resolve_ticker("BERKSHIRE123")
        assert result == "BRK.A"

    @pytest.mark.asyncio
    async def test_search_error_raises_external_api_error(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_search_ticker",
            side_effect=ExternalAPIError("FMP API", "timeout"),
        ):
            with pytest.raises(ExternalAPIError):
                await service.resolve_ticker("MICROSOFT")

    @pytest.mark.asyncio
    async def test_empty_symbol_in_result_raises_stock_not_found(self) -> None:
        service = MarketDataService()
        mock_results = [{"symbol": "", "name": "Unknown"}]
        with patch.object(
            service, "_search_ticker", return_value=mock_results
        ):
            with pytest.raises(StockNotFoundError):
                await service.resolve_ticker("MICROSOFT")
