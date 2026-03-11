"""Structlog configuration for the Stock Analyzer application."""
from __future__ import annotations

import logging

import structlog

from app.core.config import settings


def setup_logging() -> None:
    """Configure structlog processors.

    Uses ConsoleRenderer in development and JSONRenderer in production so
    that log aggregators (e.g. Azure Monitor) can parse structured output.
    """
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
    ]

    if settings.is_production:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Return a bound structlog logger tagged with the given name.

    Args:
        name: Typically ``__name__`` of the calling module.

    Returns:
        A structlog BoundLogger instance.
    """
    return structlog.get_logger(name)
