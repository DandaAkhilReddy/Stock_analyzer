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


# ---------------------------------------------------------------------------
# Additional unit tests — _COMMON_TICKERS mapping, 402 handling, edge inputs
# ---------------------------------------------------------------------------


class TestSearchSuggestionsCommonTickers:
    """Verify search_suggestions behaviour against _COMMON_TICKERS entries."""

    @pytest.mark.asyncio
    async def test_google_query_uppercased_and_forwarded_to_search_ticker(
        self,
    ) -> None:
        """search_suggestions always delegates to _search_ticker — it does NOT
        consult the _COMMON_TICKERS map (that map is only used by resolve_ticker).
        Querying 'google' must call _search_ticker with 'GOOGLE'."""
        svc = MarketDataService()
        fmp_results = [{"symbol": "GOOGL", "name": "Alphabet Inc."}]
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_results
            results = await svc.search_suggestions("google")

        mock.assert_called_once_with("GOOGLE")
        assert results == [{"symbol": "GOOGL", "name": "Alphabet Inc."}]

    @pytest.mark.asyncio
    async def test_every_common_ticker_key_is_uppercased_before_forwarding(
        self,
    ) -> None:
        """Mixed-case versions of known names are normalised to uppercase before
        _search_ticker is called."""
        from app.services.market_data_service import _COMMON_TICKERS

        svc = MarketDataService()
        # Pick one entry and submit it in title-case
        sample_name = next(iter(_COMMON_TICKERS)).capitalize()  # e.g. "Google"
        expected_upper = sample_name.upper()

        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = []
            await svc.search_suggestions(sample_name)

        mock.assert_called_once_with(expected_upper)

    @pytest.mark.asyncio
    async def test_common_ticker_entry_returned_when_fmp_responds(self) -> None:
        """When FMP returns a result for a _COMMON_TICKERS key, the mapping
        entry is included in the suggestions list."""
        svc = MarketDataService()
        fmp_result = [{"symbol": "AMZN", "name": "Amazon.com Inc."}]
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_result
            results = await svc.search_suggestions("amazon")

        assert any(r["symbol"] == "AMZN" for r in results)


# ---------------------------------------------------------------------------
# Additional unit tests — FMP 402 / payment-required graceful handling
# ---------------------------------------------------------------------------


class TestSearchSuggestions402Handling:
    """Verify ExternalAPIError propagates from search_suggestions on FMP errors."""

    @pytest.mark.asyncio
    async def test_fmp_402_raises_external_api_error_from_service(self) -> None:
        """When _search_ticker raises ExternalAPIError (e.g. FMP 402 payment
        required), search_suggestions must return local fallback results instead
        of propagating the error."""
        from app.core.exceptions import ExternalAPIError

        svc = MarketDataService()
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.side_effect = ExternalAPIError("FMP API", "HTTP 402: Payment Required")
            results = await svc.search_suggestions("apple")

        assert isinstance(results, list)
        assert all("symbol" in r and "name" in r for r in results)

    @pytest.mark.asyncio
    async def test_fmp_402_returns_502_at_endpoint(self) -> None:
        """A 402 from FMP surfaces as 502 Bad Gateway at the HTTP layer."""
        from app.core.exceptions import ExternalAPIError

        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            side_effect=ExternalAPIError("FMP API", "HTTP 402: Payment Required"),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.get("/api/search", params={"q": "apple"})

        assert resp.status_code == 502

    @pytest.mark.asyncio
    async def test_fmp_402_response_body_contains_error_code(self) -> None:
        """The 502 error response body must include a machine-readable error code."""
        from app.core.exceptions import ExternalAPIError

        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            side_effect=ExternalAPIError("FMP API", "HTTP 402: Payment Required"),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                resp = await client.get("/api/search", params={"q": "apple"})

        body = resp.json()
        assert "error" in body


# ---------------------------------------------------------------------------
# Additional unit tests — single character query
# ---------------------------------------------------------------------------


