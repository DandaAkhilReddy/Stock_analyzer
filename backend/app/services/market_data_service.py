"""Market data service — fetches real prices from Yahoo Finance via yfinance."""
from __future__ import annotations

import asyncio
import math
from datetime import datetime, timezone

import yfinance as yf

from app.core.exceptions import ExternalAPIError, StockNotFoundError
from app.core.logging import get_logger
from app.models.analysis import HistoricalPrice, TechnicalSnapshot

logger = get_logger(__name__)

_YFINANCE_TIMEOUT = 30.0


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
    """Fetches real-time quotes and historical OHLC from Yahoo Finance."""

    async def resolve_ticker(self, query: str) -> str:
        """Resolve a company name or partial input to a ticker symbol.

        Short all-alpha strings (<=5 chars) are assumed to be tickers and
        returned as-is.  Longer or non-alpha inputs trigger a yfinance
        search to find the best matching ticker symbol.

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

        logger.info("ticker_search_start", query=clean)
        try:
            results = await asyncio.wait_for(
                asyncio.to_thread(self._search_ticker, clean),
                timeout=_YFINANCE_TIMEOUT,
            )
        except TimeoutError as exc:
            raise ExternalAPIError(
                "Yahoo Finance", f"Ticker search timed out for {clean}"
            ) from exc
        except Exception as exc:
            raise ExternalAPIError(
                "Yahoo Finance",
                f"Ticker search failed for {clean}: {exc}",
            ) from exc

        if not results:
            raise StockNotFoundError(query)

        symbol = results[0].get("symbol", "")
        if not symbol:
            raise StockNotFoundError(query)

        logger.info("ticker_search_resolved", query=clean, symbol=symbol)
        return symbol.upper()

    async def search_ticker(self, query: str) -> str:
        """Force a yfinance search for the query (no fast-path skip).

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
        try:
            results = await asyncio.wait_for(
                asyncio.to_thread(self._search_ticker, clean),
                timeout=_YFINANCE_TIMEOUT,
            )
        except TimeoutError as exc:
            raise ExternalAPIError(
                "Yahoo Finance",
                f"Ticker search timed out for {clean}",
            ) from exc
        except Exception as exc:
            raise ExternalAPIError(
                "Yahoo Finance",
                f"Ticker search failed for {clean}: {exc}",
            ) from exc

        if not results:
            raise StockNotFoundError(query)

        symbol = results[0].get("symbol", "")
        if not symbol:
            raise StockNotFoundError(query)

        logger.info(
            "ticker_fallback_search_resolved",
            query=clean,
            symbol=symbol,
        )
        return symbol.upper()

    async def get_quote(self, ticker: str) -> dict:
        """Fetch current quote and company info for a ticker.

        Args:
            ticker: Stock ticker symbol (e.g. "AAPL").

        Returns:
            Dict with quote data keyed to StockAnalysisResponse fields.

        Raises:
            StockNotFoundError: If ticker is invalid or has no price data.
            ExternalAPIError: If Yahoo Finance is unreachable.
        """
        logger.info("yfinance_quote_start", ticker=ticker)
        try:
            info = await asyncio.wait_for(
                asyncio.to_thread(self._fetch_info, ticker),
                timeout=_YFINANCE_TIMEOUT,
            )
        except TimeoutError as exc:
            raise ExternalAPIError(
                "Yahoo Finance", f"Quote request timed out for {ticker}"
            ) from exc
        except Exception as exc:
            raise ExternalAPIError(
                "Yahoo Finance", f"Failed to fetch quote for {ticker}: {exc}"
            ) from exc

        current_price = _safe_float(
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
        )
        if current_price is None:
            raise StockNotFoundError(ticker)

        hq_city = info.get("city", "")
        hq_state = info.get("state", "")
        hq_country = info.get("country", "")
        headquarters = ", ".join(
            part for part in [hq_city, hq_state, hq_country] if part
        )

        employees_raw = info.get("fullTimeEmployees")
        employees = f"{employees_raw:,}" if employees_raw else ""

        logger.info(
            "yfinance_quote_complete",
            ticker=ticker,
            price=current_price,
        )

        return {
            "ticker": (info.get("symbol") or ticker).upper(),
            "company_name": info.get("shortName") or info.get("longName") or ticker,
            "current_price": current_price,
            "previous_close": _safe_float(info.get("previousClose")),
            "open": _safe_float(
                info.get("open") or info.get("regularMarketOpen")
            ),
            "day_high": _safe_float(
                info.get("dayHigh") or info.get("regularMarketDayHigh")
            ),
            "day_low": _safe_float(
                info.get("dayLow") or info.get("regularMarketDayLow")
            ),
            "volume": _safe_int(
                info.get("volume") or info.get("regularMarketVolume")
            ),
            "market_cap": _format_market_cap(
                _safe_float(info.get("marketCap"))
            ),
            "pe_ratio": _safe_float(info.get("trailingPE")),
            "eps": _safe_float(info.get("trailingEps")),
            "week_52_high": _safe_float(info.get("fiftyTwoWeekHigh")),
            "week_52_low": _safe_float(info.get("fiftyTwoWeekLow")),
            "dividend_yield": _safe_float(info.get("dividendYield")),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "headquarters": headquarters,
            "ceo": "",
            "founded": "",
            "employees": employees,
            "company_description": info.get("longBusinessSummary", ""),
        }

    async def get_historical(
        self, ticker: str, period: str = "6mo"
    ) -> list[HistoricalPrice]:
        """Fetch historical OHLC data for charting.

        Args:
            ticker: Stock ticker symbol.
            period: yfinance period string (e.g. "6mo", "1y").

        Returns:
            List of HistoricalPrice sorted oldest-first.

        Raises:
            ExternalAPIError: If Yahoo Finance is unreachable.
        """
        logger.info("yfinance_history_start", ticker=ticker, period=period)
        try:
            rows = await asyncio.wait_for(
                asyncio.to_thread(self._fetch_history, ticker, period),
                timeout=_YFINANCE_TIMEOUT,
            )
        except TimeoutError as exc:
            raise ExternalAPIError(
                "Yahoo Finance",
                f"History request timed out for {ticker}",
            ) from exc
        except Exception as exc:
            raise ExternalAPIError(
                "Yahoo Finance",
                f"Failed to fetch history for {ticker}: {exc}",
            ) from exc

        logger.info(
            "yfinance_history_complete",
            ticker=ticker,
            rows=len(rows),
        )
        return rows

    async def get_technicals(
        self, ticker: str, period: str = "1y"
    ) -> TechnicalSnapshot:
        """Compute technical indicators from historical data.

        Fetches 1 year of history to have enough data for SMA-200,
        then computes SMA, EMA, RSI, MACD, and Bollinger Bands.

        Args:
            ticker: Stock ticker symbol.
            period: yfinance period for indicator computation.

        Returns:
            TechnicalSnapshot with computed indicator values.
        """
        logger.info("yfinance_technicals_start", ticker=ticker)
        try:
            snapshot = await asyncio.wait_for(
                asyncio.to_thread(
                    self._compute_technicals, ticker, period
                ),
                timeout=_YFINANCE_TIMEOUT,
            )
        except TimeoutError as exc:
            raise ExternalAPIError(
                "Yahoo Finance",
                f"Technicals request timed out for {ticker}",
            ) from exc
        except Exception as exc:
            logger.warning(
                "yfinance_technicals_failed",
                ticker=ticker,
                error=str(exc),
            )
            return TechnicalSnapshot()

        logger.info("yfinance_technicals_complete", ticker=ticker)
        return snapshot

    # ------------------------------------------------------------------
    # Synchronous helpers (run via asyncio.to_thread)
    # ------------------------------------------------------------------

    @staticmethod
    def _search_ticker(query: str) -> list[dict]:
        """Synchronous call to yfinance Search."""
        search = yf.Search(query)
        return list(search.quotes) if search.quotes else []

    @staticmethod
    def _fetch_info(ticker: str) -> dict:
        """Synchronous call to yfinance .info property."""
        t = yf.Ticker(ticker)
        info = t.info
        if not info or info.get("trailingPegRatio") is None and not info.get("currentPrice"):
            # yfinance returns a minimal dict for invalid tickers
            pass
        return info or {}

    @staticmethod
    def _fetch_history(
        ticker: str, period: str
    ) -> list[HistoricalPrice]:
        """Synchronous call to yfinance .history()."""
        t = yf.Ticker(ticker)
        df = t.history(period=period)
        if df is None or df.empty:
            return []

        results: list[HistoricalPrice] = []
        for idx, row in df.iterrows():
            date_str = idx.strftime("%Y-%m-%d")  # type: ignore[union-attr]
            results.append(
                HistoricalPrice(
                    date=date_str,
                    open=round(float(row["Open"]), 2),
                    high=round(float(row["High"]), 2),
                    low=round(float(row["Low"]), 2),
                    close=round(float(row["Close"]), 2),
                    volume=_safe_int(row.get("Volume")),
                )
            )
        return results

    @staticmethod
    def _compute_technicals(
        ticker: str, period: str
    ) -> TechnicalSnapshot:
        """Synchronous computation of technical indicators."""
        import pandas as pd

        t = yf.Ticker(ticker)
        df = t.history(period=period)
        if df is None or df.empty or len(df) < 20:
            return TechnicalSnapshot()

        close: pd.Series = df["Close"]

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
            macd_series = (
                close.ewm(span=12).mean() - close.ewm(span=26).mean()
            )
            signal_series = macd_series.ewm(span=9).mean()
            macd_line_val = _safe_float(macd_series.iloc[-1])
            macd_signal_val = _safe_float(signal_series.iloc[-1])
            if macd_line_val is not None and macd_signal_val is not None:
                macd_hist_val = round(
                    macd_line_val - macd_signal_val, 4
                )

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
            macd_line=(
                round(macd_line_val, 4) if macd_line_val else None
            ),
            macd_signal=(
                round(macd_signal_val, 4) if macd_signal_val else None
            ),
            macd_histogram=macd_hist_val,
            bollinger_upper=bb_upper,
            bollinger_middle=(
                round(bb_middle, 2) if bb_middle else None
            ),
            bollinger_lower=bb_lower,
        )
