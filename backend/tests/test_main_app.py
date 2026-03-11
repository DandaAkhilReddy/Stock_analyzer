"""Tests for main.py — FastAPI application entry point.

Covers:
- GET /health liveness probe
- GET /ready readiness probe
- AppException handler: StockNotFoundError → 404
- AppException handler: RateLimitError → 429
- AppException handler: bare AppException → 500
- Structured error body shape (code + message)
- CORS headers on real and preflight requests
- Lifespan (startup + shutdown) executed without error

Note on lifespan testing strategy
----------------------------------
httpx's ASGITransport does not emit ASGI lifespan events (startup/shutdown),
so lifespan tests invoke the ``lifespan`` async context manager directly and
inspect its side-effects via mocks. This is the correct boundary for unit-
testing the lifespan logic independently of the ASGI transport layer.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import main
from app.core.exceptions import AppException, RateLimitError, StockNotFoundError
from httpx import ASGITransport, AsyncClient
from main import app, lifespan

# ---------------------------------------------------------------------------
# Helpers — routes that raise controlled exceptions
# ---------------------------------------------------------------------------

_PATCH_TARGET = "app.routers.analysis._ai_service.analyze"

# Origin that matches the default cors_origins setting
_CORS_ORIGIN = "http://localhost:5173"


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------


class TestHealthEndpoint:
    """GET /health — liveness probe."""

    @pytest.mark.asyncio
    async def test_returns_200(self, client: AsyncClient) -> None:
        """Liveness probe responds with HTTP 200."""
        response = await client.get("/health")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_body_is_healthy(self, client: AsyncClient) -> None:
        """Response body is exactly {"status": "healthy"}."""
        response = await client.get("/health")
        assert response.json() == {"status": "healthy"}

    @pytest.mark.asyncio
    async def test_content_type_is_json(self, client: AsyncClient) -> None:
        """Content-Type header indicates JSON."""
        response = await client.get("/health")
        assert "application/json" in response.headers["content-type"]

    @pytest.mark.asyncio
    async def test_status_key_value(self, client: AsyncClient) -> None:
        """The 'status' key in the body is the string 'healthy'."""
        response = await client.get("/health")
        assert response.json()["status"] == "healthy"


# ---------------------------------------------------------------------------
# Ready endpoint
# ---------------------------------------------------------------------------


class TestReadyEndpoint:
    """GET /ready — readiness probe."""

    @pytest.mark.asyncio
    async def test_returns_200(self, client: AsyncClient) -> None:
        """Readiness probe responds with HTTP 200."""
        response = await client.get("/ready")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_body_contains_status_ready(self, client: AsyncClient) -> None:
        """Response body contains {"status": "ready"}."""
        response = await client.get("/ready")
        assert response.json()["status"] == "ready"

    @pytest.mark.asyncio
    async def test_content_type_is_json(self, client: AsyncClient) -> None:
        """Content-Type header indicates JSON."""
        response = await client.get("/ready")
        assert "application/json" in response.headers["content-type"]

    @pytest.mark.asyncio
    async def test_full_body(self, client: AsyncClient) -> None:
        """Response body is exactly {"status": "ready"}."""
        response = await client.get("/ready")
        assert response.json() == {"status": "ready"}


# ---------------------------------------------------------------------------
# Exception handler: StockNotFoundError → 404
# ---------------------------------------------------------------------------


class TestStockNotFoundErrorHandler:
    """AppException handler maps StockNotFoundError to 404."""

    @pytest.mark.asyncio
    async def test_returns_404(self, client: AsyncClient) -> None:
        """StockNotFoundError raised in a route produces HTTP 404."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError("FAKE")
            response = await client.post("/api/analyze/FAKE")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_body_has_error_envelope(self, client: AsyncClient) -> None:
        """404 body uses the structured error envelope {"error": {...}}."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError("FAKE")
            response = await client.post("/api/analyze/FAKE")

        assert "error" in response.json()

    @pytest.mark.asyncio
    async def test_body_error_code(self, client: AsyncClient) -> None:
        """404 error body carries the STOCK_NOT_FOUND code."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError("FAKE")
            response = await client.post("/api/analyze/FAKE")

        assert response.json()["error"]["code"] == "STOCK_NOT_FOUND"

    @pytest.mark.asyncio
    async def test_body_error_message_contains_ticker(self, client: AsyncClient) -> None:
        """404 error message includes the offending ticker string."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError("ZZZZ")
            response = await client.post("/api/analyze/ZZZZ")

        assert "ZZZZ" in response.json()["error"]["message"]

    @pytest.mark.asyncio
    async def test_content_type_is_json(self, client: AsyncClient) -> None:
        """404 response is JSON, not plain text."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = StockNotFoundError("FAKE")
            response = await client.post("/api/analyze/FAKE")

        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# Exception handler: RateLimitError → 429
