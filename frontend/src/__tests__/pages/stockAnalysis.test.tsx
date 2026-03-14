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
 *   4. Analysis available, activeTab = 'chart'      → PriceChart visible
 *   5. Analysis available, activeTab = 'news'       → NewsFeed visible
 *   6. Analysis available, activeTab = 'financials' → QuarterlyEarnings visible
 *   7. Analysis available, activeTab = 'about'      → CompanyAbout visible
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — must appear before any import of the mocked modules
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => {
  const createMotionComponent = (tag: string) => {
    const Component = ({ children, ...props }: any) => {
      const Tag = tag as any;
      return <Tag {...props}>{children}</Tag>;
    };
    Component.displayName = `motion.${tag}`;
    return Component;
  };
  return {
    motion: new Proxy({}, {
      get: (_target, prop: string) => createMotionComponent(prop),
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useMotionValue: () => ({ set: () => {} }),
    useSpring: (v: any) => v,
    useTransform: () => 0,
  };
});

// Mock lightweight-charts so PriceChart renders without a real DOM canvas
vi.mock('lightweight-charts', () => ({
  createChart: () => ({
    addSeries: () => ({ setData: vi.fn() }),
    priceScale: () => ({ applyOptions: vi.fn() }),
    timeScale: () => ({ fitContent: vi.fn(), borderColor: '' }),
    applyOptions: vi.fn(),
    remove: vi.fn(),
  }),
  ColorType: { Solid: 'solid' },
  CrosshairMode: { Normal: 1 },
  AreaSeries: vi.fn(),
}));

// Stub ResizeObserver for chart tests (jsdom doesn't provide it)
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

// Mock searchStocks so AnalysisError doesn't make real network calls
vi.mock('../../services/stockApi', () => ({
  searchStocks: vi.fn().mockResolvedValue([
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'GOOG', name: 'Alphabet Inc. Class C' },
  ]),
  analyzeStock: vi.fn(),
}));

const mockFetchAnalysis = vi.fn();
const mockSetActiveTab = vi.fn();

vi.mock('../../stores/stockStore', () => ({
  useStockStore: vi.fn(),
}));

import { useStockStore } from '../../stores/stockStore';
import { StockAnalysis } from '../../pages/StockAnalysis';
import type { StockAnalysisResponse, AnalysisTab } from '../../types/analysis';

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
  historical_prices: [],
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
  sector: 'Technology',
  industry: 'Consumer Electronics',
  headquarters: 'Cupertino, CA',
  ceo: 'Tim Cook',
  founded: '1976',
  employees: '164,000',
  company_description: 'Apple designs and sells consumer electronics.',
  long_term_outlook: null,
  financier_analysis: null,
  research_context: '',
  research_sources: [],
  disclaimer: 'Not financial advice.',
};

// ---------------------------------------------------------------------------
// Helper: configure what useStockStore returns for each selector call
// ---------------------------------------------------------------------------

interface StoreSlice {
  currentTicker: string | null;
  analysis: StockAnalysisResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastFetchedAt: number | null;
  error: string | null;
  activeTab: AnalysisTab;
  setActiveTab: typeof mockSetActiveTab;
  fetchAnalysis: typeof mockFetchAnalysis;
}

