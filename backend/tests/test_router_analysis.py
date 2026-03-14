"""Tests for app.routers.analysis — POST /api/analyze/{ticker}."""
from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.core.exceptions import AIAnalysisError, ExternalAPIError, StockNotFoundError
from app.models.analysis import (
    FinancierAnalysis,
    FinancierVerdict,
    PriceForecast,
    PricePredictions,
    RiskAssessment,
    StockAnalysisResponse,
    TechnicalSnapshot,
)

# ---------------------------------------------------------------------------
# Shared test data
# ---------------------------------------------------------------------------

_FIXED_TIMESTAMP = datetime(2026, 3, 10, 12, 0, 0, tzinfo=timezone.utc)

_MOCK_RESPONSE = StockAnalysisResponse(
    ticker="AAPL",
    company_name="Apple Inc.",
    current_price=227.50,
    previous_close=224.72,
    open=225.10,
    day_high=229.00,
    day_low=224.50,
    volume=58_000_000,
    market_cap="3.5T",
    pe_ratio=35.2,
    eps=6.46,
    week_52_high=237.23,
    week_52_low=164.08,
    dividend_yield=0.0044,
    technical=TechnicalSnapshot(
        sma_20=221.30,
        sma_50=215.80,
        rsi_14=58.4,
        signal="buy",
    ),
    news=[],
    quarterly_earnings=[],
    recommendation="buy",
    confidence_score=0.78,
    summary="Apple remains a quality compounder with strong services growth.",
    bull_case="Services segment continues to expand margins substantially.",
    bear_case="Hardware saturation in China could pressure top-line growth.",
    risk_assessment=RiskAssessment(
        overall_risk="medium",
        risk_factors=["China exposure", "antitrust scrutiny"],
        risk_score=0.40,
    ),
    price_predictions=PricePredictions(
        one_week=PriceForecast(low=222.0, mid=228.0, high=234.0, confidence=0.70),
        one_month=PriceForecast(low=218.0, mid=235.0, high=248.0, confidence=0.65),
        three_months=PriceForecast(low=210.0, mid=245.0, high=265.0, confidence=0.55),
    ),
    analysis_timestamp=_FIXED_TIMESTAMP,
)

_PATCH_TARGET = "app.routers.analysis._ai_service.analyze"


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


class TestAnalyzeStockSuccess:
    """POST /api/analyze/{ticker} — successful AI analysis."""

    @pytest.mark.asyncio
    async def test_returns_200(self, client: AsyncClient) -> None:
        """A valid ticker returns HTTP 200."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post("/api/analyze/AAPL")

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_response_contains_ticker(self, client: AsyncClient) -> None:
        """Response body includes the correct ticker field."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["ticker"] == "AAPL"

    @pytest.mark.asyncio
    async def test_response_contains_company_name(self, client: AsyncClient) -> None:
        """Response body includes the company_name field."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["company_name"] == "Apple Inc."

    @pytest.mark.asyncio
    async def test_response_contains_current_price(self, client: AsyncClient) -> None:
        """Response body includes the current_price field."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["current_price"] == pytest.approx(227.50)

    @pytest.mark.asyncio
    async def test_response_contains_recommendation(self, client: AsyncClient) -> None:
        """Response body includes the recommendation field."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["recommendation"] == "buy"

    @pytest.mark.asyncio
    async def test_response_contains_confidence_score(self, client: AsyncClient) -> None:
        """Response body includes the confidence_score field."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["confidence_score"] == pytest.approx(0.78)

    @pytest.mark.asyncio
    async def test_response_contains_summary(self, client: AsyncClient) -> None:
        """Response body includes the summary field."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post("/api/analyze/AAPL")

        assert "summary" in response.json()

    @pytest.mark.asyncio
    async def test_response_contains_risk_assessment(self, client: AsyncClient) -> None:
        """Response body includes a nested risk_assessment object."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post("/api/analyze/AAPL")

        body = response.json()
        assert "risk_assessment" in body
        assert body["risk_assessment"]["overall_risk"] == "medium"

    @pytest.mark.asyncio
    async def test_response_contains_price_predictions(self, client: AsyncClient) -> None:
        """Response body includes a nested price_predictions object with three horizons."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post("/api/analyze/AAPL")

        predictions = response.json()["price_predictions"]
        assert "one_week" in predictions
        assert "one_month" in predictions
        assert "three_months" in predictions

    @pytest.mark.asyncio
    async def test_response_body_is_json(self, client: AsyncClient) -> None:
        """Content-Type header must indicate JSON."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post("/api/analyze/AAPL")

        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# Service call verification
