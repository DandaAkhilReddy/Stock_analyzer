"""Azure OpenAI provider — thin wrapper around the AsyncAzureOpenAI client."""
from __future__ import annotations

import json
import re
from typing import Any

from openai import AsyncAzureOpenAI

from app.core.config import settings
from app.core.exceptions import AIAnalysisError
from app.core.logging import get_logger

logger = get_logger(__name__)

_JSON_BLOCK_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)```")


def _extract_json(text: str) -> str:
    """Extract JSON from text that may contain markdown code fences."""
    match = _JSON_BLOCK_RE.search(text)
    if match:
        return match.group(1).strip()
    text = text.strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


class OpenAIProvider:
    """Manages the Azure OpenAI client and chat completion calls."""

    def __init__(self) -> None:
        self._client = AsyncAzureOpenAI(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        )
        self._deployment = settings.azure_openai_deployment

    async def chat_completion_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 16000,
    ) -> dict[str, Any]:
        """Send a chat completion request and parse the JSON response.

        Kimi K2.5 does not support ``response_format=json_object``, so we
        extract JSON from the raw text response instead.

        Args:
            system_prompt: System message content.
            user_prompt: User message content.
            temperature: Sampling temperature (lower = more deterministic).
            max_tokens: Maximum tokens allowed in the assistant response.

        Returns:
            Parsed JSON dict from the assistant's response.

        Raises:
            AIAnalysisError: If the API call fails or the response cannot be
                decoded as valid JSON.
        """
        try:
            response = await self._client.chat.completions.create(
                model=self._deployment,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=120.0,
            )
        except Exception as exc:
            logger.error("openai_api_error", error=str(exc))
            raise AIAnalysisError(f"API call failed: {exc}") from exc

        content = response.choices[0].message.content
        if not content:
            raise AIAnalysisError("Empty response from AI model")

        logger.debug("openai_raw_response", content_length=len(content))

        json_str = _extract_json(content)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as exc:
            logger.error(
                "openai_json_parse_error",
                content=content[:500],
                extracted=json_str[:500],
            )
            raise AIAnalysisError(f"Invalid JSON response: {exc}") from exc