function setupStore(overrides: Partial<StoreSlice> = {}): void {
  const store: StoreSlice = {
    currentTicker: null,
    analysis: null,
    isLoading: false,
    isRefreshing: false,
    lastFetchedAt: null,
    error: null,
    activeTab: 'chart',
    setActiveTab: mockSetActiveTab,
    fetchAnalysis: mockFetchAnalysis,
    ...overrides,
  };

  vi.mocked(useStockStore).mockImplementation(
    (selector: (s: StoreSlice) => unknown) => selector(store),
  );

  // Imperative getState used by the Retry button
  (useStockStore as unknown as { getState: () => StoreSlice }).getState = () => store;

  // Persist middleware API used by hydration guard
  (useStockStore as unknown as Record<string, unknown>).persist = {
    hasHydrated: () => true,
    onFinishHydration: () => () => {},
  };
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

    it('shows the "AI-Powered" heading from LandingHero', () => {
      render(<StockAnalysis />);
      expect(screen.getByText(/AI-Powered/i)).toBeInTheDocument();
    });

    it('shows the "Stock Analysis" text from LandingHero', () => {
      render(<StockAnalysis />);
      expect(screen.getByText(/Stock Analysis/i)).toBeInTheDocument();
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

    it('shows the orbital loading animation', () => {
      render(<StockAnalysis />);
      // AgentLoadingAnimation renders the ticker text
      expect(screen.getByText(/Analyzing AAPL/)).toBeInTheDocument();
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
      setupStore({ currentTicker: 'GOOGLE', isLoading: false, error: 'Ticker not found' }),
    );

    it('shows friendly error heading with the failed ticker', () => {
      render(<StockAnalysis />);
      expect(screen.getByText(/Couldn.*t analyze.*GOOGLE/)).toBeInTheDocument();
    });

    it('shows a friendly error message instead of raw error', () => {
      render(<StockAnalysis />);
      expect(screen.getByText(/couldn.*t find that stock/i)).toBeInTheDocument();
    });

    it('renders a retry link for the original ticker', () => {
      render(<StockAnalysis />);
      expect(screen.getByText(/Try.*GOOGLE.*again/)).toBeInTheDocument();
    });

    it('shows suggestion buttons after search resolves', async () => {
      render(<StockAnalysis />);
      // searchStocks mock resolves with GOOGL — wait for it to appear
      await waitFor(() => {
        expect(screen.getByText('GOOGL')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // 4. Analysis available — chart tab (default)
  // -------------------------------------------------------------------------

  describe('analysis loaded — chart tab', () => {
    beforeEach(() =>
      setupStore({ currentTicker: 'AAPL', analysis: mockAnalysis, activeTab: 'chart' }),
    );

    it('renders StockHeader with ticker', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    it('renders the company name', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });

    it('renders the TabBar with all 4 tabs', () => {
      render(<StockAnalysis />);
      expect(screen.getByRole('button', { name: /chart/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /news/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /financials/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /about/i })).toBeInTheDocument();
    });

    it('renders the PriceChart area when activeTab is chart', () => {
      render(<StockAnalysis />);
      // With empty historical_prices, the empty state message renders
      expect(
        screen.getByText('No historical price data available'),
      ).toBeInTheDocument();
    });

    it('does not render NewsFeed on the chart tab', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Latest News')).not.toBeInTheDocument();
    });

    it('calls setActiveTab when a tab button is clicked', () => {
      render(<StockAnalysis />);
      fireEvent.click(screen.getByRole('button', { name: /financials/i }));
      expect(mockSetActiveTab).toHaveBeenCalledWith('financials');
    });
  });

  // -------------------------------------------------------------------------
  // 4b. Chart with historical price data — time range buttons
  // -------------------------------------------------------------------------

  describe('chart time range buttons', () => {
    const priceData = [
      { date: '2020-01-02', open: 74, high: 75, low: 73, close: 74.5, volume: 1000 },
      { date: '2023-06-15', open: 180, high: 182, low: 179, close: 181, volume: 2000 },
      { date: '2025-03-10', open: 185, high: 186, low: 184, close: 185.5, volume: 3000 },
    ];

    beforeEach(() =>
      setupStore({
        currentTicker: 'AAPL',
        analysis: { ...mockAnalysis, historical_prices: priceData },
        activeTab: 'chart',
      }),
    );

    it('renders all 7 time range buttons including 1Y, 5Y, ALL', () => {
      render(<StockAnalysis />);
      for (const label of ['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL']) {
        expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
      }
    });

    it('renders Price Chart heading when data is available', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Price Chart')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Analysis available — news tab
  // -------------------------------------------------------------------------

  describe('analysis loaded — news tab', () => {
    beforeEach(() =>
      setupStore({ currentTicker: 'AAPL', analysis: mockAnalysis, activeTab: 'news' }),
    );

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
  });

  // -------------------------------------------------------------------------
  // 6. Analysis available — financials tab
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

    it('renders Technical Summary on financials tab when technical data exists', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Technical Summary')).toBeInTheDocument();
    });

    it('renders Price Predictions on financials tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Price Predictions')).toBeInTheDocument();
    });

    it('does not render NewsFeed (Latest News) on financials tab', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Latest News')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 7. Analysis available — about tab
  // -------------------------------------------------------------------------

  describe('analysis loaded — about tab', () => {
    beforeEach(() =>
      setupStore({ currentTicker: 'AAPL', analysis: mockAnalysis, activeTab: 'about' }),
    );

    it('renders the company description on the about tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText(/Apple designs and sells consumer electronics/)).toBeInTheDocument();
    });

    it('renders AI Analysis Summary on the about tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('AI Analysis Summary')).toBeInTheDocument();
    });

    it('renders Bull Case section on the about tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Bull Case')).toBeInTheDocument();
    });

    it('renders Bear Case section on the about tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Bear Case')).toBeInTheDocument();
    });

    it('renders Risk Assessment heading on the about tab', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    });

    it('does not render NewsFeed on about tab', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Latest News')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 8. Ticker present but analysis is null and not loading (returns null)
  // -------------------------------------------------------------------------

  describe('ticker set but analysis is null and not loading or erroring', () => {
    it('falls back to LandingHero when ticker is set but analysis is null', () => {
      setupStore({ currentTicker: 'AAPL', analysis: null, isLoading: false, error: null });
      render(<StockAnalysis />);
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 9. Analysis available — invest tab with long_term_outlook present
  // -------------------------------------------------------------------------

  const mockOutlook = {
    one_year: { low: 190, mid: 210, high: 230, confidence: 0.72 },
    five_year: { low: 240, mid: 290, high: 350, confidence: 0.6 },
    ten_year: { low: 300, mid: 400, high: 520, confidence: 0.45 },
    verdict: 'buy' as const,
    verdict_rationale: 'Strong fundamentals support long-term appreciation.',
    catalysts: ['AI integration', 'Services growth'],
    long_term_risks: ['Regulatory headwinds'],
    compound_annual_return: 12.5,
  };

  const mockAnalysisWithOutlook: StockAnalysisResponse = {
    ...mockAnalysis,
    long_term_outlook: mockOutlook,
  };

  describe('analysis loaded — invest tab (with outlook)', () => {
    beforeEach(() =>
      setupStore({
        currentTicker: 'AAPL',
        analysis: mockAnalysisWithOutlook,
        activeTab: 'invest',
      }),
    );

    it('renders the verdict banner with BUY FOR LONG TERM', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('BUY FOR LONG TERM')).toBeInTheDocument();
    });

    it('renders the verdict_rationale text', () => {
      render(<StockAnalysis />);
      expect(
        screen.getByText('Strong fundamentals support long-term appreciation.'),
      ).toBeInTheDocument();
    });

    it('renders the Price Trajectory section heading', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Price Trajectory')).toBeInTheDocument();
    });

    it('renders all three time horizon labels', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('1 Year')).toBeInTheDocument();
      expect(screen.getByText('5 Years')).toBeInTheDocument();
      expect(screen.getByText('10 Years')).toBeInTheDocument();
    });

    it('renders Growth Catalysts section', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Growth Catalysts')).toBeInTheDocument();
    });

    it('renders catalyst items from outlook data', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('AI integration')).toBeInTheDocument();
      expect(screen.getByText('Services growth')).toBeInTheDocument();
    });

    it('renders Long-Term Risks section', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Long-Term Risks')).toBeInTheDocument();
    });

    it('renders risk items from outlook data', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Regulatory headwinds')).toBeInTheDocument();
    });

    it('renders the CAGR estimate', () => {
      render(<StockAnalysis />);
      expect(screen.getByText(/12\.5%\s*CAGR/)).toBeInTheDocument();
    });

    it('renders the bottom-line ticker summary', () => {
      render(<StockAnalysis />);
      expect(screen.getByText(/for long-term investors/i)).toBeInTheDocument();
    });

    it('does not render the "not available" fallback message', () => {
      render(<StockAnalysis />);
      expect(
        screen.queryByText('Long-term outlook data not available for this stock.'),
      ).not.toBeInTheDocument();
    });

    it('does not render NewsFeed on the invest tab', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Latest News')).not.toBeInTheDocument();
    });

    it('does not render QuarterlyEarnings on the invest tab', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Quarterly Earnings')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 10. Analysis available — invest tab without long_term_outlook
  // -------------------------------------------------------------------------

  describe('analysis loaded — invest tab (no outlook)', () => {
    beforeEach(() =>
      setupStore({
        currentTicker: 'AAPL',
        analysis: { ...mockAnalysis, long_term_outlook: null },
        activeTab: 'invest',
      }),
    );

    it('renders the "not available" fallback message', () => {
      render(<StockAnalysis />);
      expect(
        screen.getByText('Long-term outlook data not available for this stock.'),
      ).toBeInTheDocument();
    });

    it('does not render the verdict banner', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText(/FOR LONG TERM/)).not.toBeInTheDocument();
    });

    it('does not render Price Trajectory', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Price Trajectory')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 11. Loading state — timer messages
  // -------------------------------------------------------------------------

  describe('loading state — timer messages', () => {
    beforeEach(() =>
      setupStore({ currentTicker: 'TSLA', isLoading: true }),
    );

    it('renders the ticker name in the "Analyzing…" line', () => {
      render(<StockAnalysis />);
      expect(screen.getByText(/Analyzing TSLA/)).toBeInTheDocument();
    });

    it('shows the initial agent message at second 0', () => {
      render(<StockAnalysis />);
      // loadingSeconds starts at 0 → messageIndex 0 → first message
      expect(
        screen.getByText('Your AI agent is analyzing market data...'),
      ).toBeInTheDocument();
    });

    it('does not render analysis content while loading', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Price Trajectory')).not.toBeInTheDocument();
      expect(screen.queryByText('Latest News')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 12. Analysis available — about tab (CompanyAbout component coverage)
  // -------------------------------------------------------------------------

  describe('analysis loaded — about tab (CompanyAbout deep coverage)', () => {
    beforeEach(() =>
      setupStore({ currentTicker: 'AAPL', analysis: mockAnalysis, activeTab: 'about' }),
    );

    it('renders the company name heading from CompanyAbout', () => {
      render(<StockAnalysis />);
      // Company name appears in both the header and the CompanyAbout hero
      expect(screen.getAllByText('Apple Inc.').length).toBeGreaterThanOrEqual(2);
    });

    it('renders the About section heading', () => {
      render(<StockAnalysis />);
      // "About" appears in both the tab bar and the CompanyAbout description heading
      expect(screen.getAllByText('About').length).toBeGreaterThanOrEqual(2);
    });

    it('renders the Key Statistics section', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Key Statistics')).toBeInTheDocument();
    });

    it('renders the CEO value from analysis fixture', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Tim Cook')).toBeInTheDocument();
    });

    it('renders the headquarters value', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Cupertino, CA')).toBeInTheDocument();
    });

    it('renders the disclaimer text', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Not financial advice.')).toBeInTheDocument();
    });

    it('does not render invest-tab content on the about tab', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText(/FOR LONG TERM/)).not.toBeInTheDocument();
      expect(
        screen.queryByText('Long-term outlook data not available for this stock.'),
      ).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 13. Message index calculation — verify correct message at 0s, 5s, 10s
  // -------------------------------------------------------------------------

  describe('loading state — message index calculation via fake timers', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      setupStore({ currentTicker: 'MSFT', isLoading: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows message index 0 at second 0 (before any tick)', () => {
      render(<StockAnalysis />);
      // loadingSeconds = 0 → Math.floor(0/5) % 13 = 0
      expect(
        screen.getByText('Your AI agent is analyzing market data...'),
      ).toBeInTheDocument();
    });

    it('shows message index 1 at second 5 (one rotation)', () => {
      render(<StockAnalysis />);
      // Advance clock by 5 ticks of 1000ms each → loadingSeconds = 5
      act(() => { vi.advanceTimersByTime(5000); });
      // Math.floor(5/5) % 13 = 1
      expect(
        screen.getByText('Scanning SEC filings and earnings reports...'),
      ).toBeInTheDocument();
    });

    it('shows message index 2 at second 10 (two rotations)', () => {
      render(<StockAnalysis />);
      act(() => { vi.advanceTimersByTime(10000); });
      // Math.floor(10/5) % 13 = 2
      expect(
        screen.getByText('AI agents are debating bull vs bear cases...'),
      ).toBeInTheDocument();
    });

    it('shows message index 12 at second 60 (wraps at 13 messages)', () => {
      render(<StockAnalysis />);
      act(() => { vi.advanceTimersByTime(60000); });
      // Math.floor(60/5) % 13 = 12 % 13 = 12
      expect(
        screen.getByText('Almost done — assembling the final report...'),
      ).toBeInTheDocument();
    });

    it('wraps back to index 0 at second 65 (full cycle + 1)', () => {
      render(<StockAnalysis />);
      act(() => { vi.advanceTimersByTime(65000); });
      // Math.floor(65/5) % 13 = 13 % 13 = 0
      expect(
        screen.getByText('Your AI agent is analyzing market data...'),
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 14. Loading state — AgentLoadingAnimation receives ticker and elapsed seconds
  // -------------------------------------------------------------------------

  describe('loading state — AgentLoadingAnimation prop passthrough', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('passes the current ticker to AgentLoadingAnimation (renders "Analyzing NVDA...")', () => {
      setupStore({ currentTicker: 'NVDA', isLoading: true });
      render(<StockAnalysis />);
      expect(screen.getByText('Analyzing NVDA...')).toBeInTheDocument();
    });

    it('displays elapsed seconds counter starting at 0s', () => {
      setupStore({ currentTicker: 'NVDA', isLoading: true });
      render(<StockAnalysis />);
      expect(screen.getByText('0s')).toBeInTheDocument();
    });

    it('increments elapsed seconds counter as time passes', () => {
      setupStore({ currentTicker: 'NVDA', isLoading: true });
      render(<StockAnalysis />);
      act(() => { vi.advanceTimersByTime(3000); });
      expect(screen.getByText('3s')).toBeInTheDocument();
    });

    it('resets elapsed seconds to 0 when isLoading becomes false', () => {
      // Start loading
      setupStore({ currentTicker: 'NVDA', isLoading: true });
      const { rerender } = render(<StockAnalysis />);
      act(() => { vi.advanceTimersByTime(7000); });
      // Switch to analysis-ready state — isLoading false, analysis present
      setupStore({
        currentTicker: 'NVDA',
        isLoading: false,
        analysis: { ...mockAnalysis, ticker: 'NVDA' },
        activeTab: 'chart',
      });
      rerender(<StockAnalysis />);
      // The ticker header should appear and the elapsed counter should be gone
      expect(screen.queryByText('7s')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 15. Error state — AnalysisError component renders with correct ticker
  // -------------------------------------------------------------------------

  describe('error state — AnalysisError component rendering', () => {
    it('renders the AnalysisError heading with the failed ticker', () => {
      setupStore({ currentTicker: 'BADTICKER', isLoading: false, error: 'not found' });
      render(<StockAnalysis />);
      expect(screen.getByText(/Couldn.*t analyze.*BADTICKER/)).toBeInTheDocument();
    });

    it('maps a 404 error string to a friendly "could not find" message', () => {
      setupStore({ currentTicker: 'XYZ', isLoading: false, error: '404 not found' });
      render(<StockAnalysis />);
      expect(screen.getByText(/couldn.*t find that stock/i)).toBeInTheDocument();
    });

    it('maps a 502 error string to a data-provider message', () => {
      setupStore({ currentTicker: 'XYZ', isLoading: false, error: '502 Bad Gateway' });
      render(<StockAnalysis />);
      expect(screen.getByText(/data provider is temporarily unavailable/i)).toBeInTheDocument();
    });

    it('maps a timeout error string to a retry message', () => {
      setupStore({ currentTicker: 'XYZ', isLoading: false, error: 'timeout exceeded' });
      render(<StockAnalysis />);
      expect(screen.getByText(/took too long/i)).toBeInTheDocument();
    });

    it('renders a "Try again" retry button for the failed ticker', () => {
      setupStore({ currentTicker: 'BADTICKER', isLoading: false, error: 'not found' });
      render(<StockAnalysis />);
      expect(screen.getByText(/Try.*BADTICKER.*again/)).toBeInTheDocument();
    });

    it('shows popular stocks when search returns no results', async () => {
      const { searchStocks: mockSearch } = await import('../../services/stockApi');
      vi.mocked(mockSearch).mockResolvedValueOnce([]);
      setupStore({ currentTicker: 'ZZZZ', isLoading: false, error: 'not found' });
      render(<StockAnalysis />);
      await waitFor(() => {
        // Popular stocks fallback — AAPL is always in the POPULAR_STOCKS list
        expect(screen.getByText('AAPL')).toBeInTheDocument();
      });
    });

    it('calls fetchAnalysis with the original ticker when retry button is clicked', async () => {
      setupStore({ currentTicker: 'BADTICKER', isLoading: false, error: 'not found' });
      render(<StockAnalysis />);
      const retryButton = screen.getByText(/Try.*BADTICKER.*again/);
      fireEvent.click(retryButton);
      expect(mockFetchAnalysis).toHaveBeenCalledWith('BADTICKER');
      // Drain any pending state updates from searchStocks resolving
      await waitFor(() => expect(mockFetchAnalysis).toHaveBeenCalledTimes(1));
    });
  });

  // -------------------------------------------------------------------------
  // 16. invest tab — FinancierInsights renders when financier_analysis exists
  // -------------------------------------------------------------------------

  const mockFinancierAnalysis = {
    perspectives: [
      {
        name: 'Warren Buffett',
        framework: 'Value Investing',
        verdict: 'buy' as const,
        reasoning: 'Wide economic moat and consistent earnings growth.',
        key_metrics_evaluated: ['ROE', 'FCF Yield'],
      },
      {
        name: 'Peter Lynch',
        framework: 'Growth at Reasonable Price',
        verdict: 'hold' as const,
        reasoning: 'PEG ratio slightly elevated.',
        key_metrics_evaluated: ['PEG', 'EPS Growth'],
      },
    ],
    consensus_verdict: 'buy' as const,
    consensus_reasoning: 'Strong fundamentals with a minor valuation premium.',
  };

  describe('analysis loaded — invest tab (with financier_analysis, no outlook)', () => {
    beforeEach(() =>
      setupStore({
        currentTicker: 'AAPL',
        analysis: {
          ...mockAnalysis,
          long_term_outlook: null,
          financier_analysis: mockFinancierAnalysis,
        },
        activeTab: 'invest',
      }),
    );

    it('renders the Legendary Investor Analysis heading', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Legendary Investor Analysis')).toBeInTheDocument();
    });

    it('renders the consensus verdict badge', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Consensus: BUY')).toBeInTheDocument();
    });

    it('renders each financier perspective card by name', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Warren Buffett')).toBeInTheDocument();
      expect(screen.getByText('Peter Lynch')).toBeInTheDocument();
    });

    it('renders perspective reasoning text', () => {
      render(<StockAnalysis />);
      expect(
        screen.getByText('Wide economic moat and consistent earnings growth.'),
      ).toBeInTheDocument();
    });

    it('renders the consensus reasoning summary', () => {
      render(<StockAnalysis />);
      expect(
        screen.getByText(/Strong fundamentals with a minor valuation premium\./),
      ).toBeInTheDocument();
    });

    it('does NOT render InvestmentOutlook (no outlook data)', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Price Trajectory')).not.toBeInTheDocument();
    });

    it('does NOT render the "not available" fallback because financier data is present', () => {
      render(<StockAnalysis />);
      expect(
        screen.queryByText('Long-term outlook data not available for this stock.'),
      ).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 17. invest tab — both outlook AND financier_analysis present simultaneously
  // -------------------------------------------------------------------------

  describe('analysis loaded — invest tab (both outlook and financier_analysis)', () => {
    beforeEach(() =>
      setupStore({
        currentTicker: 'AAPL',
        analysis: {
          ...mockAnalysis,
          long_term_outlook: {
            one_year: { low: 190, mid: 210, high: 230, confidence: 0.72 },
            five_year: { low: 240, mid: 290, high: 350, confidence: 0.6 },
            ten_year: { low: 300, mid: 400, high: 520, confidence: 0.45 },
            verdict: 'buy' as const,
            verdict_rationale: 'Solid long-term growth story.',
            catalysts: ['Services expansion'],
            long_term_risks: ['Margin compression'],
            compound_annual_return: 10.0,
          },
          financier_analysis: mockFinancierAnalysis,
        },
        activeTab: 'invest',
      }),
    );

    it('renders InvestmentOutlook (BUY FOR LONG TERM banner)', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('BUY FOR LONG TERM')).toBeInTheDocument();
    });

    it('renders FinancierInsights (Legendary Investor Analysis heading)', () => {
      render(<StockAnalysis />);
      expect(screen.getByText('Legendary Investor Analysis')).toBeInTheDocument();
    });

    it('does NOT render the "not available" fallback when both are present', () => {
      render(<StockAnalysis />);
      expect(
        screen.queryByText('Long-term outlook data not available for this stock.'),
      ).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 18. invest tab — explicit empty-state check (both null)
  // -------------------------------------------------------------------------

  describe('analysis loaded — invest tab (empty state: both null)', () => {
    beforeEach(() =>
      setupStore({
        currentTicker: 'AAPL',
        analysis: {
          ...mockAnalysis,
          long_term_outlook: null,
          financier_analysis: null,
        },
        activeTab: 'invest',
      }),
    );

    it('renders the "not available" fallback paragraph', () => {
      render(<StockAnalysis />);
      expect(
        screen.getByText('Long-term outlook data not available for this stock.'),
      ).toBeInTheDocument();
    });

    it('does not render InvestmentOutlook content', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Price Trajectory')).not.toBeInTheDocument();
      expect(screen.queryByText(/FOR LONG TERM/)).not.toBeInTheDocument();
    });

    it('does not render FinancierInsights content', () => {
      render(<StockAnalysis />);
      expect(screen.queryByText('Legendary Investor Analysis')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 19. hydration gate — returns null before persist middleware has hydrated
  // -------------------------------------------------------------------------

  describe('hydration gate (line 48)', () => {
    it('renders a loading spinner when hasHydrated is false', () => {
      const store = {
        currentTicker: 'AAPL',
        analysis: null,
        isLoading: false,
        error: null,
        activeTab: 'chart' as const,
        setActiveTab: mockSetActiveTab,
        fetchAnalysis: mockFetchAnalysis,
      };
      vi.mocked(useStockStore).mockImplementation(
        (selector: (s: typeof store) => unknown) => selector(store),
      );
      (useStockStore as unknown as Record<string, unknown>).persist = {
        hasHydrated: () => false,
        onFinishHydration: () => () => {},
      };

      const { container } = render(<StockAnalysis />);
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('does not render LandingHero while store is not yet hydrated', () => {
      const store = {
        currentTicker: null as string | null,
        analysis: null,
        isLoading: false,
        error: null,
        activeTab: 'chart' as const,
        setActiveTab: mockSetActiveTab,
        fetchAnalysis: mockFetchAnalysis,
      };
      vi.mocked(useStockStore).mockImplementation(
        (selector: (s: typeof store) => unknown) => selector(store),
      );
      (useStockStore as unknown as Record<string, unknown>).persist = {
        hasHydrated: () => false,
        onFinishHydration: () => () => {},
      };

      render(<StockAnalysis />);
      expect(screen.queryByText(/AI-Powered/)).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 20. null analysis guard (line 86 coverage)
  // -------------------------------------------------------------------------

  describe('null analysis guard (line 86)', () => {
    it('falls back to LandingHero when ticker is set but analysis is null', () => {
      setupStore({
        currentTicker: 'AAPL',
        analysis: null,
        isLoading: false,
        error: null,
      });
      render(<StockAnalysis />);
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('does not render any tab content when analysis is null', () => {
      setupStore({
        currentTicker: 'AAPL',
        analysis: null,
        isLoading: false,
        error: null,
      });
      render(<StockAnalysis />);
      expect(screen.queryByRole('button', { name: /chart/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /news/i })).not.toBeInTheDocument();
    });
  });
});
