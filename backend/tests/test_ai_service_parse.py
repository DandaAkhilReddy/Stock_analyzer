"""Tests for AIAnalysisService._merge_response()."""
from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AIAnalysisError
from app.models.analysis import (
    HistoricalPrice,
    LongTermOutlook,
    NewsItem,
    PriceForecast,
    PricePredictions,
    QuarterlyEarning,
    RiskAssessment,
    StockAnalysisResponse,
    TechnicalSnapshot,
)
from app.services.ai_analysis_service import AIAnalysisService
from app.services.market_data_service import MarketDataService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_service() -> AIAnalysisService:
    """Return a service instance with mock provider and market data (no real API calls)."""
    return AIAnalysisService(provider=MagicMock(), market_data=MagicMock())


def _price_forecast_dict(
    low: float = 140.0,
    mid: float = 150.0,
    high: float = 160.0,
    confidence: float = 0.8,
) -> dict[str, Any]:
    """Return a dict representing a single PriceForecast."""
    return {"low": low, "mid": mid, "high": high, "confidence": confidence}


def _mock_quote(**overrides: Any) -> dict[str, Any]:
    """Return a fully-populated quote dict as returned by MarketDataService.get_quote().

    Args:
        **overrides: Key-value pairs that override the defaults.

    Returns:
        Quote dict with all standard yfinance fields populated.
    """
    base: dict[str, Any] = {
        "ticker": "AAPL",
        "company_name": "Apple Inc.",
        "current_price": 175.0,
        "previous_close": 173.5,
        "open": 174.0,
        "day_high": 176.2,
        "day_low": 173.1,
        "volume": 55_000_000,
        "market_cap": "2.8T",
        "pe_ratio": 28.5,
        "eps": 6.14,
        "week_52_high": 199.62,
        "week_52_low": 124.17,
        "dividend_yield": 0.005,
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "headquarters": "Cupertino, CA",
        "employees": "164,000",
        "company_description": "Apple designs electronics.",
    }
    base.update(overrides)
    return base


def _mock_history() -> list[HistoricalPrice]:
    """Return a minimal historical price list for testing."""
    return [
        HistoricalPrice(
            date="2025-01-02",
            open=170.0,
            high=172.5,
            low=169.0,
            close=171.8,
            volume=48_000_000,
        ),
    ]


def _mock_technicals(**overrides: Any) -> TechnicalSnapshot:
    """Return a TechnicalSnapshot with common values pre-filled.

    Args:
        **overrides: Field overrides applied to the TechnicalSnapshot.

    Returns:
        A TechnicalSnapshot with realistic computed indicator values.
    """
    fields: dict[str, Any] = {
        "sma_20": 172.0,
        "sma_50": 168.0,
        "sma_200": 155.0,
        "ema_12": 173.5,
        "ema_26": 170.0,
        "rsi_14": 58.3,
        "macd_line": 2.1,
        "macd_signal": 1.8,
        "macd_histogram": 0.3,
        "bollinger_upper": 180.0,
        "bollinger_middle": 172.0,
        "bollinger_lower": 164.0,
    }
    fields.update(overrides)
    return TechnicalSnapshot(**fields)


def _minimal_valid_ai_data(**overrides: Any) -> dict[str, Any]:
    """Return the smallest ai_data dict that _merge_response accepts without error.

    Contains only AI-qualitative fields — no price or technical indicators.

    Args:
        **overrides: Key-value pairs that override the defaults.

    Returns:
        Minimal valid ai_data dict.
    """
    base: dict[str, Any] = {
        "recommendation": "buy",
        "confidence_score": 0.85,
        "summary": "Strong fundamentals.",
        "bull_case": "Growing services revenue.",
        "bear_case": "Slowing iPhone sales.",
        "risk_assessment": {
            "overall_risk": "medium",
            "risk_factors": ["competition", "regulation"],
            "risk_score": 0.4,
        },
        "price_predictions": {
            "one_week": _price_forecast_dict(140, 150, 160, 0.8),
            "one_month": _price_forecast_dict(145, 155, 165, 0.75),
            "three_months": _price_forecast_dict(150, 165, 180, 0.65),
        },
        "news": [],
        "quarterly_earnings": [],
        "support_levels": [],
        "resistance_levels": [],
        "signal": "neutral",
        "ceo": "",
        "founded": "",
    }
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# TestMergeResponseHappyPath
# ---------------------------------------------------------------------------


