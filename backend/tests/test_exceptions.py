"""Tests for app.core.exceptions — the custom exception hierarchy."""
from __future__ import annotations

import pytest

from app.core.exceptions import (
    AIAnalysisError,
    AppException,
    ExternalAPIError,
    RateLimitError,
    StockNotFoundError,
)


# ---------------------------------------------------------------------------
# AppException — base class
# ---------------------------------------------------------------------------


class TestAppException:
    """Tests for the base AppException class."""

    def test_stores_message(self) -> None:
        """message attribute matches the string passed at construction."""
        exc = AppException("something broke")
        assert exc.message == "something broke"

    def test_default_code_is_internal_error(self) -> None:
        """Omitting code yields the INTERNAL_ERROR sentinel."""
        exc = AppException("oops")
        assert exc.code == "INTERNAL_ERROR"

    def test_explicit_code_is_stored(self) -> None:
        """A caller-supplied code is preserved as-is."""
        exc = AppException("bad things", code="MY_CODE")
        assert exc.code == "MY_CODE"

    def test_inherits_from_exception(self) -> None:
        """AppException must be a subclass of the built-in Exception."""
        assert issubclass(AppException, Exception)

    def test_is_catchable_as_exception(self) -> None:
        """An AppException instance can be caught with a bare except Exception."""
        with pytest.raises(Exception, match="something broke"):
            raise AppException("something broke")

    def test_str_returns_message(self) -> None:
        """str() of an AppException returns the message text."""
        exc = AppException("the message")
        assert str(exc) == "the message"

    def test_args_contains_message(self) -> None:
        """The Exception.args tuple contains the message as its first element."""
        exc = AppException("check args")
        assert exc.args[0] == "check args"

    def test_empty_message(self) -> None:
        """AppException accepts an empty string without error."""
        exc = AppException("")
        assert exc.message == ""
        assert str(exc) == ""

    def test_message_with_special_characters(self) -> None:
        """Messages with unicode and punctuation are stored verbatim."""
        msg = "Error: ticker \u2018AAPL\u2019 \u2014 not found (500\u20ac)"
        exc = AppException(msg)
        assert exc.message == msg

    def test_code_with_empty_string(self) -> None:
        """An empty string is a valid (if unusual) code value."""
        exc = AppException("msg", code="")
        assert exc.code == ""


# ---------------------------------------------------------------------------
# StockNotFoundError
# ---------------------------------------------------------------------------


class TestStockNotFoundError:
    """Tests for StockNotFoundError."""

    def test_code_is_stock_not_found(self) -> None:
        """Hard-coded error code must be STOCK_NOT_FOUND."""
        exc = StockNotFoundError("AAPL")
        assert exc.code == "STOCK_NOT_FOUND"

    def test_ticker_attribute_stored(self) -> None:
        """The raw ticker value is accessible as exc.ticker."""
        exc = StockNotFoundError("TSLA")
        assert exc.ticker == "TSLA"

    def test_message_contains_ticker(self) -> None:
        """Formatted message wraps the ticker in single quotes."""
        exc = StockNotFoundError("MSFT")
        assert exc.message == "Stock 'MSFT' not found"

    def test_str_returns_formatted_message(self) -> None:
        """str() delegates to the formatted message, not the raw ticker."""
        exc = StockNotFoundError("GOOG")
        assert str(exc) == "Stock 'GOOG' not found"

    def test_inherits_from_app_exception(self) -> None:
        """StockNotFoundError must be a subclass of AppException."""
        assert issubclass(StockNotFoundError, AppException)

    def test_catchable_as_app_exception(self) -> None:
        """An instance can be caught via the AppException base class."""
        with pytest.raises(AppException):
            raise StockNotFoundError("NVDA")

    def test_empty_ticker(self) -> None:
        """An empty string ticker is accepted; message still formats correctly."""
        exc = StockNotFoundError("")
        assert exc.ticker == ""
        assert exc.message == "Stock '' not found"

    def test_lowercase_ticker(self) -> None:
        """Ticker casing is preserved exactly as supplied."""
        exc = StockNotFoundError("aapl")
        assert exc.ticker == "aapl"
        assert exc.message == "Stock 'aapl' not found"


# ---------------------------------------------------------------------------
# ExternalAPIError
# ---------------------------------------------------------------------------


class TestExternalAPIError:
    """Tests for ExternalAPIError."""

    def test_code_is_external_api_error(self) -> None:
        """Hard-coded error code must be EXTERNAL_API_ERROR."""
        exc = ExternalAPIError("YahooFinance", "connection refused")
        assert exc.code == "EXTERNAL_API_ERROR"

    def test_service_attribute_stored(self) -> None:
        """The raw service name is accessible as exc.service."""
        exc = ExternalAPIError("OpenAI", "timeout")
        assert exc.service == "OpenAI"

    def test_message_format(self) -> None:
        """Message follows the '<service> API error: <detail>' pattern."""
        exc = ExternalAPIError("AlphaVantage", "invalid key")
        assert exc.message == "AlphaVantage API error: invalid key"

    def test_str_returns_formatted_message(self) -> None:
        """str() returns the fully formatted message string."""
        exc = ExternalAPIError("Finnhub", "rate limit hit")
        assert str(exc) == "Finnhub API error: rate limit hit"

    def test_inherits_from_app_exception(self) -> None:
        """ExternalAPIError must be a subclass of AppException."""
        assert issubclass(ExternalAPIError, AppException)

    def test_catchable_as_app_exception(self) -> None:
        """An instance can be caught via the AppException base class."""
        with pytest.raises(AppException):
            raise ExternalAPIError("SomeService", "down")

    def test_empty_service_name(self) -> None:
        """An empty service string is accepted; format still applies."""
        exc = ExternalAPIError("", "no such service")
        assert exc.service == ""
        assert exc.message == " API error: no such service"

    def test_empty_detail_message(self) -> None:
        """An empty detail string still produces a valid formatted message."""
        exc = ExternalAPIError("AWS", "")
        assert exc.message == "AWS API error: "

    def test_service_name_with_spaces(self) -> None:
        """Service names containing spaces are stored and formatted verbatim."""
        exc = ExternalAPIError("Yahoo Finance", "503 unavailable")
        assert exc.service == "Yahoo Finance"
        assert exc.message == "Yahoo Finance API error: 503 unavailable"