class TestSearchSuggestionsSingleChar:
    """Verify that a single-character query is handled correctly at service level."""

    @pytest.mark.asyncio
    async def test_single_char_uppercased_and_forwarded(self) -> None:
        """A single lowercase character must be uppercased before forwarding."""
        svc = MarketDataService()
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = []
            await svc.search_suggestions("a")

        mock.assert_called_once_with("A")

    @pytest.mark.asyncio
    async def test_single_char_returns_matching_results(self) -> None:
        """A single-character query returns whatever _search_ticker provides."""
        svc = MarketDataService()
        fmp_results = [
            {"symbol": "A", "name": "Agilent Technologies Inc."},
            {"symbol": "AA", "name": "Alcoa Corporation"},
        ]
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_results
            results = await svc.search_suggestions("A")

        assert len(results) == 2
        assert results[0]["symbol"] == "A"
        assert results[1]["symbol"] == "AA"

    @pytest.mark.asyncio
    async def test_single_char_endpoint_returns_200(self, client: AsyncClient) -> None:
        """GET /api/search?q=A must return HTTP 200 (min_length=1 is satisfied)."""
        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            return_value=[{"symbol": "A", "name": "Agilent Technologies"}],
        ):
            resp = await client.get("/api/search", params={"q": "A"})

        assert resp.status_code == 200
        data = resp.json()
        assert data[0]["symbol"] == "A"


# ---------------------------------------------------------------------------
# Additional unit tests — special characters (spaces, hyphens)
# ---------------------------------------------------------------------------


class TestSearchSuggestionsSpecialChars:
    """Verify query normalisation for inputs containing spaces and hyphens."""

    @pytest.mark.asyncio
    async def test_leading_trailing_spaces_stripped_before_forwarding(self) -> None:
        """Whitespace surrounding the query is stripped before _search_ticker
        is called."""
        svc = MarketDataService()
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = []
            await svc.search_suggestions("  apple  ")

        mock.assert_called_once_with("APPLE")

    @pytest.mark.asyncio
    async def test_query_with_internal_spaces_preserved_after_strip(self) -> None:
        """Internal spaces in a query are preserved (only leading/trailing stripped)."""
        svc = MarketDataService()
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = []
            await svc.search_suggestions("  berkshire hathaway  ")

        mock.assert_called_once_with("BERKSHIRE HATHAWAY")

    @pytest.mark.asyncio
    async def test_query_with_hyphen_forwarded_unchanged(self) -> None:
        """Hyphens in the query (e.g. 'BRK-B') are preserved as-is."""
        svc = MarketDataService()
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = [{"symbol": "BRK-B", "name": "Berkshire Hathaway B"}]
            results = await svc.search_suggestions("brk-b")

        mock.assert_called_once_with("BRK-B")
        assert results[0]["symbol"] == "BRK-B"

    @pytest.mark.asyncio
    async def test_special_char_query_at_endpoint_returns_200(
        self, client: AsyncClient
    ) -> None:
        """A query containing a hyphen must pass validation and return 200."""
        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            return_value=[{"symbol": "BRK-B", "name": "Berkshire Hathaway B"}],
        ):
            resp = await client.get("/api/search", params={"q": "brk-b"})

        assert resp.status_code == 200
        assert resp.json()[0]["symbol"] == "BRK-B"


# ---------------------------------------------------------------------------
# Additional unit tests — foreign listing filtering (dots in symbols)
# ---------------------------------------------------------------------------


