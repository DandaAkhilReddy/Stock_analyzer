"""AI analysis service — generates full stock analysis using Kimi K2.5."""
from __future__ import annotations

from datetime import datetime, timezone

from app.core.exceptions import AIAnalysisError
from app.core.logging import get_logger
from app.models.analysis import (
    NewsItem,
    PriceForecast,
    PricePredictions,
    RiskAssessment,
    StockAnalysisResponse,
    TechnicalSnapshot,
)
from app.providers.openai_provider import OpenAIProvider

logger = get_logger(__name__)

_SYSTEM_PROMPT = """You are a senior equity research analyst with access to current market data. Provide comprehensive stock analysis including current price data, technical indicators, recent news, and investment recommendation.

You must research and provide the most recent data you know about the stock. Include actual price levels, real technical indicator values, and recent news headlines.

Respond in valid JSON matching the exact schema provided. No markdown, no code blocks, just raw JSON."""

_USER_PROMPT_TEMPLATE = """Analyze the stock: {ticker}

Provide a comprehensive analysis with all of the following data. Use the most recent data available to you.

Required JSON output:
{{
  "company_name": "<full company name>",
  "current_price": <float>,
  "previous_close": <float or null>,
  "open": <float or null>,
  "day_high": <float or null>,
  "day_low": <float or null>,
  "volume": <int or null>,
  "market_cap": "<string like '2.8T' or '150B' or null>",
  "pe_ratio": <float or null>,
  "eps": <float or null>,
  "week_52_high": <float or null>,
  "week_52_low": <float or null>,
  "dividend_yield": <float as decimal like 0.005 or null>,
  "technical": {{
    "sma_20": <float or null>,
    "sma_50": <float or null>,
    "sma_200": <float or null>,
    "ema_12": <float or null>,
    "ema_26": <float or null>,
    "rsi_14": <float or null>,
    "macd_line": <float or null>,
    "macd_signal": <float or null>,
    "macd_histogram": <float or null>,
    "bollinger_upper": <float or null>,
    "bollinger_middle": <float or null>,
    "bollinger_lower": <float or null>,
    "support_levels": [<float>, ...],
    "resistance_levels": [<float>, ...],
    "signal": "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell"
  }},
  "news": [
    {{"title": "<headline>", "source": "<source name>", "sentiment": "positive" | "negative" | "neutral"}},
    ... (5-10 recent headlines)
  ],
  "recommendation": "strong_buy" | "buy" | "hold" | "sell" | "strong_sell",
  "confidence_score": <float 0.0-1.0>,
  "summary": "<2-3 sentence analysis summary>",
  "bull_case": "<paragraph explaining bullish thesis>",
  "bear_case": "<paragraph explaining bearish thesis>",
  "risk_assessment": {{
    "overall_risk": "low" | "medium" | "high" | "very_high",
    "risk_factors": ["<factor 1>", "<factor 2>", ...],
    "risk_score": <float 0.0-1.0>
  }},
  "price_predictions": {{
    "one_week": {{"low": <float>, "mid": <float>, "high": <float>, "confidence": <float>}},
    "one_month": {{"low": <float>, "mid": <float>, "high": <float>, "confidence": <float>}},
    "three_months": {{"low": <float>, "mid": <float>, "high": <float>, "confidence": <float>}}
  }}
}}"""


class AIAnalysisService:
    """Generates comprehensive AI-powered stock analysis using Kimi K2.5."""

    def __init__(self, provider: OpenAIProvider | None = None) -> None:
        """Initialise with an OpenAI provider.

        Args:
            provider: An ``OpenAIProvider`` instance. Defaults to a new
                instance when ``None`` is supplied.
        """
        self._provider = provider or OpenAIProvider()

    async def analyze(self, ticker: str) -> StockAnalysisResponse:
        """Run full AI analysis on a stock ticker.

        Args:
            ticker: Stock ticker symbol (e.g. "AAPL", "MSFT").

        Returns:
            Complete stock analysis response.

        Raises:
            AIAnalysisError: If the AI call fails or response parsing fails.
        """
        ticker = ticker.upper().strip()
        user_prompt = _USER_PROMPT_TEMPLATE.format(ticker=ticker)
        logger.info("ai_analysis_starting", ticker=ticker)

        try:
            result = await self._provider.chat_completion_json(
                system_prompt=_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                max_tokens=4000,
            )
            response = self._parse_response(ticker, result)
            logger.info(
                "ai_analysis_complete",
                ticker=ticker,
                recommendation=response.recommendation,
            )
            return response
        except AIAnalysisError:
            raise
        except Exception as exc:
            logger.error("ai_analysis_unexpected_error", ticker=ticker, error=str(exc))
            raise AIAnalysisError(str(exc)) from exc

    def _parse_response(self, ticker: str, data: dict) -> StockAnalysisResponse:
        """Parse AI JSON response into the domain model.

        Args:
            ticker: Ticker symbol used to populate the response.
            data: Raw parsed JSON dict from the model.

        Returns:
            A fully populated ``StockAnalysisResponse``.

        Raises:
            AIAnalysisError: If required keys are missing or values have
                unexpected types.
        """
        try:
            technical_data = data.get("technical")
            technical = TechnicalSnapshot(**technical_data) if technical_data else None

            news_data = data.get("news", [])
            news = [NewsItem(**n) for n in news_data]

            risk_data = data.get("risk_assessment", {})
            predictions_data = data.get("price_predictions", {})

            return StockAnalysisResponse(
                ticker=ticker,
                company_name=data.get("company_name", ticker),
                current_price=float(data["current_price"]),
                previous_close=data.get("previous_close"),
                open=data.get("open"),
                day_high=data.get("day_high"),
                day_low=data.get("day_low"),
                volume=data.get("volume"),
                market_cap=data.get("market_cap"),
                pe_ratio=data.get("pe_ratio"),
                eps=data.get("eps"),
                week_52_high=data.get("week_52_high"),
                week_52_low=data.get("week_52_low"),
                dividend_yield=data.get("dividend_yield"),
                technical=technical,
                news=news,
                recommendation=data["recommendation"],
                confidence_score=float(data["confidence_score"]),
                summary=data["summary"],
                bull_case=data["bull_case"],
                bear_case=data["bear_case"],
                risk_assessment=RiskAssessment(
                    overall_risk=risk_data["overall_risk"],
                    risk_factors=risk_data.get("risk_factors", []),
                    risk_score=float(risk_data.get("risk_score", 0.5)),
                ),
                price_predictions=PricePredictions(
                    one_week=PriceForecast(**predictions_data["one_week"]),
                    one_month=PriceForecast(**predictions_data["one_month"]),
                    three_months=PriceForecast(**predictions_data["three_months"]),
                ),
                analysis_timestamp=datetime.now(timezone.utc),
            )
        except (KeyError, TypeError, ValueError) as exc:
            logger.error(
                "ai_response_parse_error",
                ticker=ticker,
                error=str(exc),
                data=str(data)[:500],
            )
            raise AIAnalysisError(f"Failed to parse AI response: {exc}") from exc
