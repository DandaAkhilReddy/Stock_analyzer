"""Tests for app.core.dependencies — FastAPI dependency providers."""
from __future__ import annotations

from app.core.config import Settings, settings
from app.core.dependencies import get_settings


class TestGetSettings:
    def test_returns_settings_instance(self) -> None:
        """get_settings() must return a Settings object."""
        result = get_settings()
        assert isinstance(result, Settings)

    def test_returns_global_singleton(self) -> None:
        """get_settings() must return the same object as the module-level singleton."""
        result = get_settings()
        assert result is settings

    def test_idempotent_across_calls(self) -> None:
        """Multiple calls return the identical object (singleton, not new instances)."""
        first = get_settings()
        second = get_settings()
        assert first is second

    def test_returned_settings_has_required_attributes(self) -> None:
        """The returned Settings object exposes the expected public interface."""
        result = get_settings()
        assert hasattr(result, "azure_openai_endpoint")
        assert hasattr(result, "azure_openai_api_key")
        assert hasattr(result, "environment")
        assert hasattr(result, "log_level")
        assert hasattr(result, "cors_origins")
