"""Router for AI-powered stock analysis."""
from __future__ import annotations

import asyncio
import json
import time

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.logging import get_logger
from app.models.analysis import StockAnalysisResponse
from app.providers.sharepoint_agent import SharePointAgentProvider
from app.services.ai_analysis_service import AIAnalysisService
from app.services.market_data_service import MarketDataService

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["analysis"])

_market_service = MarketDataService()
_sharepoint = (
    SharePointAgentProvider() if settings.sharepoint_agent_endpoint else None
)
_ai_service = AIAnalysisService(
    market_data=_market_service, sharepoint=_sharepoint
)


@router.get("/search")
async def search_stocks(
    q: str = Query(min_length=1, max_length=100),
) -> list[dict[str, str]]:
    """Return stock search suggestions for autocomplete.

    Args:
        q: Search query (ticker or company name fragment).

    Returns:
        List of {symbol, name} dicts matching the query.
    """
    return await _market_service.search_suggestions(q)


@router.get("/debug/earnings/{ticker}")
async def debug_earnings(ticker: str) -> dict:
    """Diagnostic endpoint: shows raw FMP earnings data for a ticker.

    Returns the quarters FMP returns and which endpoint succeeded.
    Remove this endpoint after debugging is complete.
    """
    result = await _market_service.get_income_statement(ticker)
    return {
        "ticker": ticker,
        "quarters_returned": len(result),
        "data": result,
    }


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


@router.get("/analyze/{ticker}/stream")
async def analyze_stock_stream(ticker: str) -> StreamingResponse:
    """Stream analysis progress via Server-Sent Events.

    Sends progress updates as each phase completes, with the full
    analysis result in the final event.
    """
    logger.info("analysis_stream_request", ticker=ticker)

    async def event_generator():
        def _sse(data: dict) -> str:
            return f"data: {json.dumps(data)}\n\n"

        yield _sse({"phase": "started", "progress": 0.1, "message": "Starting analysis..."})

        try:
            ticker_upper = ticker.upper().strip()

            # Check cache first (reuse the module-level cache from ai_analysis_service)
            from app.services.ai_analysis_service import _analysis_cache
            cached = _analysis_cache.get(ticker_upper)
            if cached is not None:
                expiry, response = cached
                if time.time() < expiry:
                    yield _sse({"phase": "cache_hit", "progress": 0.9, "message": "Retrieved from cache"})
                    yield _sse({"phase": "complete", "progress": 1.0, "data": response.model_dump(mode="json")})
                    return

            yield _sse({"phase": "market_data", "progress": 0.2, "message": "Fetching real-time market data..."})
            await asyncio.sleep(0)  # Yield control to flush

            yield _sse({"phase": "research", "progress": 0.4, "message": "Running research agent..."})

            yield _sse({"phase": "ai_analysis", "progress": 0.6, "message": "AI analyzing fundamentals..."})

            # Run the full analysis (which handles all phases internally)
            result = await _ai_service.analyze(ticker)

            yield _sse({"phase": "finalizing", "progress": 0.9, "message": "Assembling report..."})
            yield _sse({"phase": "complete", "progress": 1.0, "data": result.model_dump(mode="json")})

        except Exception as exc:
            logger.error("analysis_stream_error", ticker=ticker, error=str(exc))
            yield _sse({"phase": "error", "progress": 0, "message": str(exc)})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
