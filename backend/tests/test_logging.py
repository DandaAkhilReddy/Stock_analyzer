"""Tests for app.core.logging — setup_logging() and get_logger()."""
from __future__ import annotations

from unittest.mock import patch

import pytest
import structlog
from structlog._config import BoundLoggerLazyProxy

from app.core.logging import get_logger, setup_logging


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _reset_structlog() -> None:
    """Reset structlog global state between tests."""
    structlog.reset_defaults()


# ---------------------------------------------------------------------------
# get_logger()
# ---------------------------------------------------------------------------


class TestGetLogger:
    """Behavioural tests for get_logger()."""

    def test_returns_bound_logger_lazy_proxy(self) -> None:
        """get_logger() returns a structlog BoundLoggerLazyProxy."""
        logger = get_logger("test.module")
        assert isinstance(logger, BoundLoggerLazyProxy)

    def test_name_is_passed_as_factory_arg(self) -> None:
        """The name string is forwarded to the logger factory via _logger_factory_args."""
        name = "my.service.component"
        logger = get_logger(name)
        # BoundLoggerLazyProxy stores positional factory args in _logger_factory_args
        assert logger._logger_factory_args == (name,)

    def test_different_names_produce_independent_loggers(self) -> None:
        """Two get_logger() calls with different names return distinct proxies."""
        logger_a = get_logger("module.a")
        logger_b = get_logger("module.b")
        assert logger_a is not logger_b
        assert logger_a._logger_factory_args != logger_b._logger_factory_args

    def test_same_name_produces_new_proxy_each_call(self) -> None:
        """Repeated calls with the same name create a new proxy object each time."""
        logger_a = get_logger("same.name")
        logger_b = get_logger("same.name")
        # They are equal in configuration but not the same object
        assert logger_a is not logger_b

    def test_accepts_dotted_module_name(self) -> None:
        """Module-style dotted names are stored verbatim."""
        logger = get_logger("app.core.logging")
        assert logger._logger_factory_args == ("app.core.logging",)

    def test_accepts_empty_string_name(self) -> None:
        """An empty string name is accepted without error."""
        logger = get_logger("")
        assert isinstance(logger, BoundLoggerLazyProxy)

    def test_accepts_single_word_name(self) -> None:
        """A plain word name (no dots) is accepted without error."""
        logger = get_logger("worker")
        assert logger._logger_factory_args == ("worker",)

    def test_logger_has_bind_method(self) -> None:
        """Returned proxy exposes the bind() method required by the BoundLogger protocol."""
        logger = get_logger("test")
        assert callable(logger.bind)

    def test_logger_has_info_attribute(self) -> None:
        """Returned proxy lazily exposes logging level methods via __getattr__."""
        logger = get_logger("test")
        # Accessing .info triggers __getattr__ which assembles the real logger;
        # this must not raise.
        assert hasattr(logger, "info")


# ---------------------------------------------------------------------------
# setup_logging() — dev mode (is_production=False)
# ---------------------------------------------------------------------------


class TestSetupLoggingDevMode:
    """Tests for setup_logging() when is_production is False."""

    def setup_method(self) -> None:
        _reset_structlog()

    def teardown_method(self) -> None:
        _reset_structlog()

    def test_runs_without_error(self) -> None:
        """setup_logging() completes without raising in development mode."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.is_production = False
            setup_logging()  # must not raise

    def test_marks_structlog_as_configured(self) -> None:
        """After setup_logging(), structlog.is_configured() returns True."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.is_production = False
            setup_logging()
        assert structlog.is_configured() is True

    def test_dev_mode_uses_console_renderer(self) -> None:
        """In development the last processor must be a ConsoleRenderer."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.is_production = False
            setup_logging()
        processors = list(structlog.get_config()["processors"])
        assert isinstance(processors[-1], structlog.dev.ConsoleRenderer)

    def test_dev_mode_does_not_use_json_renderer(self) -> None:
        """In development the processor chain must not contain a JSONRenderer."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.is_production = False
            setup_logging()
        processors = list(structlog.get_config()["processors"])
        types = [type(p) for p in processors]
        assert structlog.processors.JSONRenderer not in types

    def test_processor_chain_includes_add_log_level(self) -> None:
        """The processor chain includes add_log_level in dev mode."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.is_production = False
            setup_logging()
        processors = list(structlog.get_config()["processors"])
        assert structlog.processors.add_log_level in processors

    def test_processor_chain_includes_timestamper(self) -> None:
        """The processor chain includes a TimeStamper in dev mode."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.is_production = False
            setup_logging()
        processors = list(structlog.get_config()["processors"])
        assert any(isinstance(p, structlog.processors.TimeStamper) for p in processors)

    def test_cache_logger_on_first_use_is_true(self) -> None:
        """setup_logging() always sets cache_logger_on_first_use=True."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.is_production = False
            setup_logging()
        assert structlog.get_config()["cache_logger_on_first_use"] is True

    def test_context_class_is_dict(self) -> None:
        """setup_logging() configures dict as the context class."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.is_production = False
            setup_logging()
        assert structlog.get_config()["context_class"] is dict

    def test_logger_factory_is_print_logger_factory(self) -> None:
        """setup_logging() installs PrintLoggerFactory as the logger factory."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.is_production = False
            setup_logging()
        factory = structlog.get_config()["logger_factory"]
        assert isinstance(factory, structlog.PrintLoggerFactory)

    @pytest.mark.parametrize("level", ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"])
    def test_accepts_all_standard_log_levels(self, level: str) -> None:
        """setup_logging() runs without error for any standard log level string."""
        _reset_structlog()
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = level
            mock_settings.is_production = False
            setup_logging()  # must not raise
        assert structlog.is_configured() is True
        _reset_structlog()

    def test_unknown_log_level_falls_back_to_info(self) -> None:
        """An unrecognised log_level string falls back to INFO without raising."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "NONSENSE"
            mock_settings.is_production = False
            # getattr(logging, "NONSENSE", logging.INFO) == logging.INFO
            setup_logging()  # must not raise
        assert structlog.is_configured() is True