# ---------------------------------------------------------------------------


class TestAnalyzeStockServiceCall:
    """Verifies that the router delegates correctly to the AI service."""

    @pytest.mark.asyncio
    async def test_calls_analyze_with_uppercase_ticker(self, client: AsyncClient) -> None:
        """analyze() is invoked with the ticker exactly as supplied in the URL."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            await client.post("/api/analyze/AAPL")

        mock_analyze.assert_called_once_with("AAPL")

    @pytest.mark.asyncio
    async def test_calls_analyze_once(self, client: AsyncClient) -> None:
        """analyze() is called exactly once per request — no double-dispatch."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            await client.post("/api/analyze/AAPL")

        assert mock_analyze.call_count == 1

    @pytest.mark.asyncio
    async def test_ticker_forwarded_verbatim_to_service(self, client: AsyncClient) -> None:
        """The ticker in the path is forwarded verbatim to analyze(), preserving case."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            await client.post("/api/analyze/MSFT")

        mock_analyze.assert_called_once_with("MSFT")

    @pytest.mark.asyncio
    async def test_different_tickers_call_service_with_correct_arg(
        self, client: AsyncClient
    ) -> None:
        """Each distinct ticker path segment reaches analyze() unchanged."""
        tickers = ["TSLA", "NVDA", "GOOGL"]
        for ticker in tickers:
            with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
                mock_analyze.return_value = _MOCK_RESPONSE
                await client.post(f"/api/analyze/{ticker}")
            mock_analyze.assert_called_once_with(ticker)


# ---------------------------------------------------------------------------
# AIAnalysisError → 500
# ---------------------------------------------------------------------------


class TestAnalyzeStockAIAnalysisError:
    """When the AI service raises AIAnalysisError the router must return 500."""

    @pytest.mark.asyncio
    async def test_returns_500_on_ai_analysis_error(self, client: AsyncClient) -> None:
        """HTTP status must be 500 when analyze() raises AIAnalysisError."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AIAnalysisError("model timed out")
            response = await client.post("/api/analyze/AAPL")

        assert response.status_code == 500

    @pytest.mark.asyncio
    async def test_error_body_has_error_key(self, client: AsyncClient) -> None:
        """500 response body contains a top-level 'error' object."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AIAnalysisError("model timed out")
            response = await client.post("/api/analyze/AAPL")

        assert "error" in response.json()

    @pytest.mark.asyncio
    async def test_error_body_contains_code(self, client: AsyncClient) -> None:
        """500 error JSON body includes the structured error code."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AIAnalysisError("context window exceeded")
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["error"]["code"] == "AI_ANALYSIS_ERROR"

    @pytest.mark.asyncio
    async def test_error_body_contains_message(self, client: AsyncClient) -> None:
        """500 error JSON includes the human-readable message from the exception."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AIAnalysisError("null response from API")
            response = await client.post("/api/analyze/AAPL")

        body = response.json()
        assert "message" in body["error"]
        assert "null response from API" in body["error"]["message"]

    @pytest.mark.asyncio
    async def test_error_response_is_json(self, client: AsyncClient) -> None:
        """500 response must have JSON content-type, not plain text."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AIAnalysisError("bad JSON from model")
            response = await client.post("/api/analyze/AAPL")

        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# StockNotFoundError → 404
# ---------------------------------------------------------------------------


