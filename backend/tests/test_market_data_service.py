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

_MOCK_HISTORICAL: list[dict] = [
    {
        "date": "2025-01-10",
        "open": 184.0,
        "high": 186.0,
        "low": 183.0,
        "close": 185.5,
        "volume": 45000000,
    }
]

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

    @pytest.mark.asyncio
    async def test_employees_string_value_formatted(self) -> None:
        service = MarketDataService()
        profile = {**_MOCK_PROFILE[0], "fullTimeEmployees": "164000"}
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=(_MOCK_QUOTE[0], profile),
        ):
            result = await service.get_quote("AAPL")
        assert result["employees"] == "164,000"

    @pytest.mark.asyncio
    async def test_employees_missing_returns_empty_string(self) -> None:
        service = MarketDataService()
        profile = {k: v for k, v in _MOCK_PROFILE[0].items()
                   if k != "fullTimeEmployees"}
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=(_MOCK_QUOTE[0], profile),
        ):
            result = await service.get_quote("AAPL")
        assert result["employees"] == ""

    @pytest.mark.asyncio
    async def test_fallback_company_name_from_quote_name(self) -> None:
        service = MarketDataService()
        profile = {k: v for k, v in _MOCK_PROFILE[0].items()
                   if k != "companyName"}
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=(_MOCK_QUOTE[0], profile),
        ):
            result = await service.get_quote("AAPL")
        assert result["company_name"] == "Apple Inc."

    @pytest.mark.asyncio
    async def test_fallback_company_name_from_ticker(self) -> None:
        service = MarketDataService()
        quote = {k: v for k, v in _MOCK_QUOTE[0].items() if k != "name"}
        profile = {k: v for k, v in _MOCK_PROFILE[0].items()
                   if k != "companyName"}
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=(quote, profile),
        ):
            result = await service.get_quote("AAPL")
        assert result["company_name"] == "AAPL"

    @pytest.mark.asyncio
    async def test_headquarters_with_missing_fields(self) -> None:
        service = MarketDataService()
        profile = {k: v for k, v in _MOCK_PROFILE[0].items()
                   if k not in ("city", "state", "country")}
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            return_value=(_MOCK_QUOTE[0], profile),
        ):
            result = await service.get_quote("AAPL")
        assert result["headquarters"] == ""


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
            service, "_get_json", return_value=[]
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

    @pytest.mark.asyncio
    async def test_handles_dict_response_gracefully(self) -> None:
        service = MarketDataService()
        with patch.object(
            service, "_get_json", return_value={"error": "bad request"}
        ):
            result = await service.get_historical("AAPL")
        assert result == []

    @pytest.mark.asyncio
    async def test_multiple_items_sorted_oldest_first(self) -> None:
        service = MarketDataService()
        bars = [
            {"date": "2025-01-03", "open": 102, "high": 103,
             "low": 101, "close": 102.5, "volume": 100},
            {"date": "2025-01-02", "open": 101, "high": 102,
             "low": 100, "close": 101.5, "volume": 100},
            {"date": "2025-01-01", "open": 100, "high": 101,
             "low": 99, "close": 100.5, "volume": 100},
        ]
        with patch.object(service, "_get_json", return_value=bars):
            result = await service.get_historical("AAPL")
        assert result[0].date == "2025-01-01"
        assert result[-1].date == "2025-01-03"

    @pytest.mark.asyncio
    async def test_volume_none_handled(self) -> None:
        service = MarketDataService()
        bars = [
            {"date": "2025-01-01", "open": 100, "high": 101,
             "low": 99, "close": 100.5},
        ]
        with patch.object(service, "_get_json", return_value=bars):
            result = await service.get_historical("AAPL")
        assert len(result) == 1
        assert result[0].volume is None


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

    @pytest.mark.asyncio
    async def test_ticker_with_dot_triggers_search(self) -> None:
        service = MarketDataService()
        mock_results = [{"symbol": "BRK.B"}]
        with patch.object(
            service, "_search_ticker", return_value=mock_results
        ):
            result = await service.resolve_ticker("BRK.B")
        assert result == "BRK.B"

    @pytest.mark.asyncio
    async def test_whitespace_stripped(self) -> None:
        service = MarketDataService()
        result = await service.resolve_ticker("  AAPL  ")
        assert result == "AAPL"


# ---------------------------------------------------------------------------
# MarketDataService.search_ticker
# ---------------------------------------------------------------------------


