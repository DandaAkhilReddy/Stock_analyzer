"""Shared pytest fixtures for the Stock Analyzer test suite."""
from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.fixture(autouse=True)
def _clear_fmp_cache() -> None:
    """Clear the FMP response cache before each test to prevent cross-test leaks."""
    from app.services.market_data_service import _response_cache

    _response_cache.clear()


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client wired directly to the FastAPI app via ASGI transport.

    Yields:
        An ``AsyncClient`` instance for making test requests without a
        live server.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