class TestAnalyzeStockNotFoundError:
    """When the AI service raises StockNotFoundError the router must return 404."""

    @pytest.mark.asyncio
    async def test_returns_404_on_stock_not_found(self, client: AsyncClient) -> None:
        """HTTP status must be 404 when analyze() raises StockNotFoundError."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError("INVALID")
            response = await client.post("/api/analyze/INVALID")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_not_found_error_body_has_error_key(self, client: AsyncClient) -> None:
        """404 response body contains a top-level 'error' object."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError("ZZZZZ")
            response = await client.post("/api/analyze/ZZZZZ")

        assert "error" in response.json()

    @pytest.mark.asyncio
    async def test_not_found_error_body_contains_code(self, client: AsyncClient) -> None:
        """404 error JSON includes the STOCK_NOT_FOUND error code."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError("ZZZZZ")
            response = await client.post("/api/analyze/ZZZZZ")

        assert response.json()["error"]["code"] == "STOCK_NOT_FOUND"

    @pytest.mark.asyncio
    async def test_not_found_error_body_contains_message(self, client: AsyncClient) -> None:
        """404 error JSON includes a message that references the missing ticker."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError("ZZZZZ")
            response = await client.post("/api/analyze/ZZZZZ")

        assert "ZZZZZ" in response.json()["error"]["message"]

    @pytest.mark.asyncio
    async def test_not_found_response_is_json(self, client: AsyncClient) -> None:
        """404 response must have JSON content-type."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError("FAKE")
            response = await client.post("/api/analyze/FAKE")

        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# ExternalAPIError → 502
# ---------------------------------------------------------------------------


class TestAnalyzeStockExternalAPIError:
    """When the AI service raises ExternalAPIError the router must return 502."""

    @pytest.mark.asyncio
    async def test_returns_502_on_external_api_error(self, client: AsyncClient) -> None:
        """HTTP status must be 502 when analyze() raises ExternalAPIError."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = ExternalAPIError("Yahoo Finance", "connection timeout")
            response = await client.post("/api/analyze/AAPL")

        assert response.status_code == 502

    @pytest.mark.asyncio
    async def test_502_error_body_has_error_key(self, client: AsyncClient) -> None:
        """502 response body must contain a top-level 'error' object."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = ExternalAPIError("FMP", "503 upstream")
            response = await client.post("/api/analyze/TSLA")

        assert "error" in response.json()

    @pytest.mark.asyncio
    async def test_502_error_body_contains_code(self, client: AsyncClient) -> None:
        """502 error JSON body must include the EXTERNAL_API_ERROR code."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = ExternalAPIError("Yahoo Finance", "rate limited")
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["error"]["code"] == "EXTERNAL_API_ERROR"

    @pytest.mark.asyncio
    async def test_502_response_is_json(self, client: AsyncClient) -> None:
        """502 response must have JSON content-type."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = ExternalAPIError("FMP", "unreachable")
            response = await client.post("/api/analyze/NVDA")

        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# URL-encoded and special-character tickers
# ---------------------------------------------------------------------------


class TestAnalyzeStockSpecialTickers:
    """Verifies routing behaviour for non-standard ticker path segments."""

    @pytest.mark.asyncio
    async def test_url_encoded_space_decoded_before_service(
        self, client: AsyncClient
    ) -> None:
        """A ticker path segment with a URL-encoded space is decoded by FastAPI
        and forwarded to the service as the decoded string."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            # %20 is a URL-encoded space; FastAPI path decodes it automatically
            await client.post("/api/analyze/BRK%20B")

        called_with = mock_analyze.call_args[0][0]
        assert " " in called_with or called_with == "BRK B"

    @pytest.mark.asyncio
    async def test_hyphenated_ticker_forwarded_verbatim(
        self, client: AsyncClient
    ) -> None:
        """Tickers containing a hyphen (e.g. BRK-B) are forwarded without mutation."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            await client.post("/api/analyze/BRK-B")

        mock_analyze.assert_called_once_with("BRK-B")

    @pytest.mark.asyncio
    async def test_lowercase_ticker_forwarded_as_is(
        self, client: AsyncClient
    ) -> None:
        """The router does NOT normalise case — lowercase ticker reaches the service unchanged."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            await client.post("/api/analyze/aapl")

        mock_analyze.assert_called_once_with("aapl")

    @pytest.mark.asyncio
    async def test_response_contains_all_required_top_level_fields(
        self, client: AsyncClient
    ) -> None:
        """A successful response must include every mandatory top-level field."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post("/api/analyze/AAPL")

        body = response.json()
        required_fields = [
            "ticker",
            "company_name",
            "current_price",
            "recommendation",
            "confidence_score",
            "summary",
            "bull_case",
            "bear_case",
            "risk_assessment",
            "price_predictions",
            "analysis_timestamp",
        ]
        for field in required_fields:
            assert field in body, f"Missing required field: {field}"


# ---------------------------------------------------------------------------
# financier_analysis populated
# ---------------------------------------------------------------------------


_MOCK_RESPONSE_WITH_FINANCIERS = _MOCK_RESPONSE.model_copy(
    update={
        "financier_analysis": {
            "perspectives": [
                {
                    "name": "Warren Buffett",
                    "framework": "value investing",
                    "verdict": "buy",
                    "reasoning": "Wide economic moat and strong free cash flow.",
                    "key_metrics_evaluated": ["ROE", "moat", "FCF"],
                },
                {
                    "name": "Peter Lynch",
                    "framework": "growth at reasonable price",
                    "verdict": "hold",
                    "reasoning": "PEG ratio slightly elevated at current price.",
                    "key_metrics_evaluated": ["PEG", "revenue_growth"],
                },
                {
                    "name": "Benjamin Graham",
                    "framework": "margin of safety",
                    "verdict": "hold",
                    "reasoning": "Current price offers limited margin of safety.",
                    "key_metrics_evaluated": ["P/B", "debt_ratio", "earnings_stability"],
                },
                {
                    "name": "Ray Dalio",
                    "framework": "macro risk parity",
                    "verdict": "hold",
                    "reasoning": "Macro headwinds from rate environment offset growth.",
                    "key_metrics_evaluated": ["macro_risk", "correlation"],
                },
                {
                    "name": "Cathie Wood",
                    "framework": "disruptive innovation",
                    "verdict": "buy",
                    "reasoning": "AI integration positions Apple on the S-curve.",
                    "key_metrics_evaluated": ["innovation_index", "TAM"],
                },
            ],
            "consensus_verdict": "buy",
            "consensus_reasoning": "Three of five frameworks favour accumulation at current levels.",
        }
    }
)

# Re-construct as a proper model instance so the router serialises it correctly.
_MOCK_RESPONSE_WITH_FINANCIERS = _MOCK_RESPONSE.model_copy(
    update={
        "financier_analysis": FinancierAnalysis(
            perspectives=[
                FinancierVerdict(
                    name="Warren Buffett",
                    framework="value investing",
                    verdict="buy",
                    reasoning="Wide economic moat and strong free cash flow.",
                    key_metrics_evaluated=["ROE", "moat", "FCF"],
                ),
                FinancierVerdict(
                    name="Peter Lynch",
                    framework="growth at reasonable price",
                    verdict="hold",
                    reasoning="PEG ratio slightly elevated at current price.",
                    key_metrics_evaluated=["PEG", "revenue_growth"],
                ),
                FinancierVerdict(
                    name="Benjamin Graham",
                    framework="margin of safety",
                    verdict="hold",
                    reasoning="Current price offers limited margin of safety.",
                    key_metrics_evaluated=["P/B", "debt_ratio", "earnings_stability"],
                ),
                FinancierVerdict(
                    name="Ray Dalio",
                    framework="macro risk parity",
                    verdict="hold",
                    reasoning="Macro headwinds from rate environment offset growth.",
                    key_metrics_evaluated=["macro_risk", "correlation"],
                ),
                FinancierVerdict(
                    name="Cathie Wood",
                    framework="disruptive innovation",
                    verdict="buy",
                    reasoning="AI integration positions Apple on the S-curve.",
                    key_metrics_evaluated=["innovation_index", "TAM"],
                ),
            ],
            consensus_verdict="buy",
            consensus_reasoning="Three of five frameworks favour accumulation at current levels.",
        )
    }
)


class TestAnalyzeStockFinancierAnalysis:
    """POST /api/analyze/{ticker} — financier_analysis field in response."""

    @pytest.mark.asyncio
    async def test_financier_analysis_key_present_in_response(
        self, client: AsyncClient
    ) -> None:
        """financier_analysis key must appear at the top level of the response body."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_WITH_FINANCIERS
            response = await client.post("/api/analyze/GOOGL")

        assert "financier_analysis" in response.json()

    @pytest.mark.asyncio
    async def test_financier_analysis_is_not_null(self, client: AsyncClient) -> None:
        """When the service returns financier data the JSON value must be non-null."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_WITH_FINANCIERS
            response = await client.post("/api/analyze/GOOGL")

        assert response.json()["financier_analysis"] is not None

    @pytest.mark.asyncio
    async def test_financier_analysis_perspectives_is_list(
        self, client: AsyncClient
    ) -> None:
        """perspectives must serialise as a JSON array."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_WITH_FINANCIERS
            response = await client.post("/api/analyze/GOOGL")

        assert isinstance(response.json()["financier_analysis"]["perspectives"], list)

    @pytest.mark.asyncio
    async def test_financier_analysis_perspectives_count(
        self, client: AsyncClient
    ) -> None:
        """All five investor perspectives must appear in the serialised response."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_WITH_FINANCIERS
            response = await client.post("/api/analyze/GOOGL")

        perspectives = response.json()["financier_analysis"]["perspectives"]
        assert len(perspectives) == 5

    @pytest.mark.asyncio
    async def test_financier_perspective_contains_required_fields(
        self, client: AsyncClient
    ) -> None:
        """Every perspective entry must include name, framework, verdict, and reasoning."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_WITH_FINANCIERS
            response = await client.post("/api/analyze/GOOGL")

        for perspective in response.json()["financier_analysis"]["perspectives"]:
            assert "name" in perspective, "perspective missing 'name'"
            assert "framework" in perspective, "perspective missing 'framework'"
            assert "verdict" in perspective, "perspective missing 'verdict'"
            assert "reasoning" in perspective, "perspective missing 'reasoning'"

    @pytest.mark.asyncio
    async def test_financier_perspective_verdict_values_are_valid(
        self, client: AsyncClient
    ) -> None:
        """Every perspective verdict must be one of the allowed literals."""
        valid_verdicts = {"buy", "hold", "sell"}
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_WITH_FINANCIERS
            response = await client.post("/api/analyze/GOOGL")

        for perspective in response.json()["financier_analysis"]["perspectives"]:
            assert perspective["verdict"] in valid_verdicts

    @pytest.mark.asyncio
    async def test_financier_consensus_verdict_present(
        self, client: AsyncClient
    ) -> None:
        """consensus_verdict must be present at the financier_analysis level."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_WITH_FINANCIERS
            response = await client.post("/api/analyze/GOOGL")

        fa = response.json()["financier_analysis"]
        assert "consensus_verdict" in fa

    @pytest.mark.asyncio
    async def test_financier_consensus_verdict_value(
        self, client: AsyncClient
    ) -> None:
        """consensus_verdict must match the value set on the mock response."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_WITH_FINANCIERS
            response = await client.post("/api/analyze/GOOGL")

        assert response.json()["financier_analysis"]["consensus_verdict"] == "buy"

    @pytest.mark.asyncio
    async def test_financier_consensus_reasoning_present(
        self, client: AsyncClient
    ) -> None:
        """consensus_reasoning must be present at the financier_analysis level."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_WITH_FINANCIERS
            response = await client.post("/api/analyze/GOOGL")

        fa = response.json()["financier_analysis"]
        assert "consensus_reasoning" in fa
        assert isinstance(fa["consensus_reasoning"], str)

    @pytest.mark.asyncio
    async def test_financier_buffett_perspective_name(
        self, client: AsyncClient
    ) -> None:
        """The first perspective must identify Warren Buffett as the financier."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_WITH_FINANCIERS
            response = await client.post("/api/analyze/GOOGL")

        first = response.json()["financier_analysis"]["perspectives"][0]
        assert first["name"] == "Warren Buffett"

    @pytest.mark.asyncio
    async def test_financier_key_metrics_evaluated_is_list(
        self, client: AsyncClient
    ) -> None:
        """key_metrics_evaluated must serialise as a JSON array for every perspective."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_WITH_FINANCIERS
            response = await client.post("/api/analyze/GOOGL")

        for perspective in response.json()["financier_analysis"]["perspectives"]:
            assert isinstance(perspective["key_metrics_evaluated"], list)


# ---------------------------------------------------------------------------
# financier_analysis null
# ---------------------------------------------------------------------------


_MOCK_RESPONSE_NO_FINANCIERS = _MOCK_RESPONSE.model_copy(
    update={"financier_analysis": None}
)


class TestAnalyzeStockFinancierAnalysisNull:
    """POST /api/analyze/{ticker} — financier_analysis field absent from AI output."""

    @pytest.mark.asyncio
    async def test_financier_analysis_serialises_as_null(
        self, client: AsyncClient
    ) -> None:
        """When the service returns None for financier_analysis it must appear as JSON null."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_NO_FINANCIERS
            response = await client.post("/api/analyze/TICKER")

        assert response.status_code == 200
        assert response.json()["financier_analysis"] is None

    @pytest.mark.asyncio
    async def test_financier_null_response_still_200(
        self, client: AsyncClient
    ) -> None:
        """A null financier_analysis must not degrade the HTTP status to a non-200 code."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_NO_FINANCIERS
            response = await client.post("/api/analyze/TICKER")

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_financier_null_other_fields_intact(
        self, client: AsyncClient
    ) -> None:
        """All other mandatory fields remain present when financier_analysis is null."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_NO_FINANCIERS
            response = await client.post("/api/analyze/TICKER")

        body = response.json()
        for field in ("ticker", "recommendation", "summary", "risk_assessment"):
            assert field in body, f"Missing field: {field}"

    @pytest.mark.asyncio
    async def test_financier_null_response_is_json(
        self, client: AsyncClient
    ) -> None:
        """Content-Type must be application/json even when financier_analysis is null."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE_NO_FINANCIERS
            response = await client.post("/api/analyze/TICKER")

        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# Generic Exception (unhandled) — propagates through ASGI transport
# ---------------------------------------------------------------------------


class TestAnalyzeStockGenericException:
    """When the service raises a bare Exception (not an AppException subclass) the
    app exception handler does NOT intercept it.  Under httpx's ASGITransport the
    exception re-propagates to the caller rather than being converted to a 500
    response — this is the defined contract for in-process ASGI testing.
    """

    @pytest.mark.asyncio
    async def test_generic_exception_propagates_to_caller(
        self, client: AsyncClient
    ) -> None:
        """A bare Exception raised inside the endpoint escapes the ASGI transport."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = Exception("unexpected failure")
            with pytest.raises(Exception, match="unexpected failure"):
                await client.post("/api/analyze/TICKER")

    @pytest.mark.asyncio
    async def test_generic_exception_is_not_swallowed(
        self, client: AsyncClient
    ) -> None:
        """Verify the exception type is exactly Exception (not an AppException subclass)."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = Exception("raw crash")
            with pytest.raises(Exception):
                await client.post("/api/analyze/TICKER")

    @pytest.mark.asyncio
    async def test_generic_exception_preserves_message(
        self, client: AsyncClient
    ) -> None:
        """The original exception message is visible on the propagated exception."""
        original_message = "database connection lost"
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = Exception(original_message)
            with pytest.raises(Exception, match=original_message):
                await client.post("/api/analyze/TICKER")

    @pytest.mark.asyncio
    async def test_generic_exception_not_caught_as_app_exception(
        self, client: AsyncClient
    ) -> None:
        """Confirm the exception that propagates is NOT an AppException instance —
        the app handler's guard clause (isinstance check) does not apply."""
        from app.core.exceptions import AppException

        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = Exception("not an app exception")
            try:
                await client.post("/api/analyze/TICKER")
            except Exception as exc:
                assert not isinstance(exc, AppException)


