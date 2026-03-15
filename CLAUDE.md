# Stock Analyzer — Claude Code Configuration

## Project Overview

AI-powered stock analysis platform with real-time Financial Modeling Prep (FMP) market data, Kimi K2.5 qualitative analysis, and multi-framework institutional investment analysis (Value, Growth, Safety, Macro, Innovation).

## Architecture

```
frontend/          React 19 + TypeScript + Vite + Tailwind CSS 4 + Zustand
backend/           Python FastAPI + Pydantic v2 + FMP API + Azure OpenAI (Kimi K2.5)
```

### Backend Layers
- `app/routers/` — FastAPI route handlers
- `app/services/` — Business logic (MarketDataService, AIAnalysisService)
- `app/providers/` — External API clients (OpenAIProvider)
- `app/models/` — Pydantic v2 response models
- `app/core/` — Config, exceptions, logging, dependencies

### Frontend Structure
- `src/pages/` — Page components (StockAnalysis)
- `src/components/` — UI components organized by feature (charts, landing, analysis, stock, etc.)
- `src/stores/` — Zustand state management
- `src/services/` — API client layer
- `src/types/` — TypeScript type definitions

## Key Patterns

### Three-Phase Analysis
1. **Phase 1**: Real market data from FMP API via `MarketDataService` (quote + historical OHLC + technicals)
2. **Phase 1.5**: Optional research enrichment via `SharePointAgentProvider` (non-blocking)
3. **Phase 2**: Qualitative analysis from Kimi K2.5 via `AIAnalysisService` — includes financier framework analysis
4. **Phase 3**: Merge real data + AI analysis into `StockAnalysisResponse`

### Financier Analysis

AI analyzes each stock through 5 institutional investment frameworks:

- Value Analysis (intrinsic value, economic moat, ROE, owner earnings)
- Growth Analysis (PEG ratio, earnings growth, revenue acceleration)
- Safety Analysis (margin of safety, book value, current ratio, debt levels)
- Macro Analysis (macroeconomic positioning, sector cycles, risk parity)
- Innovation Analysis (disruptive potential, TAM expansion, technology S-curves)

Each gives a buy/hold/sell verdict with reasoning. Consensus synthesizes all perspectives.

### Charts

- `lightweight-charts` v5 with `AreaSeries` (indigo line + gradient fill)
- Shows close prices only, no candlestick or volume bars
- Time range filters: 1W, 1M, 3M, 6M, 1Y, 5Y, ALL

### Ticker Resolution

`MarketDataService.resolve_ticker()` converts company names to symbols:

- Short alpha strings (<=5 chars) → assumed ticker, returned as-is
- Longer inputs → FMP search → first result's symbol
- Fallback: if fast-path ticker fails at `get_quote`, `search_ticker()` retries

### Error Handling

- `StockNotFoundError` → 404 (invalid ticker / no results)
- `ExternalAPIError` → 502 (FMP API unreachable)
- `AIAnalysisError` → 500 (AI provider failure)
- These propagate unwrapped through the service layer

## Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v              # run all tests
python -m pytest tests/ -v --tb=short   # quick test summary
uvicorn app.main:app --reload           # dev server on :8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                             # dev server on :5173
npm run build                           # production build
npx vitest run                          # run all tests
npx vitest run --coverage               # with coverage
```

## Environment Variables

Backend requires `.env` in `backend/`:
```
AZURE_OPENAI_ENDPOINT=<azure endpoint>
AZURE_OPENAI_API_KEY=<api key>
AZURE_OPENAI_DEPLOYMENT=Kimi-K2.5
AZURE_OPENAI_API_VERSION=2024-05-01-preview
```

## Testing

- Backend: pytest with 747+ tests (~3s). Mock at boundaries (FMP, OpenAI).
- Frontend: Vitest + React Testing Library with 822+ tests. JSDOM environment.
- Coverage target: 80%+ minimum, 90%+ for services.

## Conventions

- Python: `from __future__ import annotations`, type hints everywhere, Google-style docstrings
- TypeScript: strict mode, no `any`, functional components with hooks
- Git: `type(scope): description` format, atomic commits, never commit to main directly
- Async/await for all I/O in both backend and frontend
- Pydantic v2 models (not v1 API)
- structlog for Python logging, no `print()` in production
