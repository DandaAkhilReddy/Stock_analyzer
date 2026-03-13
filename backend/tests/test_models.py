"""Tests for app/models/analysis.py Pydantic models."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import pytest
from pydantic import ValidationError

from app.models.analysis import (
    LongTermOutlook,
    NewsItem,
    PriceForecast,
    PricePredictions,
    QuarterlyEarning,
    RiskAssessment,
    StockAnalysisResponse,
    TechnicalSnapshot,
)

# ---------------------------------------------------------------------------
# Shared factory helpers
# ---------------------------------------------------------------------------

_TIMESTAMP = datetime(2025, 6, 1, 12, 0, 0, tzinfo=timezone.utc)


def _make_forecast(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {"low": 100.0, "mid": 110.0, "high": 120.0, "confidence": 0.8}
    return {**base, **overrides}


def _make_predictions(**overrides: Any) -> dict[str, Any]:
    forecast = _make_forecast()
    base: dict[str, Any] = {
        "one_week": forecast,
        "one_month": forecast,
        "three_months": forecast,
    }
    return {**base, **overrides}


def _make_risk(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "overall_risk": "medium",
        "risk_factors": ["market volatility"],
        "risk_score": 5.0,
    }
    return {**base, **overrides}


def _make_response(**overrides: Any) -> dict[str, Any]:
    """Minimal valid StockAnalysisResponse payload."""
    base: dict[str, Any] = {
        "ticker": "AAPL",
        "company_name": "Apple Inc.",
        "current_price": 175.50,
        "recommendation": "hold",
        "confidence_score": 0.72,
        "summary": "Stable outlook.",
        "bull_case": "Strong iPhone cycle.",
        "bear_case": "Macro headwinds.",
        "risk_assessment": _make_risk(),
        "price_predictions": _make_predictions(),
        "analysis_timestamp": _TIMESTAMP,
    }
    return {**base, **overrides}


# ===========================================================================
# TechnicalSnapshot
# ===========================================================================


class TestTechnicalSnapshot:
    def test_all_fields_default_to_none_and_empty_lists(self) -> None:
        snap = TechnicalSnapshot()

        for field in (
            "sma_20", "sma_50", "sma_200",
            "ema_12", "ema_26",
            "rsi_14",
            "macd_line", "macd_signal", "macd_histogram",
            "bollinger_upper", "bollinger_middle", "bollinger_lower",
        ):
            assert getattr(snap, field) is None, f"{field} should default to None"

        assert snap.support_levels == []
        assert snap.resistance_levels == []

    def test_default_signal_is_neutral(self) -> None:
        snap = TechnicalSnapshot()
        assert snap.signal == "neutral"

    def test_partial_values_accepted(self) -> None:
        snap = TechnicalSnapshot(sma_20=50.5, rsi_14=42.3, support_levels=[48.0, 49.5])
        assert snap.sma_20 == 50.5
        assert snap.rsi_14 == 42.3
        assert snap.support_levels == [48.0, 49.5]
        assert snap.sma_50 is None

    def test_all_float_fields_set(self) -> None:
        snap = TechnicalSnapshot(
            sma_20=100.0, sma_50=95.0, sma_200=90.0,
            ema_12=102.0, ema_26=98.0,
            rsi_14=55.0,
            macd_line=1.2, macd_signal=0.9, macd_histogram=0.3,
            bollinger_upper=115.0, bollinger_middle=105.0, bollinger_lower=95.0,
            support_levels=[90.0, 85.0],
            resistance_levels=[120.0, 130.0],
            signal="buy",
        )
        assert snap.bollinger_upper == 115.0
        assert snap.resistance_levels == [120.0, 130.0]

    @pytest.mark.parametrize("signal", ["strong_buy", "buy", "neutral", "sell", "strong_sell"])
    def test_each_signal_value_accepted(self, signal: str) -> None:
        snap = TechnicalSnapshot(signal=signal)  # type: ignore[arg-type]
        assert snap.signal == signal

    def test_invalid_signal_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            TechnicalSnapshot(signal="bullish")  # type: ignore[arg-type]

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("signal",) for e in errors)

    def test_support_levels_and_resistance_levels_are_independent(self) -> None:
        snap = TechnicalSnapshot(support_levels=[50.0], resistance_levels=[80.0, 90.0])
        assert len(snap.support_levels) == 1
        assert len(snap.resistance_levels) == 2

    def test_empty_lists_explicit(self) -> None:
        snap = TechnicalSnapshot(support_levels=[], resistance_levels=[])
        assert snap.support_levels == []
        assert snap.resistance_levels == []


# ===========================================================================
# NewsItem
# ===========================================================================


class TestNewsItem:
    def test_minimal_requires_only_title(self) -> None:
        item = NewsItem(title="Fed raises rates")
        assert item.title == "Fed raises rates"
        assert item.source is None
        assert item.sentiment is None

    def test_all_fields_populated(self) -> None:
        item = NewsItem(title="Record earnings", source="Reuters", sentiment="positive")
        assert item.source == "Reuters"
        assert item.sentiment == "positive"

    @pytest.mark.parametrize("sentiment", ["positive", "negative", "neutral"])
    def test_each_sentiment_value_accepted(self, sentiment: str) -> None:
        item = NewsItem(title="Headline", sentiment=sentiment)  # type: ignore[arg-type]
        assert item.sentiment == sentiment

    def test_sentiment_none_explicit(self) -> None:
        item = NewsItem(title="No sentiment", sentiment=None)
        assert item.sentiment is None

    def test_invalid_sentiment_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            NewsItem(title="Headline", sentiment="mixed")  # type: ignore[arg-type]

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("sentiment",) for e in errors)

    def test_title_required(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            NewsItem()  # type: ignore[call-arg]

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("title",) for e in errors)


# ===========================================================================
# QuarterlyEarning
# ===========================================================================


class TestQuarterlyEarning:
    def test_all_optional_fields_default_to_none(self) -> None:
        earning = QuarterlyEarning(quarter="Q1 2025")
        assert earning.quarter == "Q1 2025"
        assert earning.revenue is None
        assert earning.net_income is None
        assert earning.eps is None
        assert earning.yoy_revenue_growth is None

    def test_all_fields_set(self) -> None:
        earning = QuarterlyEarning(
            quarter="Q2 2025",
            revenue=98_000.0,
            net_income=25_000.0,
            eps=1.52,
            yoy_revenue_growth=0.08,
        )
        assert earning.revenue == 98_000.0
        assert earning.yoy_revenue_growth == 0.08

    def test_quarter_is_required(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            QuarterlyEarning()  # type: ignore[call-arg]

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("quarter",) for e in errors)

    def test_negative_values_accepted(self) -> None:
        earning = QuarterlyEarning(quarter="Q3 2025", net_income=-500.0, yoy_revenue_growth=-0.15)
        assert earning.net_income == -500.0
        assert earning.yoy_revenue_growth == -0.15


# ===========================================================================
# PriceForecast
# ===========================================================================


class TestPriceForecast:
    def test_all_four_fields_required(self) -> None:
        forecast = PriceForecast(low=90.0, mid=100.0, high=110.0, confidence=0.75)
        assert forecast.low == 90.0
        assert forecast.mid == 100.0
        assert forecast.high == 110.0
        assert forecast.confidence == 0.75

    @pytest.mark.parametrize("missing_field", ["low", "mid", "high", "confidence"])
    def test_missing_field_raises_validation_error(self, missing_field: str) -> None:
        payload = {"low": 90.0, "mid": 100.0, "high": 110.0, "confidence": 0.75}
        del payload[missing_field]
        with pytest.raises(ValidationError) as exc_info:
            PriceForecast(**payload)

        errors = exc_info.value.errors()
        assert any(e["loc"] == (missing_field,) for e in errors)

    def test_zero_confidence_accepted(self) -> None:
        forecast = PriceForecast(low=0.0, mid=0.0, high=0.0, confidence=0.0)
        assert forecast.confidence == 0.0

    def test_identical_low_mid_high_accepted(self) -> None:
        # No semantic constraint on ordering — model accepts equal values
        forecast = PriceForecast(low=100.0, mid=100.0, high=100.0, confidence=1.0)
        assert forecast.low == forecast.mid == forecast.high


# ===========================================================================
# PricePredictions
# ===========================================================================


class TestPricePredictions:
    def test_all_three_horizons_required(self) -> None:
        forecast_data = _make_forecast()
        predictions = PricePredictions(
            one_week=forecast_data,
            one_month=forecast_data,
            three_months=forecast_data,
        )
        assert isinstance(predictions.one_week, PriceForecast)
        assert isinstance(predictions.one_month, PriceForecast)
        assert isinstance(predictions.three_months, PriceForecast)

    @pytest.mark.parametrize("missing_horizon", ["one_week", "one_month", "three_months"])
    def test_missing_horizon_raises_validation_error(self, missing_horizon: str) -> None:
        payload = _make_predictions()
        del payload[missing_horizon]
        with pytest.raises(ValidationError) as exc_info:
            PricePredictions(**payload)

        errors = exc_info.value.errors()
        assert any(e["loc"] == (missing_horizon,) for e in errors)

    def test_nested_forecast_values_preserved(self) -> None:
        week_data = _make_forecast(low=50.0, high=60.0, confidence=0.9)
        month_data = _make_forecast(low=55.0, high=70.0, confidence=0.85)
        three_months_data = _make_forecast(low=60.0, high=90.0, confidence=0.7)

        predictions = PricePredictions(
            one_week=week_data,
            one_month=month_data,
            three_months=three_months_data,
        )
        assert predictions.one_week.low == 50.0
        assert predictions.three_months.high == 90.0


# ===========================================================================
# RiskAssessment
# ===========================================================================


class TestRiskAssessment:
    @pytest.mark.parametrize("risk_level", ["low", "medium", "high", "very_high"])
    def test_each_overall_risk_value_accepted(self, risk_level: str) -> None:
        ra = RiskAssessment(
            overall_risk=risk_level,  # type: ignore[arg-type]
            risk_factors=["factor one"],
            risk_score=3.0,
        )
        assert ra.overall_risk == risk_level

    def test_invalid_overall_risk_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            RiskAssessment(
                overall_risk="extreme",  # type: ignore[arg-type]
                risk_factors=[],
                risk_score=10.0,
            )

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("overall_risk",) for e in errors)

    def test_empty_risk_factors_list_accepted(self) -> None:
        ra = RiskAssessment(overall_risk="low", risk_factors=[], risk_score=1.0)
        assert ra.risk_factors == []

    def test_multiple_risk_factors(self) -> None:
        factors = ["sector rotation", "rising interest rates", "regulatory risk"]
        ra = RiskAssessment(overall_risk="high", risk_factors=factors, risk_score=7.5)
        assert len(ra.risk_factors) == 3
        assert "sector rotation" in ra.risk_factors

    def test_risk_score_required(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            RiskAssessment(overall_risk="medium", risk_factors=[])  # type: ignore[call-arg]

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("risk_score",) for e in errors)

    def test_zero_risk_score(self) -> None:
        ra = RiskAssessment(overall_risk="low", risk_factors=[], risk_score=0.0)
        assert ra.risk_score == 0.0


# ===========================================================================
# StockAnalysisResponse
# ===========================================================================


class TestStockAnalysisResponse:
    def test_minimal_required_fields_only(self) -> None:
        resp = StockAnalysisResponse(**_make_response())
        assert resp.ticker == "AAPL"
        assert resp.company_name == "Apple Inc."
        assert resp.current_price == 175.50
        # Optional fields absent → None or []
        assert resp.previous_close is None
        assert resp.open is None
        assert resp.day_high is None
        assert resp.day_low is None
        assert resp.volume is None
        assert resp.market_cap is None
        assert resp.pe_ratio is None
        assert resp.eps is None
        assert resp.week_52_high is None
        assert resp.week_52_low is None
        assert resp.dividend_yield is None
        assert resp.technical is None
        assert resp.news == []
        assert resp.quarterly_earnings == []

    def test_full_payload_accepted(self) -> None:
        payload = _make_response(
            previous_close=174.0,
            open=175.0,
            day_high=177.0,
            day_low=173.5,
            volume=65_000_000,
            market_cap="2.8T",
            pe_ratio=28.5,
            eps=6.15,
            week_52_high=199.62,
            week_52_low=164.08,
            dividend_yield=0.0055,
            technical={
                "sma_20": 172.0,
                "signal": "buy",
                "support_levels": [170.0],
                "resistance_levels": [180.0],
            },
            news=[{"title": "Apple beats estimates", "source": "CNBC", "sentiment": "positive"}],
            quarterly_earnings=[
                {"quarter": "Q1 2025", "revenue": 124_000.0, "eps": 1.98}
            ],
            model_used="kimi-k2.5",
        )
        resp = StockAnalysisResponse(**payload)

        assert resp.volume == 65_000_000
        assert resp.market_cap == "2.8T"
        assert resp.pe_ratio == 28.5
        assert isinstance(resp.technical, TechnicalSnapshot)
        assert resp.technical.signal == "buy"
        assert len(resp.news) == 1
        assert resp.news[0].sentiment == "positive"
        assert resp.quarterly_earnings[0].quarter == "Q1 2025"

    @pytest.mark.parametrize(
        "recommendation",
        ["strong_buy", "buy", "hold", "sell", "strong_sell"],
    )
    def test_each_recommendation_value_accepted(self, recommendation: str) -> None:
        payload = _make_response(recommendation=recommendation)
        resp = StockAnalysisResponse(**payload)
        assert resp.recommendation == recommendation

    def test_invalid_recommendation_raises_validation_error(self) -> None:
        payload = _make_response(recommendation="maybe")
        with pytest.raises(ValidationError) as exc_info:
            StockAnalysisResponse(**payload)

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("recommendation",) for e in errors)

    def test_default_model_used(self) -> None:
        resp = StockAnalysisResponse(**_make_response())
        assert resp.model_used == "gpt-5.3"

    def test_model_used_override(self) -> None:
        resp = StockAnalysisResponse(**_make_response(model_used="gpt-4o"))
        assert resp.model_used == "gpt-4o"

    def test_default_disclaimer_text(self) -> None:
        resp = StockAnalysisResponse(**_make_response())
        assert "Financial Modeling Prep" in resp.disclaimer
        assert "not financial advice" in resp.disclaimer

    def test_disclaimer_overridable(self) -> None:
        custom = "Custom disclaimer for tests."
        resp = StockAnalysisResponse(**_make_response(disclaimer=custom))
        assert resp.disclaimer == custom

    def test_open_field_not_blocked_by_protected_namespaces(self) -> None:
        """model_config protected_namespaces=() lets `open` coexist with model_ fields."""
        resp = StockAnalysisResponse(**_make_response(open=174.5))
        assert resp.open == 174.5

    def test_analysis_timestamp_preserved(self) -> None:
        resp = StockAnalysisResponse(**_make_response())
        assert resp.analysis_timestamp == _TIMESTAMP

    def test_nested_risk_assessment_parsed(self) -> None:
        resp = StockAnalysisResponse(**_make_response())
        assert isinstance(resp.risk_assessment, RiskAssessment)
        assert resp.risk_assessment.overall_risk == "medium"

    def test_nested_price_predictions_parsed(self) -> None:
        resp = StockAnalysisResponse(**_make_response())
        assert isinstance(resp.price_predictions, PricePredictions)
        assert isinstance(resp.price_predictions.one_week, PriceForecast)

    def test_missing_required_fields_raise_validation_error(self) -> None:
        # ticker is mandatory
        payload = _make_response()
        del payload["ticker"]
        with pytest.raises(ValidationError) as exc_info:
            StockAnalysisResponse(**payload)

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("ticker",) for e in errors)

    def test_confidence_score_stored_accurately(self) -> None:
        resp = StockAnalysisResponse(**_make_response(confidence_score=0.999))
        assert resp.confidence_score == pytest.approx(0.999)

    def test_volume_integer_field(self) -> None:
        resp = StockAnalysisResponse(**_make_response(volume=123_456_789))
        assert resp.volume == 123_456_789

    def test_multiple_news_items(self) -> None:
        news = [
            {"title": "Bullish signal", "sentiment": "positive"},
            {"title": "Concern raised", "sentiment": "negative"},
            {"title": "Neutral update"},
        ]
        resp = StockAnalysisResponse(**_make_response(news=news))
        assert len(resp.news) == 3
        assert resp.news[2].sentiment is None

    def test_multiple_quarterly_earnings(self) -> None:
        earnings = [
            {"quarter": "Q1 2025", "eps": 1.98},
            {"quarter": "Q2 2025", "eps": 2.05},
        ]
        resp = StockAnalysisResponse(**_make_response(quarterly_earnings=earnings))
        assert len(resp.quarterly_earnings) == 2
        assert resp.quarterly_earnings[1].eps == 2.05

    def test_long_term_outlook_defaults_to_none(self) -> None:
        resp = StockAnalysisResponse(**_make_response())
        assert resp.long_term_outlook is None

    def test_long_term_outlook_populated(self) -> None:
        outlook = {
            "one_year": _make_forecast(),
            "five_year": _make_forecast(mid=200.0),
            "ten_year": _make_forecast(mid=350.0),
            "verdict": "strong_buy",
            "verdict_rationale": "Excellent long-term growth.",
            "catalysts": ["AI", "Cloud"],
            "long_term_risks": ["Regulation"],
            "compound_annual_return": 15.0,
        }
        resp = StockAnalysisResponse(**_make_response(long_term_outlook=outlook))
        assert resp.long_term_outlook is not None
        assert isinstance(resp.long_term_outlook, LongTermOutlook)
        assert resp.long_term_outlook.verdict == "strong_buy"
        assert resp.long_term_outlook.compound_annual_return == 15.0


# ===========================================================================
# LongTermOutlook
# ===========================================================================


def _make_outlook(**overrides: Any) -> dict[str, Any]:
    """Minimal valid LongTermOutlook payload."""
    base: dict[str, Any] = {
        "one_year": _make_forecast(),
        "five_year": _make_forecast(),
        "ten_year": _make_forecast(),
        "verdict": "buy",
        "verdict_rationale": "Solid growth trajectory.",
        "catalysts": ["innovation"],
        "long_term_risks": ["competition"],
        "compound_annual_return": 10.0,
    }
    return {**base, **overrides}


class TestLongTermOutlook:
    def test_all_fields_populated(self) -> None:
        outlook = LongTermOutlook(**_make_outlook())
        assert outlook.verdict == "buy"
        assert outlook.compound_annual_return == 10.0
        assert isinstance(outlook.one_year, PriceForecast)

    @pytest.mark.parametrize(
        "verdict",
        ["strong_buy", "buy", "hold", "sell", "strong_sell"],
    )
    def test_each_verdict_value_accepted(self, verdict: str) -> None:
        outlook = LongTermOutlook(**_make_outlook(verdict=verdict))
        assert outlook.verdict == verdict

    def test_invalid_verdict_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            LongTermOutlook(**_make_outlook(verdict="maybe"))
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("verdict",) for e in errors)

    def test_catalysts_defaults_to_empty_list(self) -> None:
        payload = _make_outlook()
        del payload["catalysts"]
        outlook = LongTermOutlook(**payload)
        assert outlook.catalysts == []

    def test_long_term_risks_defaults_to_empty_list(self) -> None:
        payload = _make_outlook()
        del payload["long_term_risks"]
        outlook = LongTermOutlook(**payload)
        assert outlook.long_term_risks == []

    def test_missing_required_forecast_raises(self) -> None:
        payload = _make_outlook()
        del payload["five_year"]
        with pytest.raises(ValidationError) as exc_info:
            LongTermOutlook(**payload)
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("five_year",) for e in errors)

    def test_nested_forecasts_preserved(self) -> None:
        outlook = LongTermOutlook(
            **_make_outlook(
                one_year=_make_forecast(mid=150.0),
                five_year=_make_forecast(mid=250.0),
                ten_year=_make_forecast(mid=400.0),
            )
        )
        assert outlook.one_year.mid == 150.0
        assert outlook.five_year.mid == 250.0
        assert outlook.ten_year.mid == 400.0
