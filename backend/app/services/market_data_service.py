"""Market data service — fetches real prices from Financial Modeling Prep API."""
from __future__ import annotations

import math

import httpx

from app.core.config import settings
from app.core.exceptions import ExternalAPIError, StockNotFoundError
from app.core.logging import get_logger
from app.models.analysis import HistoricalPrice, TechnicalSnapshot

logger = get_logger(__name__)

_FMP_BASE = "https://financialmodelingprep.com/stable"
_TIMEOUT = 30.0

# Local mapping for common company names → ticker symbols.
# Avoids hitting FMP's premium /search-name endpoint for well-known names.
_COMMON_TICKERS: dict[str, str] = {
    "GOOGLE": "GOOGL",
    "ALPHABET": "GOOGL",
    "AMAZON": "AMZN",
    "FACEBOOK": "META",
    "MICROSOFT": "MSFT",
    "NVIDIA": "NVDA",
    "NETFLIX": "NFLX",
    "BERKSHIRE": "BRK-B",
    "JPMORGAN": "JPM",
    "WALMART": "WMT",
    "MASTERCARD": "MA",
    "SALESFORCE": "CRM",
    "COINBASE": "COIN",
    "PALANTIR": "PLTR",
    "SNOWFLAKE": "SNOW",
    "SPOTIFY": "SPOT",
    "PINTEREST": "PINS",
    "SNAPCHAT": "SNAP",
    "AIRBNB": "ABNB",
    "CROWDSTRIKE": "CRWD",
    "DATADOG": "DDOG",
    "SHOPIFY": "SHOP",
    "CLOUDFLARE": "NET",
    "SQUARE": "SQ",
    "ROBINHOOD": "HOOD",
}


def _format_market_cap(value: float | None) -> str | None:
    """Format market cap number to human-readable string (e.g. '2.8T')."""
    if value is None:
        return None
    if value >= 1e12:
        return f"{value / 1e12:.1f}T"
    if value >= 1e9:
        return f"{value / 1e9:.1f}B"
    if value >= 1e6:
        return f"{value / 1e6:.1f}M"
    return str(int(value))


def _safe_float(value: object) -> float | None:
    """Return float if value is a valid number, else None."""
    if value is None:
        return None
    try:
        f = float(value)  # type: ignore[arg-type]
        return None if math.isnan(f) or math.isinf(f) else f
    except (TypeError, ValueError):
        return None


def _date_to_quarter(date_str: str) -> str:
    """Convert FMP date string to quarter label: '2025-03-31' → 'Q1 2025'."""
    try:
        month = int(date_str.split("-")[1])
        year = date_str.split("-")[0]
        quarter = (month - 1) // 3 + 1
        return f"Q{quarter} {year}"
    except (IndexError, ValueError):
        return date_str


def _classify_sentiment(raw: str) -> str:
    """Normalize FMP sentiment to our enum."""
    raw_lower = (raw or "").lower().strip()
    if raw_lower in ("positive", "bullish"):
        return "positive"
    if raw_lower in ("negative", "bearish"):
        return "negative"
    return "neutral"


def _safe_int(value: object) -> int | None:
    """Return int if value is a valid number, else None."""
    if value is None:
        return None
    try:
        f = float(value)  # type: ignore[arg-type]
        return None if math.isnan(f) or math.isinf(f) else int(f)
    except (TypeError, ValueError):
        return None


