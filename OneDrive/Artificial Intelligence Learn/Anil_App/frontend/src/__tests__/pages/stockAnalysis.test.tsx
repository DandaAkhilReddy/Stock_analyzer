/**
 * Tests for the StockAnalysis page component.
 *
 * The page reads from useStockStore — that store is mocked to control which
 * conditional branch renders.  framer-motion is mocked so motion.div /
 * AnimatePresence render as plain wrappers.
 *
 * Branches tested:
 *   1. No ticker selected  → empty-state prompt
 *   2. Loading in progress → spinner + ticker name
 *   3. Error state         → error message + retry button
 *   4. Analysis available, activeTab = 'news'       → NewsFeed visible
 *   5. Analysis available, activeTab = 'financials' → QuarterlyEarnings visible
 *   6. Analysis available, activeTab = 'growth'     → PricePrediction visible
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — must appear before any import of the mocked modules
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockFetchAnalysis = vi.fn();
const mockSetActiveTab = vi.fn();

vi.mock('../../stores/stockStore', () => ({
  useStockStore: vi.fn(),
}));

import { useStockStore } from '../../stores/stockStore';
import { StockAnalysis } from '../../pages/StockAnalysis';
import type { StockAnalysisResponse } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const mockAnalysis: StockAnalysisResponse = {
  ticker: 'AAPL',
  company_name: 'Apple Inc.',
  current_price: 185.5,
  previous_close: 184.2,
  open: 184.8,
  day_high: 186.1,
  day_low: 184.0,
  volume: 45_000_000,
  market_cap: '2.8T',
  pe_ratio: 28.5,
  eps: 6.51,
  week_52_high: 199.62,
  week_52_low: 164.08,
  dividend_yield: 0.0054,
  technical: {
    sma_20: 183.5,
    sma_50: 180.2,
    sma_200: 175.0,
    ema_12: 184.0,
    ema_26: 182.5,
    rsi_14: 62.3,
    macd_line: 1.5,
    macd_signal: 1.2,
    macd_histogram: 0.3,
    bollinger_upper: 190.0,
    bollinger_middle: 183.5,
    bollinger_lower: 177.0,
    support_levels: [180.0],
    resistance_levels: [190.0],
    signal: 'buy',
  },
  news: [{ title: 'Apple quarterly results', source: 'Reuters', sentiment: 'positive' }],
  quarterly_earnings: [
    { quarter: 'Q1 2025', revenue: 94_900, net_income: 23_600, eps: 1.53, yoy_revenue_growth: 0.05 },
  ],
  recommendation: 'buy',
  confidence_score: 0.78,
  summary: 'Apple shows strong momentum.',
  bull_case: 'Strong ecosystem.',
  bear_case: 'Regulatory pressure.',
  risk_assessment: { overall_risk: 'medium', risk_factors: ['Regulation'], risk_score: 0.45 },
  price_predictions: {
    one_week: { low: 183, mid: 186, high: 189, confidence: 0.75 },
    one_month: { low: 180, mid: 190, high: 200, confidence: 0.65 },
    three_months: { low: 175, mid: 195, high: 215, confidence: 0.55 },
  },
  analysis_timestamp: '2025-01-01T00:00:00Z',
  model_used: 'kimi-k2.5',
  disclaimer: 'Not financial advice.',
};

// ---------------------------------------------------------------------------
// Helper: configure what useStockStore returns for each selector call
// ---------------------------------------------------------------------------

interface StoreSlice {
  currentTicker: string | null;
  analysis: StockAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  activeTab: 'news' | 'financials' | 'growth';
  setActiveTab: typeof mockSetActiveTab;
  fetchAnalysis: typeof mockFetchAnalysis;
}

function setupStore(overrides: Partial<StoreSlice> = {}): void {
  const store: StoreSlice = {
    currentTicker: null,
    analysis: null,
    isLoading: false,
    error: null,
    activeTab: 'news',
    setActiveTab: mockSetActiveTab,
    fetchAnalysis: mockFetchAnalysis,
    ...overrides,
  };

  vi.mocked(useStockStore).mockImplementation(
    (selector: (s: StoreSlice) => unknown) => selector(store),
  );

  // Imperative getState used by the Retry button
  (useStockStore as unknown as { getState: () => StoreSlice }).getState = () => store;
}

// ===========================================================================
// StockAnalysis page
// ===========================================================================

describe('StockAnalysis', () => {
  beforeEach(() => {
    mockFetchAnalysis.mockClear();
    mockSetActiveTab.mockClear();
  });

  // -------------------------------------------------------------------------
  // 1. Empty state — no ticker
  // -------------------------------------------------------------------------

  describe('empty state (no currentTicker)', () => {
    beforeEach(() => setupStore({ currentTicker: null }));

    it('shows the "Search for a stock to begin" heading', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Search for a stock to begin')).toBeInTheDocument();
    });

    it('shows the descriptive paragraph text', () => {
      render(<StockAnalysis />);
      expect(screen.getByText(/Enter a ticker symbol/)).toBeInTheDocument();
    });

    it('does not show a loading spinner', () => {
      render(<StockAnalysis />);
      const svgs = document.querySelectorAll('svg');
      const spinner = Array.from(svgs).find((svg) => svg.classList.contains('animate-spin'));
      expect(spinner).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Loading state
  // -------------------------------------------------------------------------

  describe('loading state', () => {
    beforeEach(() => setupStore({ currentTicker: 'AAPL', isLoading: true }));

    it('shows "Analyzing AAPL..." text', () => {
      render(<StockAnalysis />);
      expect(screen.getByText(/Analyzing AAPL/)).toBeInTheDocument();
    });

    it('shows the loading spinner (animate-spin class)', () => {
      render(<StockAnalysis />);
      const svgs = document.querySelectorAll('svg');
      const spinner = Array.from(svgs).find((svg) => svg.classList.contains('animate-spin'));
      expect(spinner).toBeInTheDocument();
    });

    it('does not show error UI during loading', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText(/Error analyzing/)).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Error state
  // -------------------------------------------------------------------------

  describe('error state', () => {
    beforeEach(() =>
      setupStore({ currentTicker: 'AAPL', isLoading: false, error: 'Ticker not found' }),
    );

    it('shows "Error analyzing AAPL" heading', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Error analyzing AAPL')).toBeInTheDocument();
    });

    it('shows the error message text', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Ticker not found')).toBeInTheDocument();
    });

    it('renders a Retry button', () => {
      render(<StockAnalysis />);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('calls fetchAnalysis with the current ticker when Retry is clicked', () => {
      render(<StockAnalysis />);
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(mockFetchAnalysis).toHaveBeenCalledOnce();
      expect(mockFetchAnalysis).toHaveBeenCalledWith('AAPL');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Analysis available — news tab (default)
  // -------------------------------------------------------------------------

  describe('analysis loaded — news tab', () => {
    beforeEach(() =>
      setupStore({ currentTicker: 'AAPL', analysis: mockAnalysis, activeTab: 'news' }),
    );

    it('renders StockHeader with ticker', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    it('renders the company name', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });

    it('renders the TabBar', () => {
      render(<StockAnalysis />);
      expect(screen.getByRole('button', { name: /news/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /financials/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /growth/i })).toBeInTheDocument();
    });

    it('renders the NewsFeed when activeTab is news', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Latest News')).toBeInTheDocument();
    });

    it('renders the news article title', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Apple quarterly results')).toBeInTheDocument();
    });

    it('does not render QuarterlyEarnings on the news tab', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Quarterly Earnings')).not.toBeInTheDocument();
    });

    it('calls setActiveTab when a tab button is clicked', () => {
      render(<StockAnalysis />);
      fireEvent.click(screen.getByRole('button', { name: /financials/i }));
      expect(mockSetActiveTab).toHaveBeenCalledWith('financials');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Analysis available — financials tab
  // -------------------------------------------------------------------------

  describe('analysis loaded — financials tab', () => {
    beforeEach(() =>
      setupStore({ currentTicker: 'AAPL', analysis: mockAnalysis, activeTab: 'financials' }),
    );

    it('renders QuarterlyEarnings heading on financials tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Quarterly Earnings')).toBeInTheDocument();
    });

    it('renders Price Data card on financials tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Price Data')).toBeInTheDocument();
    });

    it('renders Key Statistics card on financials tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Key Statistics')).toBeInTheDocument();
    });

    it('does not render NewsFeed (Latest News) on financials tab', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Latest News')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 6. Analysis available — growth tab
  // -------------------------------------------------------------------------

  describe('analysis loaded — growth tab', () => {
    beforeEach(() =>
      setupStore({ currentTicker: 'AAPL', analysis: mockAnalysis, activeTab: 'growth' }),
    );

    it('renders Price Predictions heading on growth tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Price Predictions')).toBeInTheDocument();
    });

    it('renders Bull Case section on growth tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Bull Case')).toBeInTheDocument();
    });

    it('renders Bear Case section on growth tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Bear Case')).toBeInTheDocument();
    });

    it('renders Risk Assessment heading on growth tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    });

    it('does not render NewsFeed on growth tab', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Latest News')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 7. Ticker present but analysis is null and not loading (returns null)
  // -------------------------------------------------------------------------

  describe('ticker set but analysis is null and not loading or erroring', () => {
    it('renders nothing (returns null) when ticker is set but analysis is null', () => {
      setupStore({ currentTicker: 'AAPL', analysis: null, isLoading: false, error: null });
      const { container } = render(<StockAnalysis />);
      expect(container.firstChild).toBeNull();
    });
  });
});
