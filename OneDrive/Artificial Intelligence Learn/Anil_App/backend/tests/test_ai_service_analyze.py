"""Tests for AIAnalysisService.analyze() — two-phase market data + AI approach."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.core.exceptions import AIAnalysisError, StockNotFoundError
from app.models.analysis import HistoricalPrice, StockAnalysisResponse, TechnicalSnapshot
from app.services.ai_analysis_service import AIAnalysisService

# ---------------------------------------------------------------------------
# Module-level mock data constants
# ---------------------------------------------------------------------------

_MOCK_QUOTE: dict = {
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
    "sector": "Technology",
    "industry": "Consumer Electronics",
    "headquarters": "Cupertino, California",
    "ceo": "",
    "founded": "",
    "employees": "164,000",
    "company_description": "Apple designs consumer electronics.",
}

_MOCK_HISTORY: list[HistoricalPrice] = [
    HistoricalPrice(date="2025-01-02", open=182.0, high=185.0, low=181.0, close=184.0, volume=40000000),
    HistoricalPrice(date="2025-01-03", open=184.0, high=187.0, low=183.5, close=186.5, volume=42000000),
]

_MOCK_TECHNICALS: TechnicalSnapshot = TechnicalSnapshot(
    sma_20=183.5,
    sma_50=180.2,
    sma_200=175.0,
    rsi_14=62.3,
    signal="neutral",
)

_MOCK_AI_RESPONSE: dict = {
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
    "news": [{"title": "Apple Reports Strong Q1", "source": "Reuters", "sentiment": "positive"}],
    "quarterly_earnings": [
        {
            "quarter": "Q1 2025",
            "revenue": 94900,
            "net_income": 23600,
            "eps": 1.53,
            "yoy_revenue_growth": 0.05,
        }
    ],
    "support_levels": [180.0, 175.0],
    "resistance_levels": [190.0, 195.0],
    "signal": "buy",
    "ceo": "Tim Cook",
    "founded": "1976",
}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def mock_provider() -> AsyncMock:
    """AsyncMock standing in for OpenAIProvider.

    Returns a mock whose ``chat_completion_json`` is an awaitable that
    returns the canonical qualitative-only mock AI response by default.
    """
    provider = AsyncMock()
    provider.chat_completion_json = AsyncMock(return_value=dict(_MOCK_AI_RESPONSE))
    return provider


@pytest.fixture()
def mock_market() -> AsyncMock:
    """AsyncMock standing in for MarketDataService.

    All three data-fetch methods return the canonical mock data.
    ``get_quote`` uses a side_effect so the returned ticker reflects the
    symbol that was passed in — required for ticker-normalisation assertions.
    """
    market = AsyncMock()
    market.get_quote = AsyncMock(
        side_effect=lambda t, **_: {**_MOCK_QUOTE, "ticker": t}
    )
    market.get_historical = AsyncMock(return_value=list(_MOCK_HISTORY))
    market.get_technicals = AsyncMock(return_value=_MOCK_TECHNICALS)
    return market


@pytest.fixture()
def service(mock_provider: AsyncMock, mock_market: AsyncMock) -> AIAnalysisService:
    """AIAnalysisService wired to both the mock provider and mock market."""
    return AIAnalysisService(provider=mock_provider, market_data=mock_market)


# ---------------------------------------------------------------------------
# Ticker normalisation
# ---------------------------------------------------------------------------


class TestTickerNormalisation:
    @pytest.mark.asyncio
    async def test_analyze_uppercases_lowercase_ticker(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """Lowercase ticker is upper-cased before being passed to the AI prompt."""
        await service.analyze("aapl")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "AAPL" in kwargs["user_prompt"]

    @pytest.mark.asyncio
    async def test_analyze_uppercases_mixed_case_ticker(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """Mixed-case ticker is normalised to uppercase."""
        await service.analyze("MsFt")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "MSFT" in kwargs["user_prompt"]

    @pytest.mark.asyncio
    async def test_analyze_strips_leading_whitespace(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """Leading whitespace is stripped before processing."""
        await service.analyze("  AAPL")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "AAPL" in kwargs["user_prompt"]
        assert "  AAPL" not in kwargs["user_prompt"]

    @pytest.mark.asyncio
    async def test_analyze_strips_trailing_whitespace(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """Trailing whitespace is stripped before processing."""
        await service.analyze("AAPL  ")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "AAPL" in kwargs["user_prompt"]
        assert "AAPL  " not in kwargs["user_prompt"]

    @pytest.mark.asyncio
    async def test_analyze_strips_whitespace_and_uppercases_together(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """Whitespace stripping and uppercasing both apply in one pass."""
        await service.analyze("  tsla  ")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "TSLA" in kwargs["user_prompt"]


# ---------------------------------------------------------------------------
# Market data service call arguments
# ---------------------------------------------------------------------------


class TestMarketDataCalls:
    @pytest.mark.asyncio
    async def test_analyze_calls_get_quote_with_normalised_ticker(
        self, service: AIAnalysisService, mock_market: AsyncMock
    ) -> None:
        """get_quote is called with the uppercased ticker."""
        await service.analyze("aapl")

        mock_market.get_quote.assert_called_once_with("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_calls_get_historical(
        self, service: AIAnalysisService, mock_market: AsyncMock
    ) -> None:
        """get_historical is called exactly once per analyze call."""
        await service.analyze("AAPL")

        mock_market.get_historical.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_calls_get_technicals(
        self, service: AIAnalysisService, mock_market: AsyncMock
    ) -> None:
        """get_technicals is called exactly once per analyze call."""
        await service.analyze("AAPL")

        mock_market.get_technicals.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_calls_all_three_market_methods(
        self, service: AIAnalysisService, mock_market: AsyncMock
    ) -> None:
        """All three market data calls are issued for a single analyze call."""
        await service.analyze("AAPL")

        mock_market.get_quote.assert_called_once()
        mock_market.get_historical.assert_called_once()
        mock_market.get_technicals.assert_called_once()


# ---------------------------------------------------------------------------
# Provider call arguments
# ---------------------------------------------------------------------------


class TestProviderCallArguments:
    @pytest.mark.asyncio
    async def test_analyze_passes_system_prompt(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """chat_completion_json receives a non-empty system_prompt kwarg."""
        await service.analyze("AAPL")

        mock_provider.chat_completion_json.assert_called_once()
        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "system_prompt" in kwargs
        assert len(kwargs["system_prompt"]) > 0

    @pytest.mark.asyncio
    async def test_analyze_passes_user_prompt_containing_ticker(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """User prompt forwarded to AI contains the stock ticker."""
        await service.analyze("NVDA")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "NVDA" in kwargs["user_prompt"]

    @pytest.mark.asyncio
    async def test_analyze_passes_max_tokens_8000(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """Phase-2 AI call uses max_tokens=8000 (qualitative-only, smaller budget)."""
        await service.analyze("AAPL")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert kwargs["max_tokens"] == 8000

    @pytest.mark.asyncio
    async def test_analyze_calls_provider_exactly_once(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """AI provider is called exactly once per analyze invocation."""
        await service.analyze("AAPL")

        mock_provider.chat_completion_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_analyze_user_prompt_does_not_contain_raw_ticker_format_placeholder(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """The {ticker} template placeholder must be substituted, not left verbatim."""
        await service.analyze("AAPL")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "{ticker}" not in kwargs["user_prompt"]

    @pytest.mark.asyncio
    async def test_analyze_user_prompt_contains_real_price_data(
        self, service: AIAnalysisService, mock_provider: AsyncMock
    ) -> None:
        """User prompt forwarded to AI contains the real market price from the quote."""
        await service.analyze("AAPL")

        _, kwargs = mock_provider.chat_completion_json.call_args
        assert "185.5" in kwargs["user_prompt"]


# ---------------------------------------------------------------------------
# Successful response parsing
# ---------------------------------------------------------------------------


class TestSuccessfulResponse:
    @pytest.mark.asyncio
    async def test_analyze_returns_stock_analysis_response_type(
        self, service: AIAnalysisService
    ) -> None:
        """Return value is always a StockAnalysisResponse instance."""
        result = await service.analyze("AAPL")

        assert isinstance(result, StockAnalysisResponse)

    @pytest.mark.asyncio
    async def test_analyze_returns_correct_ticker(
        self, service: AIAnalysisService
    ) -> None:
        """Ticker in the response matches the normalised input symbol."""
        result = await service.analyze("AAPL")

        assert result.ticker == "AAPL"

    @pytest.mark.asyncio
    async def test_analyze_returns_correct_company_name(
        self, service: AIAnalysisService
    ) -> None:
        """Company name comes from the market quote, not the AI response."""
        result = await service.analyze("AAPL")

        assert result.company_name == "Apple Inc."

    @pytest.mark.asyncio
    async def test_analyze_returns_correct_current_price(
        self, service: AIAnalysisService
    ) -> None:
        """Current price is sourced from the real market quote."""
        result = await service.analyze("AAPL")

        assert result.current_price == pytest.approx(185.50)

    @pytest.mark.asyncio
    async def test_analyze_returns_correct_previous_close(
        self, service: AIAnalysisService
    ) -> None:
        """Previous close comes from the real market quote."""
        result = await service.analyze("AAPL")

        assert result.previous_close == pytest.approx(184.20)

    @pytest.mark.asyncio
    async def test_analyze_returns_correct_recommendation(
        self, service: AIAnalysisService
    ) -> None:
        """Recommendation comes from the AI qualitative response."""
        result = await service.analyze("AAPL")

        assert result.recommendation == "buy"

    @pytest.mark.asyncio
    async def test_analyze_returns_correct_confidence_score(
        self, service: AIAnalysisService
    ) -> None:
        """Confidence score comes from the AI qualitative response."""
        result = await service.analyze("AAPL")

        assert result.confidence_score == pytest.approx(0.78)

    @pytest.mark.asyncio
    async def test_analyze_returns_technical_snapshot(
        self, service: AIAnalysisService
    ) -> None:
        """Technical snapshot is built from real market technicals, signal from AI."""
        result = await service.analyze("AAPL")

        assert result.technical is not None
        # RSI sourced from real market data (mock_market.get_technicals)
        assert result.technical.rsi_14 == pytest.approx(62.3)
        # Signal overridden by AI's signal field
        assert result.technical.signal == "buy"

    @pytest.mark.asyncio
    async def test_analyze_returns_technical_sma_from_market_data(
        self, service: AIAnalysisService
    ) -> None:
        """SMA values in the technical snapshot come from real market technicals."""
        result = await service.analyze("AAPL")

        assert result.technical is not None
        assert result.technical.sma_20 == pytest.approx(183.5)
        assert result.technical.sma_50 == pytest.approx(180.2)
        assert result.technical.sma_200 == pytest.approx(175.0)

    @pytest.mark.asyncio
    async def test_analyze_returns_news_items(
        self, service: AIAnalysisService
    ) -> None:
        """News items come from the AI qualitative response."""
        result = await service.analyze("AAPL")

        assert len(result.news) == 1
        assert result.news[0].title == "Apple Reports Strong Q1"
        assert result.news[0].sentiment == "positive"

    @pytest.mark.asyncio
    async def test_analyze_returns_quarterly_earnings(
        self, service: AIAnalysisService
    ) -> None:
        """Quarterly earnings come from the AI qualitative response."""
        result = await service.analyze("AAPL")

        assert len(result.quarterly_earnings) == 1
        assert result.quarterly_earnings[0].quarter == "Q1 2025"

    @pytest.mark.asyncio
    async def test_analyze_returns_risk_assessment(
        self, service: AIAnalysisService
    ) -> None:
        """Risk assessment comes from the AI qualitative response."""
        result = await service.analyze("AAPL")

        assert result.risk_assessment.overall_risk == "medium"
        assert result.risk_assessment.risk_score == pytest.approx(0.45)

    @pytest.mark.asyncio
    async def test_analyze_returns_price_predictions(
        self, service: AIAnalysisService
    ) -> None:
        """Price predictions come from the AI qualitative response."""
        result = await service.analyze("AAPL")

        assert result.price_predictions.one_week.mid == pytest.approx(186.0)
        assert result.price_predictions.one_month.confidence == pytest.approx(0.65)
        assert result.price_predictions.three_months.high == pytest.approx(215.0)

    @pytest.mark.asyncio
    async def test_analyze_populates_analysis_timestamp(
        self, service: AIAnalysisService
    ) -> None:
        """analysis_timestamp is always populated after a successful call."""
        result = await service.analyze("AAPL")

        assert result.analysis_timestamp is not None

    @pytest.mark.asyncio
    async def test_analyze_returns_historical_prices_from_market(
        self, service: AIAnalysisService
    ) -> None:
        """historical_prices are sourced from the real market data service."""
        result = await service.analyze("AAPL")

        assert len(result.historical_prices) == 2
        assert result.historical_prices[0].date == "2025-01-02"

    @pytest.mark.asyncio
    async def test_analyze_ticker_in_response_is_resolved_from_quote(
        self,
        mock_provider: AsyncMock,
        mock_market: AsyncMock,
    ) -> None:
        """Ticker in the response is taken from the quote (resolved by yfinance), uppercased."""
        # quote returns the normalised uppercase ticker from mock_market's side_effect
        service = AIAnalysisService(provider=mock_provider, market_data=mock_market)

        result = await service.analyze("AAPL")

        assert result.ticker == "AAPL"

    @pytest.mark.asyncio
    async def test_analyze_ceo_from_ai_response(
        self, service: AIAnalysisService
    ) -> None:
        """CEO field is populated from the AI qualitative response."""
        result = await service.analyze("AAPL")

        assert result.ceo == "Tim Cook"

    @pytest.mark.asyncio
    async def test_analyze_founded_from_ai_response(
        self, service: AIAnalysisService
    ) -> None:
        """Founded year is populated from the AI qualitative response."""
        result = await service.analyze("AAPL")

        assert result.founded == "1976"

    @pytest.mark.asyncio
    async def test_analyze_support_levels_merged_from_ai(
        self, service: AIAnalysisService
    ) -> None:
        """Support levels from AI response are merged into the technical snapshot."""
        result = await service.analyze("AAPL")

        assert result.technical is not None
        assert 180.0 in result.technical.support_levels
        assert 175.0 in result.technical.support_levels

    @pytest.mark.asyncio
    async def test_analyze_resistance_levels_merged_from_ai(
        self, service: AIAnalysisService
    ) -> None:
        """Resistance levels from AI response are merged into the technical snapshot."""
        result = await service.analyze("AAPL")

        assert result.technical is not None
        assert 190.0 in result.technical.resistance_levels
        assert 195.0 in result.technical.resistance_levels


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------


class TestErrorHandling:
    @pytest.mark.asyncio
    async def test_analyze_re_raises_ai_analysis_error_unchanged(
        self, mock_provider: AsyncMock, mock_market: AsyncMock
    ) -> None:
        """AIAnalysisError from the provider must bubble up unmodified."""
        original = AIAnalysisError("upstream failure")
        mock_provider.chat_completion_json = AsyncMock(side_effect=original)
        service = AIAnalysisService(provider=mock_provider, market_data=mock_market)

        with pytest.raises(AIAnalysisError, match="upstream failure"):
            await service.analyze("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_does_not_double_wrap_ai_analysis_error(
        self, mock_provider: AsyncMock, mock_market: AsyncMock
    ) -> None:
        """AIAnalysisError from the provider must bubble up as-is, not wrapped again."""
        original = AIAnalysisError("provider broke")
        mock_provider.chat_completion_json = AsyncMock(side_effect=original)
        service = AIAnalysisService(provider=mock_provider, market_data=mock_market)

        with pytest.raises(AIAnalysisError) as exc_info:
            await service.analyze("AAPL")

        # __cause__ should be None — re-raised, not chained
        assert exc_info.value.__cause__ is None

    @pytest.mark.asyncio
    async def test_analyze_wraps_generic_exception_in_ai_analysis_error(
        self, mock_provider: AsyncMock, mock_market: AsyncMock
    ) -> None:
        """RuntimeError from the AI provider is wrapped in AIAnalysisError."""
        mock_provider.chat_completion_json = AsyncMock(
            side_effect=RuntimeError("network timeout")
        )
        service = AIAnalysisService(provider=mock_provider, market_data=mock_market)

        with pytest.raises(AIAnalysisError):
            await service.analyze("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_wraps_generic_exception_preserves_original_message(
        self, mock_provider: AsyncMock, mock_market: AsyncMock
    ) -> None:
        """The original exception message is preserved inside the AIAnalysisError."""
        mock_provider.chat_completion_json = AsyncMock(
            side_effect=RuntimeError("network timeout")
        )
        service = AIAnalysisService(provider=mock_provider, market_data=mock_market)

        with pytest.raises(AIAnalysisError, match="network timeout"):
            await service.analyze("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_wraps_generic_exception_chains_cause(
        self, mock_provider: AsyncMock, mock_market: AsyncMock
    ) -> None:
        """The original exception is chained as __cause__ on the AIAnalysisError."""
        original = RuntimeError("dns failure")
        mock_provider.chat_completion_json = AsyncMock(side_effect=original)
        service = AIAnalysisService(provider=mock_provider, market_data=mock_market)

        with pytest.raises(AIAnalysisError) as exc_info:
            await service.analyze("AAPL")

        assert exc_info.value.__cause__ is original

    @pytest.mark.asyncio
    async def test_analyze_wraps_value_error_in_ai_analysis_error(
        self, mock_provider: AsyncMock, mock_market: AsyncMock
    ) -> None:
        """ValueError from the AI provider is wrapped in AIAnalysisError."""
        mock_provider.chat_completion_json = AsyncMock(
            side_effect=ValueError("unexpected value")
        )
        service = AIAnalysisService(provider=mock_provider, market_data=mock_market)

        with pytest.raises(AIAnalysisError, match="unexpected value"):
            await service.analyze("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_raises_ai_analysis_error_on_missing_required_key(
        self, mock_provider: AsyncMock, mock_market: AsyncMock
    ) -> None:
        """AI response missing required qualitative fields (e.g. recommendation) raises AIAnalysisError."""
        bad_payload: dict = {}  # missing recommendation, confidence_score, summary, etc.
        mock_provider.chat_completion_json = AsyncMock(return_value=bad_payload)
        service = AIAnalysisService(provider=mock_provider, market_data=mock_market)

        with pytest.raises(AIAnalysisError):
            await service.analyze("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_raises_ai_analysis_error_on_stock_not_found(
        self, mock_provider: AsyncMock, mock_market: AsyncMock
    ) -> None:
        """StockNotFoundError from get_quote is wrapped and raised as AIAnalysisError."""
        mock_market.get_quote = AsyncMock(side_effect=StockNotFoundError("FAKE"))
        service = AIAnalysisService(provider=mock_provider, market_data=mock_market)

        with pytest.raises(AIAnalysisError, match="FAKE"):
            await service.analyze("FAKE")

    @pytest.mark.asyncio
    async def test_analyze_raises_ai_analysis_error_on_market_runtime_error(
        self, mock_provider: AsyncMock, mock_market: AsyncMock
    ) -> None:
        """RuntimeError from get_historical is wrapped and raised as AIAnalysisError."""
        mock_market.get_historical = AsyncMock(
            side_effect=RuntimeError("yfinance unavailable")
        )
        service = AIAnalysisService(provider=mock_provider, market_data=mock_market)

        with pytest.raises(AIAnalysisError, match="yfinance unavailable"):
            await service.analyze("AAPL")

    @pytest.mark.asyncio
    async def test_analyze_does_not_call_ai_when_market_fetch_fails(
        self, mock_provider: AsyncMock, mock_market: AsyncMock
    ) -> None:
        """If market data fetch fails, the AI provider must not be called at all."""
        mock_market.get_quote = AsyncMock(side_effect=RuntimeError("timeout"))
        service = AIAnalysisService(provider=mock_provider, market_data=mock_market)

        with pytest.raises(AIAnalysisError):
            await service.analyze("AAPL")

        mock_provider.chat_completion_json.assert_not_called()


# ---------------------------------------------------------------------------
# Default provider / market construction
# ---------------------------------------------------------------------------


class TestDefaultProviderConstruction:
    def test_init_creates_openai_provider_when_none_given(self) -> None:
        """Constructor must instantiate OpenAIProvider when no provider is supplied."""
        with patch("app.services.ai_analysis_service.OpenAIProvider") as mock_cls:
            mock_cls.return_value = AsyncMock()
            with patch("app.services.ai_analysis_service.MarketDataService"):
                svc = AIAnalysisService()
                mock_cls.assert_called_once()
                assert svc._provider is mock_cls.return_value

    def test_init_creates_market_data_service_when_none_given(self) -> None:
        """Constructor must instantiate MarketDataService when no market_data is supplied."""
        with patch("app.services.ai_analysis_service.MarketDataService") as mock_cls:
            mock_cls.return_value = AsyncMock()
            with patch("app.services.ai_analysis_service.OpenAIProvider"):
                svc = AIAnalysisService()
                mock_cls.assert_called_once()
                assert svc._market is mock_cls.return_value

    def test_init_uses_supplied_provider(self, mock_provider: AsyncMock) -> None:
        """Supplied provider is stored without replacement."""
        with patch("app.services.ai_analysis_service.MarketDataService"):
            svc = AIAnalysisService(provider=mock_provider)
            assert svc._provider is mock_provider

    def test_init_uses_supplied_market_data(self, mock_market: AsyncMock) -> None:
        """Supplied market_data is stored without replacement."""
        with patch("app.services.ai_analysis_service.OpenAIProvider"):
            svc = AIAnalysisService(market_data=mock_market)
            assert svc._market is mock_market
