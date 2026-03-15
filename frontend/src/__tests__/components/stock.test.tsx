/**
 * Tests for stock display components:
 *   StockHeader, PriceCard, KeyStats, MetricsBar
 *
 * Covers: happy paths, null/N/A values, formatting helpers, change sign logic.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { children?: React.ReactNode }) => (
      <tr {...props}>{children}</tr>
    ),
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useTransform: () => 0,
}));

import { StockHeader } from '../../components/stock/StockHeader';
import { KeyStats } from '../../components/stock/KeyStats';
import { MetricsBar } from '../../components/stock/MetricsBar';
import type { StockAnalysisResponse } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Shared mock fixture
// ---------------------------------------------------------------------------

const mockAnalysis: StockAnalysisResponse = {
  ticker: 'AAPL',
  company_name: 'Apple Inc.',
  current_price: 185.50,
  previous_close: 184.20,
  open: 184.80,
  day_high: 186.10,
  day_low: 184.00,
  volume: 45_000_000,
  market_cap: '2.8T',
  pe_ratio: 28.5,
  eps: 6.51,
  week_52_high: 199.62,
  week_52_low: 164.08,
  dividend_yield: 0.0054,
  technical: null,
  news: [],
  quarterly_earnings: [],
  recommendation: 'buy',
  confidence_score: 0.78,
  summary: 'Test summary',
  bull_case: 'Bull',
  bear_case: 'Bear',
  risk_assessment: {
    overall_risk: 'medium',
    risk_factors: [],
    risk_score: 0.45,
  },
  price_predictions: {
    one_week: { low: 183, mid: 186, high: 189, confidence: 0.75 },
    one_month: { low: 180, mid: 190, high: 200, confidence: 0.65 },
    three_months: { low: 175, mid: 195, high: 215, confidence: 0.55 },
  },
  analysis_timestamp: '2025-01-01T00:00:00Z',
  model_used: 'kimi-k2.5',
  disclaimer: 'Test disclaimer',
};

// ---------------------------------------------------------------------------
// StockHeader
// ---------------------------------------------------------------------------

describe('StockHeader', () => {
  it('renders the ticker symbol', () => {
    render(<StockHeader analysis={mockAnalysis} />);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  it('renders the company name', () => {
    render(<StockHeader analysis={mockAnalysis} />);
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  it('renders the current price with two decimal places', () => {
    render(<StockHeader analysis={mockAnalysis} />);
    expect(screen.getByText(/\$185\.50/)).toBeInTheDocument();
  });

  it('renders a recommendation badge with label text', () => {
    render(<StockHeader analysis={mockAnalysis} />);
    expect(screen.getByText('Buy')).toBeInTheDocument();
  });

  it('shows a positive change and percent when current_price > previous_close', () => {
    // change = 185.50 - 184.20 = +1.30, pct ≈ +0.71%
    render(<StockHeader analysis={mockAnalysis} />);
    expect(screen.getByText(/\+1\.30/)).toBeInTheDocument();
    expect(screen.getByText(/\+0\.71%/)).toBeInTheDocument();
  });

  it('shows a negative change when current_price < previous_close', () => {
    const downAnalysis: StockAnalysisResponse = {
      ...mockAnalysis,
      current_price: 182.00,
      previous_close: 184.20,
    };
    render(<StockHeader analysis={downAnalysis} />);
    // change = -2.20
    expect(screen.getByText(/-2\.20/)).toBeInTheDocument();
  });

  it('does not render a change line when previous_close is null', () => {
    const noPrevClose: StockAnalysisResponse = {
      ...mockAnalysis,
      previous_close: null,
    };
    render(<StockHeader analysis={noPrevClose} />);
    // No change span should appear
    expect(screen.queryByText(/\+0\.00/)).not.toBeInTheDocument();
  });

  it('renders the market cap badge when market_cap is provided', () => {
    render(<StockHeader analysis={mockAnalysis} />);
    expect(screen.getByText(/Mkt Cap: 2\.8T/)).toBeInTheDocument();
  });

  it('does not render the market cap badge when market_cap is null', () => {
    const noMarketCap: StockAnalysisResponse = { ...mockAnalysis, market_cap: null };
    render(<StockHeader analysis={noMarketCap} />);
    expect(screen.queryByText(/Mkt Cap:/)).not.toBeInTheDocument();
  });

  it('uses the ticker for the avatar letter when company_name is null (line 27 ?? branch)', () => {
    const noName: StockAnalysisResponse = { ...mockAnalysis, company_name: null };
    const { container } = render(<StockHeader analysis={noName} />);
    // Avatar letter falls back to ticker first char: 'A' from 'AAPL'
    const avatarSpan = container.querySelector('.text-white.font-bold');
    expect(avatarSpan?.textContent).toBe('A');
  });

  it('shows a negative change badge with red styling when change is negative', () => {
    const downAnalysis: StockAnalysisResponse = {
      ...mockAnalysis,
      current_price: 180.00,
      previous_close: 185.00,
    };
    const { container } = render(<StockHeader analysis={downAnalysis} />);
    const redBadge = container.querySelector('.bg-red-50');
    expect(redBadge).toBeInTheDocument();
  });

  it('falls back to raw recommendation string for an unknown recommendation value (line 41 ?? branch)', () => {
    const unknownRec: StockAnalysisResponse = {
      ...mockAnalysis,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recommendation: 'accumulate' as any,
    };
    render(<StockHeader analysis={unknownRec} />);
    // recLabels['accumulate'] is undefined so falls back to 'accumulate'
    expect(screen.getByText('accumulate')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// KeyStats
// ---------------------------------------------------------------------------

describe('KeyStats', () => {
  it('renders the "Key Statistics" card title', () => {
    render(<KeyStats analysis={mockAnalysis} />);
    expect(screen.getByText('Key Statistics')).toBeInTheDocument();
  });

  it('renders 52W High label and value', () => {
    render(<KeyStats analysis={mockAnalysis} />);
    expect(screen.getByText('52W High')).toBeInTheDocument();
    expect(screen.getByText('$199.62')).toBeInTheDocument();
  });

  it('renders 52W Low label and value', () => {
    render(<KeyStats analysis={mockAnalysis} />);
    expect(screen.getByText('52W Low')).toBeInTheDocument();
    expect(screen.getByText('$164.08')).toBeInTheDocument();
  });

  it('renders Market Cap as the raw string from the API', () => {
    render(<KeyStats analysis={mockAnalysis} />);
    expect(screen.getByText('Market Cap')).toBeInTheDocument();
    // market_cap is already a formatted string "2.8T"
    const caps = screen.getAllByText('2.8T');
    expect(caps.length).toBeGreaterThanOrEqual(1);
  });

  it('renders P/E Ratio with two decimal places', () => {
    render(<KeyStats analysis={mockAnalysis} />);
    expect(screen.getByText('P/E Ratio')).toBeInTheDocument();
    expect(screen.getByText('28.50')).toBeInTheDocument();
  });

  it('renders EPS with dollar prefix', () => {
    render(<KeyStats analysis={mockAnalysis} />);
    expect(screen.getByText('EPS')).toBeInTheDocument();
    const epsValues = screen.getAllByText('$6.51');
    expect(epsValues.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Div Yield multiplied by 100 as a percentage', () => {
    // 0.0054 * 100 = 0.54%
    render(<KeyStats analysis={mockAnalysis} />);
    expect(screen.getByText('Div Yield')).toBeInTheDocument();
    expect(screen.getByText('0.54%')).toBeInTheDocument();
  });

  it('renders "N/A" for null week_52_high', () => {
    const noHigh: StockAnalysisResponse = { ...mockAnalysis, week_52_high: null };
    render(<KeyStats analysis={noHigh} />);
    const naItems = screen.getAllByText('N/A');
    expect(naItems.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "N/A" for null dividend_yield', () => {
    const noYield: StockAnalysisResponse = { ...mockAnalysis, dividend_yield: null };
    render(<KeyStats analysis={noYield} />);
    const naItems = screen.getAllByText('N/A');
    expect(naItems.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "N/A" for null pe_ratio', () => {
    const noPE: StockAnalysisResponse = { ...mockAnalysis, pe_ratio: null };
    render(<KeyStats analysis={noPE} />);
    const naItems = screen.getAllByText('N/A');
    expect(naItems.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "N/A" for null market_cap', () => {
    const noCap: StockAnalysisResponse = { ...mockAnalysis, market_cap: null };
    render(<KeyStats analysis={noCap} />);
    const naItems = screen.getAllByText('N/A');
    expect(naItems.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// MetricsBar
// ---------------------------------------------------------------------------

describe('MetricsBar', () => {
  it('renders all 6 metric pill labels', () => {
    render(<MetricsBar analysis={mockAnalysis} />);

    const expectedLabels = ['Market Cap', 'P/E Ratio', 'EPS', '52W High', '52W Low', 'Div Yield'];
    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders Market Cap value from the API string', () => {
    render(<MetricsBar analysis={mockAnalysis} />);
    const caps = screen.getAllByText('2.8T');
    expect(caps.length).toBeGreaterThanOrEqual(1);
  });

  it('renders P/E Ratio formatted to two decimal places', () => {
    render(<MetricsBar analysis={mockAnalysis} />);
    const peValues = screen.getAllByText('28.50');
    expect(peValues.length).toBeGreaterThanOrEqual(1);
  });

  it('renders EPS with dollar prefix', () => {
    render(<MetricsBar analysis={mockAnalysis} />);
    const epsValues = screen.getAllByText('$6.51');
    expect(epsValues.length).toBeGreaterThanOrEqual(1);
  });

  it('renders 52W High formatted as dollar amount', () => {
    render(<MetricsBar analysis={mockAnalysis} />);
    expect(screen.getByText('$199.62')).toBeInTheDocument();
  });

  it('renders 52W Low formatted as dollar amount', () => {
    render(<MetricsBar analysis={mockAnalysis} />);
    expect(screen.getByText('$164.08')).toBeInTheDocument();
  });

  it('renders Div Yield as percentage', () => {
    render(<MetricsBar analysis={mockAnalysis} />);
    const yieldValues = screen.getAllByText('0.54%');
    expect(yieldValues.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "N/A" pill values when all optional fields are null', () => {
    const allNull: StockAnalysisResponse = {
      ...mockAnalysis,
      market_cap: null,
      pe_ratio: null,
      eps: null,
      week_52_high: null,
      week_52_low: null,
      dividend_yield: null,
    };
    render(<MetricsBar analysis={allNull} />);
    const naItems = screen.getAllByText('N/A');
    // All 6 optional pills should show N/A
    expect(naItems).toHaveLength(6);
  });
});
