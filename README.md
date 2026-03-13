<div align="center">

# Stock Analyzer

### AI-Powered Stock Analysis with Real-Time Market Data

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)

[![Tests](https://img.shields.io/badge/Tests-1%2C571+-22c55e?style=for-the-badge&logo=vitest&logoColor=white)](#testing)
[![Coverage](https://img.shields.io/badge/Coverage-97%25+-22c55e?style=for-the-badge&logo=codecov&logoColor=white)](#testing)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#deployment)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](#license)

---

**Real-time stock quotes** from Financial Modeling Prep | **AI analysis** powered by Azure OpenAI | **Interactive charts** with TradingView

[Getting Started](#getting-started) | [Features](#features) | [Architecture](#architecture) | [API](#api-endpoints) | [Deployment](#deployment)

</div>

---

## What It Does

Stock Analyzer combines **real-time market data** with **AI-powered qualitative analysis** to give you a comprehensive view of any US stock. Search a ticker, get instant price data, technical indicators, AI-generated investment insights, news sentiment, and long-term growth projections — all in one place.

## Features

### Real-Time Market Intelligence
- **Live Stock Quotes** — Current price, day range, 52-week high/low, market cap, P/E ratio, EPS
- **Full Historical Charts** — Interactive candlestick + volume charts from IPO to today (1W, 1M, 3M, 6M, 1Y, 5Y, ALL)
- **Technical Indicators** — SMA (20/50/200), EMA (12/26), RSI-14, MACD, Bollinger Bands, support & resistance levels
- **Stock Search** — Autocomplete search with US market filtering and debounced suggestions

### AI-Powered Analysis
- **Investment Recommendation** — Strong Buy / Buy / Hold / Sell / Strong Sell with confidence scoring
- **Bull vs Bear Case** — Narrative analysis of both sides
- **Price Predictions** — Short-term (1W, 1M, 3M) and long-term (1Y, 5Y, 10Y) forecasts with CAGR
- **Risk Assessment** — Risk score with detailed risk factor breakdown
- **News Sentiment** — AI-synthesized headlines tagged as positive, negative, or neutral
- **Quarterly Earnings** — Revenue, net income, EPS, and YoY growth

### Polished UI/UX
- **3D Animated Landing Page** — Mesh gradient background, floating elements, dot grid overlay
- **Tabbed Analysis Interface** — Chart, News, Financials, About, Invest tabs with smooth Framer Motion transitions
- **Investment Growth Calculator** — Project returns for $10K, $50K, $100K over multiple horizons
- **Smart Loading States** — 13 rotating AI agent messages while analysis runs
- **Persistent State** — Zustand with localStorage keeps your last analysis across sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7.3, Tailwind CSS 4.2 |
| **State** | Zustand 5 with persist middleware |
| **Charts** | TradingView Lightweight Charts 5.1 |
| **Animation** | Framer Motion 12 |
| **Backend** | Python 3.13, FastAPI 0.115, Pydantic v2 |
| **AI** | Azure OpenAI (Kimi K2.5) |
| **Market Data** | Financial Modeling Prep API |
| **Logging** | structlog (JSON in prod, console in dev) |
| **Testing** | Vitest + React Testing Library, pytest |
| **Deployment** | Docker multi-stage, Render.com |

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- [FMP API key](https://financialmodelingprep.com/developer) (free tier available)
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) endpoint (or compatible API)

### 1. Clone the repo

```bash
git clone https://github.com/DandaAkhilReddy/Stock_analyzer.git
cd Stock_analyzer
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4.1
AZURE_OPENAI_API_VERSION=2024-05-01-preview
FMP_API_KEY=your-fmp-api-key
```

Start the API server:

```bash
uvicorn main:app --reload  # http://localhost:8000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

The Vite dev server proxies `/api` requests to the backend automatically.

### 4. Open the app

Navigate to `http://localhost:5173`, search for any US stock ticker (AAPL, MSFT, TSLA, ...) and explore.

## Architecture

```
                    +-------------------+
                    |   React Frontend  |
                    |  (Vite + Zustand) |
                    +--------+----------+
                             |
                        /api/analyze/{ticker}
                             |
                    +--------v----------+
                    |   FastAPI Router   |
                    +--------+----------+
                             |
              +--------------+--------------+
              |                             |
     +--------v----------+       +----------v--------+
     | MarketDataService  |       | AIAnalysisService  |
     | (FMP API)          |       | (Azure OpenAI)     |
     +--------+----------+       +----------+--------+
              |                             |
     +--------v----------+       +----------v--------+
     | Real-time quotes   |       | Investment recs    |
     | Historical OHLC    |       | Price predictions  |
     | Technical analysis |       | Risk assessment    |
     | Company profile    |       | News sentiment     |
     +--------------------+       +--------------------+
              |                             |
              +--------------+--------------+
                             |
                    +--------v----------+
                    | StockAnalysisResponse |
                    |  (merged result)      |
                    +-----------------------+
```

### Two-Phase Analysis Pipeline

1. **Phase 1 — Real Data**: Fetches live quotes, historical prices, and company profile from FMP. Computes technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands) locally.
2. **Phase 2 — AI Analysis**: Packages Phase 1 data into a structured prompt, sends to Azure OpenAI, receives JSON with recommendations, predictions, and sentiment.
3. **Phase 3 — Merge**: Combines real market data with AI analysis into a unified response.

## Project Structure

```
Stock_analyzer/
+-- backend/
|   +-- main.py                          # FastAPI app, CORS, exception handlers
|   +-- requirements.txt
|   +-- app/
|   |   +-- routers/analysis.py          # /api/search, /api/analyze endpoints
|   |   +-- services/
|   |   |   +-- market_data_service.py   # FMP API client + technical analysis
|   |   |   +-- ai_analysis_service.py   # Azure OpenAI orchestration
|   |   +-- providers/
|   |   |   +-- openai_provider.py       # LLM client + JSON repair
|   |   |   +-- sharepoint_agent.py      # Optional research enrichment
|   |   +-- models/analysis.py           # Pydantic v2 response schemas
|   |   +-- core/                        # Config, exceptions, logging, DI
|   +-- tests/                           # 16 test files, 745+ tests
+-- frontend/
|   +-- src/
|   |   +-- pages/StockAnalysis.tsx      # Main analysis page
|   |   +-- components/
|   |   |   +-- landing/                 # Hero, search bar, 3D animations
|   |   |   +-- charts/                  # Candlestick, MACD, RSI charts
|   |   |   +-- analysis/               # Recommendations, predictions, risk
|   |   |   +-- invest/                  # Long-term outlook, growth calc
|   |   |   +-- news/                    # Sentiment-tagged news feed
|   |   |   +-- financials/              # Earnings, key metrics
|   |   |   +-- stock/                   # Price header, signal banner
|   |   |   +-- technical/               # Support/resistance, indicators
|   |   |   +-- about/                   # Company profile
|   |   +-- stores/stockStore.ts         # Zustand state management
|   |   +-- services/                    # API client with retry logic
|   |   +-- hooks/                       # useStockSearch custom hook
|   |   +-- types/analysis.ts            # Full TypeScript interfaces
|   +-- __tests__/                       # 24 test files, 826+ tests
+-- Dockerfile                           # Multi-stage production build
+-- render.yaml                          # One-click Render deployment
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search?q=apple` | Search stocks by name or ticker |
| `POST` | `/api/analyze/{ticker}` | Full analysis (real data + AI) |
| `GET` | `/health` | Liveness probe |
| `GET` | `/ready` | Readiness probe |

### Example: Analyze a stock

```bash
curl -X POST http://localhost:8000/api/analyze/AAPL
```

Response includes: current price, technical indicators, AI recommendation, price predictions, risk assessment, news sentiment, quarterly earnings, company profile, and long-term outlook.

### Error Responses

```json
{
  "error": {
    "code": "TICKER_NOT_FOUND",
    "message": "No results found for ticker 'XYZ'"
  }
}
```

| Status | Code | Meaning |
|--------|------|---------|
| 404 | `TICKER_NOT_FOUND` | Invalid ticker or no results |
| 502 | `EXTERNAL_API_ERROR` | Market data provider unreachable |
| 500 | `AI_ANALYSIS_ERROR` | AI provider failure |

## Testing

**1,571 tests** across frontend and backend with **97%+ line coverage**.

### Run all tests

```bash
# Backend (745+ tests, ~1 second)
cd backend
python -m pytest tests/ -v

# Frontend (826+ tests, ~6 seconds)
cd frontend
npx vitest run

# With coverage
npx vitest run --coverage
```

### Coverage breakdown

| Area | Tests | Coverage |
|------|-------|----------|
| Frontend | 826+ | 97.85% |
| Backend | 745+ | 99% |
| **Total** | **1,571+** | **97%+** |

Test coverage includes: API client retry/timeout logic, Zustand store persistence, chart rendering, keyboard navigation, technical indicator math, AI response parsing, JSON repair, Pydantic model validation, and error propagation.

## Deployment

### Docker

```bash
docker build -t stock-analyzer .
docker run -p 8000:8000 --env-file backend/.env stock-analyzer
```

The multi-stage Dockerfile builds the React frontend, then copies it into the FastAPI backend for single-container deployment.

### Render.com (one-click)

The included `render.yaml` configures automatic deployment:

1. Fork this repo
2. Connect to [Render](https://render.com)
3. Create a new **Blueprint** and point it at your fork
4. Set the environment variables (API keys) in the Render dashboard
5. Deploy

Health checks hit `/health` automatically.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_OPENAI_ENDPOINT` | Yes | Azure OpenAI endpoint URL |
| `AZURE_OPENAI_API_KEY` | Yes | Azure OpenAI API key |
| `AZURE_OPENAI_DEPLOYMENT` | Yes | Model deployment name (e.g., `gpt-4.1`) |
| `AZURE_OPENAI_API_VERSION` | Yes | API version (e.g., `2024-05-01-preview`) |
| `FMP_API_KEY` | Yes | Financial Modeling Prep API key |
| `ENVIRONMENT` | No | `production` or `development` (default) |
| `LOG_LEVEL` | No | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit with conventional format (`feat(scope): description`)
4. Push and open a PR

### Commit conventions

```
type(scope): description

Types: feat, fix, refactor, test, docs, chore, perf, ci
```

## License

This project is licensed under the MIT License.

---

<div align="center">

Built by [Danda Akhil Reddy](https://github.com/DandaAkhilReddy)

**If you found this useful, give it a star!**

</div>
