"""Tests for AIAnalysisService._parse_response()."""
from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest

from app.core.exceptions import AIAnalysisError
from app.models.analysis import (
    NewsItem,
    PriceForecast,
    PricePredictions,
    QuarterlyEarning,
    RiskAssessment,
    StockAnalysisResponse,
    TechnicalSnapshot,
)
from app.services.ai_analysis_service import AIAnalysisService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_service() -> AIAnalysisService:
    """Return a service instance with a mock provider (no real API calls)."""
    return AIAnalysisService(provider=MagicMock())


def _price_forecast_dict(low: float = 140.0, mid: float = 150.0, high: float = 160.0, confidence: float = 0.8) -> dict[str, Any]:
    return {"low": low, "mid": mid, "high": high, "confidence": confidence}


def _minimal_valid_data(**overrides: Any) -> dict[str, Any]:
    """Return the smallest dict that _parse_response accepts without error."""
    base: dict[str, Any] = {
        "ticker": "AAPL",
        "company_name": "Apple Inc.",
        "current_price": 175.0,
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
    }
    base.update(overrides)
    return base


def _full_data() -> dict[str, Any]:
    """Return a maximally-populated dict exercising every optional field."""
    data = _minimal_valid_data(
        previous_close=173.5,
        open=174.0,
        day_high=176.2,
        day_low=173.1,
        volume=55_000_000,
        market_cap="2.8T",
        pe_ratio=28.5,
        eps=6.14,
        week_52_high=199.62,
        week_52_low=124.17,
        dividend_yield=0.005,
        technical={
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
            "support_levels": [165.0, 160.0],
            "resistance_levels": [180.0, 185.0],
            "signal": "buy",
        },
        news=[
            {"title": "Apple beats Q1 estimates", "source": "Reuters", "sentiment": "positive"},
            {"title": "Vision Pro supply concerns", "source": "Bloomberg", "sentiment": "negative"},
        ],
        quarterly_earnings=[
            {"quarter": "Q1 2025", "revenue": 124_300.0, "net_income": 36_330.0, "eps": 2.40, "yoy_revenue_growth": 0.04},
            {"quarter": "Q4 2024", "revenue": 119_575.0, "net_income": 33_916.0, "eps": 2.18, "yoy_revenue_growth": 0.06},
        ],
    )
    return data


# ---------------------------------------------------------------------------
# TestParseResponseHappyPath
# ---------------------------------------------------------------------------


class TestParseResponseHappyPath:
    """Full valid data returns a correctly populated StockAnalysisResponse."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        return _make_service()

    @pytest.fixture
    def result(self, service: AIAnalysisService) -> StockAnalysisResponse:
        return service._parse_response("aapl", _full_data())

    def test_returns_stock_analysis_response(self, result: StockAnalysisResponse) -> None:
        assert isinstance(result, StockAnalysisResponse)

    def test_ticker_from_data_field(self, result: StockAnalysisResponse) -> None:
        """Ticker is taken from data['ticker'], not the input argument."""
        assert result.ticker == "AAPL"

    def test_company_name(self, result: StockAnalysisResponse) -> None:
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

    def test_technical_fields_populated(self, result: StockAnalysisResponse) -> None:
        tech = result.technical
        assert tech is not None
        assert tech.sma_20 == 172.0
        assert tech.rsi_14 == pytest.approx(58.3)
        assert tech.signal == "buy"
        assert tech.support_levels == [165.0, 160.0]
        assert tech.resistance_levels == [180.0, 185.0]

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


# ---------------------------------------------------------------------------
# TestTickerResolution
# ---------------------------------------------------------------------------


class TestTickerResolution:
    """Tests covering how the output ticker is resolved."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        return _make_service()

    def test_uses_data_ticker_over_input_ticker(self, service: AIAnalysisService) -> None:
        """data['ticker'] takes priority over the input argument."""
        data = _minimal_valid_data(ticker="MSFT")
        result = service._parse_response("anything", data)
        assert result.ticker == "MSFT"

    def test_falls_back_to_input_ticker_when_key_absent(self, service: AIAnalysisService) -> None:
        """When 'ticker' is absent from data, the input ticker is used."""
        data = _minimal_valid_data()
        del data["ticker"]
        result = service._parse_response("nvda", data)
        assert result.ticker == "NVDA"

    def test_uppercases_data_ticker(self, service: AIAnalysisService) -> None:
        """Ticker from data is uppercased regardless of case in the payload."""
        data = _minimal_valid_data(ticker="googl")
        result = service._parse_response("x", data)
        assert result.ticker == "GOOGL"

    def test_strips_whitespace_from_data_ticker(self, service: AIAnalysisService) -> None:
        """Leading/trailing whitespace in data ticker is stripped."""
        data = _minimal_valid_data(ticker="  TSLA  ")
        result = service._parse_response("x", data)
        assert result.ticker == "TSLA"

    def test_uppercases_and_strips_input_ticker_fallback(self, service: AIAnalysisService) -> None:
        """Fallback input ticker is also uppercased and stripped via .upper().strip()."""
        data = _minimal_valid_data()
        del data["ticker"]
        result = service._parse_response("  amzn  ", data)
        # The input ticker is uppercased before entering _parse_response (in analyze()),
        # but _parse_response itself calls .upper().strip() on data.get("ticker", ticker).
        # When falling back to the raw input, the result depends on what's passed in.
        assert result.ticker == "AMZN"

    def test_company_name_falls_back_to_ticker_arg(self, service: AIAnalysisService) -> None:
        """company_name falls back to the input ticker when absent from data."""
        data = _minimal_valid_data()
        del data["company_name"]
        result = service._parse_response("AAPL", data)
        assert result.company_name == "AAPL"