class TestSearchTicker:
    """Tests for MarketDataService.search_ticker (fallback search)."""

    @pytest.mark.asyncio
    async def test_returns_uppercase_symbol(self) -> None:
        service = MarketDataService()
        with patch.object(
            service, "_search_ticker", return_value=_MOCK_SEARCH
        ):
            result = await service.search_ticker("microsoft")
        assert result == "MSFT"

    @pytest.mark.asyncio
    async def test_raises_stock_not_found_when_no_results(self) -> None:
        service = MarketDataService()
        with patch.object(service, "_search_ticker", return_value=[]):
            with pytest.raises(StockNotFoundError):
                await service.search_ticker("XYZNONEXIST")

    @pytest.mark.asyncio
    async def test_raises_stock_not_found_when_empty_symbol(self) -> None:
        service = MarketDataService()
        with patch.object(
            service, "_search_ticker", return_value=[{"symbol": ""}]
        ):
            with pytest.raises(StockNotFoundError):
                await service.search_ticker("something")

    @pytest.mark.asyncio
    async def test_calls_search_ticker_internal(self) -> None:
        service = MarketDataService()
        mock = AsyncMock(return_value=_MOCK_SEARCH)
        with patch.object(service, "_search_ticker", mock):
            await service.search_ticker("microsoft")
        mock.assert_called_once_with("MICROSOFT")

    @pytest.mark.asyncio
    async def test_raises_external_api_error_on_network_failure(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_search_ticker",
            side_effect=ExternalAPIError("FMP API", "timeout"),
        ):
            with pytest.raises(ExternalAPIError):
                await service.search_ticker("apple")


# ---------------------------------------------------------------------------
# MarketDataService._search_ticker — US exchange filtering
# ---------------------------------------------------------------------------


class TestSearchTickerUSFilter:
    """Tests for _search_ticker US-only exchange filtering."""

    @pytest.mark.asyncio
    async def test_filters_out_foreign_symbols_with_dots(self) -> None:
        service = MarketDataService()
        mixed_results = [
            {"symbol": "TSLA", "name": "Tesla Inc"},
            {"symbol": "TSLA.NE", "name": "Tesla Inc (NEO)"},
            {"symbol": "TSLA.DE", "name": "Tesla Inc (Frankfurt)"},
        ]
        with patch.object(service, "_get_json", new_callable=AsyncMock) as mock:
            mock.return_value = mixed_results
            result = await service._search_ticker("TESLA")
        assert len(result) == 1
        assert result[0]["symbol"] == "TSLA"

    @pytest.mark.asyncio
    async def test_keeps_all_us_symbols(self) -> None:
        service = MarketDataService()
        us_results = [
            {"symbol": "AAPL", "name": "Apple Inc"},
            {"symbol": "MSFT", "name": "Microsoft Corp"},
        ]
        with patch.object(service, "_get_json", new_callable=AsyncMock) as mock:
            mock.return_value = us_results
            result = await service._search_ticker("TECH")
        assert len(result) == 2

    @pytest.mark.asyncio
    async def test_returns_empty_when_all_foreign(self) -> None:
        service = MarketDataService()
        foreign_only = [
            {"symbol": "SAP.DE", "name": "SAP SE"},
            {"symbol": "NESN.SW", "name": "Nestle SA"},
        ]
        with patch.object(service, "_get_json", new_callable=AsyncMock) as mock:
            mock.return_value = foreign_only
            result = await service._search_ticker("SAP")
        assert result == []

    @pytest.mark.asyncio
    async def test_handles_missing_symbol_key(self) -> None:
        service = MarketDataService()
        bad_results = [{"name": "No Symbol Co"}, {"symbol": "AAPL", "name": "Apple"}]
        with patch.object(service, "_get_json", new_callable=AsyncMock) as mock:
            mock.return_value = bad_results
            result = await service._search_ticker("MISSING")
        # Entry without symbol has "" which has no dot, so it passes filter
        assert len(result) == 2


# ---------------------------------------------------------------------------
# MarketDataService._get_json
# ---------------------------------------------------------------------------