# ---------------------------------------------------------------------------


class TestRateLimitErrorHandler:
    """AppException handler maps RateLimitError to 429."""

    @pytest.mark.asyncio
    async def test_returns_429(self, client: AsyncClient) -> None:
        """RateLimitError raised in a route produces HTTP 429."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = RateLimitError()
            response = await client.post("/api/analyze/AAPL")

        assert response.status_code == 429

    @pytest.mark.asyncio
    async def test_body_has_error_envelope(self, client: AsyncClient) -> None:
        """429 body uses the structured error envelope {"error": {...}}."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = RateLimitError()
            response = await client.post("/api/analyze/AAPL")

        assert "error" in response.json()

    @pytest.mark.asyncio
    async def test_body_error_code(self, client: AsyncClient) -> None:
        """429 error body carries the RATE_LIMIT_EXCEEDED code."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = RateLimitError()
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"

    @pytest.mark.asyncio
    async def test_body_error_message_default(self, client: AsyncClient) -> None:
        """429 error body contains the default rate-limit message."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = RateLimitError()
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["error"]["message"] == "Rate limit exceeded"

    @pytest.mark.asyncio
    async def test_body_error_message_custom(self, client: AsyncClient) -> None:
        """429 error body reflects a custom rate-limit message when supplied."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = RateLimitError("Kimi API throttled")
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["error"]["message"] == "Kimi API throttled"

    @pytest.mark.asyncio
    async def test_content_type_is_json(self, client: AsyncClient) -> None:
        """429 response is JSON, not plain text."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = RateLimitError()
            response = await client.post("/api/analyze/AAPL")

        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# Exception handler: generic AppException → 500
# ---------------------------------------------------------------------------


