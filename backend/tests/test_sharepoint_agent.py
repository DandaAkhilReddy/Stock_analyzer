"""Tests for SharePointAgentProvider — Azure AI Foundry Responses API client."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.providers.sharepoint_agent import SharePointAgentProvider


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

FAKE_ENDPOINT = "https://example.com/api/responses?api-version=2025-11-15-preview"
FAKE_KEY = "test-api-key-123"


@pytest.fixture()
def provider() -> SharePointAgentProvider:
    """Return a provider with fake credentials."""
    return SharePointAgentProvider(endpoint=FAKE_ENDPOINT, api_key=FAKE_KEY)


@pytest.fixture()
def provider_no_endpoint() -> SharePointAgentProvider:
    """Return a provider with no endpoint configured."""
    return SharePointAgentProvider(endpoint="", api_key=FAKE_KEY)


# ---------------------------------------------------------------------------
# _parse_response
# ---------------------------------------------------------------------------


class TestParseResponse:
    """Tests for static response parsing logic."""

    def test_extracts_text_from_standard_response(self) -> None:
        data = {
            "id": "resp_123",
            "output": [
                {
                    "type": "message",
                    "content": [
                        {"type": "text", "text": "Apple Inc. is performing well."}
                    ],
                }
            ],
        }
        text, sources = SharePointAgentProvider._parse_response(data)
        assert text == "Apple Inc. is performing well."
        assert sources == []

    def test_extracts_multiple_text_blocks(self) -> None:
        data = {
            "output": [
                {
                    "type": "message",
                    "content": [
                        {"type": "text", "text": "First paragraph."},
                        {"type": "text", "text": "Second paragraph."},
                    ],
                }
            ],
        }
        text, sources = SharePointAgentProvider._parse_response(data)
        assert "First paragraph." in text
        assert "Second paragraph." in text

    def test_extracts_annotations_as_sources(self) -> None:
        data = {
            "output": [
                {
                    "type": "message",
                    "content": [
                        {
                            "type": "text",
                            "text": "Research summary.",
                            "annotations": [
                                {"url": "https://example.com/article1"},
                                {"url": "https://example.com/article2"},
                            ],
                        }
                    ],
                }
            ],
        }
        text, sources = SharePointAgentProvider._parse_response(data)
        assert text == "Research summary."
        assert sources == [
            "https://example.com/article1",
            "https://example.com/article2",
        ]

    def test_deduplicates_source_urls(self) -> None:
        data = {
            "output": [
                {
                    "type": "message",
                    "content": [
                        {
                            "type": "text",
                            "text": "Summary.",
                            "annotations": [
                                {"url": "https://example.com/same"},
                                {"url": "https://example.com/same"},
                            ],
                        }
                    ],
                }
            ],
        }
        _, sources = SharePointAgentProvider._parse_response(data)
        assert sources == ["https://example.com/same"]

    def test_empty_output_returns_empty(self) -> None:
        text, sources = SharePointAgentProvider._parse_response({"output": []})
        assert text == ""
        assert sources == []

    def test_missing_output_key_returns_empty(self) -> None:
        text, sources = SharePointAgentProvider._parse_response({})
        assert text == ""
        assert sources == []

    def test_empty_content_blocks(self) -> None:
        data = {"output": [{"type": "message", "content": []}]}
        text, sources = SharePointAgentProvider._parse_response(data)
        assert text == ""
        assert sources == []

    def test_annotations_without_url_ignored(self) -> None:
        data = {
            "output": [
                {
                    "type": "message",
                    "content": [
                        {
                            "type": "text",
                            "text": "Text.",
                            "annotations": [{"title": "no url here"}],
                        }
                    ],
                }
            ],
        }
        _, sources = SharePointAgentProvider._parse_response(data)
        assert sources == []

    def test_multiple_output_items(self) -> None:
        data = {
            "output": [
                {
                    "type": "message",
                    "content": [{"type": "text", "text": "Part 1."}],
                },
                {
                    "type": "message",
                    "content": [{"type": "text", "text": "Part 2."}],
                },
            ],
        }
        text, sources = SharePointAgentProvider._parse_response(data)
        assert "Part 1." in text
        assert "Part 2." in text


# ---------------------------------------------------------------------------
# research_company — no endpoint configured
# ---------------------------------------------------------------------------


class TestNoEndpoint:
    """Tests when no endpoint is configured — should skip gracefully."""

    @pytest.mark.asyncio()
    async def test_returns_empty_when_no_endpoint(
        self, provider_no_endpoint: SharePointAgentProvider
    ) -> None:
        text, sources = await provider_no_endpoint.research_company("AAPL", "Apple Inc.")
        assert text == ""
        assert sources == []


# ---------------------------------------------------------------------------
# research_company — success path
# ---------------------------------------------------------------------------


class TestResearchCompanySuccess:
    """Tests for successful API calls."""

    @pytest.mark.asyncio()
    async def test_success_returns_text_and_sources(
        self, provider: SharePointAgentProvider
    ) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "output": [
                {
                    "type": "message",
                    "content": [
                        {
                            "type": "text",
                            "text": "Apple is a major tech company.",
                            "annotations": [
                                {"url": "https://reuters.com/apple"},
                            ],
                        }
                    ],
                }
            ],
        }

        with patch("app.providers.sharepoint_agent.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            text, sources = await provider.research_company("AAPL", "Apple Inc.")

        assert text == "Apple is a major tech company."
        assert sources == ["https://reuters.com/apple"]

    @pytest.mark.asyncio()
    async def test_sends_correct_headers_and_payload(
        self, provider: SharePointAgentProvider
    ) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"output": []}

        with patch("app.providers.sharepoint_agent.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            await provider.research_company("MSFT", "Microsoft Corporation")

        call_args = mock_client.post.call_args
        assert call_args[0][0] == FAKE_ENDPOINT
        headers = call_args[1]["headers"]
        assert headers["Authorization"] == f"Bearer {FAKE_KEY}"
        assert headers["Content-Type"] == "application/json"
        payload = call_args[1]["json"]
        assert "MSFT" in payload["input"]
        assert "Microsoft Corporation" in payload["input"]


# ---------------------------------------------------------------------------
# research_company — failure paths (graceful fallback)
# ---------------------------------------------------------------------------


class TestResearchCompanyFailure:
    """Tests that failures return empty strings, never raise."""

    @pytest.mark.asyncio()
    async def test_timeout_returns_empty(
        self, provider: SharePointAgentProvider
    ) -> None:
        with patch("app.providers.sharepoint_agent.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(side_effect=httpx.TimeoutException("timeout"))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            text, sources = await provider.research_company("AAPL", "Apple Inc.")

        assert text == ""
        assert sources == []

    @pytest.mark.asyncio()
    async def test_network_error_returns_empty(
        self, provider: SharePointAgentProvider
    ) -> None:
        with patch("app.providers.sharepoint_agent.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(
                side_effect=httpx.ConnectError("connection refused")
            )
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            text, sources = await provider.research_company("AAPL", "Apple Inc.")

        assert text == ""
        assert sources == []

    @pytest.mark.asyncio()
    async def test_http_500_returns_empty(
        self, provider: SharePointAgentProvider
    ) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status = MagicMock(
            side_effect=httpx.HTTPStatusError(
                "Server Error",
                request=MagicMock(),
                response=mock_response,
            )
        )

        with patch("app.providers.sharepoint_agent.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            text, sources = await provider.research_company("AAPL", "Apple Inc.")

        assert text == ""
        assert sources == []

    @pytest.mark.asyncio()
    async def test_malformed_json_returns_empty(
        self, provider: SharePointAgentProvider
    ) -> None:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.side_effect = ValueError("bad json")

        with patch("app.providers.sharepoint_agent.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            text, sources = await provider.research_company("AAPL", "Apple Inc.")

        assert text == ""
        assert sources == []

    @pytest.mark.asyncio()
    async def test_unexpected_exception_returns_empty(
        self, provider: SharePointAgentProvider
    ) -> None:
        with patch("app.providers.sharepoint_agent.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(side_effect=RuntimeError("unexpected"))
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            text, sources = await provider.research_company("AAPL", "Apple Inc.")

        assert text == ""
        assert sources == []