# ---------------------------------------------------------------------------
# AIAnalysisError
# ---------------------------------------------------------------------------


class TestAIAnalysisError:
    """Tests for AIAnalysisError."""

    def test_code_is_ai_analysis_error(self) -> None:
        """Hard-coded error code must be AI_ANALYSIS_ERROR."""
        exc = AIAnalysisError("model timed out")
        assert exc.code == "AI_ANALYSIS_ERROR"

    def test_message_is_prefixed(self) -> None:
        """Raw detail is prepended with 'AI analysis failed: '."""
        exc = AIAnalysisError("context window exceeded")
        assert exc.message == "AI analysis failed: context window exceeded"

    def test_str_returns_prefixed_message(self) -> None:
        """str() returns the full prefixed message string."""
        exc = AIAnalysisError("null response")
        assert str(exc) == "AI analysis failed: null response"

    def test_inherits_from_app_exception(self) -> None:
        """AIAnalysisError must be a subclass of AppException."""
        assert issubclass(AIAnalysisError, AppException)

    def test_catchable_as_app_exception(self) -> None:
        """An instance can be caught via the AppException base class."""
        with pytest.raises(AppException):
            raise AIAnalysisError("unexpected token")

    def test_empty_detail(self) -> None:
        """An empty detail string still produces a valid prefixed message."""
        exc = AIAnalysisError("")
        assert exc.message == "AI analysis failed: "


# ---------------------------------------------------------------------------
# RateLimitError
# ---------------------------------------------------------------------------


class TestRateLimitError:
    """Tests for RateLimitError."""

    def test_code_is_rate_limit_exceeded(self) -> None:
        """Hard-coded error code must be RATE_LIMIT_EXCEEDED."""
        exc = RateLimitError()
        assert exc.code == "RATE_LIMIT_EXCEEDED"

    def test_default_message(self) -> None:
        """Omitting the message argument uses the built-in default text."""
        exc = RateLimitError()
        assert exc.message == "Rate limit exceeded"

    def test_str_default_message(self) -> None:
        """str() with default construction returns the default message."""
        exc = RateLimitError()
        assert str(exc) == "Rate limit exceeded"

    def test_custom_message_overrides_default(self) -> None:
        """A caller-supplied message replaces the default."""
        exc = RateLimitError("Too many requests — try again in 60 s")
        assert exc.message == "Too many requests — try again in 60 s"

    def test_str_with_custom_message(self) -> None:
        """str() with a custom message returns that custom text."""
        exc = RateLimitError("slow down")
        assert str(exc) == "slow down"

    def test_inherits_from_app_exception(self) -> None:
        """RateLimitError must be a subclass of AppException."""
        assert issubclass(RateLimitError, AppException)

    def test_catchable_as_app_exception(self) -> None:
        """An instance can be caught via the AppException base class."""
        with pytest.raises(AppException):
            raise RateLimitError()

    def test_empty_custom_message(self) -> None:
        """An empty string overrides the default (edge case accepted by the API)."""
        exc = RateLimitError("")
        assert exc.message == ""


# ---------------------------------------------------------------------------
# Cross-cutting: full inheritance chain
# ---------------------------------------------------------------------------


class TestInheritanceChain:
    """Verifies that every concrete exception satisfies the full hierarchy."""

    @pytest.mark.parametrize(
        "exc_cls",
        [
            StockNotFoundError,
            ExternalAPIError,
            AIAnalysisError,
            RateLimitError,
        ],
    )
    def test_all_subclass_app_exception(self, exc_cls: type) -> None:
        """Every concrete exception class inherits from AppException."""
        assert issubclass(exc_cls, AppException)

    @pytest.mark.parametrize(
        "exc_cls",
        [
            AppException,
            StockNotFoundError,
            ExternalAPIError,
            AIAnalysisError,
            RateLimitError,
        ],
    )
    def test_all_subclass_builtin_exception(self, exc_cls: type) -> None:
        """Every exception in the hierarchy ultimately inherits from Exception."""
        assert issubclass(exc_cls, Exception)

    def test_catch_via_app_exception_covers_all_subclasses(self) -> None:
        """A single AppException handler catches any subclass instance."""
        errors: list[AppException] = [
            StockNotFoundError("X"),
            ExternalAPIError("svc", "detail"),
            AIAnalysisError("reason"),
            RateLimitError(),
        ]
        for err in errors:
            with pytest.raises(AppException):
                raise err
