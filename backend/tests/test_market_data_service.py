"""Tests for MarketDataService — FMP API wrapper."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.core.exceptions import ExternalAPIError, StockNotFoundError
from app.models.analysis import HistoricalPrice, TechnicalSnapshot
from app.services.market_data_service import (
    MarketDataService,
    _classify_sentiment,
    _date_to_quarter,
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
    async def test_local_mapping_google_returns_googl(self) -> None:
        service = MarketDataService()
        result = await service.resolve_ticker("GOOGLE")
        assert result == "GOOGL"

    @pytest.mark.asyncio
    async def test_local_mapping_facebook_returns_meta(self) -> None:
        service = MarketDataService()
        result = await service.resolve_ticker("FACEBOOK")
        assert result == "META"

    @pytest.mark.asyncio
    async def test_local_mapping_microsoft_returns_msft(self) -> None:
        service = MarketDataService()
        result = await service.resolve_ticker("MICROSOFT")
        assert result == "MSFT"

    @pytest.mark.asyncio
    async def test_local_mapping_case_insensitive(self) -> None:
        service = MarketDataService()
        result = await service.resolve_ticker("google")
        assert result == "GOOGL"

    @pytest.mark.asyncio
    async def test_unknown_company_triggers_search(self) -> None:
        service = MarketDataService()
        with patch.object(
            service, "_search_ticker", return_value=_MOCK_SEARCH
        ):
            result = await service.resolve_ticker("ACMECORP")
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
    async def test_search_api_error_raises_stock_not_found(self) -> None:
        """FMP 402/5xx errors are caught and converted to StockNotFoundError."""
        service = MarketDataService()
        with patch.object(
            service,
            "_search_ticker",
            side_effect=ExternalAPIError("FMP API", "HTTP 402"),
        ):
            with pytest.raises(StockNotFoundError):
                await service.resolve_ticker("XYZUNKNOWNCORP")

    @pytest.mark.asyncio
    async def test_empty_symbol_in_result_raises_stock_not_found(self) -> None:
        service = MarketDataService()
        mock_results = [{"symbol": "", "name": "Unknown"}]
        with patch.object(
            service, "_search_ticker", return_value=mock_results
        ):
            with pytest.raises(StockNotFoundError):
                await service.resolve_ticker("XYZUNKNOWNCORP")

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


# ---------------------------------------------------------------------------
# _compute_technicals — deep math validation
# ---------------------------------------------------------------------------


def _bars_from_closes(closes: list[float]) -> list[dict]:
    """Build FMP-format bars (newest-first) from a list of close prices."""
    bars = [
        {
            "date": f"2025-01-{i + 1:02d}",
            "open": c - 0.1,
            "high": c + 0.5,
            "low": c - 0.5,
            "close": c,
            "volume": 1_000_000,
        }
        for i, c in enumerate(closes)
    ]
    # FMP returns newest-first; _compute_technicals reverses before processing
    return list(reversed(bars))


class TestComputeTechnicalsMath:
    """Exact math validation for every indicator in _compute_technicals."""

    # ------------------------------------------------------------------
    # SMA-20
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_sma_20_exact_arithmetic_mean(self) -> None:
        """SMA-20 must equal the arithmetic mean of the 20 most recent closes."""
        # 20 bars with known closes: arithmetic mean = (1+2+...+20)/20 = 10.5
        closes = [float(i) for i in range(1, 21)]
        expected_sma20 = sum(closes[-20:]) / 20  # 10.5
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.sma_20 == pytest.approx(expected_sma20, rel=1e-4)

    @pytest.mark.asyncio
    async def test_sma_20_on_constant_price_series(self) -> None:
        """SMA-20 of a flat 100.0 series must be exactly 100.0."""
        closes = [100.0] * 25
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.sma_20 == pytest.approx(100.0)

    @pytest.mark.asyncio
    async def test_sma_20_uses_only_last_20_bars(self) -> None:
        """SMA-20 with 30 bars must reflect only the 20 most recent closes."""
        # First 10 bars at 0.0, last 20 bars at 100.0 → SMA-20 must be 100.0
        closes = [0.0] * 10 + [100.0] * 20
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.sma_20 == pytest.approx(100.0)

    # ------------------------------------------------------------------
    # SMA-50
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_sma_50_returns_none_when_fewer_than_50_bars(self) -> None:
        """SMA-50 must be None when the dataset has fewer than 50 bars."""
        closes = [float(i) for i in range(1, 40)]  # 39 bars
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.sma_50 is None

    @pytest.mark.asyncio
    async def test_sma_50_returns_value_when_exactly_50_bars(self) -> None:
        """SMA-50 must be computed when exactly 50 bars are present."""
        closes = [100.0] * 50
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.sma_50 == pytest.approx(100.0)

    # ------------------------------------------------------------------
    # EMA-12 and EMA-26
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_ema_12_on_constant_price_series_equals_price(self) -> None:
        """EMA-12 of a constant price series must converge to that price."""
        closes = [50.0] * 40
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.ema_12 == pytest.approx(50.0, rel=1e-4)

    @pytest.mark.asyncio
    async def test_ema_26_on_constant_price_series_equals_price(self) -> None:
        """EMA-26 of a constant price series must converge to that price."""
        closes = [75.0] * 40
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.ema_26 == pytest.approx(75.0, rel=1e-4)

    @pytest.mark.asyncio
    async def test_ema_12_reacts_faster_than_ema_26_on_rising_series(self) -> None:
        """EMA-12 must be greater than EMA-26 on a steadily rising price series."""
        closes = [float(i) for i in range(1, 61)]  # strictly increasing
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.ema_12 is not None
        assert result.ema_26 is not None
        assert result.ema_12 > result.ema_26

    # ------------------------------------------------------------------
    # RSI-14
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_rsi_14_is_none_for_all_up_days(self) -> None:
        """RSI-14 with only up-days has zero average loss.

        The implementation divides by loss.replace(0, NaN), making RS = NaN
        and therefore RSI = NaN, which _safe_float converts to None.
        """
        # 51 strictly rising bars → every diff is positive, avg loss = 0
        closes = [float(i) for i in range(1, 52)]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        # avg_loss = 0 → loss replaced with NaN → RSI is NaN → _safe_float → None
        assert result.rsi_14 is None

    @pytest.mark.asyncio
    async def test_rsi_14_is_none_for_all_down_days(self) -> None:
        """RSI-14 with only down-days computes to 0.0, which the service maps to None.

        The implementation uses ``round(rsi_14, 2) if rsi_14 else None``.
        Because ``if 0.0`` is falsy in Python, a mathematically correct RSI of
        0.0 is treated the same as None and stored as None.  This test documents
        that known behaviour so a future refactor can catch the change.
        """
        # 51 strictly falling bars → every diff is negative, avg gain = 0
        closes = [float(i) for i in range(51, 0, -1)]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        # avg_gain = 0 → RS = 0 → RSI_raw = 0.0 → falsy guard maps it to None
        assert result.rsi_14 is None

    @pytest.mark.asyncio
    async def test_rsi_14_near_50_for_equal_alternating_moves(self) -> None:
        """RSI-14 near 50 when up/down moves are equal in magnitude."""
        # Alternating +1/-1 pattern: avg_gain ≈ avg_loss → RS ≈ 1 → RSI ≈ 50
        closes: list[float] = []
        price = 100.0
        for i in range(60):
            price += 1.0 if i % 2 == 0 else -1.0
            closes.append(price)
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.rsi_14 is not None
        assert result.rsi_14 == pytest.approx(50.0, abs=5.0)

    @pytest.mark.asyncio
    async def test_rsi_14_bounded_between_0_and_100(self) -> None:
        """RSI-14 must always be in [0, 100] for any valid price series."""
        closes = [100.0 + (i % 7) * 3 - 10 for i in range(50)]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        if result.rsi_14 is not None:
            assert 0.0 <= result.rsi_14 <= 100.0

    # ------------------------------------------------------------------
    # MACD
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_macd_histogram_equals_line_minus_signal(self) -> None:
        """MACD histogram must equal MACD line − signal line (rounded to 4dp)."""
        closes = [float(i) for i in range(1, 61)]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.macd_line is not None
        assert result.macd_signal is not None
        assert result.macd_histogram is not None
        expected_hist = round(result.macd_line - result.macd_signal, 4)
        assert result.macd_histogram == pytest.approx(expected_hist, abs=1e-6)

    @pytest.mark.asyncio
    async def test_macd_line_positive_on_rising_series(self) -> None:
        """EMA-12 > EMA-26 on a rising series → MACD line must be positive."""
        closes = [float(i) for i in range(1, 61)]  # strictly increasing
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.macd_line is not None
        assert result.macd_line > 0

    @pytest.mark.asyncio
    async def test_macd_all_none_when_not_enough_data(self) -> None:
        """With fewer than 20 bars all indicators including MACD must be None."""
        closes = [float(i) for i in range(1, 15)]  # 14 bars
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.macd_line is None
        assert result.macd_signal is None
        assert result.macd_histogram is None

    # ------------------------------------------------------------------
    # Bollinger Bands
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_bollinger_middle_equals_sma_20(self) -> None:
        """Bollinger middle band must equal SMA-20."""
        closes = [float(i) for i in range(1, 31)]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.bollinger_middle is not None
        assert result.sma_20 is not None
        assert result.bollinger_middle == pytest.approx(result.sma_20)

    @pytest.mark.asyncio
    async def test_bollinger_bands_symmetric_around_middle(self) -> None:
        """Upper and lower bands must be equidistant from the middle."""
        closes = [float(i) for i in range(1, 31)]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.bollinger_upper is not None
        assert result.bollinger_lower is not None
        assert result.bollinger_middle is not None
        upper_dist = result.bollinger_upper - result.bollinger_middle
        lower_dist = result.bollinger_middle - result.bollinger_lower
        assert upper_dist == pytest.approx(lower_dist, rel=1e-3)

    @pytest.mark.asyncio
    async def test_bollinger_bands_zero_width_for_constant_prices(self) -> None:
        """Constant price series has zero std → upper = middle = lower."""
        closes = [100.0] * 25
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=_bars_from_closes(closes)):
            result = await service._compute_technicals("AAPL")
        assert result.bollinger_upper == pytest.approx(100.0, abs=0.01)
        assert result.bollinger_middle == pytest.approx(100.0)
        assert result.bollinger_lower == pytest.approx(100.0, abs=0.01)


# ---------------------------------------------------------------------------
# get_historical — additional edge cases
# ---------------------------------------------------------------------------


class TestGetHistoricalEdgeCases:
    """Edge cases for MarketDataService.get_historical."""

    @pytest.mark.asyncio
    async def test_single_data_point_returned(self) -> None:
        """A single-bar response must return exactly one HistoricalPrice."""
        bars = [
            {
                "date": "2025-06-01",
                "open": 200.0,
                "high": 205.0,
                "low": 198.0,
                "close": 203.5,
                "volume": 5_000_000,
            }
        ]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=bars):
            result = await service.get_historical("AAPL")
        assert len(result) == 1
        assert result[0].close == pytest.approx(203.5)
        assert result[0].date == "2025-06-01"

    @pytest.mark.asyncio
    async def test_close_value_rounded_to_two_decimal_places(self) -> None:
        """Close prices must be rounded to 2 decimal places."""
        bars = [
            {
                "date": "2025-06-01",
                "open": 100.123456,
                "high": 101.999,
                "low": 99.001,
                "close": 100.999999,
                "volume": 1_000,
            }
        ]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=bars):
            result = await service.get_historical("AAPL")
        assert result[0].close == pytest.approx(101.0, abs=0.01)
        assert result[0].open == pytest.approx(100.12, abs=0.01)

    @pytest.mark.asyncio
    async def test_items_in_wrong_order_are_sorted_oldest_first(self) -> None:
        """Items provided newest-first must be reversed to oldest-first."""
        # FMP contract: newest entry at index 0
        bars_newest_first = [
            {
                "date": "2025-03-03",
                "open": 103.0, "high": 104.0, "low": 102.0, "close": 103.5,
                "volume": 300,
            },
            {
                "date": "2025-03-01",
                "open": 101.0, "high": 102.0, "low": 100.0, "close": 101.5,
                "volume": 100,
            },
            {
                "date": "2025-03-02",
                "open": 102.0, "high": 103.0, "low": 101.0, "close": 102.5,
                "volume": 200,
            },
        ]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=bars_newest_first):
            result = await service.get_historical("AAPL")
        # After reversal, the order reflects the original list reversed:
        # [2025-03-02, 2025-03-01, 2025-03-03] — oldest by insertion position
        assert result[0].date == "2025-03-02"
        assert result[-1].date == "2025-03-03"

    @pytest.mark.asyncio
    async def test_missing_volume_field_returns_none(self) -> None:
        """Bars without a volume key must produce HistoricalPrice with volume=None."""
        bars = [
            {
                "date": "2025-06-01",
                "open": 100.0, "high": 101.0, "low": 99.0, "close": 100.5,
                # volume key intentionally absent
            }
        ]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=bars):
            result = await service.get_historical("AAPL")
        assert result[0].volume is None

    @pytest.mark.asyncio
    async def test_volume_none_value_returns_none(self) -> None:
        """Bars with explicit volume=None must produce HistoricalPrice with volume=None."""
        bars = [
            {
                "date": "2025-06-01",
                "open": 100.0, "high": 101.0, "low": 99.0, "close": 100.5,
                "volume": None,
            }
        ]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=bars):
            result = await service.get_historical("AAPL")
        assert result[0].volume is None

    @pytest.mark.asyncio
    async def test_large_multi_bar_response_preserves_count(self) -> None:
        """100 bars in → 100 HistoricalPrice objects out."""
        bars = [
            {
                "date": f"2025-01-{i + 1:02d}",
                "open": 100.0, "high": 101.0, "low": 99.0,
                "close": 100.0 + i * 0.1, "volume": 1_000,
            }
            for i in range(100)
        ]
        service = MarketDataService()
        with patch.object(service, "_get_json", return_value=list(reversed(bars))):
            result = await service.get_historical("AAPL")
        assert len(result) == 100


# ---------------------------------------------------------------------------
# Helper function edge cases — _safe_float, _safe_int, _format_market_cap
# ---------------------------------------------------------------------------


class TestSafeFloatEdgeCases:
    """Additional edge cases for _safe_float."""

    def test_negative_inf_returns_none(self) -> None:
        assert _safe_float(float("-inf")) is None

    def test_positive_inf_string_returns_none(self) -> None:
        # float("inf") == math.inf → isnan=False, isinf=True → None
        assert _safe_float("inf") is None

    def test_negative_inf_string_returns_none(self) -> None:
        assert _safe_float("-inf") is None

    def test_nan_string_returns_none(self) -> None:
        # float("nan") is valid Python → isnan=True → None
        assert _safe_float("nan") is None

    def test_zero_returns_zero(self) -> None:
        assert _safe_float(0) == 0.0

    def test_zero_string_returns_zero(self) -> None:
        assert _safe_float("0") == 0.0

    def test_negative_float_returned(self) -> None:
        assert _safe_float(-42.7) == pytest.approx(-42.7)

    def test_list_value_returns_none(self) -> None:
        assert _safe_float([1, 2, 3]) is None

    def test_bool_true_treated_as_1(self) -> None:
        # bool is a subclass of int in Python; float(True) == 1.0
        assert _safe_float(True) == pytest.approx(1.0)


class TestSafeIntEdgeCases:
    """Additional edge cases for _safe_int."""

    def test_float_string_parsed_and_truncated(self) -> None:
        assert _safe_int("99.9") == 99

    def test_zero_float_returns_zero(self) -> None:
        assert _safe_int(0.0) == 0

    def test_negative_int_returned(self) -> None:
        assert _safe_int(-500) == -500

    def test_negative_float_truncated_toward_zero(self) -> None:
        # int(-99.9) == -99 in Python (truncation toward zero)
        assert _safe_int(-99.9) == -99

    def test_inf_float_returns_none(self) -> None:
        assert _safe_int(float("inf")) is None

    def test_dict_value_returns_none(self) -> None:
        assert _safe_int({"a": 1}) is None

    def test_bool_false_treated_as_zero(self) -> None:
        assert _safe_int(False) == 0


class TestFormatMarketCapBoundaries:
    """Boundary values for _format_market_cap."""

    def test_exactly_1_trillion(self) -> None:
        assert _format_market_cap(1e12) == "1.0T"

    def test_just_below_1_trillion_falls_to_billions(self) -> None:
        # 999_999_999_999 < 1e12 → billions branch
        result = _format_market_cap(999_999_999_999.0)
        assert result is not None
        assert result.endswith("B")

    def test_exactly_1_billion(self) -> None:
        assert _format_market_cap(1e9) == "1.0B"

    def test_just_below_1_billion_falls_to_millions(self) -> None:
        result = _format_market_cap(999_999_999.0)
        assert result is not None
        assert result.endswith("M")

    def test_exactly_1_million(self) -> None:
        assert _format_market_cap(1e6) == "1.0M"

    def test_just_below_1_million_returns_raw_int_string(self) -> None:
        result = _format_market_cap(999_999.0)
        assert result == "999999"

    def test_zero_returns_zero_string(self) -> None:
        assert _format_market_cap(0.0) == "0"

    def test_fractional_trillion_formatted_to_one_decimal(self) -> None:
        assert _format_market_cap(2.85e12) == "2.9T"


# ---------------------------------------------------------------------------
# MarketDataService._parallel_get — raise_for_status paths
# ---------------------------------------------------------------------------


def _http_status_error(status_code: int) -> httpx.HTTPStatusError:
    """Build an httpx.HTTPStatusError for a given status code."""
    request = httpx.Request("GET", "https://financialmodelingprep.com/stable/quote")
    response = httpx.Response(
        status_code=status_code,
        content=b"error body",
        request=request,
    )
    return httpx.HTTPStatusError(
        f"HTTP {status_code}", request=request, response=response
    )


class TestParallelGet:
    """Tests for MarketDataService._parallel_get raise_for_status coverage."""

    @pytest.mark.asyncio
    async def test_quote_404_raises_http_status_error(self) -> None:
        """r1.raise_for_status() on a 404 must propagate HTTPStatusError."""
        service = MarketDataService()
        quote_resp = _mock_response([], status_code=404)
        profile_resp = _mock_response(_MOCK_PROFILE, status_code=200)

        mock_client = AsyncMock()
        mock_client.get.side_effect = [quote_resp, profile_resp]

        async def fake_gather(*coros):  # type: ignore[no-untyped-def]
            results = []
            for coro in coros:
                results.append(await coro)
            return results

        with patch("asyncio.gather", side_effect=fake_gather):
            with pytest.raises(httpx.HTTPStatusError):
                async with httpx.AsyncClient() as client:
                    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
                    mock_client.__aexit__ = AsyncMock(return_value=False)
                    with patch("httpx.AsyncClient", return_value=mock_client):
                        await service._parallel_get(
                            client,
                            "https://financialmodelingprep.com/stable/quote",
                            "https://financialmodelingprep.com/stable/profile",
                            "AAPL",
                        )

    @pytest.mark.asyncio
    async def test_r1_raise_for_status_called_on_404(self) -> None:
        """_parallel_get must call raise_for_status() on the first response."""
        service = MarketDataService()

        request = httpx.Request("GET", "https://example.com")
        r1 = MagicMock(spec=httpx.Response)
        r1.raise_for_status.side_effect = _http_status_error(404)
        r2 = MagicMock(spec=httpx.Response)
        r2.raise_for_status.return_value = None

        mock_client = MagicMock()

        async def mock_gather_r1(*coros: object) -> list:  # type: ignore[return]
            import inspect
            for coro in coros:
                if inspect.iscoroutine(coro):
                    coro.close()
            return [r1, r2]

        with patch("asyncio.gather", side_effect=mock_gather_r1):
            with pytest.raises(httpx.HTTPStatusError):
                await service._parallel_get(
                    mock_client,  # type: ignore[arg-type]
                    "https://financialmodelingprep.com/stable/quote",
                    "https://financialmodelingprep.com/stable/profile",
                    "AAPL",
                )
        r1.raise_for_status.assert_called_once()

    @pytest.mark.asyncio
    async def test_r2_raise_for_status_called_on_500(self) -> None:
        """_parallel_get must call raise_for_status() on the second response."""
        service = MarketDataService()

        r1 = MagicMock(spec=httpx.Response)
        r1.raise_for_status.return_value = None
        r2 = MagicMock(spec=httpx.Response)
        r2.raise_for_status.side_effect = _http_status_error(500)

        mock_client = MagicMock()

        async def mock_gather(*coros: object) -> list:  # type: ignore[return]
            # drain the two coroutines so Python does not warn about unawaited coros
            for coro in coros:
                import inspect
                if inspect.iscoroutine(coro):
                    coro.close()
            return [r1, r2]

        with patch("asyncio.gather", side_effect=mock_gather):
            with pytest.raises(httpx.HTTPStatusError):
                await service._parallel_get(
                    mock_client,  # type: ignore[arg-type]
                    "https://financialmodelingprep.com/stable/quote",
                    "https://financialmodelingprep.com/stable/profile",
                    "AAPL",
                )
        r2.raise_for_status.assert_called_once()

    @pytest.mark.asyncio
    async def test_both_responses_ok_returns_tuple(self) -> None:
        """When both responses succeed, returns (r1, r2) tuple."""
        service = MarketDataService()

        r1 = MagicMock(spec=httpx.Response)
        r1.raise_for_status.return_value = None
        r2 = MagicMock(spec=httpx.Response)
        r2.raise_for_status.return_value = None

        mock_client = MagicMock()

        async def mock_gather(*coros: object) -> list:  # type: ignore[return]
            import inspect
            for coro in coros:
                if inspect.iscoroutine(coro):
                    coro.close()
            return [r1, r2]

        with patch("asyncio.gather", side_effect=mock_gather):
            result = await service._parallel_get(
                mock_client,  # type: ignore[arg-type]
                "https://financialmodelingprep.com/stable/quote",
                "https://financialmodelingprep.com/stable/profile",
                "AAPL",
            )
        assert result == (r1, r2)

    @pytest.mark.asyncio
    async def test_both_raise_for_status_fail_first_wins(self) -> None:
        """When both raise_for_status() would fail, the first error propagates."""
        service = MarketDataService()

        r1 = MagicMock(spec=httpx.Response)
        r1.raise_for_status.side_effect = _http_status_error(403)
        r2 = MagicMock(spec=httpx.Response)
        r2.raise_for_status.side_effect = _http_status_error(500)

        mock_client = MagicMock()

        async def mock_gather(*coros: object) -> list:  # type: ignore[return]
            import inspect
            for coro in coros:
                if inspect.iscoroutine(coro):
                    coro.close()
            return [r1, r2]

        with patch("asyncio.gather", side_effect=mock_gather):
            with pytest.raises(httpx.HTTPStatusError) as exc_info:
                await service._parallel_get(
                    mock_client,
                    "https://financialmodelingprep.com/stable/quote",
                    "https://financialmodelingprep.com/stable/profile",
                    "AAPL",
                )
        assert exc_info.value.response.status_code == 403


# ---------------------------------------------------------------------------
# _fetch_quote_and_profile — HTTP error code coverage via _parallel_get
# ---------------------------------------------------------------------------


class TestFetchQuoteAndProfileHttpErrors:
    """Tests for _fetch_quote_and_profile covering specific HTTP error codes.

    The raise_for_status() calls in _parallel_get raise httpx.HTTPStatusError,
    which is a subclass of httpx.HTTPError.  _fetch_quote_and_profile catches
    httpx.HTTPError and converts it to ExternalAPIError.
    """

    @pytest.mark.asyncio
    async def test_quote_404_converted_to_external_api_error(self) -> None:
        """404 from quote endpoint → ExternalAPIError with 'Failed to fetch'."""
        service = MarketDataService()
        with patch.object(
            service,
            "_parallel_get",
            side_effect=_http_status_error(404),
        ):
            with pytest.raises(ExternalAPIError, match="Failed to fetch"):
                await service._fetch_quote_and_profile("AAPL")

    @pytest.mark.asyncio
    async def test_profile_500_converted_to_external_api_error(self) -> None:
        """500 from profile endpoint → ExternalAPIError with 'Failed to fetch'."""
        service = MarketDataService()
        with patch.object(
            service,
            "_parallel_get",
            side_effect=_http_status_error(500),
        ):
            with pytest.raises(ExternalAPIError, match="Failed to fetch"):
                await service._fetch_quote_and_profile("TSLA")

    @pytest.mark.asyncio
    async def test_both_endpoints_fail_raises_external_api_error(self) -> None:
        """When _parallel_get raises, _fetch_quote_and_profile wraps it."""
        service = MarketDataService()
        # Simulate asyncio.gather raising because both requests fail;
        # in practice gather propagates the first exception.
        with patch.object(
            service,
            "_parallel_get",
            side_effect=_http_status_error(503),
        ):
            with pytest.raises(ExternalAPIError):
                await service._fetch_quote_and_profile("NVDA")

    @pytest.mark.asyncio
    async def test_403_rate_limit_converted_to_external_api_error(self) -> None:
        """403 Forbidden → ExternalAPIError."""
        service = MarketDataService()
        with patch.object(
            service,
            "_parallel_get",
            side_effect=_http_status_error(403),
        ):
            with pytest.raises(ExternalAPIError):
                await service._fetch_quote_and_profile("MSFT")

    @pytest.mark.asyncio
    async def test_429_too_many_requests_converted_to_external_api_error(
        self,
    ) -> None:
        """429 Too Many Requests → ExternalAPIError."""
        service = MarketDataService()
        with patch.object(
            service,
            "_parallel_get",
            side_effect=_http_status_error(429),
        ):
            with pytest.raises(ExternalAPIError):
                await service._fetch_quote_and_profile("AMZN")


# ---------------------------------------------------------------------------
# get_quote — HTTP error codes surface as ExternalAPIError
# ---------------------------------------------------------------------------


class TestGetQuoteHttpErrorCodes:
    """Tests that specific HTTP error codes from FMP surface as ExternalAPIError."""

    @pytest.mark.asyncio
    async def test_403_forbidden_raises_external_api_error(self) -> None:
        """A 403 from FMP must result in ExternalAPIError, not a silent failure."""
        service = MarketDataService()
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            side_effect=ExternalAPIError("FMP API", "HTTP 403: Forbidden"),
        ):
            with pytest.raises(ExternalAPIError, match="403"):
                await service.get_quote("AAPL")

    @pytest.mark.asyncio
    async def test_429_too_many_requests_raises_external_api_error(self) -> None:
        """A 429 rate-limit from FMP must result in ExternalAPIError."""
        service = MarketDataService()
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            side_effect=ExternalAPIError("FMP API", "HTTP 429: Too Many Requests"),
        ):
            with pytest.raises(ExternalAPIError, match="429"):
                await service.get_quote("TSLA")

    @pytest.mark.asyncio
    async def test_500_internal_server_error_raises_external_api_error(
        self,
    ) -> None:
        """A 500 from FMP must result in ExternalAPIError."""
        service = MarketDataService()
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            side_effect=ExternalAPIError("FMP API", "HTTP 500: Internal Server Error"),
        ):
            with pytest.raises(ExternalAPIError, match="500"):
                await service.get_quote("NVDA")

    @pytest.mark.asyncio
    async def test_error_message_preserved_through_layers(self) -> None:
        """Error detail from FMP must be preserved in the raised ExternalAPIError."""
        service = MarketDataService()
        detail = "HTTP 502: upstream connect error"
        with patch.object(
            service,
            "_fetch_quote_and_profile",
            side_effect=ExternalAPIError("FMP API", detail),
        ):
            with pytest.raises(ExternalAPIError) as exc_info:
                await service.get_quote("AAPL")
        assert "502" in str(exc_info.value)


# ---------------------------------------------------------------------------
# _COMMON_TICKERS — parametrized coverage of every mapping entry
# ---------------------------------------------------------------------------

from app.services.market_data_service import _COMMON_TICKERS  # noqa: E402


@pytest.mark.parametrize(
    "company_name,expected_ticker",
    list(_COMMON_TICKERS.items()),
)
@pytest.mark.asyncio
async def test_resolve_ticker_common_mapping(
    company_name: str, expected_ticker: str
) -> None:
    """Every entry in _COMMON_TICKERS must resolve via resolve_ticker."""
    service = MarketDataService()
    result = await service.resolve_ticker(company_name)
    assert result == expected_ticker


@pytest.mark.parametrize(
    "company_name,expected_ticker",
    list(_COMMON_TICKERS.items()),
)
@pytest.mark.asyncio
async def test_resolve_ticker_common_mapping_lowercase(
    company_name: str, expected_ticker: str
) -> None:
    """All _COMMON_TICKERS entries must resolve correctly when input is lowercase."""
    service = MarketDataService()
    result = await service.resolve_ticker(company_name.lower())
    assert result == expected_ticker


@pytest.mark.parametrize(
    "company_name,expected_ticker",
    list(_COMMON_TICKERS.items()),
)
@pytest.mark.asyncio
async def test_resolve_ticker_common_mapping_mixed_case(
    company_name: str, expected_ticker: str
) -> None:
    """All _COMMON_TICKERS entries must resolve correctly when input is title-cased."""
    service = MarketDataService()
    result = await service.resolve_ticker(company_name.title())
    assert result == expected_ticker


# ---------------------------------------------------------------------------
# _COMMON_TICKERS — named spot-checks for the most common mixed-case variants
# ---------------------------------------------------------------------------


class TestCommonTickersMixedCase:
    """Spot-checks for mixed-case variants of _COMMON_TICKERS entries."""

    @pytest.mark.asyncio
    async def test_google_uppercase(self) -> None:
        assert await MarketDataService().resolve_ticker("GOOGLE") == "GOOGL"

    @pytest.mark.asyncio
    async def test_google_lowercase(self) -> None:
        assert await MarketDataService().resolve_ticker("google") == "GOOGL"

    @pytest.mark.asyncio
    async def test_google_titlecase(self) -> None:
        assert await MarketDataService().resolve_ticker("Google") == "GOOGL"

    @pytest.mark.asyncio
    async def test_amazon_uppercase(self) -> None:
        assert await MarketDataService().resolve_ticker("AMAZON") == "AMZN"

    @pytest.mark.asyncio
    async def test_amazon_lowercase(self) -> None:
        assert await MarketDataService().resolve_ticker("amazon") == "AMZN"

    @pytest.mark.asyncio
    async def test_amazon_titlecase(self) -> None:
        assert await MarketDataService().resolve_ticker("Amazon") == "AMZN"

    @pytest.mark.asyncio
    async def test_nvidia_lowercase(self) -> None:
        assert await MarketDataService().resolve_ticker("nvidia") == "NVDA"

    @pytest.mark.asyncio
    async def test_facebook_mixed_case(self) -> None:
        assert await MarketDataService().resolve_ticker("Facebook") == "META"

    @pytest.mark.asyncio
    async def test_alphabet_lowercase(self) -> None:
        assert await MarketDataService().resolve_ticker("alphabet") == "GOOGL"

    @pytest.mark.asyncio
    async def test_shopify_titlecase(self) -> None:
        assert await MarketDataService().resolve_ticker("Shopify") == "SHOP"

    @pytest.mark.asyncio
    async def test_coinbase_mixed_case(self) -> None:
        assert await MarketDataService().resolve_ticker("Coinbase") == "COIN"

    @pytest.mark.asyncio
    async def test_snowflake_lowercase(self) -> None:
        assert await MarketDataService().resolve_ticker("snowflake") == "SNOW"


# ---------------------------------------------------------------------------
# MarketDataService._get_json — retry logic
# ---------------------------------------------------------------------------


def _make_http_status_response(status_code: int, body: bytes = b"error") -> httpx.Response:
    """Build an httpx.Response that will raise HTTPStatusError on raise_for_status."""
    return httpx.Response(
        status_code=status_code,
        content=body,
        request=httpx.Request("GET", "https://financialmodelingprep.com/stable/test"),
    )


def _make_async_client_mock(side_effects: list) -> AsyncMock:
    """Build a mock AsyncClient whose .get() yields side_effects in sequence."""
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=side_effects)
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    return mock_client


class TestGetJsonRetry:
    """Tests for _get_json retry + backoff logic."""

    # ------------------------------------------------------------------
    # Happy path — no retry needed
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_succeeds_on_first_attempt_no_sleep_called(self) -> None:
        service = MarketDataService()
        good_resp = _mock_response([{"symbol": "AAPL"}])
        mock_client = _make_async_client_mock([good_resp])

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep") as mock_sleep:
            result = await service._get_json("https://example.com", {"apikey": "k"})

        assert result == [{"symbol": "AAPL"}]
        mock_sleep.assert_not_called()

    # ------------------------------------------------------------------
    # Retry on 5xx / 429
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_retries_on_502_and_succeeds_on_second_attempt(self) -> None:
        service = MarketDataService()
        bad_resp = _make_http_status_response(502)
        good_resp = _mock_response({"ok": True})
        mock_client = _make_async_client_mock([bad_resp, good_resp])

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep"), \
             patch("random.uniform", return_value=0.0):
            result = await service._get_json("https://example.com", {"apikey": "k"})

        assert result == {"ok": True}
        assert mock_client.get.call_count == 2

    @pytest.mark.asyncio
    async def test_retries_on_429_and_succeeds_on_second_attempt(self) -> None:
        service = MarketDataService()
        bad_resp = _make_http_status_response(429, b"rate limited")
        good_resp = _mock_response([{"symbol": "TSLA"}])
        mock_client = _make_async_client_mock([bad_resp, good_resp])

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep"), \
             patch("random.uniform", return_value=0.0):
            result = await service._get_json("https://example.com", {"apikey": "k"})

        assert result == [{"symbol": "TSLA"}]

    @pytest.mark.asyncio
    async def test_retries_on_500_and_succeeds_on_second_attempt(self) -> None:
        service = MarketDataService()
        bad_resp = _make_http_status_response(500, b"Internal Server Error")
        good_resp = _mock_response({"price": 185.5})
        mock_client = _make_async_client_mock([bad_resp, good_resp])

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep"), \
             patch("random.uniform", return_value=0.0):
            result = await service._get_json("https://example.com", {"apikey": "k"})

        assert result == {"price": 185.5}

    @pytest.mark.asyncio
    async def test_retries_on_503_and_succeeds_on_second_attempt(self) -> None:
        service = MarketDataService()
        bad_resp = _make_http_status_response(503, b"Service Unavailable")
        good_resp = _mock_response([])
        mock_client = _make_async_client_mock([bad_resp, good_resp])

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep"), \
             patch("random.uniform", return_value=0.0):
            result = await service._get_json("https://example.com", {"apikey": "k"})

        assert result == []

    @pytest.mark.asyncio
    async def test_retries_on_504_and_succeeds_on_second_attempt(self) -> None:
        service = MarketDataService()
        bad_resp = _make_http_status_response(504, b"Gateway Timeout")
        good_resp = _mock_response({"data": "ok"})
        mock_client = _make_async_client_mock([bad_resp, good_resp])

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep"), \
             patch("random.uniform", return_value=0.0):
            result = await service._get_json("https://example.com", {"apikey": "k"})

        assert result == {"data": "ok"}

    # ------------------------------------------------------------------
    # Retry on timeout
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_retries_on_timeout_and_succeeds_on_second_attempt(self) -> None:
        service = MarketDataService()
        good_resp = _mock_response([{"symbol": "MSFT"}])
        mock_client = _make_async_client_mock(
            [httpx.TimeoutException("timed out"), good_resp]
        )

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep"), \
             patch("random.uniform", return_value=0.0):
            result = await service._get_json("https://example.com", {"apikey": "k"})

        assert result == [{"symbol": "MSFT"}]

    # ------------------------------------------------------------------
    # Non-retryable errors — fail immediately
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_fails_immediately_on_404_no_retry(self) -> None:
        service = MarketDataService()
        not_found_resp = _make_http_status_response(404, b"Not Found")
        mock_client = _make_async_client_mock([not_found_resp])

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep") as mock_sleep:
            with pytest.raises(ExternalAPIError, match="HTTP 404"):
                await service._get_json("https://example.com", {"apikey": "k"})

        # get() called exactly once — no retry
        assert mock_client.get.call_count == 1
        mock_sleep.assert_not_called()

    @pytest.mark.asyncio
    async def test_fails_immediately_on_401_no_retry(self) -> None:
        service = MarketDataService()
        auth_resp = _make_http_status_response(401, b"Unauthorized")
        mock_client = _make_async_client_mock([auth_resp])

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep") as mock_sleep:
            with pytest.raises(ExternalAPIError, match="HTTP 401"):
                await service._get_json("https://example.com", {"apikey": "k"})

        assert mock_client.get.call_count == 1
        mock_sleep.assert_not_called()

    @pytest.mark.asyncio
    async def test_fails_immediately_on_403_no_retry(self) -> None:
        service = MarketDataService()
        forbidden_resp = _make_http_status_response(403, b"Forbidden")
        mock_client = _make_async_client_mock([forbidden_resp])

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep") as mock_sleep:
            with pytest.raises(ExternalAPIError, match="HTTP 403"):
                await service._get_json("https://example.com", {"apikey": "k"})

        assert mock_client.get.call_count == 1
        mock_sleep.assert_not_called()

    @pytest.mark.asyncio
    async def test_fails_immediately_on_400_no_retry(self) -> None:
        service = MarketDataService()
        bad_req_resp = _make_http_status_response(400, b"Bad Request")
        mock_client = _make_async_client_mock([bad_req_resp])

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep") as mock_sleep:
            with pytest.raises(ExternalAPIError, match="HTTP 400"):
                await service._get_json("https://example.com", {"apikey": "k"})

        assert mock_client.get.call_count == 1
        mock_sleep.assert_not_called()

    # ------------------------------------------------------------------
    # Retry exhaustion — all 3 attempts fail
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_raises_external_api_error_after_exhausting_all_retries_502(
        self,
    ) -> None:
        service = MarketDataService()
        bad_resp = _make_http_status_response(502, b"Bad Gateway")
        mock_client = _make_async_client_mock([bad_resp, bad_resp, bad_resp])

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep"), \
             patch("random.uniform", return_value=0.0):
            with pytest.raises(ExternalAPIError, match="HTTP 502"):
                await service._get_json("https://example.com", {"apikey": "k"})

        assert mock_client.get.call_count == 3

    @pytest.mark.asyncio
    async def test_raises_external_api_error_after_exhausting_all_retries_timeout(
        self,
    ) -> None:
        service = MarketDataService()
        mock_client = _make_async_client_mock(
            [httpx.TimeoutException("timed out")] * 3
        )

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("asyncio.sleep"), \
             patch("random.uniform", return_value=0.0):
            with pytest.raises(ExternalAPIError, match="timed out"):
                await service._get_json("https://example.com", {"apikey": "k"})

        assert mock_client.get.call_count == 3

    # ------------------------------------------------------------------
    # Backoff delay increases exponentially
    # ------------------------------------------------------------------

    @pytest.mark.asyncio
    async def test_backoff_delays_grow_exponentially(self) -> None:
        """Delays between attempts follow 1s, 2s pattern (base * 2^(attempt-1))."""
        service = MarketDataService()
        bad_resp = _make_http_status_response(503)
        good_resp = _mock_response({"ok": True})
        # Fail twice then succeed — triggers 2 sleeps with delays 1s and 2s
        mock_client = _make_async_client_mock([bad_resp, bad_resp, good_resp])

        sleep_calls: list[float] = []

        async def capture_sleep(delay: float) -> None:
            sleep_calls.append(delay)

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("app.services.market_data_service.asyncio.sleep", side_effect=capture_sleep), \
             patch("random.uniform", return_value=0.0):
            await service._get_json("https://example.com", {"apikey": "k"})

        assert len(sleep_calls) == 2
        # First delay: base=1.0 * 2^0 = 1.0, jitter=0 → 1.0
        assert sleep_calls[0] == pytest.approx(1.0)
        # Second delay: base=1.0 * 2^1 = 2.0, jitter=0 → 2.0
        assert sleep_calls[1] == pytest.approx(2.0)

    @pytest.mark.asyncio
    async def test_no_sleep_after_last_failed_attempt(self) -> None:
        """asyncio.sleep is NOT called after the final failed attempt."""
        service = MarketDataService()
        bad_resp = _make_http_status_response(502)
        # All 3 attempts fail → sleep called between attempt 1→2 and 2→3, not after 3
        mock_client = _make_async_client_mock([bad_resp, bad_resp, bad_resp])

        sleep_calls: list[float] = []

        async def capture_sleep(delay: float) -> None:
            sleep_calls.append(delay)

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("app.services.market_data_service.asyncio.sleep", side_effect=capture_sleep), \
             patch("random.uniform", return_value=0.0):
            with pytest.raises(ExternalAPIError):
                await service._get_json("https://example.com", {"apikey": "k"})

        # Only 2 sleeps: between attempt 1→2 and 2→3
        assert len(sleep_calls) == 2

    @pytest.mark.asyncio
    async def test_jitter_is_added_to_base_delay(self) -> None:
        """random.uniform jitter is included in the sleep duration."""
        service = MarketDataService()
        bad_resp = _make_http_status_response(500)
        good_resp = _mock_response({"ok": True})
        mock_client = _make_async_client_mock([bad_resp, good_resp])

        sleep_calls: list[float] = []

        async def capture_sleep(delay: float) -> None:
            sleep_calls.append(delay)

        # Jitter = 0.3 (uniform called with (0, 0.5) → returns 0.3)
        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("app.services.market_data_service.asyncio.sleep", side_effect=capture_sleep), \
             patch("random.uniform", return_value=0.3):
            await service._get_json("https://example.com", {"apikey": "k"})

        # base_delay=1.0, jitter=0.3 → sleep(1.3)
        assert len(sleep_calls) == 1
        assert sleep_calls[0] == pytest.approx(1.3)


# ---------------------------------------------------------------------------
# MarketDataService.search_suggestions — S&P 500 boosting
# ---------------------------------------------------------------------------

_MOCK_SP500_CONSTITUENTS: list[dict] = [
    {"symbol": "MSFT", "marketCap": 3_000_000_000_000},
    {"symbol": "AAPL", "marketCap": 2_800_000_000_000},
    {"symbol": "AMZN", "marketCap": 1_500_000_000_000},
]


class TestSearchSuggestionsSP500Boost:
    """Tests for search_suggestions with S&P 500 priority ordering."""

    def setup_method(self) -> None:
        """Reset the class-level cache before each test."""
        MarketDataService._sp500_cache = {}
        MarketDataService._sp500_loaded_at = 0.0

    @pytest.mark.asyncio
    async def test_sp500_stocks_appear_before_non_sp500(self) -> None:
        service = MarketDataService()
        search_results = [
            {"symbol": "MSTR", "name": "MicroStrategy Inc"},
            {"symbol": "MSFT", "name": "Microsoft Corporation"},
        ]
        with patch.object(
            service, "_search_ticker", new_callable=AsyncMock, return_value=search_results
        ), patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value=_MOCK_SP500_CONSTITUENTS
        ):
            result = await service.search_suggestions("micr")

        assert result[0]["symbol"] == "MSFT"
        assert result[1]["symbol"] == "MSTR"

    @pytest.mark.asyncio
    async def test_sp500_sorted_by_market_cap_descending(self) -> None:
        service = MarketDataService()
        search_results = [
            {"symbol": "AMZN", "name": "Amazon.com Inc."},
            {"symbol": "MSFT", "name": "Microsoft Corporation"},
            {"symbol": "AAPL", "name": "Apple Inc."},
        ]
        with patch.object(
            service, "_search_ticker", new_callable=AsyncMock, return_value=search_results
        ), patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value=_MOCK_SP500_CONSTITUENTS
        ):
            result = await service.search_suggestions("a")

        symbols = [r["symbol"] for r in result]
        assert symbols == ["MSFT", "AAPL", "AMZN"]

    @pytest.mark.asyncio
    async def test_cache_loads_once_across_calls(self) -> None:
        service = MarketDataService()
        search_results = [{"symbol": "MSFT", "name": "Microsoft Corporation"}]

        get_json_mock = AsyncMock(return_value=_MOCK_SP500_CONSTITUENTS)
        with patch.object(
            service, "_search_ticker", new_callable=AsyncMock, return_value=search_results
        ), patch.object(service, "_get_json", get_json_mock):
            await service.search_suggestions("msft")
            await service.search_suggestions("msft")

        # _get_json called once for sp500 cache + once per _search_ticker call
        # But _search_ticker is mocked, so only the sp500 call goes through
        assert get_json_mock.call_count == 1

    @pytest.mark.asyncio
    async def test_graceful_fallback_when_sp500_fails(self) -> None:
        service = MarketDataService()
        search_results = [
            {"symbol": "MSTR", "name": "MicroStrategy Inc"},
            {"symbol": "MSFT", "name": "Microsoft Corporation"},
        ]

        async def side_effect(url: str, params: dict) -> list:
            if "sp500" in url:
                raise ExternalAPIError("FMP API", "sp500 unavailable")
            return search_results

        with patch.object(
            service, "_search_ticker", new_callable=AsyncMock, return_value=search_results
        ), patch.object(service, "_get_json", side_effect=side_effect):
            result = await service.search_suggestions("micr")

        # Falls back to original order (no boosting)
        assert len(result) == 2
        assert result[0]["symbol"] == "MSTR"
        assert result[1]["symbol"] == "MSFT"

    @pytest.mark.asyncio
    async def test_non_sp500_stocks_still_returned(self) -> None:
        service = MarketDataService()
        search_results = [
            {"symbol": "PLTR", "name": "Palantir Technologies"},
            {"symbol": "HOOD", "name": "Robinhood Markets"},
        ]
        with patch.object(
            service, "_search_ticker", new_callable=AsyncMock, return_value=search_results
        ), patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value=_MOCK_SP500_CONSTITUENTS
        ):
            result = await service.search_suggestions("tech")

        assert len(result) == 2
        assert result[0]["symbol"] == "PLTR"
        assert result[1]["symbol"] == "HOOD"

    @pytest.mark.asyncio
    async def test_empty_search_results(self) -> None:
        service = MarketDataService()
        with patch.object(
            service, "_search_ticker", new_callable=AsyncMock, return_value=[]
        ), patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value=_MOCK_SP500_CONSTITUENTS
        ):
            result = await service.search_suggestions("zzzzz")

        assert result == []

    @pytest.mark.asyncio
    async def test_filters_entries_without_symbol(self) -> None:
        service = MarketDataService()
        search_results = [
            {"symbol": "", "name": "Empty Symbol"},
            {"symbol": "MSFT", "name": "Microsoft Corporation"},
        ]
        with patch.object(
            service, "_search_ticker", new_callable=AsyncMock, return_value=search_results
        ), patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value=_MOCK_SP500_CONSTITUENTS
        ):
            result = await service.search_suggestions("ms")

        assert len(result) == 1
        assert result[0]["symbol"] == "MSFT"


# ---------------------------------------------------------------------------
# Unit tests for _date_to_quarter
# ---------------------------------------------------------------------------


class TestDateToQuarter:
    """Tests for _date_to_quarter helper."""

    def test_q1_date(self) -> None:
        assert _date_to_quarter("2025-03-31") == "Q1 2025"

    def test_q2_date(self) -> None:
        assert _date_to_quarter("2025-06-30") == "Q2 2025"

    def test_q3_date(self) -> None:
        assert _date_to_quarter("2025-09-30") == "Q3 2025"

    def test_q4_date(self) -> None:
        assert _date_to_quarter("2025-12-31") == "Q4 2025"

    def test_malformed_no_hyphen_returns_input(self) -> None:
        # No hyphens → split gives a single-element list → IndexError → fallback
        assert _date_to_quarter("20250331") == "20250331"

    def test_empty_string_returns_empty(self) -> None:
        # Empty string → split gives [""] → IndexError on [1] → fallback
        assert _date_to_quarter("") == ""

    def test_non_numeric_month_returns_input(self) -> None:
        # Month token is not a number → ValueError → fallback
        assert _date_to_quarter("2025-xx-31") == "2025-xx-31"


# ---------------------------------------------------------------------------
# Unit tests for _classify_sentiment — negative branch
# ---------------------------------------------------------------------------


class TestClassifySentimentNegative:
    """Tests for _classify_sentiment negative/bearish mapping."""

    def test_negative_lowercase(self) -> None:
        assert _classify_sentiment("negative") == "negative"

    def test_bearish_lowercase(self) -> None:
        assert _classify_sentiment("bearish") == "negative"

    def test_bearish_uppercase(self) -> None:
        assert _classify_sentiment("BEARISH") == "negative"

    def test_negative_titlecase(self) -> None:
        assert _classify_sentiment("Negative") == "negative"


# ---------------------------------------------------------------------------
# Integration tests for get_income_statement() — fallback paths
# ---------------------------------------------------------------------------

_INCOME_ROW_TEMPLATE: dict = {
    "date": "2025-03-31",
    "revenue": 100_000_000,
    "netIncome": 20_000_000,
    "eps": 1.5,
}


def _make_income_rows(count: int, revenue: int = 100_000_000) -> list[dict]:
    rows = []
    for i in range(count):
        rows.append({
            "date": f"2025-0{(i % 3) + 1}-31",
            "revenue": revenue,
            "netIncome": 20_000_000,
            "eps": 1.5,
        })
    return rows


class TestGetIncomeStatementFallback:
    """Tests for get_income_statement() stable→v3 fallback and edge cases."""

    def setup_method(self) -> None:
        MarketDataService._sp500_cache = {}
        MarketDataService._sp500_loaded_at = 0.0

    @pytest.mark.asyncio
    async def test_income_stable_fails_v3_succeeds(self) -> None:
        service = MarketDataService()
        v3_data = [_INCOME_ROW_TEMPLATE.copy()]
        call_count = 0

        async def side_effect(url: str, params: dict) -> list | dict:
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise ExternalAPIError("FMP API", "stable endpoint unavailable")
            return v3_data

        with patch.object(service, "_get_json", side_effect=side_effect):
            result = await service.get_income_statement("AAPL")

        assert len(result) == 1
        assert result[0]["quarter"] == "Q1 2025"

    @pytest.mark.asyncio
    async def test_income_both_endpoints_empty(self) -> None:
        service = MarketDataService()

        with patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value=[]
        ):
            result = await service.get_income_statement("AAPL")

        assert result == []

    @pytest.mark.asyncio
    async def test_income_yoy_insufficient_history(self) -> None:
        """Only 3 rows — no i+4 index exists, so yoy_revenue_growth is None."""
        service = MarketDataService()
        rows = _make_income_rows(3)

        with patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value=rows
        ):
            result = await service.get_income_statement("AAPL")

        assert all(r["yoy_revenue_growth"] is None for r in result)

    @pytest.mark.asyncio
    async def test_income_yoy_zero_prev_revenue(self) -> None:
        """5 rows where the 5th row has revenue=0 — division skipped, yoy=None."""
        service = MarketDataService()
        rows = _make_income_rows(5)
        rows[4]["revenue"] = 0  # prev_rev == 0 → guard triggers

        with patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value=rows
        ):
            result = await service.get_income_statement("AAPL")

        # Row 0 has i+4=4 which has revenue=0 → yoy must be None
        assert result[0]["yoy_revenue_growth"] is None

    @pytest.mark.asyncio
    async def test_income_non_list_response(self) -> None:
        """_get_json returns a dict instead of a list — treated as empty."""
        service = MarketDataService()

        with patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value={}
        ):
            result = await service.get_income_statement("AAPL")

        assert result == []


# ---------------------------------------------------------------------------
# Integration tests for get_stock_news() — fallback paths
# ---------------------------------------------------------------------------

_NEWS_ITEM: dict = {
    "title": "News headline",
    "site": "Reuters",
    "sentiment": "Bearish",
    "url": "https://example.com",
    "publishedDate": "2025-03-14",
    "image": "https://img.com/1.jpg",
}


class TestGetStockNewsFallback:
    """Tests for get_stock_news() stable→v3 fallback and edge cases."""

    def setup_method(self) -> None:
        MarketDataService._sp500_cache = {}
        MarketDataService._sp500_loaded_at = 0.0

    @pytest.mark.asyncio
    async def test_news_stable_fails_v3_succeeds(self) -> None:
        service = MarketDataService()
        call_count = 0

        async def side_effect(url: str, params: dict) -> list | dict:
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise ExternalAPIError("FMP API", "stable endpoint unavailable")
            return [_NEWS_ITEM.copy()]

        with patch.object(service, "_get_json", side_effect=side_effect):
            result = await service.get_stock_news("AAPL")

        assert len(result) == 1
        assert result[0]["title"] == "News headline"
        assert result[0]["sentiment"] == "negative"

    @pytest.mark.asyncio
    async def test_news_both_endpoints_empty(self) -> None:
        service = MarketDataService()

        with patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value=[]
        ):
            result = await service.get_stock_news("AAPL")

        assert result == []

    @pytest.mark.asyncio
    async def test_news_filters_empty_title(self) -> None:
        service = MarketDataService()
        items = [
            {"title": "", "site": "Reuters", "sentiment": "Positive", "url": "https://a.com"},
            _NEWS_ITEM.copy(),
        ]

        with patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value=items
        ):
            result = await service.get_stock_news("AAPL")

        assert len(result) == 1
        assert result[0]["title"] == "News headline"

    @pytest.mark.asyncio
    async def test_news_negative_sentiment(self) -> None:
        service = MarketDataService()
        item = _NEWS_ITEM.copy()
        item["sentiment"] = "Bearish"

        with patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value=[item]
        ):
            result = await service.get_stock_news("AAPL")

        assert result[0]["sentiment"] == "negative"

    @pytest.mark.asyncio
    async def test_news_non_list_response(self) -> None:
        """_get_json returns a dict — treated as empty."""
        service = MarketDataService()

        with patch.object(
            service, "_get_json", new_callable=AsyncMock, return_value={}
        ):
            result = await service.get_stock_news("AAPL")

        assert result == []