# ---------------------------------------------------------------------------
# TestTechnicalField
# ---------------------------------------------------------------------------


class TestTechnicalField:
    """Tests for optional technical snapshot handling."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        return _make_service()

    def test_technical_none_when_key_absent(self, service: AIAnalysisService) -> None:
        """technical is None when 'technical' is not present in data."""
        data = _minimal_valid_data()
        result = service._parse_response("AAPL", data)
        assert result.technical is None

    def test_technical_none_when_value_is_none(self, service: AIAnalysisService) -> None:
        """technical is None when data['technical'] is explicitly None."""
        data = _minimal_valid_data(technical=None)
        result = service._parse_response("AAPL", data)
        assert result.technical is None

    def test_technical_populated_when_present(self, service: AIAnalysisService) -> None:
        """technical is a TechnicalSnapshot when a valid dict is provided."""
        data = _minimal_valid_data(technical={"signal": "neutral"})
        result = service._parse_response("AAPL", data)
        assert isinstance(result.technical, TechnicalSnapshot)
        assert result.technical.signal == "neutral"

    def test_technical_all_fields_default_to_none_when_omitted(self, service: AIAnalysisService) -> None:
        """TechnicalSnapshot fields with defaults work when not supplied."""
        data = _minimal_valid_data(technical={"signal": "sell"})
        result = service._parse_response("AAPL", data)
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
        return _make_service()

    def test_empty_news_list_when_key_absent(self, service: AIAnalysisService) -> None:
        """news defaults to [] when 'news' key is missing."""
        data = _minimal_valid_data()
        result = service._parse_response("AAPL", data)
        assert result.news == []

    def test_empty_news_list_when_value_is_empty(self, service: AIAnalysisService) -> None:
        """news is [] when data['news'] is an empty list."""
        data = _minimal_valid_data(news=[])
        result = service._parse_response("AAPL", data)
        assert result.news == []

    def test_single_news_item_parsed(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data(news=[
            {"title": "Headline A", "source": "WSJ", "sentiment": "neutral"},
        ])
        result = service._parse_response("AAPL", data)
        assert len(result.news) == 1
        assert result.news[0].title == "Headline A"

    def test_multiple_news_items_parsed(self, service: AIAnalysisService) -> None:
        items = [
            {"title": f"Headline {i}", "source": "CNN", "sentiment": "positive"}
            for i in range(5)
        ]
        data = _minimal_valid_data(news=items)
        result = service._parse_response("AAPL", data)
        assert len(result.news) == 5
        assert all(isinstance(n, NewsItem) for n in result.news)

    def test_news_item_optional_fields_absent(self, service: AIAnalysisService) -> None:
        """NewsItem accepts a dict with only the required 'title' field."""
        data = _minimal_valid_data(news=[{"title": "Minimal headline"}])
        result = service._parse_response("AAPL", data)
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
        return _make_service()

    def test_empty_earnings_when_key_absent(self, service: AIAnalysisService) -> None:
        """quarterly_earnings defaults to [] when key is missing."""
        data = _minimal_valid_data()
        result = service._parse_response("AAPL", data)
        assert result.quarterly_earnings == []

    def test_empty_earnings_when_value_is_empty(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data(quarterly_earnings=[])
        result = service._parse_response("AAPL", data)
        assert result.quarterly_earnings == []

    def test_single_quarter_parsed(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data(quarterly_earnings=[
            {"quarter": "Q2 2025", "revenue": 90_000.0, "net_income": 25_000.0, "eps": 1.55, "yoy_revenue_growth": 0.08},
        ])
        result = service._parse_response("AAPL", data)
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
        data = _minimal_valid_data(quarterly_earnings=quarters)
        result = service._parse_response("AAPL", data)
        assert len(result.quarterly_earnings) == 4
        assert all(isinstance(q, QuarterlyEarning) for q in result.quarterly_earnings)

    def test_earnings_optional_fields_default_to_none(self, service: AIAnalysisService) -> None:
        """Only 'quarter' is required on QuarterlyEarning; all other fields are optional."""
        data = _minimal_valid_data(quarterly_earnings=[{"quarter": "Q3 2025"}])
        result = service._parse_response("AAPL", data)
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
        return _make_service()

    def test_risk_factors_defaults_to_empty_list(self, service: AIAnalysisService) -> None:
        """risk_factors defaults to [] when the key is absent from risk_assessment."""
        data = _minimal_valid_data(risk_assessment={
            "overall_risk": "low",
        })
        result = service._parse_response("AAPL", data)
        assert result.risk_assessment.risk_factors == []

    def test_risk_score_defaults_to_0_5_when_key_absent(self, service: AIAnalysisService) -> None:
        """risk_score defaults to 0.5 when absent from risk_assessment dict."""
        data = _minimal_valid_data(risk_assessment={
            "overall_risk": "high",
            "risk_factors": ["macro headwinds"],
        })
        result = service._parse_response("AAPL", data)
        assert result.risk_assessment.risk_score == pytest.approx(0.5)

    def test_risk_score_is_cast_to_float(self, service: AIAnalysisService) -> None:
        """risk_score is float-cast, so integer values are accepted."""
        data = _minimal_valid_data(risk_assessment={
            "overall_risk": "medium",
            "risk_score": 1,
        })
        result = service._parse_response("AAPL", data)
        assert isinstance(result.risk_assessment.risk_score, float)
        assert result.risk_assessment.risk_score == pytest.approx(1.0)

    def test_risk_assessment_overall_risk_stored(self, service: AIAnalysisService) -> None:
        for level in ("low", "medium", "high", "very_high"):
            data = _minimal_valid_data(risk_assessment={"overall_risk": level})
            result = service._parse_response("AAPL", data)
            assert result.risk_assessment.overall_risk == level

    def test_risk_factors_list_preserved(self, service: AIAnalysisService) -> None:
        factors = ["debt load", "fx exposure", "regulatory risk"]
        data = _minimal_valid_data(risk_assessment={
            "overall_risk": "high",
            "risk_factors": factors,
            "risk_score": 0.7,
        })
        result = service._parse_response("AAPL", data)
        assert result.risk_assessment.risk_factors == factors


# ---------------------------------------------------------------------------
# TestCurrentPriceConversion
# ---------------------------------------------------------------------------


class TestCurrentPriceConversion:
    """Tests for float() conversion of current_price."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        return _make_service()

    def test_integer_current_price_converted_to_float(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data(current_price=200)
        result = service._parse_response("AAPL", data)
        assert result.current_price == 200.0
        assert isinstance(result.current_price, float)

    def test_string_numeric_current_price_converted(self, service: AIAnalysisService) -> None:
        """A numeric string is valid input for float()."""
        data = _minimal_valid_data(current_price="175.50")
        result = service._parse_response("AAPL", data)
        assert result.current_price == pytest.approx(175.50)

    def test_confidence_score_converted_to_float(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data(confidence_score=1)
        result = service._parse_response("AAPL", data)
        assert isinstance(result.confidence_score, float)
        assert result.confidence_score == 1.0


# ---------------------------------------------------------------------------
# TestParseResponseErrorCases
# ---------------------------------------------------------------------------


class TestParseResponseErrorCases:
    """Every missing required key or bad value raises AIAnalysisError."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        return _make_service()

    def test_raises_when_current_price_missing(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data()
        del data["current_price"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_recommendation_missing(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data()
        del data["recommendation"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_confidence_score_missing(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data()
        del data["confidence_score"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_summary_missing(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data()
        del data["summary"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_bull_case_missing(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data()
        del data["bull_case"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_bear_case_missing(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data()
        del data["bear_case"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_current_price_is_non_numeric_string(self, service: AIAnalysisService) -> None:
        """float("N/A") raises ValueError → must become AIAnalysisError."""
        data = _minimal_valid_data(current_price="N/A")
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_current_price_is_none(self, service: AIAnalysisService) -> None:
        """float(None) raises TypeError → must become AIAnalysisError."""
        data = _minimal_valid_data(current_price=None)
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_confidence_score_is_non_numeric_string(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data(confidence_score="high")
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_risk_overall_risk_missing(self, service: AIAnalysisService) -> None:
        """overall_risk is accessed via direct key on risk_data → KeyError."""
        data = _minimal_valid_data(risk_assessment={"risk_score": 0.5})
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_price_predictions_one_week_missing(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data()
        del data["price_predictions"]["one_week"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_price_predictions_one_month_missing(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data()
        del data["price_predictions"]["one_month"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_when_price_predictions_three_months_missing(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data()
        del data["price_predictions"]["three_months"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)

    def test_raises_ai_analysis_error_not_key_error(self, service: AIAnalysisService) -> None:
        """The raw KeyError must be wrapped, not re-raised directly."""
        data = _minimal_valid_data()
        del data["current_price"]
        with pytest.raises(AIAnalysisError):
            service._parse_response("AAPL", data)

    def test_original_exception_is_chained(self, service: AIAnalysisService) -> None:
        """The AIAnalysisError must chain the original exception via __cause__."""
        data = _minimal_valid_data()
        del data["current_price"]
        with pytest.raises(AIAnalysisError) as exc_info:
            service._parse_response("AAPL", data)
        assert exc_info.value.__cause__ is not None

    def test_raises_when_data_is_empty_dict(self, service: AIAnalysisService) -> None:
        """Completely empty dict causes multiple required-key misses."""
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", {})

    def test_raises_when_price_forecast_missing_required_field(self, service: AIAnalysisService) -> None:
        """PriceForecast(**data) raises TypeError when a required field is absent."""
        data = _minimal_valid_data()
        # Remove 'mid' which is required on PriceForecast
        del data["price_predictions"]["one_week"]["mid"]
        with pytest.raises(AIAnalysisError, match="Failed to parse AI response"):
            service._parse_response("AAPL", data)


# ---------------------------------------------------------------------------
# TestParseResponseCodeAttribute
# ---------------------------------------------------------------------------


class TestParseResponseCodeAttribute:
    """Verify the raised AIAnalysisError carries the correct domain code."""

    @pytest.fixture
    def service(self) -> AIAnalysisService:
        return _make_service()

    def test_error_code_is_ai_analysis_error(self, service: AIAnalysisService) -> None:
        data = _minimal_valid_data()
        del data["current_price"]
        with pytest.raises(AIAnalysisError) as exc_info:
            service._parse_response("AAPL", data)
        assert exc_info.value.code == "AI_ANALYSIS_ERROR"
