"""Router for AI-powered stock analysis."""
from __future__ import annotations

from fastapi import APIRouter

from app.core.logging import get_logger
from app.models.analysis import StockAnalysisResponse
from app.services.ai_analysis_service import AIAnalysisService

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["analysis"])

_ai_service = AIAnalysisService()


@router.post("/analyze/{ticker}", response_model=StockAnalysisResponse)
async def analyze_stock(ticker: str) -> StockAnalysisResponse:
    """Run comprehensive AI-powered stock analysis.

    Sends the ticker to Kimi K2.5 which provides current price data,
    technical indicators, news, and investment recommendation.
    """
    logger.info("analysis_request", ticker=ticker)
    result = await _ai_service.analyze(ticker)
    logger.info("analysis_complete", ticker=ticker, recommendation=result.recommendation)
    return result
