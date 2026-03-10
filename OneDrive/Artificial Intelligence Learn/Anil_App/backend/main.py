"""Stock Analyzer API entry point."""
from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppException, RateLimitError, StockNotFoundError
from app.core.logging import get_logger, setup_logging
from app.routers import analysis

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: configure logging."""
    setup_logging()
    logger.info("stock_analyzer_starting", environment=settings.environment)
    yield
    logger.info("stock_analyzer_shutting_down")


app = FastAPI(
    title="Stock Analyzer API",
    description="AI-powered stock analysis using Kimi K2.5",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Map domain exceptions to structured HTTP responses."""
    status_code = 500
    if isinstance(exc, StockNotFoundError):
        status_code = 404
    elif isinstance(exc, RateLimitError):
        status_code = 429

    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "healthy"}


@app.get("/ready")
async def ready() -> dict[str, Any]:
    """Readiness probe."""
    return {"status": "ready"}
