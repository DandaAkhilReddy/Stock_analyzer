"""Router for AI-powered stock analysis."""
from __future__ import annotations

from fastapi import APIRouter

from app.core.logging import get_logger
from app.models.analysis import StockAnalysisResponse
from app.services.ai_analysis_service import AIAnalysisService
from app.services.market_data_service import MarketDataService

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["analysis"])

_market_service = MarketDataService()
_ai_service = AIAnalysisService(market_data=_market_service)


@router.post("/analyze/{ticker}", response_model=StockAnalysisResponse)
async def analyze_stock(ticker: str) -> StockAnalysisResponse:
    """Run comprehensive stock analysis.

    Fetches real market data from Financial Modeling Prep, then uses AI
    for qualitative analysis (recommendation, news, predictions).
    """
    logger.info("analysis_request", ticker=ticker)
    result = await _ai_service.analyze(ticker)
    logger.info("analysis_complete", ticker=ticker, recommendation=result.recommendation)
    return result