class MarketDataService:
    """Fetches real-time quotes and historical OHLC from FMP API."""

    def __init__(self) -> None:
        self._api_key = settings.fmp_api_key

    def _params(self, **extra: object) -> dict[str, object]:
        """Build query params with API key."""
        return {"apikey": self._api_key, **extra}

    async def _get_json(self, url: str, params: dict[str, object]) -> list | dict:
        """Make an authenticated GET request to FMP and return JSON.

        Args:
            url: Full FMP API URL.
            params: Query parameters (apikey included).

        Returns:
            Parsed JSON response.

        Raises:
            ExternalAPIError: On network/timeout/HTTP errors.
        """
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            try:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                return resp.json()
            except httpx.TimeoutException as exc:
                raise ExternalAPIError(
                    "FMP API", f"Request timed out: {url}"
                ) from exc
            except httpx.HTTPStatusError as exc:
                raise ExternalAPIError(
                    "FMP API",
                    f"HTTP {exc.response.status_code}: {exc.response.text[:200]}",
                ) from exc
            except httpx.HTTPError as exc:
                raise ExternalAPIError(
                    "FMP API", f"Request failed: {exc}"
                ) from exc

    async def resolve_ticker(self, query: str) -> str:
        """Resolve a company name or partial input to a ticker symbol.

        Short all-alpha strings (<=5 chars) are assumed to be tickers and
        returned as-is.  Longer or non-alpha inputs trigger an FMP search.

        Args:
            query: User input — ticker symbol or company name.

        Returns:
            Resolved uppercase ticker symbol.

        Raises:
            StockNotFoundError: If no matching symbol is found.
        """
        clean = query.upper().strip()
        if len(clean) <= 5 and clean.isalpha():
            return clean

        # Check local mapping before hitting FMP search (avoids 402 on free tier)
        local_match = _COMMON_TICKERS.get(clean)
        if local_match:
            logger.info("ticker_local_resolved", query=clean, symbol=local_match)
            return local_match

        logger.info("ticker_search_start", query=clean)
        try:
            results = await self._search_ticker(clean)
        except ExternalAPIError:
            raise StockNotFoundError(query)

        if not results:
            raise StockNotFoundError(query)

        symbol = results[0].get("symbol", "")
        if not symbol:
            raise StockNotFoundError(query)

        logger.info("ticker_search_resolved", query=clean, symbol=symbol)
        return symbol.upper()

    async def search_suggestions(self, query: str) -> list[dict[str, str]]:
        """Return lightweight search suggestions for autocomplete.

        Args:
            query: User input to search for.

        Returns:
            List of dicts with ``symbol`` and ``name`` keys.
        """
        results = await self._search_ticker(query.upper().strip())
        return [
            {"symbol": r.get("symbol", ""), "name": r.get("name", "")}
            for r in results
            if r.get("symbol")
        ]

    async def search_ticker(self, query: str) -> str:
        """Force an FMP search for the query (no fast-path skip).

        Used as a fallback when resolve_ticker's fast-path guess
        fails at the get_quote stage.

        Args:
            query: User input to search for.

        Returns:
            Resolved uppercase ticker symbol.

        Raises:
            StockNotFoundError: If no matching symbol is found.
        """
        clean = query.upper().strip()
        logger.info("ticker_fallback_search_start", query=clean)
        results = await self._search_ticker(clean)

        if not results:
            raise StockNotFoundError(query)

        symbol = results[0].get("symbol", "")
        if not symbol:
            raise StockNotFoundError(query)

        logger.info("ticker_fallback_search_resolved", query=clean, symbol=symbol)
        return symbol.upper()

    async def get_quote(self, ticker: str) -> dict:
        """Fetch current quote and company info for a ticker.

        Args:
            ticker: Stock ticker symbol (e.g. "AAPL").

        Returns:
            Dict with quote data keyed to StockAnalysisResponse fields.

        Raises:
            StockNotFoundError: If ticker is invalid or has no price data.
            ExternalAPIError: If FMP API is unreachable.
        """
        logger.info("fmp_quote_start", ticker=ticker)

        # Fetch quote and profile in parallel
        quote_data, profile_data = await self._fetch_quote_and_profile(ticker)

        current_price = _safe_float(quote_data.get("price"))
        if current_price is None:
            raise StockNotFoundError(ticker)

        logger.info("fmp_quote_complete", ticker=ticker, price=current_price)

        return {
            "ticker": (quote_data.get("symbol") or ticker).upper(),
            "company_name": (
                profile_data.get("companyName")
                or quote_data.get("name")
                or ticker
            ),
            "current_price": current_price,
            "previous_close": _safe_float(quote_data.get("previousClose")),
            "open": _safe_float(quote_data.get("open")),
            "day_high": _safe_float(quote_data.get("dayHigh")),
            "day_low": _safe_float(quote_data.get("dayLow")),
            "volume": _safe_int(quote_data.get("volume")),
            "market_cap": _format_market_cap(
                _safe_float(quote_data.get("marketCap"))
            ),
            "pe_ratio": _safe_float(quote_data.get("pe")),
            "eps": _safe_float(quote_data.get("eps")),
            "week_52_high": _safe_float(quote_data.get("yearHigh")),
            "week_52_low": _safe_float(quote_data.get("yearLow")),
            "dividend_yield": _safe_float(
                profile_data.get("lastDiv")
            ),
            "sector": profile_data.get("sector", ""),
            "industry": profile_data.get("industry", ""),
            "headquarters": (
                f"{profile_data.get('city', '')}, "
                f"{profile_data.get('state', '')}, "
                f"{profile_data.get('country', '')}"
            ).strip(", "),
            "ceo": profile_data.get("ceo", ""),
            "founded": "",
            "employees": (
                f"{int(profile_data['fullTimeEmployees']):,}"
                if profile_data.get("fullTimeEmployees")
                else ""
            ),
            "company_description": profile_data.get("description", ""),
        }

    async def get_historical(
        self, ticker: str, period: str = "6mo"
    ) -> list[HistoricalPrice]:
        """Fetch historical OHLC data for charting.

        Args:
            ticker: Stock ticker symbol.
            period: Period string — mapped to FMP date range.

        Returns:
            List of HistoricalPrice sorted oldest-first.

        Raises:
            ExternalAPIError: If FMP API is unreachable.
        """
        logger.info("fmp_history_start", ticker=ticker, period=period)

        url = f"{_FMP_BASE}/historical-price-eod/full"
        data = await self._get_json(
            url, self._params(symbol=ticker, **{"from": "1980-01-01"})
        )

        # FMP /stable/ returns a flat array (newest-first)
        historical = data if isinstance(data, list) else []

        # Reverse for oldest-first
        rows: list[HistoricalPrice] = []
        for item in reversed(historical):
            rows.append(
                HistoricalPrice(
                    date=item["date"],
                    open=round(float(item["open"]), 2),
                    high=round(float(item["high"]), 2),
                    low=round(float(item["low"]), 2),
                    close=round(float(item["close"]), 2),
                    volume=_safe_int(item.get("volume")),
                )
            )

        logger.info("fmp_history_complete", ticker=ticker, rows=len(rows))
        return rows

    async def get_technicals(
        self, ticker: str, period: str = "1y"
    ) -> TechnicalSnapshot:
        """Compute technical indicators from historical data.

        Fetches historical data and computes SMA, EMA, RSI, MACD,
        and Bollinger Bands locally.

        Args:
            ticker: Stock ticker symbol.
            period: Not used for FMP — always fetches enough data.

        Returns:
            TechnicalSnapshot with computed indicator values.
        """
        logger.info("fmp_technicals_start", ticker=ticker)
        try:
            snapshot = await self._compute_technicals(ticker)
        except Exception as exc:
            logger.warning(
                "fmp_technicals_failed", ticker=ticker, error=str(exc)
            )
            return TechnicalSnapshot()

        logger.info("fmp_technicals_complete", ticker=ticker)
        return snapshot

    async def get_income_statement(
        self, ticker: str, limit: int = 8
    ) -> list[dict]:
        """Fetch quarterly income statement data from FMP.

        Args:
            ticker: Stock ticker symbol (e.g. "AAPL").
            limit: Number of quarters to fetch from FMP (default 8, to allow
                   YoY comparison).

        Returns:
            List of dicts with: quarter, revenue, net_income, eps,
            yoy_revenue_growth — most recent first, capped to 4 entries.

        Raises:
            ExternalAPIError: If FMP API is unreachable.
        """
        logger.info("fmp_income_statement_start", ticker=ticker)
        url = f"{_FMP_BASE}/income-statement"
        data = await self._get_json(
            url, self._params(symbol=ticker, period="quarter", limit=limit)
        )
        rows = data if isinstance(data, list) else []
        logger.info(
            "fmp_income_raw",
            ticker=ticker,
            raw_count=len(rows),
            dates=[r.get("date") for r in rows[:8]],
        )

        result: list[dict] = []
        for i, item in enumerate(rows):
            date_str = item.get("date", "")
            quarter_label = _date_to_quarter(date_str)

            revenue = item.get("revenue")
            net_income = item.get("netIncome")
            eps_val = item.get("eps")

            # YoY: compare with same quarter last year (4 entries back)
            yoy: float | None = None
            if i + 4 < len(rows) and revenue and rows[i + 4].get("revenue"):
                prev_rev = rows[i + 4]["revenue"]
                if prev_rev != 0:
                    yoy = round((revenue - prev_rev) / abs(prev_rev), 4)

            result.append({
                "quarter": quarter_label,
                "revenue": round(revenue / 1_000_000, 1) if revenue else None,
                "net_income": (
                    round(net_income / 1_000_000, 1) if net_income else None
                ),
                "eps": round(eps_val, 2) if eps_val is not None else None,
                "yoy_revenue_growth": yoy,
            })

        logger.info(
            "fmp_income_statement_complete", ticker=ticker, quarters=len(result[:4])
        )
        return result[:4]

    async def get_stock_news(self, ticker: str, limit: int = 15) -> list[dict]:
        """Fetch real stock news from FMP.

        Args:
            ticker: Stock ticker symbol (e.g. "AAPL").
            limit: Maximum number of articles to return.

        Returns:
            List of dicts with: title, source, sentiment, url,
            published_date, image_url.

        Raises:
            ExternalAPIError: If FMP API is unreachable.
        """
        logger.info("fmp_news_start", ticker=ticker)
        url = f"{_FMP_BASE}/stock_news"
        data = await self._get_json(
            url, self._params(tickers=ticker, limit=limit)
        )
        rows = data if isinstance(data, list) else []

        result: list[dict] = []
        for item in rows:
            title = item.get("title", "")
            if not title:
                continue
            result.append({
                "title": title,
                "source": item.get("site") or item.get("source"),
                "sentiment": _classify_sentiment(item.get("sentiment", "")),
                "url": item.get("url"),
                "published_date": item.get("publishedDate"),
                "image_url": item.get("image"),
            })

        logger.info("fmp_news_complete", ticker=ticker, articles=len(result))
        return result

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _search_ticker(self, query: str) -> list[dict]:
        """Search FMP for matching US ticker symbols.

        Foreign listings (symbols containing dots like TSLA.NE, MSFT.DE)
        are filtered out so only US exchange results are returned.
        """
        url = f"{_FMP_BASE}/search-name"
        data = await self._get_json(url, self._params(query=query, limit=10))
        results = data if isinstance(data, list) else []
        # US exchanges only — filter out foreign listings (symbols with dots)
        return [r for r in results if "." not in r.get("symbol", "")]

    async def _fetch_quote_and_profile(
        self, ticker: str
    ) -> tuple[dict, dict]:
        """Fetch quote and profile data in parallel."""
        quote_url = f"{_FMP_BASE}/quote"
        profile_url = f"{_FMP_BASE}/profile"

        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            try:
                quote_resp, profile_resp = await self._parallel_get(
                    client, quote_url, profile_url, ticker
                )
            except httpx.TimeoutException as exc:
                raise ExternalAPIError(
                    "FMP API", f"Quote request timed out for {ticker}"
                ) from exc
            except httpx.HTTPError as exc:
                raise ExternalAPIError(
                    "FMP API", f"Failed to fetch quote for {ticker}: {exc}"
                ) from exc

        quote_list = quote_resp.json()
        profile_list = profile_resp.json()

        quote_data = quote_list[0] if isinstance(quote_list, list) and quote_list else {}
        profile_data = (
            profile_list[0]
            if isinstance(profile_list, list) and profile_list
            else {}
        )
        return quote_data, profile_data

    async def _parallel_get(
        self,
        client: httpx.AsyncClient,
        url1: str,
        url2: str,
        ticker: str,
    ) -> tuple[httpx.Response, httpx.Response]:
        """Execute two GET requests in parallel."""
        import asyncio

        params = self._params(symbol=ticker)
        r1, r2 = await asyncio.gather(
            client.get(url1, params=params),
            client.get(url2, params=params),
        )
        r1.raise_for_status()
        r2.raise_for_status()
        return r1, r2

    async def _compute_technicals(self, ticker: str) -> TechnicalSnapshot:
        """Fetch 1-year history from FMP and compute technical indicators."""
        import pandas as pd

        url = f"{_FMP_BASE}/historical-price-eod/full"
        data = await self._get_json(url, self._params(symbol=ticker))
        historical = data if isinstance(data, list) else []

        if len(historical) < 20:
            return TechnicalSnapshot()

        # FMP returns newest-first — reverse for chronological order
        historical = list(reversed(historical))
        close = pd.Series([float(d["close"]) for d in historical])

        sma_20 = _safe_float(close.rolling(20).mean().iloc[-1])
        sma_50 = (
            _safe_float(close.rolling(50).mean().iloc[-1])
            if len(close) >= 50
            else None
        )
        sma_200 = (
            _safe_float(close.rolling(200).mean().iloc[-1])
            if len(close) >= 200
            else None
        )

        ema_12 = _safe_float(close.ewm(span=12).mean().iloc[-1])
        ema_26 = _safe_float(close.ewm(span=26).mean().iloc[-1])

        # RSI-14
        delta = close.diff()
        gain = delta.where(delta > 0, 0.0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0.0)).rolling(14).mean()
        rs = gain / loss.replace(0, float("nan"))
        rsi_series = 100 - (100 / (1 + rs))
        rsi_14 = _safe_float(rsi_series.iloc[-1])

        # MACD
        macd_line_val = None
        macd_signal_val = None
        macd_hist_val = None
        if ema_12 is not None and ema_26 is not None:
            macd_series = close.ewm(span=12).mean() - close.ewm(span=26).mean()
            signal_series = macd_series.ewm(span=9).mean()
            macd_line_val = _safe_float(macd_series.iloc[-1])
            macd_signal_val = _safe_float(signal_series.iloc[-1])
            if macd_line_val is not None and macd_signal_val is not None:
                macd_hist_val = round(macd_line_val - macd_signal_val, 4)

        # Bollinger Bands (20-period, 2 std)
        bb_middle = sma_20
        bb_std = _safe_float(close.rolling(20).std().iloc[-1])
        bb_upper = (
            round(bb_middle + 2 * bb_std, 2)
            if bb_middle is not None and bb_std is not None
            else None
        )
        bb_lower = (
            round(bb_middle - 2 * bb_std, 2)
            if bb_middle is not None and bb_std is not None
            else None
        )

        return TechnicalSnapshot(
            sma_20=round(sma_20, 2) if sma_20 else None,
            sma_50=round(sma_50, 2) if sma_50 else None,
            sma_200=round(sma_200, 2) if sma_200 else None,
            ema_12=round(ema_12, 2) if ema_12 else None,
            ema_26=round(ema_26, 2) if ema_26 else None,
            rsi_14=round(rsi_14, 2) if rsi_14 else None,
            macd_line=round(macd_line_val, 4) if macd_line_val else None,
            macd_signal=round(macd_signal_val, 4) if macd_signal_val else None,
            macd_histogram=macd_hist_val,
            bollinger_upper=bb_upper,
            bollinger_middle=round(bb_middle, 2) if bb_middle else None,
            bollinger_lower=bb_lower,
        )