class TestMergeResponseHappyPath:
    """Full valid data returns a correctly populated StockAnalysisResponse."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        """Provide a service instance with mocked dependencies."""
        return _make_service()

    @pytest.fixture
    def result(self, service: AIAnalysisService) -> StockAnalysisResponse:
        """Invoke _merge_response with complete, valid inputs."""
        ai_data = _minimal_valid_ai_data(
            support_levels=[165.0, 160.0],
            resistance_levels=[180.0, 185.0],
            signal="buy",
            news=[
                {"title": "Apple beats Q1 estimates", "source": "Reuters", "sentiment": "positive"},
                {"title": "Vision Pro supply concerns", "source": "Bloomberg", "sentiment": "negative"},
            ],
            quarterly_earnings=[
                {
                    "quarter": "Q1 2025",
                    "revenue": 124_300.0,
                    "net_income": 36_330.0,
                    "eps": 2.40,
                    "yoy_revenue_growth": 0.04,
                },
                {
                    "quarter": "Q4 2024",
                    "revenue": 119_575.0,
                    "net_income": 33_916.0,
                    "eps": 2.18,
                    "yoy_revenue_growth": 0.06,
                },
            ],
        )
        return service._merge_response(
            "AAPL",
            _mock_quote(),
            _mock_history(),
            _mock_technicals(),
            ai_data,
        )

    def test_returns_stock_analysis_response(self, result: StockAnalysisResponse) -> None:
        assert isinstance(result, StockAnalysisResponse)

    def test_ticker_from_first_param(self, result: StockAnalysisResponse) -> None:
        """Ticker is the first positional argument passed directly to _merge_response."""
        assert result.ticker == "AAPL"

    def test_company_name_from_quote(self, result: StockAnalysisResponse) -> None:
        assert result.company_name == "Apple Inc."

    def test_current_price_is_float(self, result: StockAnalysisResponse) -> None:
        assert result.current_price == 175.0
        assert isinstance(result.current_price, float)

    def test_optional_quote_fields_populated(self, result: StockAnalysisResponse) -> None:
        assert result.previous_close == 173.5
        assert result.open == 174.0
        assert result.day_high == 176.2
        assert result.day_low == 173.1
        assert result.volume == 55_000_000

    def test_fundamental_fields_populated(self, result: StockAnalysisResponse) -> None:
        assert result.market_cap == "2.8T"
        assert result.pe_ratio == 28.5
        assert result.eps == 6.14
        assert result.week_52_high == 199.62
        assert result.week_52_low == 124.17
        assert result.dividend_yield == 0.005

    def test_recommendation_and_confidence(self, result: StockAnalysisResponse) -> None:
        assert result.recommendation == "buy"
        assert result.confidence_score == pytest.approx(0.85)

    def test_narrative_fields(self, result: StockAnalysisResponse) -> None:
        assert result.summary == "Strong fundamentals."
        assert result.bull_case == "Growing services revenue."
        assert result.bear_case == "Slowing iPhone sales."

    def test_analysis_timestamp_is_set(self, result: StockAnalysisResponse) -> None:
        from datetime import datetime, timezone

        assert isinstance(result.analysis_timestamp, datetime)
        assert result.analysis_timestamp.tzinfo == timezone.utc

    def test_technical_is_snapshot_instance(self, result: StockAnalysisResponse) -> None:
        assert isinstance(result.technical, TechnicalSnapshot)

    def test_technical_fields_from_technicals_param(self, result: StockAnalysisResponse) -> None:
        """SMA/RSI/MACD come from the technicals param; support/resistance/signal from ai_data."""
        tech = result.technical
        assert tech is not None
        assert tech.sma_20 == 172.0
        assert tech.rsi_14 == pytest.approx(58.3)
        assert tech.signal == "buy"
        assert tech.support_levels == [165.0, 160.0]
        assert tech.resistance_levels == [180.0, 185.0]

    def test_historical_prices_passed_through(self, result: StockAnalysisResponse) -> None:
        assert len(result.historical_prices) == 1
        assert result.historical_prices[0].close == pytest.approx(171.8)

    def test_news_list_length(self, result: StockAnalysisResponse) -> None:
        assert len(result.news) == 2

    def test_news_items_are_news_item_instances(self, result: StockAnalysisResponse) -> None:
        for item in result.news:
            assert isinstance(item, NewsItem)

    def test_news_first_item_fields(self, result: StockAnalysisResponse) -> None:
        first = result.news[0]
        assert first.title == "Apple beats Q1 estimates"
        assert first.source == "Reuters"
        assert first.sentiment == "positive"

    def test_news_second_item_fields(self, result: StockAnalysisResponse) -> None:
        second = result.news[1]
        assert second.title == "Vision Pro supply concerns"
        assert second.sentiment == "negative"

    def test_quarterly_earnings_length(self, result: StockAnalysisResponse) -> None:
        assert len(result.quarterly_earnings) == 2

    def test_quarterly_earnings_are_correct_type(self, result: StockAnalysisResponse) -> None:
        for earning in result.quarterly_earnings:
            assert isinstance(earning, QuarterlyEarning)

    def test_quarterly_earnings_first_item(self, result: StockAnalysisResponse) -> None:
        q = result.quarterly_earnings[0]
        assert q.quarter == "Q1 2025"
        assert q.revenue == pytest.approx(124_300.0)
        assert q.eps == pytest.approx(2.40)
        assert q.yoy_revenue_growth == pytest.approx(0.04)

    def test_risk_assessment_is_correct_type(self, result: StockAnalysisResponse) -> None:
        assert isinstance(result.risk_assessment, RiskAssessment)

    def test_risk_assessment_fields(self, result: StockAnalysisResponse) -> None:
        risk = result.risk_assessment
        assert risk.overall_risk == "medium"
        assert risk.risk_factors == ["competition", "regulation"]
        assert risk.risk_score == pytest.approx(0.4)

    def test_price_predictions_is_correct_type(self, result: StockAnalysisResponse) -> None:
        assert isinstance(result.price_predictions, PricePredictions)

    def test_price_predictions_one_week(self, result: StockAnalysisResponse) -> None:
        fw = result.price_predictions.one_week
        assert isinstance(fw, PriceForecast)
        assert fw.low == 140.0
        assert fw.mid == 150.0
        assert fw.high == 160.0
        assert fw.confidence == pytest.approx(0.8)

    def test_price_predictions_one_month(self, result: StockAnalysisResponse) -> None:
        fm = result.price_predictions.one_month
        assert fm.mid == 155.0
        assert fm.confidence == pytest.approx(0.75)

    def test_price_predictions_three_months(self, result: StockAnalysisResponse) -> None:
        f3 = result.price_predictions.three_months
        assert f3.mid == 165.0
        assert f3.confidence == pytest.approx(0.65)

    def test_company_info_from_quote(self, result: StockAnalysisResponse) -> None:
        assert result.sector == "Technology"
        assert result.industry == "Consumer Electronics"
        assert result.headquarters == "Cupertino, CA"
        assert result.employees == "164,000"
        assert result.company_description == "Apple designs electronics."


# ---------------------------------------------------------------------------
# TestTickerResolution
# ---------------------------------------------------------------------------


class TestTickerResolution:
    """Tests covering how the output ticker is resolved."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        """Provide a service instance with mocked dependencies."""
        return _make_service()

    def test_ticker_from_first_arg(self, service: AIAnalysisService) -> None:
        """The ticker param is passed through verbatim — no resolution from ai_data."""
        result = service._merge_response(
            "MSFT",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(),
        )
        assert result.ticker == "MSFT"

    def test_ticker_lowercase_input_preserved(self, service: AIAnalysisService) -> None:
        """_merge_response does not uppercase the ticker — caller is responsible."""
        result = service._merge_response(
            "aapl",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(),
        )
        # The ticker passed in is used as-is by _merge_response
        assert result.ticker == "aapl"

    def test_company_name_from_quote(self, service: AIAnalysisService) -> None:
        """company_name is taken from quote['company_name']."""
        result = service._merge_response(
            "AAPL",
            _mock_quote(company_name="Apple Corporation"),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(),
        )
        assert result.company_name == "Apple Corporation"

    def test_company_name_falls_back_to_ticker_when_absent(
        self, service: AIAnalysisService
    ) -> None:
        """company_name falls back to the ticker arg when absent from quote."""
        quote = _mock_quote()
        del quote["company_name"]
        result = service._merge_response(
            "AAPL",
            quote,
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(),
        )
        assert result.company_name == "AAPL"


# ---------------------------------------------------------------------------
# TestTechnicalField
# ---------------------------------------------------------------------------


class TestTechnicalField:
    """Tests for TechnicalSnapshot merging — computed vs AI-provided fields."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        """Provide a service instance with mocked dependencies."""
        return _make_service()

    def test_technical_always_present(self, service: AIAnalysisService) -> None:
        """_merge_response always builds a TechnicalSnapshot (never None)."""
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(),
        )
        assert isinstance(result.technical, TechnicalSnapshot)

    def test_computed_indicators_from_technicals_param(
        self, service: AIAnalysisService
    ) -> None:
        """sma_20, rsi_14, macd_line etc. come from the technicals arg, not ai_data."""
        technicals = _mock_technicals(sma_20=172.0, rsi_14=58.3)
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            technicals,
            _minimal_valid_ai_data(),
        )
        assert result.technical is not None
        assert result.technical.sma_20 == pytest.approx(172.0)
        assert result.technical.rsi_14 == pytest.approx(58.3)

    def test_support_and_resistance_from_ai_data(
        self, service: AIAnalysisService
    ) -> None:
        """support_levels and resistance_levels are merged from ai_data."""
        ai_data = _minimal_valid_ai_data(
            support_levels=[165.0, 160.0],
            resistance_levels=[180.0, 185.0],
        )
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            ai_data,
        )
        assert result.technical is not None
        assert result.technical.support_levels == [165.0, 160.0]
        assert result.technical.resistance_levels == [180.0, 185.0]

    def test_signal_from_ai_data(self, service: AIAnalysisService) -> None:
        """signal field is merged from ai_data into the TechnicalSnapshot."""
        ai_data = _minimal_valid_ai_data(signal="sell")
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            ai_data,
        )
        assert result.technical is not None
        assert result.technical.signal == "sell"

    def test_empty_technicals_param_defaults_to_none_fields(
        self, service: AIAnalysisService
    ) -> None:
        """When TechnicalSnapshot() is passed, all computed fields are None."""
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(),
        )
        tech = result.technical
        assert tech is not None
        assert tech.sma_20 is None
        assert tech.rsi_14 is None


# ---------------------------------------------------------------------------
# TestNewsField
# ---------------------------------------------------------------------------


class TestNewsField:
    """Tests for news list parsing."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        """Provide a service instance with mocked dependencies."""
        return _make_service()

    def test_empty_news_list_when_key_absent(self, service: AIAnalysisService) -> None:
        """news defaults to [] when 'news' key is missing from ai_data."""
        ai_data = _minimal_valid_ai_data()
        del ai_data["news"]
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            ai_data,
        )
        assert result.news == []

    def test_empty_news_list_when_value_is_empty(self, service: AIAnalysisService) -> None:
        """news is [] when ai_data['news'] is an empty list."""
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(news=[]),
        )
        assert result.news == []

    def test_single_news_item_parsed(self, service: AIAnalysisService) -> None:
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(
                news=[{"title": "Headline A", "source": "WSJ", "sentiment": "neutral"}]
            ),
        )
        assert len(result.news) == 1
        assert result.news[0].title == "Headline A"

    def test_multiple_news_items_parsed(self, service: AIAnalysisService) -> None:
        items = [
            {"title": f"Headline {i}", "source": "CNN", "sentiment": "positive"}
            for i in range(5)
        ]
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(news=items),
        )
        assert len(result.news) == 5
        assert all(isinstance(n, NewsItem) for n in result.news)

    def test_news_item_optional_fields_absent(self, service: AIAnalysisService) -> None:
        """NewsItem accepts a dict with only the required 'title' field."""
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(news=[{"title": "Minimal headline"}]),
        )
        item = result.news[0]
        assert item.title == "Minimal headline"
        assert item.source is None
        assert item.sentiment is None


# ---------------------------------------------------------------------------
# TestQuarterlyEarningsField
# ---------------------------------------------------------------------------


class TestQuarterlyEarningsField:
    """Tests for quarterly_earnings list parsing."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        """Provide a service instance with mocked dependencies."""
        return _make_service()

    def test_empty_earnings_when_key_absent(self, service: AIAnalysisService) -> None:
        """quarterly_earnings defaults to [] when key is missing from ai_data."""
        ai_data = _minimal_valid_ai_data()
        del ai_data["quarterly_earnings"]
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            ai_data,
        )
        assert result.quarterly_earnings == []

    def test_empty_earnings_when_value_is_empty(self, service: AIAnalysisService) -> None:
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(quarterly_earnings=[]),
        )
        assert result.quarterly_earnings == []

    def test_single_quarter_parsed(self, service: AIAnalysisService) -> None:
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(
                quarterly_earnings=[
                    {
                        "quarter": "Q2 2025",
                        "revenue": 90_000.0,
                        "net_income": 25_000.0,
                        "eps": 1.55,
                        "yoy_revenue_growth": 0.08,
                    }
                ]
            ),
        )
        assert len(result.quarterly_earnings) == 1
        q = result.quarterly_earnings[0]
        assert isinstance(q, QuarterlyEarning)
        assert q.quarter == "Q2 2025"
        assert q.revenue == pytest.approx(90_000.0)

    def test_multiple_quarters_parsed(self, service: AIAnalysisService) -> None:
        quarters = [
            {"quarter": f"Q{i} 2024", "revenue": float(i * 1000)}
            for i in range(1, 5)
        ]
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(quarterly_earnings=quarters),
        )
        assert len(result.quarterly_earnings) == 4
        assert all(isinstance(q, QuarterlyEarning) for q in result.quarterly_earnings)

    def test_earnings_optional_fields_default_to_none(
        self, service: AIAnalysisService
    ) -> None:
        """Only 'quarter' is required on QuarterlyEarning; all other fields are optional."""
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(quarterly_earnings=[{"quarter": "Q3 2025"}]),
        )
        q = result.quarterly_earnings[0]
        assert q.quarter == "Q3 2025"
        assert q.revenue is None
        assert q.net_income is None
        assert q.eps is None
        assert q.yoy_revenue_growth is None


# ---------------------------------------------------------------------------
# TestRiskAssessmentField
# ---------------------------------------------------------------------------


class TestRiskAssessmentField:
    """Tests for RiskAssessment construction including default handling."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        """Provide a service instance with mocked dependencies."""
        return _make_service()

    def test_risk_factors_defaults_to_empty_list(self, service: AIAnalysisService) -> None:
        """risk_factors defaults to [] when the key is absent from risk_assessment."""
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(risk_assessment={"overall_risk": "low"}),
        )
        assert result.risk_assessment.risk_factors == []

    def test_risk_score_defaults_to_0_5_when_key_absent(
        self, service: AIAnalysisService
    ) -> None:
        """risk_score defaults to 0.5 when absent from risk_assessment dict."""
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(
                risk_assessment={"overall_risk": "high", "risk_factors": ["macro headwinds"]}
            ),
        )
        assert result.risk_assessment.risk_score == pytest.approx(0.5)

    def test_risk_score_is_cast_to_float(self, service: AIAnalysisService) -> None:
        """risk_score is float-cast, so integer values are accepted."""
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(
                risk_assessment={"overall_risk": "medium", "risk_score": 1}
            ),
        )
        assert isinstance(result.risk_assessment.risk_score, float)
        assert result.risk_assessment.risk_score == pytest.approx(1.0)

    def test_risk_assessment_overall_risk_stored(
        self, service: AIAnalysisService
    ) -> None:
        for level in ("low", "medium", "high", "very_high"):
            result = service._merge_response(
                "AAPL",
                _mock_quote(),
                [],
                TechnicalSnapshot(),
                _minimal_valid_ai_data(risk_assessment={"overall_risk": level}),
            )
            assert result.risk_assessment.overall_risk == level

    def test_risk_factors_list_preserved(self, service: AIAnalysisService) -> None:
        factors = ["debt load", "fx exposure", "regulatory risk"]
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(
                risk_assessment={
                    "overall_risk": "high",
                    "risk_factors": factors,
                    "risk_score": 0.7,
                }
            ),
        )
        assert result.risk_assessment.risk_factors == factors


# ---------------------------------------------------------------------------
# TestCurrentPriceConversion
# ---------------------------------------------------------------------------


class TestCurrentPriceConversion:
    """Tests for current_price sourcing and type consistency from quote."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        """Provide a service instance with mocked dependencies."""
        return _make_service()

    def test_integer_current_price_from_quote(self, service: AIAnalysisService) -> None:
        """current_price stored as-is from quote (Pydantic coerces int → float)."""
        result = service._merge_response(
            "AAPL",
            _mock_quote(current_price=200),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(),
        )
        assert result.current_price == 200.0
        assert isinstance(result.current_price, float)

    def test_float_current_price_from_quote(self, service: AIAnalysisService) -> None:
        result = service._merge_response(
            "AAPL",
            _mock_quote(current_price=175.50),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(),
        )
        assert result.current_price == pytest.approx(175.50)

    def test_confidence_score_converted_to_float(
        self, service: AIAnalysisService
    ) -> None:
        result = service._merge_response(
            "AAPL",
            _mock_quote(),
            [],
            TechnicalSnapshot(),
            _minimal_valid_ai_data(confidence_score=1),
        )
        assert isinstance(result.confidence_score, float)
        assert result.confidence_score == 1.0


# ---------------------------------------------------------------------------
# TestMergeResponseErrorCases
# ---------------------------------------------------------------------------


class TestMergeResponseErrorCases:
    """Every missing required AI key or bad value raises AIAnalysisError."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        """Provide a service instance with mocked dependencies."""
        return _make_service()

    def test_raises_when_recommendation_missing(self, service: AIAnalysisService) -> None:
        ai_data = _minimal_valid_ai_data()
        del ai_data["recommendation"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )

    def test_raises_when_confidence_score_missing(
        self, service: AIAnalysisService
    ) -> None:
        ai_data = _minimal_valid_ai_data()
        del ai_data["confidence_score"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )

    def test_raises_when_summary_missing(self, service: AIAnalysisService) -> None:
        ai_data = _minimal_valid_ai_data()
        del ai_data["summary"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )

    def test_raises_when_bull_case_missing(self, service: AIAnalysisService) -> None:
        ai_data = _minimal_valid_ai_data()
        del ai_data["bull_case"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )

    def test_raises_when_bear_case_missing(self, service: AIAnalysisService) -> None:
        ai_data = _minimal_valid_ai_data()
        del ai_data["bear_case"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )

    def test_raises_when_current_price_missing_from_quote(
        self, service: AIAnalysisService
    ) -> None:
        """quote['current_price'] is accessed directly — KeyError becomes AIAnalysisError."""
        quote = _mock_quote()
        del quote["current_price"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL", quote, [], TechnicalSnapshot(), _minimal_valid_ai_data()
            )

    def test_raises_when_confidence_score_is_non_numeric_string(
        self, service: AIAnalysisService
    ) -> None:
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL",
                _mock_quote(),
                [],
                TechnicalSnapshot(),
                _minimal_valid_ai_data(confidence_score="high"),
            )

    def test_raises_when_risk_overall_risk_missing(
        self, service: AIAnalysisService
    ) -> None:
        """overall_risk is accessed via direct key on risk_data → KeyError."""
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL",
                _mock_quote(),
                [],
                TechnicalSnapshot(),
                _minimal_valid_ai_data(risk_assessment={"risk_score": 0.5}),
            )

    def test_raises_when_price_predictions_one_week_missing(
        self, service: AIAnalysisService
    ) -> None:
        ai_data = _minimal_valid_ai_data()
        del ai_data["price_predictions"]["one_week"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )

    def test_raises_when_price_predictions_one_month_missing(
        self, service: AIAnalysisService
    ) -> None:
        ai_data = _minimal_valid_ai_data()
        del ai_data["price_predictions"]["one_month"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )

    def test_raises_when_price_predictions_three_months_missing(
        self, service: AIAnalysisService
    ) -> None:
        ai_data = _minimal_valid_ai_data()
        del ai_data["price_predictions"]["three_months"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )

    def test_raises_ai_analysis_error_not_key_error(
        self, service: AIAnalysisService
    ) -> None:
        """The raw KeyError must be wrapped, not re-raised directly."""
        ai_data = _minimal_valid_ai_data()
        del ai_data["recommendation"]
        with pytest.raises(AIAnalysisError):
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )

    def test_original_exception_is_chained(self, service: AIAnalysisService) -> None:
        """The AIAnalysisError must chain the original exception via __cause__."""
        ai_data = _minimal_valid_ai_data()
        del ai_data["recommendation"]
        with pytest.raises(AIAnalysisError) as exc_info:
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )
        assert exc_info.value.__cause__ is not None

    def test_raises_when_ai_data_is_empty_dict(self, service: AIAnalysisService) -> None:
        """Completely empty ai_data dict causes multiple required-key misses."""
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), {}
            )

    def test_raises_when_price_forecast_missing_required_field(
        self, service: AIAnalysisService
    ) -> None:
        """PriceForecast(**data) raises TypeError when a required field is absent."""
        ai_data = _minimal_valid_ai_data()
        # Remove 'mid' which is required on PriceForecast
        del ai_data["price_predictions"]["one_week"]["mid"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )


# ---------------------------------------------------------------------------
# TestMergeResponseCodeAttribute
# ---------------------------------------------------------------------------


class TestMergeResponseCodeAttribute:
    """Verify the raised AIAnalysisError carries the correct domain code."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        """Provide a service instance with mocked dependencies."""
        return _make_service()

    def test_error_code_is_ai_analysis_error(self, service: AIAnalysisService) -> None:
        ai_data = _minimal_valid_ai_data()
        del ai_data["recommendation"]
        with pytest.raises(AIAnalysisError) as exc_info:
            service._merge_response(
                "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
            )
        assert exc_info.value.code == "AI_ANALYSIS_ERROR"


# ---------------------------------------------------------------------------
# TestParseLongTerm
# ---------------------------------------------------------------------------


def _long_term_outlook_dict(**overrides: Any) -> dict[str, Any]:
    """Return a valid long_term_outlook dict for testing."""
    base: dict[str, Any] = {
        "one_year": _price_forecast_dict(170, 200, 230, 0.70),
        "five_year": _price_forecast_dict(200, 300, 400, 0.55),
        "ten_year": _price_forecast_dict(250, 450, 650, 0.40),
        "verdict": "buy",
        "verdict_rationale": "Strong long-term growth potential.",
        "catalysts": ["AI integration", "Services expansion"],
        "long_term_risks": ["Regulatory pressure"],
        "compound_annual_return": 12.5,
    }
    base.update(overrides)
    return base


class TestParseLongTerm:
    """Tests for AIAnalysisService._parse_long_term()."""

    def test_returns_long_term_outlook_on_valid_data(self) -> None:
        result = AIAnalysisService._parse_long_term(_long_term_outlook_dict())
        assert isinstance(result, LongTermOutlook)
        assert result.verdict == "buy"
        assert result.compound_annual_return == pytest.approx(12.5)

    def test_returns_none_when_data_is_none(self) -> None:
        assert AIAnalysisService._parse_long_term(None) is None

    def test_returns_none_when_data_is_empty_dict(self) -> None:
        assert AIAnalysisService._parse_long_term({}) is None

    def test_returns_none_when_data_is_not_dict(self) -> None:
        assert AIAnalysisService._parse_long_term("invalid") is None  # type: ignore[arg-type]

    def test_returns_none_when_required_key_missing(self) -> None:
        data = _long_term_outlook_dict()
        del data["one_year"]
        assert AIAnalysisService._parse_long_term(data) is None

    def test_returns_none_when_verdict_missing(self) -> None:
        data = _long_term_outlook_dict()
        del data["verdict"]
        assert AIAnalysisService._parse_long_term(data) is None

    def test_catalysts_defaults_to_empty_list(self) -> None:
        data = _long_term_outlook_dict()
        del data["catalysts"]
        result = AIAnalysisService._parse_long_term(data)
        assert result is not None
        assert result.catalysts == []

    def test_long_term_risks_defaults_to_empty_list(self) -> None:
        data = _long_term_outlook_dict()
        del data["long_term_risks"]
        result = AIAnalysisService._parse_long_term(data)
        assert result is not None
        assert result.long_term_risks == []

    def test_compound_annual_return_defaults_to_zero(self) -> None:
        data = _long_term_outlook_dict()
        del data["compound_annual_return"]
        result = AIAnalysisService._parse_long_term(data)
        assert result is not None
        assert result.compound_annual_return == pytest.approx(0.0)

    def test_verdict_rationale_defaults_to_empty_string(self) -> None:
        data = _long_term_outlook_dict()
        del data["verdict_rationale"]
        result = AIAnalysisService._parse_long_term(data)
        assert result is not None
        assert result.verdict_rationale == ""

    def test_forecast_values_preserved(self) -> None:
        result = AIAnalysisService._parse_long_term(_long_term_outlook_dict())
        assert result is not None
        assert result.one_year.mid == pytest.approx(200.0)
        assert result.five_year.mid == pytest.approx(300.0)
        assert result.ten_year.mid == pytest.approx(450.0)

    def test_merge_response_includes_long_term_outlook(self) -> None:
        """_merge_response populates long_term_outlook when ai_data includes it."""
        service = _make_service()
        ai_data = _minimal_valid_ai_data(
            long_term_outlook=_long_term_outlook_dict()
        )
        result = service._merge_response(
            "AAPL", _mock_quote(), [], TechnicalSnapshot(), ai_data
        )
        assert result.long_term_outlook is not None
        assert result.long_term_outlook.verdict == "buy"

    def test_merge_response_long_term_none_when_absent(self) -> None:
        """_merge_response sets long_term_outlook=None when key is absent."""
        service = _make_service()
        result = service._merge_response(
            "AAPL", _mock_quote(), [], TechnicalSnapshot(), _minimal_valid_ai_data()
        )
        assert result.long_term_outlook is None
