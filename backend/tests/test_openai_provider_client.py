"""Tests for OpenAIProvider.chat_completion_json.

Covers:
- Successful JSON parse from a plain response
- Successful JSON parse from a markdown-fenced response
- APIcall exception → AIAnalysisError
- Empty content (empty string) → AIAnalysisError
- None content → AIAnalysisError
- Non-JSON content that cannot be decoded → AIAnalysisError
- Correct temperature forwarded to create()
- Correct max_tokens forwarded to create()
- Correct deployment model name used
- Correct message structure (system + user roles) passed to create()
- Default temperature and max_tokens used when not supplied
"""
from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.exceptions import AIAnalysisError
from app.providers.openai_provider import OpenAIProvider

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_DEPLOYMENT = "test-deployment-model"


def _make_response(content: str | None) -> MagicMock:
    """Build a fake openai ChatCompletion response with a single choice."""
    message = MagicMock()
    message.content = content

    choice = MagicMock()
    choice.message = message

    response = MagicMock()
    response.choices = [choice]
    return response


def _make_provider() -> tuple[OpenAIProvider, AsyncMock]:
    """Instantiate OpenAIProvider with the AsyncAzureOpenAI client fully mocked.

    Returns the provider instance and the mock ``create`` coroutine so tests
    can configure return values and assert call arguments.
    """
    with patch("app.providers.openai_provider.AsyncAzureOpenAI"), patch(
        "app.providers.openai_provider.settings"
    ) as mock_settings:
        mock_settings.azure_openai_endpoint = "https://fake.openai.azure.com/"
        mock_settings.azure_openai_api_key = "fake-key"
        mock_settings.azure_openai_api_version = "2024-05-01-preview"
        mock_settings.azure_openai_deployment = _DEPLOYMENT

        provider = OpenAIProvider()

    create_mock = AsyncMock()
    provider._client.chat.completions.create = create_mock
    return provider, create_mock


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


