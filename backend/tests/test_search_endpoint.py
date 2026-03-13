"""Tests for GET /api/search autocomplete endpoint and search_suggestions()."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from main import app
from app.services.market_data_service import MarketDataService


# ---------------------------------------------------------------------------
# Unit tests — MarketDataService.search_suggestions
# ---------------------------------------------------------------------------


class TestSearchSuggestions:
    """Tests for MarketDataService.search_suggestions()."""

    @pytest.mark.asyncio
    async def test_returns_symbol_and_name(self) -> None:
        svc = MarketDataService()
        fmp_results = [
            {"symbol": "AAPL", "name": "Apple Inc."},
            {"symbol": "APPN", "name": "Appian Corporation"},
        ]
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_results
            results = await svc.search_suggestions("app")

        assert results == [
            {"symbol": "AAPL", "name": "Apple Inc."},
            {"symbol": "APPN", "name": "Appian Corporation"},
        ]

    @pytest.mark.asyncio
    async def test_filters_out_entries_without_symbol(self) -> None:
        svc = MarketDataService()
        fmp_results = [
            {"symbol": "AAPL", "name": "Apple Inc."},
            {"symbol": "", "name": "No Symbol Co"},
            {"name": "Missing Symbol"},
        ]
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_results
            results = await svc.search_suggestions("app")

        assert len(results) == 1
        assert results[0]["symbol"] == "AAPL"

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_results(self) -> None:
        svc = MarketDataService()
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = []
            results = await svc.search_suggestions("xyznotreal")

        assert results == []

    @pytest.mark.asyncio
    async def test_uppercases_query(self) -> None:
        svc = MarketDataService()
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = []
            await svc.search_suggestions("  apple  ")

        mock.assert_called_once_with("APPLE")

    @pytest.mark.asyncio
    async def test_handles_extra_fields_gracefully(self) -> None:
        svc = MarketDataService()
        fmp_results = [
            {"symbol": "MSFT", "name": "Microsoft", "exchange": "NASDAQ", "currency": "USD"},
        ]
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_results
            results = await svc.search_suggestions("msft")

        assert results == [{"symbol": "MSFT", "name": "Microsoft"}]


# ---------------------------------------------------------------------------
# Integration tests — GET /api/search
# ---------------------------------------------------------------------------


class TestSearchEndpoint:
    """Tests for the GET /api/search route."""

    @pytest.mark.asyncio
    async def test_returns_suggestions(self) -> None:
        mock_results = [
            {"symbol": "AAPL", "name": "Apple Inc."},
        ]
        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            return_value=mock_results,
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.get("/api/search", params={"q": "apple"})

        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["symbol"] == "AAPL"

    @pytest.mark.asyncio
    async def test_missing_query_returns_422(self) -> None:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/search")

        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_empty_query_returns_422(self) -> None:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/search", params={"q": ""})

        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_no_results_returns_empty_array(self) -> None:
        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            return_value=[],
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.get("/api/search", params={"q": "xyznotreal"})

        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_fmp_error_returns_502(self) -> None:
        from app.core.exceptions import ExternalAPIError

        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            side_effect=ExternalAPIError("FMP API", "timeout"),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.get("/api/search", params={"q": "apple"})

        assert resp.status_code == 502

    @pytest.mark.asyncio
    async def test_single_character_query_returns_200(self) -> None:
        """A single character query satisfies min_length=1 and returns 200."""
        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            return_value=[],
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.get("/api/search", params={"q": "A"})

        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_max_length_query_returns_200(self) -> None:
        """A 100-character query is the maximum allowed and must return 200."""
        long_query = "A" * 100
        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            return_value=[],
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.get("/api/search", params={"q": long_query})

        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_over_max_length_query_returns_422(self) -> None:
        """A 101-character query exceeds max_length=100 and must return 422."""
        too_long_query = "A" * 101
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            resp = await client.get("/api/search", params={"q": too_long_query})

        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_response_is_json_content_type(self) -> None:
        """Successful search response must have application/json content-type."""
        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            return_value=[{"symbol": "AAPL", "name": "Apple Inc."}],
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.get("/api/search", params={"q": "apple"})

        assert "application/json" in resp.headers["content-type"]

    @pytest.mark.asyncio
    async def test_each_result_has_symbol_and_name_keys(self) -> None:
        """Every object in the result array must contain 'symbol' and 'name' keys."""
        mock_results = [
            {"symbol": "AAPL", "name": "Apple Inc."},
            {"symbol": "MSFT", "name": "Microsoft Corporation"},
            {"symbol": "GOOGL", "name": "Alphabet Inc."},
        ]
        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            return_value=mock_results,
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.get("/api/search", params={"q": "tech"})

        data = resp.json()
        assert len(data) == 3
        for item in data:
            assert "symbol" in item, f"Missing 'symbol' key in result: {item}"
            assert "name" in item, f"Missing 'name' key in result: {item}"

    @pytest.mark.asyncio
    async def test_results_symbol_values_are_non_empty_strings(self) -> None:
        """The search endpoint must return only results whose symbol is non-empty."""
        mock_results = [
            {"symbol": "NVDA", "name": "NVIDIA Corporation"},
        ]
        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            return_value=mock_results,
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.get("/api/search", params={"q": "nvidia"})

        data = resp.json()
        for item in data:
            assert isinstance(item["symbol"], str)
            assert len(item["symbol"]) > 0
