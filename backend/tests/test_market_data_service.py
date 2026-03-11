"""Tests for MarketDataService — yfinance wrapper."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

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
# MarketDataService.get_quote
# ---------------------------------------------------------------------------


_MOCK_INFO: dict = {
    "symbol": "AAPL",
    "shortName": "Apple Inc.",
    "currentPrice": 185.50,
    "previousClose": 184.20,
    "open": 184.80,
    "dayHigh": 186.10,
    "dayLow": 184.00,
    "volume": 45000000,
    "marketCap": 2.8e12,
    "trailingPE": 28.5,
    "trailingEps": 6.51,
    "fiftyTwoWeekHigh": 199.62,
    "fiftyTwoWeekLow": 164.08,
    "dividendYield": 0.0054,
    "sector": "Technology",
    "industry": "Consumer Electronics",
    "city": "Cupertino",
    "state": "California",
    "country": "United States",
    "fullTimeEmployees": 164000,
    "longBusinessSummary": "Apple designs consumer electronics.",
}


class TestGetQuote:
    """Tests for MarketDataService.get_quote."""

    @pytest.mark.asyncio
    async def test_returns_dict_with_ticker(self) -> None:
        service = MarketDataService()
        with patch.object(
            MarketDataService, "_fetch_info", return_value=dict(_MOCK_INFO)
        ):
            result = await service.get_quote("AAPL")
        assert result["ticker"] == "AAPL"

    @pytest.mark.asyncio
    async def test_returns_correct_price(self) -> None:
        service = MarketDataService()
        with patch.object(
            MarketDataService, "_fetch_info", return_value=dict(_MOCK_INFO)
        ):
            result = await service.get_quote("AAPL")
        assert result["current_price"] == pytest.approx(185.50)

    @pytest.mark.asyncio
    async def test_returns_company_name(self) -> None:
        service = MarketDataService()
        with patch.object(
            MarketDataService, "_fetch_info", return_value=dict(_MOCK_INFO)
        ):
            result = await service.get_quote("AAPL")
        assert result["company_name"] == "Apple Inc."

    @pytest.mark.asyncio
    async def test_returns_formatted_market_cap(self) -> None:
        service = MarketDataService()
        with patch.object(
            MarketDataService, "_fetch_info", return_value=dict(_MOCK_INFO)
        ):
            result = await service.get_quote("AAPL")
        assert result["market_cap"] == "2.8T"

    @pytest.mark.asyncio
    async def test_returns_headquarters(self) -> None:
        service = MarketDataService()
        with patch.object(
            MarketDataService, "_fetch_info", return_value=dict(_MOCK_INFO)
        ):
            result = await service.get_quote("AAPL")
        assert "Cupertino" in result["headquarters"]
        assert "California" in result["headquarters"]

    @pytest.mark.asyncio
    async def test_returns_employee_count_formatted(self) -> None:
        service = MarketDataService()
        with patch.object(
            MarketDataService, "_fetch_info", return_value=dict(_MOCK_INFO)
        ):
            result = await service.get_quote("AAPL")
        assert result["employees"] == "164,000"

    @pytest.mark.asyncio
    async def test_raises_stock_not_found_when_no_price(self) -> None:
        """Empty info dict with no currentPrice raises StockNotFoundError."""
        service = MarketDataService()
        with patch.object(
            MarketDataService, "_fetch_info", return_value={}
        ):
            with pytest.raises(StockNotFoundError):
                await service.get_quote("INVALID")

    @pytest.mark.asyncio
    async def test_raises_external_api_error_on_exception(self) -> None:
        service = MarketDataService()
        with patch.object(
            MarketDataService,
            "_fetch_info",
            side_effect=ConnectionError("network down"),
        ):
            with pytest.raises(ExternalAPIError):
                await service.get_quote("AAPL")

    @pytest.mark.asyncio
    async def test_falls_back_to_regular_market_price(self) -> None:
        """Uses regularMarketPrice when currentPrice is missing."""
        info = {"regularMarketPrice": 185.0, "symbol": "AAPL"}
        service = MarketDataService()
        with patch.object(
            MarketDataService, "_fetch_info", return_value=info
        ):
            result = await service.get_quote("AAPL")
        assert result["current_price"] == pytest.approx(185.0)


# ---------------------------------------------------------------------------
# MarketDataService.get_historical
# ---------------------------------------------------------------------------


class TestGetHistorical:
    """Tests for MarketDataService.get_historical."""

    @pytest.mark.asyncio
    async def test_returns_list_of_historical_prices(self) -> None:
        mock_data = [
            HistoricalPrice(
                date="2025-01-10",
                open=184.0,
                high=186.0,
                low=183.0,
                close=185.5,
                volume=45000000,
            )
        ]
        service = MarketDataService()
        with patch.object(
            MarketDataService, "_fetch_history", return_value=mock_data
        ):
            result = await service.get_historical("AAPL")
        assert len(result) == 1
        assert isinstance(result[0], HistoricalPrice)

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_data(self) -> None:
        service = MarketDataService()
        with patch.object(
            MarketDataService, "_fetch_history", return_value=[]
        ):
            result = await service.get_historical("AAPL")
        assert result == []

    @pytest.mark.asyncio
    async def test_raises_external_api_error_on_exception(self) -> None:
        service = MarketDataService()
        with patch.object(
            MarketDataService,
            "_fetch_history",
            side_effect=ConnectionError("timeout"),
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
            MarketDataService,
            "_compute_technicals",
            return_value=mock_snap,
        ):
            result = await service.get_technicals("AAPL")
        assert isinstance(result, TechnicalSnapshot)
        assert result.sma_20 == pytest.approx(183.5)

    @pytest.mark.asyncio
    async def test_returns_empty_snapshot_on_failure(self) -> None:
        """Failures in technicals computation return empty snapshot."""
        service = MarketDataService()
        with patch.object(
            MarketDataService,
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
        """Short all-alpha strings are assumed to be tickers."""
        service = MarketDataService()
        result = await service.resolve_ticker("AAPL")
        assert result == "AAPL"

    @pytest.mark.asyncio
    async def test_lowercased_short_alpha_uppercased(self) -> None:
        """Lowercase tickers are uppercased."""
        service = MarketDataService()
        result = await service.resolve_ticker("msft")
        assert result == "MSFT"

    @pytest.mark.asyncio
    async def test_company_name_triggers_search(self) -> None:
        """Long strings trigger yfinance search."""
        service = MarketDataService()
        mock_results = [{"symbol": "MSFT", "shortname": "Microsoft Corp"}]
        with patch.object(
            MarketDataService, "_search_ticker", return_value=mock_results
        ):
            result = await service.resolve_ticker("MICROSOFT")
        assert result == "MSFT"

    @pytest.mark.asyncio
    async def test_no_results_raises_stock_not_found(self) -> None:
        """Empty search results raise StockNotFoundError."""
        service = MarketDataService()
        with patch.object(
            MarketDataService, "_search_ticker", return_value=[]
        ):
            with pytest.raises(StockNotFoundError):
                await service.resolve_ticker("XYZNONEXIST")

    @pytest.mark.asyncio
    async def test_numeric_input_triggers_search(self) -> None:
        """Non-alpha strings trigger search."""
        service = MarketDataService()
        mock_results = [{"symbol": "BRK.A"}]
        with patch.object(
            MarketDataService, "_search_ticker", return_value=mock_results
        ):
            result = await service.resolve_ticker("BERKSHIRE123")
        assert result == "BRK.A"

    @pytest.mark.asyncio
    async def test_search_timeout_raises_external_api_error(self) -> None:
        """Timeout during search raises ExternalAPIError."""
        from app.core.exceptions import ExternalAPIError

        service = MarketDataService()
        with patch.object(
            MarketDataService,
            "_search_ticker",
            side_effect=TimeoutError("timeout"),
        ):
            with pytest.raises(ExternalAPIError):
                await service.resolve_ticker("MICROSOFT")

    @pytest.mark.asyncio
    async def test_empty_symbol_in_result_raises_stock_not_found(self) -> None:
        """Search result with empty symbol raises StockNotFoundError."""
        service = MarketDataService()
        mock_results = [{"symbol": "", "shortname": "Unknown"}]
        with patch.object(
            MarketDataService, "_search_ticker", return_value=mock_results
        ):
            with pytest.raises(StockNotFoundError):
                await service.resolve_ticker("MICROSOFT")