class TestChatCompletionJsonSuccess:
    @pytest.mark.asyncio
    async def test_returns_dict_from_plain_json_response(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"score": 42, "label": "buy"}')

        result = await provider.chat_completion_json("sys", "usr")

        assert result == {"score": 42, "label": "buy"}

    @pytest.mark.asyncio
    async def test_returns_dict_from_fenced_json_response(self) -> None:
        provider, create_mock = _make_provider()
        fenced = '```json\n{"status": "ok", "value": 1}\n```'
        create_mock.return_value = _make_response(fenced)

        result = await provider.chat_completion_json("sys", "usr")

        assert result == {"status": "ok", "value": 1}

    @pytest.mark.asyncio
    async def test_returns_nested_dict(self) -> None:
        provider, create_mock = _make_provider()
        payload: dict[str, Any] = {"outer": {"inner": [1, 2, 3]}, "flag": True}
        import json

        create_mock.return_value = _make_response(json.dumps(payload))

        result = await provider.chat_completion_json("sys", "usr")

        assert result == payload

    @pytest.mark.asyncio
    async def test_returns_dict_when_json_surrounded_by_prose(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response(
            'Here is the analysis: {"rating": 5} Hope that helps!'
        )

        result = await provider.chat_completion_json("sys", "usr")

        assert result == {"rating": 5}


# ---------------------------------------------------------------------------
# API call failure
# ---------------------------------------------------------------------------


class TestChatCompletionJsonAPIError:
    @pytest.mark.asyncio
    async def test_raises_ai_analysis_error_on_api_exception(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.side_effect = RuntimeError("connection timeout")

        with pytest.raises(AIAnalysisError, match="API call failed"):
            await provider.chat_completion_json("sys", "usr")

    @pytest.mark.asyncio
    async def test_original_exception_is_chained(self) -> None:
        provider, create_mock = _make_provider()
        original = ValueError("bad request")
        create_mock.side_effect = original

        with pytest.raises(AIAnalysisError) as exc_info:
            await provider.chat_completion_json("sys", "usr")

        assert exc_info.value.__cause__ is original

    @pytest.mark.asyncio
    async def test_raises_ai_analysis_error_on_network_ioerror(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.side_effect = IOError("network unreachable")

        with pytest.raises(AIAnalysisError, match="API call failed"):
            await provider.chat_completion_json("sys", "usr")

    @pytest.mark.asyncio
    async def test_error_message_contains_original_text(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.side_effect = Exception("quota exceeded")

        with pytest.raises(AIAnalysisError, match="quota exceeded"):
            await provider.chat_completion_json("sys", "usr")


# ---------------------------------------------------------------------------
# Empty / None content
# ---------------------------------------------------------------------------


class TestChatCompletionJsonEmptyContent:
    @pytest.mark.asyncio
    async def test_raises_ai_analysis_error_for_empty_string_content(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response("")

        with pytest.raises(AIAnalysisError, match="Empty response from AI model"):
            await provider.chat_completion_json("sys", "usr")

    @pytest.mark.asyncio
    async def test_raises_ai_analysis_error_for_none_content(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response(None)

        with pytest.raises(AIAnalysisError, match="Empty response from AI model"):
            await provider.chat_completion_json("sys", "usr")


# ---------------------------------------------------------------------------
# Invalid JSON
# ---------------------------------------------------------------------------


class TestChatCompletionJsonInvalidJSON:
    """Invalid JSON tests — provider retries once, so mock returns bad JSON twice."""

    @pytest.mark.asyncio
    async def test_raises_ai_analysis_error_for_plain_text(self) -> None:
        provider, create_mock = _make_provider()
        bad = _make_response("I cannot provide analysis right now.")
        create_mock.side_effect = [bad, bad]

        with pytest.raises(AIAnalysisError, match="Invalid JSON response"):
            await provider.chat_completion_json("sys", "usr")

    @pytest.mark.asyncio
    async def test_raises_ai_analysis_error_for_truncated_json(self) -> None:
        provider, create_mock = _make_provider()
        bad = _make_response('{"key": "val')  # unterminated
        create_mock.side_effect = [bad, bad]

        with pytest.raises(AIAnalysisError, match="Invalid JSON response"):
            await provider.chat_completion_json("sys", "usr")

    @pytest.mark.asyncio
    async def test_raises_ai_analysis_error_for_json_with_unbalanced_braces(self) -> None:
        provider, create_mock = _make_provider()
        bad = _make_response("{broken key: no quotes}")
        create_mock.side_effect = [bad, bad]

        with pytest.raises(AIAnalysisError, match="Invalid JSON response"):
            await provider.chat_completion_json("sys", "usr")

    @pytest.mark.asyncio
    async def test_original_json_decode_error_is_chained(self) -> None:
        provider, create_mock = _make_provider()
        bad = _make_response("not json at all !!!")
        create_mock.side_effect = [bad, bad]

        with pytest.raises(AIAnalysisError) as exc_info:
            await provider.chat_completion_json("sys", "usr")

        import json

        assert isinstance(exc_info.value.__cause__, json.JSONDecodeError)

    @pytest.mark.asyncio
    async def test_retries_once_on_json_failure(self) -> None:
        provider, create_mock = _make_provider()
        bad = _make_response("not json")
        good = _make_response('{"ok": true}')
        create_mock.side_effect = [bad, good]

        result = await provider.chat_completion_json("sys", "usr")

        assert result == {"ok": True}
        assert create_mock.call_count == 2

    @pytest.mark.asyncio
    async def test_repairs_trailing_comma(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"a": 1, "b": 2,}')

        result = await provider.chat_completion_json("sys", "usr")

        assert result == {"a": 1, "b": 2}

    @pytest.mark.asyncio
    async def test_repairs_js_comments(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response(
            '{"a": 1, // this is a comment\n"b": 2}'
        )

        result = await provider.chat_completion_json("sys", "usr")

        assert result == {"a": 1, "b": 2}


# ---------------------------------------------------------------------------
# Call arguments forwarded to create()
# ---------------------------------------------------------------------------


class TestChatCompletionJsonCallArguments:
    @pytest.mark.asyncio
    async def test_uses_configured_deployment_as_model(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"ok": true}')

        await provider.chat_completion_json("sys", "usr")

        _, kwargs = create_mock.call_args
        assert kwargs["model"] == _DEPLOYMENT

    @pytest.mark.asyncio
    async def test_temperature_not_sent_to_api(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"ok": true}')

        await provider.chat_completion_json("sys", "usr", temperature=0.9)

        _, kwargs = create_mock.call_args
        assert "temperature" not in kwargs

    @pytest.mark.asyncio
    async def test_passes_custom_max_tokens(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"ok": true}')

        await provider.chat_completion_json("sys", "usr", max_tokens=512)

        _, kwargs = create_mock.call_args
        assert kwargs["max_completion_tokens"] == 512

    @pytest.mark.asyncio
    async def test_default_call_omits_temperature(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"ok": true}')

        await provider.chat_completion_json("sys", "usr")

        _, kwargs = create_mock.call_args
        assert "temperature" not in kwargs

    @pytest.mark.asyncio
    async def test_default_max_tokens_is_16000(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"ok": true}')

        await provider.chat_completion_json("sys", "usr")

        _, kwargs = create_mock.call_args
        assert kwargs["max_completion_tokens"] == 16000

    @pytest.mark.asyncio
    async def test_messages_contain_system_role(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"ok": true}')

        await provider.chat_completion_json("You are a helper.", "Tell me something.")

        _, kwargs = create_mock.call_args
        messages: list[dict[str, str]] = kwargs["messages"]
        system_msgs = [m for m in messages if m["role"] == "system"]
        assert len(system_msgs) == 1
        assert system_msgs[0]["content"] == "You are a helper."

    @pytest.mark.asyncio
    async def test_messages_contain_user_role(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"ok": true}')

        await provider.chat_completion_json("You are a helper.", "Tell me something.")

        _, kwargs = create_mock.call_args
        messages: list[dict[str, str]] = kwargs["messages"]
        user_msgs = [m for m in messages if m["role"] == "user"]
        assert len(user_msgs) == 1
        assert user_msgs[0]["content"] == "Tell me something."

    @pytest.mark.asyncio
    async def test_messages_order_is_system_then_user(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"ok": true}')

        await provider.chat_completion_json("SYSTEM", "USER")

        _, kwargs = create_mock.call_args
        messages: list[dict[str, str]] = kwargs["messages"]
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"

    @pytest.mark.asyncio
    async def test_response_format_is_json_object(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"ok": true}')

        await provider.chat_completion_json("sys", "usr")

        _, kwargs = create_mock.call_args
        assert kwargs["response_format"] == {"type": "json_object"}

    @pytest.mark.asyncio
    async def test_timeout_is_180_seconds(self) -> None:
        provider, create_mock = _make_provider()
        create_mock.return_value = _make_response('{"ok": true}')

        await provider.chat_completion_json("sys", "usr")

        _, kwargs = create_mock.call_args
        assert kwargs["timeout"] == pytest.approx(180.0)
