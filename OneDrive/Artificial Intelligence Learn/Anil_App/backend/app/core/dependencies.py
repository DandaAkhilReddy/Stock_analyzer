"""FastAPI dependency providers for injected application-level objects."""
from __future__ import annotations

from app.core.config import Settings, settings


def get_settings() -> Settings:
    """Dependency that returns the global Settings instance.

    Intended for use with ``Depends(get_settings)`` in route handlers so
    that settings can be overridden in tests.
    """
    return settings