class TestGetJson:
    """Tests for MarketDataService._get_json error handling."""

    @pytest.mark.asyncio
    async def test_returns_parsed_json_on_success(self) -> None:
        service = MarketDataService()
        mock_resp = _mock_response([{"symbol": "AAPL"}])
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await service._get_json(
                "https://example.com", {"apikey": "test"}
            )
        assert result == [{"symbol": "AAPL"}]

    @pytest.mark.asyncio
    async def test_raises_external_api_error_on_timeout(self) -> None:
        service = MarketDataService()
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.TimeoutException("timed out")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(ExternalAPIError, match="timed out"):
                await service._get_json(
                    "https://example.com", {"apikey": "test"}
                )

    @pytest.mark.asyncio
    async def test_raises_external_api_error_on_http_status_error(self) -> None:
        service = MarketDataService()
        resp = httpx.Response(
            500,
            content=b"Internal Server Error",
            request=httpx.Request("GET", "https://example.com"),
        )
        mock_client = AsyncMock()
        mock_client.get.return_value = resp
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(ExternalAPIError, match="HTTP 500"):
                await service._get_json(
                    "https://example.com", {"apikey": "test"}
                )

    @pytest.mark.asyncio
    async def test_raises_external_api_error_on_generic_http_error(
        self,
    ) -> None:
        service = MarketDataService()
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.ConnectError("connection refused")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        with patch("httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(ExternalAPIError, match="Request failed"):
                await service._get_json(
                    "https://example.com", {"apikey": "test"}
                )


# ---------------------------------------------------------------------------
# MarketDataService._fetch_quote_and_profile
# ---------------------------------------------------------------------------


class TestFetchQuoteAndProfile:
    """Tests for MarketDataService._fetch_quote_and_profile."""

    @pytest.mark.asyncio
    async def test_returns_quote_and_profile_dicts(self) -> None:
        service = MarketDataService()
        quote_resp = _mock_response(_MOCK_QUOTE)
        profile_resp = _mock_response(_MOCK_PROFILE)
        with patch.object(
            service,
            "_parallel_get",
            return_value=(quote_resp, profile_resp),
        ):
            quote, profile = await service._fetch_quote_and_profile("AAPL")
        assert quote["symbol"] == "AAPL"
        assert profile["companyName"] == "Apple Inc."

    @pytest.mark.asyncio
    async def test_handles_empty_response_lists(self) -> None:
        service = MarketDataService()
        quote_resp = _mock_response([])
        profile_resp = _mock_response([])
        with patch.object(
            service,
            "_parallel_get",
            return_value=(quote_resp, profile_resp),
        ):
            quote, profile = await service._fetch_quote_and_profile("AAPL")
        assert quote == {}
        assert profile == {}

    @pytest.mark.asyncio
    async def test_raises_external_api_error_on_timeout(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_parallel_get",
            side_effect=httpx.TimeoutException("timed out"),
        ):
            with pytest.raises(ExternalAPIError, match="timed out"):
                await service._fetch_quote_and_profile("AAPL")

    @pytest.mark.asyncio
    async def test_raises_external_api_error_on_http_error(self) -> None:
        service = MarketDataService()
        with patch.object(
            service,
            "_parallel_get",
            side_effect=httpx.ConnectError("refused"),
        ):
            with pytest.raises(ExternalAPIError, match="Failed to fetch"):
                await service._fetch_quote_and_profile("AAPL")


# ---------------------------------------------------------------------------
# MarketDataService._compute_technicals
# ---------------------------------------------------------------------------


def _generate_historical_bars(count: int, base_price: float = 100.0) -> list[dict]:
    """Generate mock historical bars for technicals tests."""
    bars = []
    for i in range(count):
        price = base_price + i * 0.5
        bars.append({
            "date": f"2025-01-{i + 1:02d}",
            "open": price - 0.5,
            "high": price + 1.0,
            "low": price - 1.0,
            "close": price,
            "volume": 1000000,
        })
    # FMP returns newest-first
    return list(reversed(bars))


class TestComputeTechnicals:
    """Tests for MarketDataService._compute_technicals."""

    @pytest.mark.asyncio
    async def test_returns_empty_snapshot_when_less_than_20_bars(self) -> None:
        service = MarketDataService()
        bars = _generate_historical_bars(10)
        with patch.object(service, "_get_json", return_value=bars):
            result = await service._compute_technicals("AAPL")
        assert result.sma_20 is None
        assert result.rsi_14 is None

    @pytest.mark.asyncio
    async def test_computes_sma_20_correctly(self) -> None:
        service = MarketDataService()
        bars = _generate_historical_bars(30)
        with patch.object(service, "_get_json", return_value=bars):
            result = await service._compute_technicals("AAPL")
        assert result.sma_20 is not None
        assert isinstance(result.sma_20, float)

    @pytest.mark.asyncio
    async def test_computes_rsi_14(self) -> None:
        service = MarketDataService()
        # Need alternating prices so RSI has both gains and losses
        bars = []
        for i in range(50):
            price = 100 + (i % 5) * 2 - 4  # oscillates 96-104
            bars.append({
                "date": f"2025-{(i // 28) + 1:02d}-{(i % 28) + 1:02d}",
                "open": price - 0.5, "high": price + 1,
                "low": price - 1, "close": float(price), "volume": 1000000,
            })
        bars = list(reversed(bars))
        with patch.object(service, "_get_json", return_value=bars):
            result = await service._compute_technicals("AAPL")
        assert result.rsi_14 is not None
        assert 0 <= result.rsi_14 <= 100

    @pytest.mark.asyncio
    async def test_computes_macd_values(self) -> None:
        service = MarketDataService()
        bars = _generate_historical_bars(50)
        with patch.object(service, "_get_json", return_value=bars):
            result = await service._compute_technicals("AAPL")
        assert result.macd_line is not None
        assert result.macd_signal is not None
        assert result.macd_histogram is not None

    @pytest.mark.asyncio
    async def test_computes_bollinger_bands(self) -> None:
        service = MarketDataService()
        bars = _generate_historical_bars(30)
        with patch.object(service, "_get_json", return_value=bars):
            result = await service._compute_technicals("AAPL")
        assert result.bollinger_upper is not None
        assert result.bollinger_middle is not None
        assert result.bollinger_lower is not None
        assert result.bollinger_upper > result.bollinger_middle
        assert result.bollinger_middle > result.bollinger_lower