class TestSearchTickerForeignListingFilter:
    """Verify _search_ticker filters out symbols containing dots (foreign listings)."""

    @pytest.mark.asyncio
    async def test_dot_symbols_excluded_from_search_ticker(self) -> None:
        """Symbols like 'TSLA.NE' or 'MSFT.DE' must be stripped; only US symbols
        (no dot) survive the filter in _search_ticker."""
        svc = MarketDataService()
        raw_fmp_response = [
            {"symbol": "TSLA", "name": "Tesla Inc."},
            {"symbol": "TSLA.NE", "name": "Tesla Inc. (NEO)"},
            {"symbol": "TSLA.DE", "name": "Tesla Inc. (XETRA)"},
        ]
        with patch.object(svc, "_get_json", new_callable=AsyncMock) as mock:
            mock.return_value = raw_fmp_response
            results = await svc._search_ticker("TSLA")

        assert len(results) == 1
        assert results[0]["symbol"] == "TSLA"

    @pytest.mark.asyncio
    async def test_all_results_dot_symbols_returns_empty_list(self) -> None:
        """If every FMP result is a foreign listing, _search_ticker returns []."""
        svc = MarketDataService()
        raw_fmp_response = [
            {"symbol": "AAPL.DE", "name": "Apple (XETRA)"},
            {"symbol": "AAPL.L", "name": "Apple (London)"},
        ]
        with patch.object(svc, "_get_json", new_callable=AsyncMock) as mock:
            mock.return_value = raw_fmp_response
            results = await svc._search_ticker("AAPL")

        assert results == []

    @pytest.mark.asyncio
    async def test_search_suggestions_propagates_filtering(self) -> None:
        """Foreign listings must be absent from the final search_suggestions output."""
        svc = MarketDataService()
        raw_fmp_response = [
            {"symbol": "MSFT", "name": "Microsoft Corporation"},
            {"symbol": "MSFT.NE", "name": "Microsoft (NEO)"},
            {"symbol": "MSFT.DE", "name": "Microsoft (XETRA)"},
        ]
        with patch.object(svc, "_get_json", new_callable=AsyncMock) as mock:
            mock.return_value = raw_fmp_response
            results = await svc.search_suggestions("msft")

        symbols = [r["symbol"] for r in results]
        assert "MSFT" in symbols
        assert "MSFT.NE" not in symbols
        assert "MSFT.DE" not in symbols


# ---------------------------------------------------------------------------
# Additional unit tests — exact ticker vs company name
# ---------------------------------------------------------------------------


class TestSearchSuggestionsTickerVsCompanyName:
    """Verify behaviour for exact ticker lookups vs company name fragments."""

    @pytest.mark.asyncio
    async def test_exact_ticker_aapl_forwarded_uppercased(self) -> None:
        """An exact ticker like 'AAPL' is uppercased and forwarded directly."""
        svc = MarketDataService()
        fmp_results = [{"symbol": "AAPL", "name": "Apple Inc."}]
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_results
            results = await svc.search_suggestions("AAPL")

        mock.assert_called_once_with("AAPL")
        assert results[0]["symbol"] == "AAPL"

    @pytest.mark.asyncio
    async def test_lowercase_ticker_uppercased_before_forwarding(self) -> None:
        """Lowercase ticker 'aapl' must be uppercased to 'AAPL' before the call."""
        svc = MarketDataService()
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = [{"symbol": "AAPL", "name": "Apple Inc."}]
            await svc.search_suggestions("aapl")

        mock.assert_called_once_with("AAPL")

    @pytest.mark.asyncio
    async def test_company_name_fragment_forwarded_correctly(self) -> None:
        """A company name fragment like 'micro' is uppercased and forwarded."""
        svc = MarketDataService()
        fmp_results = [
            {"symbol": "MSFT", "name": "Microsoft Corporation"},
            {"symbol": "MU", "name": "Micron Technology"},
        ]
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_results
            results = await svc.search_suggestions("micro")

        mock.assert_called_once_with("MICRO")
        assert len(results) == 2

    @pytest.mark.asyncio
    async def test_exact_ticker_vs_company_name_both_return_correct_shape(
        self,
    ) -> None:
        """Both an exact ticker query and a company name query must yield dicts
        with exactly 'symbol' and 'name' keys — nothing more, nothing less."""
        svc = MarketDataService()
        for query, fmp_payload in [
            ("AAPL", [{"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ"}]),
            (
                "apple",
                [{"symbol": "AAPL", "name": "Apple Inc.", "type": "stock"}],
            ),
        ]:
            with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
                mock.return_value = fmp_payload
                results = await svc.search_suggestions(query)

            assert len(results) == 1
            assert set(results[0].keys()) == {"symbol", "name"}

    @pytest.mark.asyncio
    async def test_exact_ticker_endpoint_response_structure(
        self, client: AsyncClient
    ) -> None:
        """GET /api/search?q=AAPL returns 200 with correct symbol/name keys."""
        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            return_value=[{"symbol": "AAPL", "name": "Apple Inc."}],
        ):
            resp = await client.get("/api/search", params={"q": "AAPL"})

        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["symbol"] == "AAPL"
        assert data[0]["name"] == "Apple Inc."