# ---------------------------------------------------------------------------
# setup_logging() — production mode (is_production=True)
# ---------------------------------------------------------------------------


class TestSetupLoggingProductionMode:
    """Tests for setup_logging() when is_production is True."""

    def setup_method(self) -> None:
        _reset_structlog()

    def teardown_method(self) -> None:
        _reset_structlog()

    def test_runs_without_error(self) -> None:
        """setup_logging() completes without raising in production mode."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.is_production = True
            setup_logging()  # must not raise

    def test_marks_structlog_as_configured(self) -> None:
        """After setup_logging(), structlog.is_configured() returns True in production."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.is_production = True
            setup_logging()
        assert structlog.is_configured() is True

    def test_production_mode_uses_json_renderer(self) -> None:
        """In production the last processor must be a JSONRenderer."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.is_production = True
            setup_logging()
        processors = list(structlog.get_config()["processors"])
        assert isinstance(processors[-1], structlog.processors.JSONRenderer)

    def test_production_mode_does_not_use_console_renderer(self) -> None:
        """In production the processor chain must not contain a ConsoleRenderer."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "WARNING"
            mock_settings.is_production = True
            setup_logging()
        processors = list(structlog.get_config()["processors"])
        types = [type(p) for p in processors]
        assert structlog.dev.ConsoleRenderer not in types

    def test_processor_chain_includes_add_log_level(self) -> None:
        """The processor chain includes add_log_level in production mode."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.is_production = True
            setup_logging()
        processors = list(structlog.get_config()["processors"])
        assert structlog.processors.add_log_level in processors

    def test_processor_chain_includes_timestamper(self) -> None:
        """The processor chain includes a TimeStamper in production mode."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.is_production = True
            setup_logging()
        processors = list(structlog.get_config()["processors"])
        assert any(isinstance(p, structlog.processors.TimeStamper) for p in processors)

    def test_cache_logger_on_first_use_is_true(self) -> None:
        """setup_logging() sets cache_logger_on_first_use=True in production."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.is_production = True
            setup_logging()
        assert structlog.get_config()["cache_logger_on_first_use"] is True

    def test_context_class_is_dict(self) -> None:
        """setup_logging() configures dict as the context class in production."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.is_production = True
            setup_logging()
        assert structlog.get_config()["context_class"] is dict

    def test_logger_factory_is_print_logger_factory(self) -> None:
        """setup_logging() installs PrintLoggerFactory in production."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.is_production = True
            setup_logging()
        factory = structlog.get_config()["logger_factory"]
        assert isinstance(factory, structlog.PrintLoggerFactory)


# ---------------------------------------------------------------------------
# setup_logging() → get_logger() integration
# ---------------------------------------------------------------------------


class TestSetupLoggingThenGetLogger:
    """Verify that a logger obtained after setup_logging() is usable."""

    def setup_method(self) -> None:
        _reset_structlog()

    def teardown_method(self) -> None:
        _reset_structlog()

    def test_logger_usable_after_dev_setup(self) -> None:
        """A logger obtained after dev setup_logging() exposes log level methods."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.is_production = False
            setup_logging()
        logger = get_logger("integration.dev")
        assert isinstance(logger, BoundLoggerLazyProxy)
        assert callable(getattr(logger, "info", None))

    def test_logger_usable_after_production_setup(self) -> None:
        """A logger obtained after production setup_logging() exposes log level methods."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "INFO"
            mock_settings.is_production = True
            setup_logging()
        logger = get_logger("integration.prod")
        assert isinstance(logger, BoundLoggerLazyProxy)
        assert callable(getattr(logger, "warning", None))

    def test_second_setup_logging_call_reconfigures(self) -> None:
        """Calling setup_logging() twice does not raise — it just reconfigures."""
        with patch("app.core.logging.settings") as mock_settings:
            mock_settings.log_level = "DEBUG"
            mock_settings.is_production = False
            setup_logging()
            setup_logging()  # second call must not raise
        assert structlog.is_configured() is True