class TestGenericAppExceptionHandler:
    """AppException handler defaults to 500 for non-specialised subclasses."""

    @pytest.mark.asyncio
    async def test_returns_500(self, client: AsyncClient) -> None:
        """A bare AppException (not a specialised subclass) maps to HTTP 500."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AppException("something went wrong")
            response = await client.post("/api/analyze/AAPL")

        assert response.status_code == 500

    @pytest.mark.asyncio
    async def test_body_has_error_envelope(self, client: AsyncClient) -> None:
        """500 body uses the structured error envelope {"error": {...}}."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AppException("internal failure")
            response = await client.post("/api/analyze/AAPL")

        assert "error" in response.json()

    @pytest.mark.asyncio
    async def test_body_error_code_reflects_exception(self, client: AsyncClient) -> None:
        """500 error body carries the code set on the AppException instance."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AppException("boom", code="INTERNAL_ERROR")
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["error"]["code"] == "INTERNAL_ERROR"

    @pytest.mark.asyncio
    async def test_body_error_message_reflects_exception(self, client: AsyncClient) -> None:
        """500 error body carries the message from the AppException instance."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AppException("unexpected pipeline failure")
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["error"]["message"] == "unexpected pipeline failure"

    @pytest.mark.asyncio
    async def test_body_error_custom_code(self, client: AsyncClient) -> None:
        """500 error body preserves any custom code given to AppException."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AppException("db unreachable", code="DB_ERROR")
            response = await client.post("/api/analyze/AAPL")

        assert response.json()["error"]["code"] == "DB_ERROR"

    @pytest.mark.asyncio
    async def test_content_type_is_json(self, client: AsyncClient) -> None:
        """500 response is JSON, not plain text."""
        with patch(_PATCH_TARGET, new_callable=AsyncMock) as mock_analyze:
            mock_analyze.side_effect = AppException("internal failure")
            response = await client.post("/api/analyze/AAPL")

        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# CORS headers
# ---------------------------------------------------------------------------


class TestCORSHeaders:
    """CORS middleware injects the correct headers on responses."""

    @pytest.mark.asyncio
    async def test_preflight_returns_200(self, client: AsyncClient) -> None:
        """OPTIONS preflight with a matching origin gets a 200 response."""
        response = await client.options(
            "/health",
            headers={
                "Origin": _CORS_ORIGIN,
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_preflight_allows_origin(self, client: AsyncClient) -> None:
        """OPTIONS preflight echoes the matching origin in allow-origin header."""
        response = await client.options(
            "/health",
            headers={
                "Origin": _CORS_ORIGIN,
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.headers.get("access-control-allow-origin") == _CORS_ORIGIN

    @pytest.mark.asyncio
    async def test_preflight_allows_credentials(self, client: AsyncClient) -> None:
        """OPTIONS preflight response confirms credentials are allowed."""
        response = await client.options(
            "/health",
            headers={
                "Origin": _CORS_ORIGIN,
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.headers.get("access-control-allow-credentials") == "true"

    @pytest.mark.asyncio
    async def test_cors_origin_on_get_health(self, client: AsyncClient) -> None:
        """A simple GET /health with a matching Origin returns the allow-origin header."""
        response = await client.get("/health", headers={"Origin": _CORS_ORIGIN})
        assert response.headers.get("access-control-allow-origin") == _CORS_ORIGIN

    @pytest.mark.asyncio
    async def test_cors_origin_on_get_ready(self, client: AsyncClient) -> None:
        """A simple GET /ready with a matching Origin returns the allow-origin header."""
        response = await client.get("/ready", headers={"Origin": _CORS_ORIGIN})
        assert response.headers.get("access-control-allow-origin") == _CORS_ORIGIN

    @pytest.mark.asyncio
    async def test_no_cors_header_without_origin(self, client: AsyncClient) -> None:
        """A request without an Origin header does not emit allow-origin."""
        response = await client.get("/health")
        assert "access-control-allow-origin" not in response.headers


# ---------------------------------------------------------------------------
# Lifespan (startup + shutdown)
# ---------------------------------------------------------------------------


class TestLifespan:
    """Application lifespan executes setup_logging and emits log events.

    ASGITransport does not emit ASGI lifespan events, so these tests invoke
    the ``lifespan`` async context manager directly. This is the correct
    isolation boundary for the lifespan unit tests.
    """

    @pytest.mark.asyncio
    async def test_lifespan_completes_without_error(self) -> None:
        """Entering and exiting the lifespan context does not raise."""
        mock_app = MagicMock()
        # Should not raise
        async with lifespan(mock_app):
            pass

    @pytest.mark.asyncio
    async def test_startup_calls_setup_logging(self) -> None:
        """Lifespan startup calls setup_logging exactly once."""
        mock_app = MagicMock()
        with (
            patch.object(main, "setup_logging") as mock_setup,
            patch.object(main, "logger"),
        ):
            async with lifespan(mock_app):
                pass

        mock_setup.assert_called_once()

    @pytest.mark.asyncio
    async def test_startup_logs_environment_event(self) -> None:
        """Lifespan startup emits the 'stock_analyzer_starting' log event."""
        mock_app = MagicMock()
        with (
            patch.object(main, "setup_logging"),
            patch.object(main, "logger") as mock_logger,
        ):
            async with lifespan(mock_app):
                pass

        startup_calls = [
            call
            for call in mock_logger.info.call_args_list
            if call.args and call.args[0] == "stock_analyzer_starting"
        ]
        assert len(startup_calls) == 1

    @pytest.mark.asyncio
    async def test_startup_log_includes_environment_kwarg(self) -> None:
        """Startup log passes the environment value as a keyword argument."""
        mock_app = MagicMock()
        with (
            patch.object(main, "setup_logging"),
            patch.object(main, "logger") as mock_logger,
        ):
            async with lifespan(mock_app):
                pass

        startup_call = next(
            call
            for call in mock_logger.info.call_args_list
            if call.args and call.args[0] == "stock_analyzer_starting"
        )
        assert "environment" in startup_call.kwargs

    @pytest.mark.asyncio
    async def test_shutdown_logs_event(self) -> None:
        """Lifespan teardown emits the 'stock_analyzer_shutting_down' log event."""
        mock_app = MagicMock()
        with (
            patch.object(main, "setup_logging"),
            patch.object(main, "logger") as mock_logger,
        ):
            async with lifespan(mock_app):
                pass

        shutdown_calls = [
            call
            for call in mock_logger.info.call_args_list
            if call.args and call.args[0] == "stock_analyzer_shutting_down"
        ]
        assert len(shutdown_calls) == 1

    @pytest.mark.asyncio
    async def test_setup_logging_called_before_yield(self) -> None:
        """setup_logging is invoked during startup, before the app body runs."""
        mock_app = MagicMock()
        call_order: list[str] = []

        def record_setup() -> None:
            call_order.append("setup_logging")

        with (
            patch.object(main, "setup_logging", side_effect=record_setup),
            patch.object(main, "logger"),
        ):
            async with lifespan(mock_app):
                call_order.append("body")

        assert call_order == ["setup_logging", "body"]