# ---------------------------------------------------------------------------
# Additional unit tests — response structure guarantees
# ---------------------------------------------------------------------------


class TestSearchResponseStructure:
    """Verify the shape of every item returned by search_suggestions."""

    @pytest.mark.asyncio
    async def test_each_result_contains_exactly_symbol_and_name(self) -> None:
        """search_suggestions must return dicts with exactly two keys: symbol
        and name — extra FMP fields must be dropped."""
        svc = MarketDataService()
        fmp_results = [
            {
                "symbol": "NVDA",
                "name": "NVIDIA Corporation",
                "exchange": "NASDAQ",
                "currency": "USD",
                "stockExchange": "NASDAQ Global Select Market",
            }
        ]
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_results
            results = await svc.search_suggestions("nvidia")

        assert len(results) == 1
        assert set(results[0].keys()) == {"symbol", "name"}

    @pytest.mark.asyncio
    async def test_symbol_and_name_are_strings(self) -> None:
        """Both symbol and name values must be plain Python strings."""
        svc = MarketDataService()
        fmp_results = [
            {"symbol": "AMZN", "name": "Amazon.com Inc."},
        ]
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_results
            results = await svc.search_suggestions("amazon")

        assert isinstance(results[0]["symbol"], str)
        assert isinstance(results[0]["name"], str)

    @pytest.mark.asyncio
    async def test_missing_name_defaults_to_empty_string(self) -> None:
        """If FMP omits the 'name' field, the result must carry an empty string
        rather than None or raising a KeyError."""
        svc = MarketDataService()
        fmp_results = [{"symbol": "XYZ"}]  # no 'name' key
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_results
            results = await svc.search_suggestions("xyz")

        assert len(results) == 1
        assert results[0]["name"] == ""

    @pytest.mark.asyncio
    async def test_multiple_results_all_have_required_keys(self) -> None:
        """All items in a multi-result response carry both required keys."""
        svc = MarketDataService()
        fmp_results = [
            {"symbol": "AAPL", "name": "Apple Inc."},
            {"symbol": "AMZN", "name": "Amazon.com Inc."},
            {"symbol": "TSLA", "name": "Tesla Inc."},
            {"symbol": "MSFT", "name": "Microsoft Corporation"},
            {"symbol": "META", "name": "Meta Platforms Inc."},
        ]
        with patch.object(svc, "_search_ticker", new_callable=AsyncMock) as mock:
            mock.return_value = fmp_results
            results = await svc.search_suggestions("tech")

        assert len(results) == 5
        for item in results:
            assert "symbol" in item
            assert "name" in item
            assert isinstance(item["symbol"], str)
            assert isinstance(item["name"], str)

    @pytest.mark.asyncio
    async def test_endpoint_response_items_have_symbol_and_name(
        self, client: AsyncClient
    ) -> None:
        """Every object returned by GET /api/search must contain 'symbol' and 'name'."""
        mock_results = [
            {"symbol": "GOOGL", "name": "Alphabet Inc."},
            {"symbol": "META", "name": "Meta Platforms Inc."},
        ]
        with patch.object(
            MarketDataService,
            "search_suggestions",
            new_callable=AsyncMock,
            return_value=mock_results,
        ):
            resp = await client.get("/api/search", params={"q": "g"})

        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        for item in data:
            assert set(item.keys()) >= {"symbol", "name"}
            assert isinstance(item["symbol"], str)
            assert isinstance(item["name"], str)
