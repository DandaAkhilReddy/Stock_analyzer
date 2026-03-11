"""Custom exception hierarchy for the Stock Analyzer application."""
from __future__ import annotations


class AppException(Exception):
    """Base application exception.

    All domain-specific exceptions should inherit from this class so that
    the global exception handler in main.py can catch them uniformly.
    """

    def __init__(self, message: str, code: str = "INTERNAL_ERROR") -> None:
        self.message = message
        self.code = code
        super().__init__(message)


class StockNotFoundError(AppException):
    """Raised when a requested ticker cannot be found in any data source."""

    def __init__(self, ticker: str) -> None:
        super().__init__(
            message=f"Stock '{ticker}' not found",
            code="STOCK_NOT_FOUND",
        )
        self.ticker = ticker


class ExternalAPIError(AppException):
    """Raised when a third-party API call fails in an unrecoverable way."""

    def __init__(self, service: str, message: str) -> None:
        super().__init__(
            message=f"{service} API error: {message}",
            code="EXTERNAL_API_ERROR",
        )
        self.service = service


class AIAnalysisError(AppException):
    """Raised when the AI analysis pipeline fails to produce a result."""

    def __init__(self, message: str) -> None:
        super().__init__(
            message=f"AI analysis failed: {message}",
            code="AI_ANALYSIS_ERROR",
        )


class RateLimitError(AppException):
    """Raised when a rate limit is hit on an external service or the API itself."""

    def __init__(self, message: str = "Rate limit exceeded") -> None:
        super().__init__(message=message, code="RATE_LIMIT_EXCEEDED")
