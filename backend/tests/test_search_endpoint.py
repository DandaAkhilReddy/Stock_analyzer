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
