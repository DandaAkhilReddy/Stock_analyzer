"""Tests for AIAnalysisService.analyze()."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.core.exceptions import AIAnalysisError
from app.models.analysis import StockAnalysisResponse
from app.services.ai_analysis_service import AIAnalysisService

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

_MOCK_AI_RESPONSE: dict = {
    "ticker": "AAPL",
    "company_name": "Apple Inc.",
    "current_price": 185.50,
    "previous_close": 184.20,
    "open": 184.80,
    "day_high": 186.10,
    "day_low": 184.00,
    "volume": 45000000,
    "market_cap": "2.8T",
    "pe_ratio": 28.5,
    "eps": 6.51,
    "week_52_high": 199.62,
    "week_52_low": 164.08,
    "dividend_yield": 0.0054,
    "technical": {
        "sma_20": 183.50,
        "sma_50": 180.20,
        "sma_200": 175.00,
        "ema_12": 184.00,
        "ema_26": 182.50,
        "rsi_14": 62.3,
        "macd_line": 1.5,
        "macd_signal": 1.2,
        "macd_histogram": 0.3,
        "bollinger_upper": 190.0,
        "bollinger_middle": 183.5,
        "bollinger_lower": 177.0,
        "support_levels": [180.0, 175.0],
        "resistance_levels": [190.0, 195.0],
        "signal": "buy",
    },
    "news": [
        {"title": "Apple Reports Strong Q1", "source": "Reuters", "sentiment": "positive"}
    ],
    "quarterly_earnings": [
        {
            "quarter": "Q1 2025",
            "revenue": 94900,
            "net_income": 23600,
            "eps": 1.53,
            "yoy_revenue_growth": 0.05,
        }
    ],
    "recommendation": "buy",
    "confidence_score": 0.78,
    "summary": "Apple shows strong momentum.",
    "bull_case": "Strong ecosystem.",
    "bear_case": "Regulatory pressure.",
    "risk_assessment": {
        "overall_risk": "medium",
        "risk_factors": ["Regulation"],
        "risk_score": 0.45,
    },
    "price_predictions": {
        "one_week": {"low": 183.0, "mid": 186.0, "high": 189.0, "confidence": 0.75},
        "one_month": {"low": 180.0, "mid": 190.0, "high": 200.0, "confidence": 0.65},
        "three_months": {"low": 175.0, "mid": 195.0, "high": 215.0, "confidence": 0.55},
    },
}


@pytest.fixture()
def mock_ai_response() -> dict:
    """Deep-copy-safe reference to the canonical mock AI payload."""
    return dict(_MOCK_AI_RESPONSE)


@pytest.fixture()
def mock_provider() -> AsyncMock:
    """AsyncMock standing in for OpenAIProvider.

    Returns a mock whose ``chat_completion_json`` is an awaitable that
    returns the canonical mock AI response by default.
    """
    provider = AsyncMock()
    provider.chat_completion_json = AsyncMock(return_value=dict(_MOCK_AI_RESPONSE))
    return provider


@pytest.fixture()
def service(mock_provider: AsyncMock) -> AIAnalysisService:
    """AIAnalysisService wired to the mock provider."""
    return AIAnalysisService(provider=mock_provider)


# ---------------------------------------------------------------------------
# Ticker normalisation
# ---------------------------------------------------------------------------


class TestTickerNormalisation:
    @pytest.mark.asyncio
    async def test_analyze_uppercases_lowercase_ticker(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        await service.analyze("aapl")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "AAPL" in kwargs["user_prompt"]

    @pytest.mark.asyncio
    async def test_analyze_uppercases_mixed_case_ticker(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        await service.analyze("MsFt")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "MSFT" in kwargs["user_prompt"]

    @pytest.mark.asyncio
    async def test_analyze_strips_leading_whitespace(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        await service.analyze("  AAPL")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "AAPL" in kwargs["user_prompt"]
        # Ensure the raw whitespace was not forwarded
        assert "  AAPL" not in kwargs["user_prompt"]

    @pytest.mark.asyncio
    async def test_analyze_strips_trailing_whitespace(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        await service.analyze("AAPL  ")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "AAPL" in kwargs["user_prompt"]
        assert "AAPL  " not in kwargs["user_prompt"]

    @pytest.mark.asyncio
    async def test_analyze_strips_whitespace_and_uppercases_together(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        await service.analyze("  tsla  ")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "TSLA" in kwargs["user_prompt"]


# ---------------------------------------------------------------------------
# Provider call arguments
# ---------------------------------------------------------------------------


class TestProviderCallArguments:
    @pytest.mark.asyncio
    async def test_analyze_passes_system_prompt(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        await service.analyze("AAPL")

        mock_provider.chat_completion_json.assert_called_once()
        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "system_prompt" in kwargs
        assert len(kwargs["system_prompt"]) > 0

    @pytest.mark.asyncio
    async def test_analyze_passes_user_prompt_containing_ticker(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        await service.analyze("NVDA")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "NVDA" in kwargs["user_prompt"]

    @pytest.mark.asyncio
    async def test_analyze_passes_max_tokens_32000(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        await service.analyze("AAPL")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert kwargs["max_tokens"] == 32000

    @pytest.mark.asyncio
    async def test_analyze_calls_provider_exactly_once(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        await service.analyze("AAPL")

        mock_provider.chat_completion_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_user_prompt_does_not_contain_raw_ticker_format_placeholder(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """Verify {ticker} placeholder is replaced, not left verbatim."""
        await service.analyze("AAPL")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "{ticker}" not in kwargs["user_prompt"]


# ---------------------------------------------------------------------------
# Successful response parsing
# ---------------------------------------------------------------------------


class TestSuccessfulResponse:
    @pytest.mark.asyncio
    async def test_analyze_returns_stock_analysis_response_type(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert isinstance(result, StockAnalysisResponse)

    @pytest.mark.asyncio
    async def test_analyze_returns_correct_ticker(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert result.ticker == "AAPL"

    @pytest.mark.asyncio
    async def test_analyze_returns_correct_company_name(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert result.company_name == "Apple Inc."

    @pytest.mark.asyncio
    async def test_analyze_returns_correct_current_price(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert result.current_price == pytest.approx(185.50)

    @pytest.mark.asyncio
    async def test_analyze_returns_correct_recommendation(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert result.recommendation == "buy"

    @pytest.mark.asyncio
    async def test_analyze_returns_correct_confidence_score(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert result.confidence_score == pytest.approx(0.78)

    @pytest.mark.asyncio
    async def test_analyze_returns_technical_snapshot(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert result.technical is not None
        assert result.technical.rsi_14 == pytest.approx(62.3)
        assert result.technical.signal == "buy"

    @pytest.mark.asyncio
    async def test_analyze_returns_news_items(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert len(result.news) == 1
        assert result.news[0].title == "Apple Reports Strong Q1"
        assert result.news[0].sentiment == "positive"

    @pytest.mark.asyncio
    async def test_analyze_returns_quarterly_earnings(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert len(result.quarterly_earnings) == 1
        assert result.quarterly_earnings[0].quarter == "Q1 2025"

    @pytest.mark.asyncio
    async def test_analyze_returns_risk_assessment(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert result.risk_assessment.overall_risk == "medium"
        assert result.risk_assessment.risk_score == pytest.approx(0.45)

    @pytest.mark.asyncio
    async def test_analyze_returns_price_predictions(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert result.price_predictions.one_week.mid == pytest.approx(186.0)
        assert result.price_predictions.one_month.confidence == pytest.approx(0.65)
        assert result.price_predictions.three_months.high == pytest.approx(215.0)

    @pytest.mark.asyncio
    async def test_analyze_populates_analysis_timestamp(
        self, service: AIAnalysisService
    ) -> None:
        result = await service.analyze("AAPL")

        assert result.analysis_timestamp is not None

    @pytest.mark.asyncio
    async def test_analyze_ticker_in_response_is_uppercased(
        self,
        mock_provider: AsyncMock,
    ) -> None:
        """Ticker returned in the AI payload is normalised to uppercase."""
        payload = dict(_MOCK_AI_RESPONSE)
        payload["ticker"] = "aapl"  # AI returned lowercase — must be corrected
        mock_provider.chat_completion_json = AsyncMock(return_value=payload)
        service = AIAnalysisService(provider=mock_provider)

        result = await service.analyze("AAPL")

        assert result.ticker == "AAPL"


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------


class TestErrorHandling:
    @pytest.mark.asyncio
    async def test_analyze_re_raises_ai_analysis_error_unchanged(
        self, mock_provider: AsyncMock
    ) -> None:
        original = AIAnalysisError("upstream failure")
        mock_provider.chat_completion_json = AsyncMock(side_effect=original)
        service = AIAnalysisService(provider=mock_provider)

        with pytest.raises(AIAnalysisError, match="upstream failure"):
            await service.analyze("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_does_not_double_wrap_ai_analysis_error(
        self, mock_provider: AsyncMock
    ) -> None:
        """AIAnalysisError from the provider must bubble up as-is, not wrapped again."""
        original = AIAnalysisError("provider broke")
        mock_provider.chat_completion_json = AsyncMock(side_effect=original)
        service = AIAnalysisService(provider=mock_provider)

        with pytest.raises(AIAnalysisError) as exc_info:
            await service.analyze("AAPL")

        # __cause__ should be None — the exception was re-raised, not wrapped
        assert exc_info.value.__cause__ is None

    @pytest.mark.asyncio
    async def test_analyze_wraps_generic_exception_in_ai_analysis_error(
        self, mock_provider: AsyncMock
    ) -> None:
        mock_provider.chat_completion_json = AsyncMock(
            side_effect=RuntimeError("network timeout")
        )
        service = AIAnalysisService(provider=mock_provider)

        with pytest.raises(AIAnalysisError):
            await service.analyze("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_wraps_generic_exception_preserves_original_message(
        self, mock_provider: AsyncMock
    ) -> None:
        mock_provider.chat_completion_json = AsyncMock(
            side_effect=RuntimeError("network timeout")
        )
        service = AIAnalysisService(provider=mock_provider)

        with pytest.raises(AIAnalysisError, match="network timeout"):
            await service.analyze("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_wraps_generic_exception_chains_cause(
        self, mock_provider: AsyncMock
    ) -> None:
        original = RuntimeError("dns failure")
        mock_provider.chat_completion_json = AsyncMock(side_effect=original)
        service = AIAnalysisService(provider=mock_provider)

        with pytest.raises(AIAnalysisError) as exc_info:
            await service.analyze("AAPL")

        assert exc_info.value.__cause__ is original

    @pytest.mark.asyncio
    async def test_analyze_wraps_value_error_in_ai_analysis_error(
        self, mock_provider: AsyncMock
    ) -> None:
        mock_provider.chat_completion_json = AsyncMock(
            side_effect=ValueError("unexpected value")
        )
        service = AIAnalysisService(provider=mock_provider)

        with pytest.raises(AIAnalysisError, match="unexpected value"):
            await service.analyze("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_raises_ai_analysis_error_on_missing_required_key(
        self, mock_provider: AsyncMock
    ) -> None:
        """Parse failure on missing required field must surface as AIAnalysisError."""
        bad_payload: dict = {}  # missing current_price and all required keys
        mock_provider.chat_completion_json = AsyncMock(return_value=bad_payload)
        service = AIAnalysisService(provider=mock_provider)

        with pytest.raises(AIAnalysisError):
            await service.analyze("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_raises_ai_analysis_error_on_non_numeric_price(
        self, mock_provider: AsyncMock
    ) -> None:
        """A non-numeric current_price must raise AIAnalysisError, not ValueError."""
        payload = dict(_MOCK_AI_RESPONSE)
        payload["current_price"] = "not-a-number"
        mock_provider.chat_completion_json = AsyncMock(return_value=payload)
        service = AIAnalysisService(provider=mock_provider)

        with pytest.raises(AIAnalysisError):
            await service.analyze("AAPL")


# ---------------------------------------------------------------------------
# Default provider construction
# ---------------------------------------------------------------------------


class TestDefaultProviderConstruction:
    def test_init_creates_openai_provider_when_none_given(self) -> None:
        """Constructor must not raise when no provider is supplied."""
        with patch("app.services.ai_analysis_service.OpenAIProvider") as mock_cls:
            mock_cls.return_value = AsyncMock()
            svc = AIAnalysisService()
            mock_cls.assert_called_once()
            assert svc._provider is mock_cls.return_value

    def test_init_uses_supplied_provider(self, mock_provider: AsyncMock) -> None:
        svc = AIAnalysisService(provider=mock_provider)
        assert svc._provider is mock_provider