# ---------------------------------------------------------------------------
# Empty ticker — POST /api/analyze/
# ---------------------------------------------------------------------------


class TestAnalyzeStockEmptyTicker:
    """POST /api/analyze/ with no ticker path segment."""

    @pytest.mark.asyncio
    async def test_empty_ticker_returns_4xx(self, client: AsyncClient) -> None:
        """A POST with no ticker segment must not return a 200 — route does not exist."""
        response = await client.post("/api/analyze/")

        assert response.status_code in (404, 405, 422)

    @pytest.mark.asyncio
    async def test_empty_ticker_response_is_json(self, client: AsyncClient) -> None:
        """The error response for a missing ticker path must use JSON content-type."""
        response = await client.post("/api/analyze/")

        assert "application/json" in response.headers["content-type"]

    @pytest.mark.asyncio
    async def test_empty_ticker_service_never_called(
        self, client: AsyncClient
    ) -> None:
        """The AI service must not be invoked when the ticker path segment is absent."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            await client.post("/api/analyze/")

        mock_analyze.assert_not_called()


# ---------------------------------------------------------------------------
# Very long ticker (>100 chars)
# ---------------------------------------------------------------------------

_LONG_TICKER = "A" * 101


class TestAnalyzeStockLongTicker:
    """POST /api/analyze/{ticker} where the ticker exceeds 100 characters."""

    @pytest.mark.asyncio
    async def test_long_ticker_does_not_return_500_from_routing(
        self, client: AsyncClient
    ) -> None:
        """A >100-char ticker must not crash the router — 200 (mocked) or a domain error."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post(f"/api/analyze/{_LONG_TICKER}")

        # FastAPI has no built-in path-param length limit; mocked service returns 200.
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_long_ticker_forwarded_verbatim_to_service(
        self, client: AsyncClient
    ) -> None:
        """The full ticker string (regardless of length) must reach analyze() unchanged."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            await client.post(f"/api/analyze/{_LONG_TICKER}")

        mock_analyze.assert_called_once_with(_LONG_TICKER)

    @pytest.mark.asyncio
    async def test_long_ticker_not_found_returns_404(
        self, client: AsyncClient
    ) -> None:
        """If the service raises StockNotFoundError for a long ticker, router returns 404."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError(_LONG_TICKER)
            response = await client.post(f"/api/analyze/{_LONG_TICKER}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_long_ticker_response_is_json(self, client: AsyncClient) -> None:
        """Content-type must be application/json regardless of ticker length."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = _MOCK_RESPONSE
            response = await client.post(f"/api/analyze/{_LONG_TICKER}")

        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# Content-type JSON — all error paths
# ---------------------------------------------------------------------------


class TestErrorResponseContentType:
    """Every error response class must carry application/json content-type."""

    @pytest.mark.asyncio
    async def test_404_not_found_error_is_json(self, client: AsyncClient) -> None:
        """StockNotFoundError (404) response must declare JSON content-type."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError("FAKE")
            response = await client.post("/api/analyze/FAKE")

        assert "application/json" in response.headers["content-type"]

    @pytest.mark.asyncio
    async def test_502_external_api_error_is_json(self, client: AsyncClient) -> None:
        """ExternalAPIError (502) response must declare JSON content-type."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = ExternalAPIError("FMP", "gateway timeout")
            response = await client.post("/api/analyze/AAPL")

        assert "application/json" in response.headers["content-type"]

    @pytest.mark.asyncio
    async def test_500_ai_analysis_error_is_json(self, client: AsyncClient) -> None:
        """AIAnalysisError (500) response must declare JSON content-type."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AIAnalysisError("model returned null")
            response = await client.post("/api/analyze/AAPL")

        assert "application/json" in response.headers["content-type"]

    @pytest.mark.asyncio
    async def test_500_generic_exception_propagates_not_swallowed(
        self, client: AsyncClient
    ) -> None:
        """Bare Exception propagates through ASGITransport — verified by pytest.raises."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = Exception("unhandled crash")
            with pytest.raises(Exception, match="unhandled crash"):
                await client.post("/api/analyze/AAPL")

    @pytest.mark.asyncio
    async def test_empty_ticker_path_error_is_json(
        self, client: AsyncClient
    ) -> None:
        """Route-not-found response for POST /api/analyze/ must have JSON content-type."""
        response = await client.post("/api/analyze/")

        assert "application/json" in response.headers["content-type"]
