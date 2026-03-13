"""Azure AI Foundry SharePoint agent — research enrichment via Responses API."""
from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_TIMEOUT = 60.0

_RESEARCH_PROMPT = (
    "Research {company_name} ({ticker}): recent news, SEC filings, "
    "analyst sentiment, competitive landscape, key risks. "
    "Provide a concise summary with sources."
)


class SharePointAgentProvider:
    """Calls the Azure AI Foundry SharePoint agent via Responses API.

    The agent has Web Search + Knowledge grounding and returns
    research context that enriches the GPT 5.3 qualitative analysis.
    """

    def __init__(
        self,
        endpoint: str | None = None,
        api_key: str | None = None,
    ) -> None:
        """Initialise with Responses API endpoint and auth key.

        Args:
            endpoint: Full Responses API URL (including api-version).
            api_key: Azure API key (reuses Azure OpenAI key by default).
        """
        self._endpoint = endpoint or settings.sharepoint_agent_endpoint
        self._api_key = api_key or settings.azure_openai_api_key

    async def research_company(
        self, ticker: str, company_name: str
    ) -> tuple[str, list[str]]:
        """Ask the agent to research a company.

        Args:
            ticker: Stock ticker symbol (e.g. "AAPL").
            company_name: Full company name (e.g. "Apple Inc.").

        Returns:
            Tuple of (research_text, source_urls). On failure returns
            ("", []) so the caller is never blocked.
        """
        if not self._endpoint:
            logger.debug("sharepoint_agent_skipped", reason="no endpoint configured")
            return "", []

        prompt = _RESEARCH_PROMPT.format(
            company_name=company_name, ticker=ticker
        )
        logger.info(
            "sharepoint_research_start", ticker=ticker, company=company_name
        )

        try:
            result = await self._call_responses_api(prompt)
        except Exception as exc:
            logger.warning(
                "sharepoint_research_failed",
                ticker=ticker,
                error=str(exc),
            )
            return "", []

        text, sources = self._parse_response(result)
        logger.info(
            "sharepoint_research_complete",
            ticker=ticker,
            text_length=len(text),
            sources_count=len(sources),
        )
        return text, sources

    async def _call_responses_api(self, prompt: str) -> dict[str, Any]:
        """Send a request to the Azure AI Foundry Responses API.

        Args:
            prompt: The research prompt to send.

        Returns:
            Parsed JSON response dict.

        Raises:
            httpx.HTTPError: On network/timeout errors.
        """
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {"input": prompt}

        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                self._endpoint,
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    def _parse_response(data: dict[str, Any]) -> tuple[str, list[str]]:
        """Extract text and sources from the Responses API output.

        Expected shape::

            {
              "output": [
                {
                  "type": "message",
                  "content": [{"type": "text", "text": "..."}]
                }
              ]
            }

        Args:
            data: Raw JSON response from the agent.

        Returns:
            Tuple of (combined_text, source_urls).
        """
        texts: list[str] = []
        sources: list[str] = []

        for output_item in data.get("output", []):
            # Extract text from message content blocks
            for content_block in output_item.get("content", []):
                if content_block.get("type") == "text":
                    texts.append(content_block.get("text", ""))

            # Extract annotations/sources if present
            for content_block in output_item.get("content", []):
                for annotation in content_block.get("annotations", []):
                    url = annotation.get("url", "")
                    if url and url not in sources:
                        sources.append(url)

        return "\n\n".join(texts).strip(), sources
