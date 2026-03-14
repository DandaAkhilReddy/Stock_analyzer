/**
 * Tests for InvestmentOutlook component.
 *
 * Covers:
 *  - All five verdict banners (strong_buy, buy, hold, sell, strong_sell)
 *  - Verdict rationale text rendering
 *  - CAGR conditional display (positive vs. zero vs. negative)
 *  - Price trajectory section with all three HorizonCards
 *  - formatCurrency: sub-10K (2dp) and >=10K (K suffix)
 *  - investmentGrowth: plain, K, M thresholds
 *  - Percentage change sign, color, and bar width clamping
 *  - Confidence percentage rendering
 *  - Growth Catalysts section: present, empty (hidden), multiple items
 *  - Long-Term Risks section: present, empty (hidden), multiple items
 *  - Bottom Line summary: ticker, verdict label, correct color class
 *  - Unknown verdict falls back to HOLD defaults
 *  - "from $X today" header derived from currentPrice
 *
 * framer-motion is stubbed so motion.div renders as a plain <div>,
 * keeping tests fast and deterministic.
 */

import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// framer-motion mock — must come before any component import
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useTransform: () => 0,
}));

// ---------------------------------------------------------------------------
// Component under test
// ---------------------------------------------------------------------------

import { InvestmentOutlook } from '../../components/invest/InvestmentOutlook';
import type { LongTermOutlook, PriceForecast } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const baseForecast: PriceForecast = {
  low: 150.0,
  mid: 200.0,
  high: 250.0,
  confidence: 0.75,
};

const baseOutlook: LongTermOutlook = {
  verdict: 'buy',
  verdict_rationale: 'Strong fundamentals with consistent earnings growth.',
  compound_annual_return: 12.5,
  one_year: { low: 195.0, mid: 210.0, high: 225.0, confidence: 0.8 },
  five_year: { low: 220.0, mid: 280.0, high: 340.0, confidence: 0.65 },
  ten_year: { low: 300.0, mid: 450.0, high: 600.0, confidence: 0.5 },
  catalysts: ['AI product expansion', 'International market growth'],
  long_term_risks: ['Regulatory headwinds', 'Competitive pressure'],
};

const CURRENT_PRICE = 185.5;
const TICKER = 'AAPL';

// ===========================================================================
// Verdict Banner
// ===========================================================================

describe('InvestmentOutlook — Verdict Banner', () => {
  it('renders "BUY FOR LONG TERM" banner for buy verdict', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('BUY FOR LONG TERM')).toBeInTheDocument();
  });

  it('renders "STRONG BUY FOR LONG TERM" banner for strong_buy verdict', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, verdict: 'strong_buy' }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('STRONG BUY FOR LONG TERM')).toBeInTheDocument();
  });

  it('renders "HOLD FOR LONG TERM" banner for hold verdict', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, verdict: 'hold' }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('HOLD FOR LONG TERM')).toBeInTheDocument();
  });

  it('renders "SELL FOR LONG TERM" banner for sell verdict', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, verdict: 'sell' }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('SELL FOR LONG TERM')).toBeInTheDocument();
  });

  it('renders "STRONG SELL FOR LONG TERM" banner for strong_sell verdict', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, verdict: 'strong_sell' }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('STRONG SELL FOR LONG TERM')).toBeInTheDocument();
  });

  it('renders verdict_rationale text in the banner', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(
      screen.getByText('Strong fundamentals with consistent earnings growth.'),
    ).toBeInTheDocument();
  });

  it('renders CAGR when compound_annual_return is positive', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    // compound_annual_return: 12.5 → "~12.5% CAGR"
    expect(screen.getByText('~12.5% CAGR')).toBeInTheDocument();
    expect(screen.getByText('estimated annual return')).toBeInTheDocument();
  });

  it('does not render CAGR when compound_annual_return is 0', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, compound_annual_return: 0 }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.queryByText(/CAGR/)).not.toBeInTheDocument();
    expect(screen.queryByText('estimated annual return')).not.toBeInTheDocument();
  });

  it('does not render CAGR when compound_annual_return is negative', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, compound_annual_return: -5.0 }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.queryByText(/CAGR/)).not.toBeInTheDocument();
  });

  it('falls back to HOLD label for an unrecognised verdict string', () => {
    render(
      <InvestmentOutlook
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outlook={{ ...baseOutlook, verdict: 'unknown_verdict' as any }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getAllByText(/HOLD/)[0]).toBeInTheDocument();
  });
});

// ===========================================================================
// Price Trajectory Section
// ===========================================================================

describe('InvestmentOutlook — Price Trajectory', () => {
  it('renders the "Price Trajectory" section heading', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Price Trajectory')).toBeInTheDocument();
  });

  it('shows current price in the trajectory header', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={185.5}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('from $185.50 today')).toBeInTheDocument();
  });

  it('renders the "1 Year" horizon card label', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('1 Year')).toBeInTheDocument();
  });

  it('renders the "5 Years" horizon card label', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('5 Years')).toBeInTheDocument();
  });

  it('renders the "10 Years" horizon card label', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('10 Years')).toBeInTheDocument();
  });

  it('formats mid price below $10K with two decimal places', () => {
    // one_year.mid = 210.0 → "$210.00"
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('$210.00')).toBeInTheDocument();
  });

  it('formats mid price at or above $10K with K suffix and one decimal place', () => {
    // ten_year.mid = 450.0 — still below 10K; use a forecast where mid >= 10000
    const outlookWithLargeTarget: LongTermOutlook = {
      ...baseOutlook,
      ten_year: { low: 9000, mid: 15000, high: 20000, confidence: 0.4 },
    };
    render(
      <InvestmentOutlook
        outlook={outlookWithLargeTarget}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    // 15000 / 1000 = 15.0 → "$15.0K"
    expect(screen.getByText('$15.0K')).toBeInTheDocument();
  });

  it('renders low price for the 1-year horizon card', () => {
    // one_year.low = 195.0 → "Low: $195.00"
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Low: $195.00')).toBeInTheDocument();
  });

  it('renders high price for the 1-year horizon card', () => {
    // one_year.high = 225.0 → "High: $225.00"
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('High: $225.00')).toBeInTheDocument();
  });

  it('renders confidence percentage for the 1-year horizon card', () => {
    // one_year.confidence: 0.80 → "Confidence: 80%"
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Confidence: 80%')).toBeInTheDocument();
  });

  it('renders confidence percentage for the 5-year horizon card', () => {
    // five_year.confidence: 0.65 → "Confidence: 65%"
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Confidence: 65%')).toBeInTheDocument();
  });

  it('renders confidence percentage for the 10-year horizon card', () => {
    // ten_year.confidence: 0.5 → "Confidence: 50%"
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Confidence: 50%')).toBeInTheDocument();
  });

  it('shows positive percentage change with + prefix when mid > currentPrice', () => {
    // one_year.mid = 210, currentPrice = 185.5
    // change = ((210 - 185.5) / 185.5) * 100 ≈ +13.2%
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('+13.2%')).toBeInTheDocument();
  });

  it('shows negative percentage change without + prefix when mid < currentPrice', () => {
    const bearOutlook: LongTermOutlook = {
      ...baseOutlook,
      one_year: { low: 100.0, mid: 160.0, high: 180.0, confidence: 0.6 },
    };
    // change = ((160 - 185.5) / 185.5) * 100 ≈ -13.7%
    render(
      <InvestmentOutlook
        outlook={bearOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('-13.7%')).toBeInTheDocument();
  });

  it('shows +0.0% when mid equals currentPrice exactly', () => {
    const flatOutlook: LongTermOutlook = {
      ...baseOutlook,
      one_year: { low: 180.0, mid: 185.5, high: 195.0, confidence: 0.7 },
    };
    render(
      <InvestmentOutlook
        outlook={flatOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('+0.0%')).toBeInTheDocument();
  });

  it('renders $10K today → future value investment projection', () => {
    // one_year: shares = 10000/185.5, futureVal = shares * 210
    // ≈ 53.9 shares × $210 = ~$11319 → "$11.3K"
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    // All three cards produce investment projections; at least one must be present
    const projections = screen.getAllByText('$10K today');
    expect(projections.length).toBeGreaterThanOrEqual(1);
  });

  it('formats investment projection as M suffix when futureValue >= $1M', () => {
    // Craft a scenario: 10000 / 10 * 2000 = $2,000,000 → "$2.00M"
    const moonOutlook: LongTermOutlook = {
      ...baseOutlook,
      ten_year: { low: 1000, mid: 2000, high: 3000, confidence: 0.3 },
    };
    render(
      <InvestmentOutlook
        outlook={moonOutlook}
        currentPrice={10}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('$2.00M')).toBeInTheDocument();
  });

  it('clamps progress bar width to 5% minimum when change is very negative', () => {
    // change = -100% → width = Math.min(Math.max(-100 + 50, 5), 100) = 5%
    const crashOutlook: LongTermOutlook = {
      ...baseOutlook,
      one_year: { low: 0.1, mid: 0.1, high: 0.1, confidence: 0.1 },
    };
    const { container } = render(
      <InvestmentOutlook
        outlook={crashOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    const bars = container.querySelectorAll<HTMLElement>('[style*="width: 5%"]');
    expect(bars.length).toBeGreaterThanOrEqual(1);
  });

  it('clamps progress bar width to 100% maximum when change is very positive', () => {
    // change = +200% → Math.min(Math.max(200 + 50, 5), 100) = 100%
    const rocketOutlook: LongTermOutlook = {
      ...baseOutlook,
      one_year: { low: 400, mid: 600, high: 800, confidence: 0.5 },
    };
    const { container } = render(
      <InvestmentOutlook
        outlook={rocketOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    const bars = container.querySelectorAll<HTMLElement>('[style*="width: 100%"]');
    expect(bars.length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================================================
// Growth Catalysts Section
// ===========================================================================

describe('InvestmentOutlook — Growth Catalysts', () => {
  it('renders the "Growth Catalysts" heading when catalysts are present', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Growth Catalysts')).toBeInTheDocument();
  });

  it('renders each catalyst as a list item', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('AI product expansion')).toBeInTheDocument();
    expect(screen.getByText('International market growth')).toBeInTheDocument();
  });

  it('does not render Growth Catalysts section when catalysts array is empty', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, catalysts: [] }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.queryByText('Growth Catalysts')).not.toBeInTheDocument();
  });

  it('renders all three catalyst items when three are provided', () => {
    const outlookWithThree: LongTermOutlook = {
      ...baseOutlook,
      catalysts: ['Catalyst Alpha', 'Catalyst Beta', 'Catalyst Gamma'],
    };
    render(
      <InvestmentOutlook
        outlook={outlookWithThree}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Catalyst Alpha')).toBeInTheDocument();
    expect(screen.getByText('Catalyst Beta')).toBeInTheDocument();
    expect(screen.getByText('Catalyst Gamma')).toBeInTheDocument();
  });

  it('renders a single catalyst without crashing', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, catalysts: ['Only catalyst'] }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Only catalyst')).toBeInTheDocument();
  });
});

// ===========================================================================
// Long-Term Risks Section
// ===========================================================================

describe('InvestmentOutlook — Long-Term Risks', () => {
  it('renders the "Long-Term Risks" heading when risks are present', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Long-Term Risks')).toBeInTheDocument();
  });

  it('renders each risk factor as a list item', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Regulatory headwinds')).toBeInTheDocument();
    expect(screen.getByText('Competitive pressure')).toBeInTheDocument();
  });

  it('does not render Long-Term Risks section when risks array is empty', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, long_term_risks: [] }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.queryByText('Long-Term Risks')).not.toBeInTheDocument();
  });

  it('renders all three risk items when three are provided', () => {
    const outlookWithThreeRisks: LongTermOutlook = {
      ...baseOutlook,
      long_term_risks: ['Risk One', 'Risk Two', 'Risk Three'],
    };
    render(
      <InvestmentOutlook
        outlook={outlookWithThreeRisks}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Risk One')).toBeInTheDocument();
    expect(screen.getByText('Risk Two')).toBeInTheDocument();
    expect(screen.getByText('Risk Three')).toBeInTheDocument();
  });

  it('renders both catalysts and risks sections simultaneously when both are populated', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Growth Catalysts')).toBeInTheDocument();
    expect(screen.getByText('Long-Term Risks')).toBeInTheDocument();
  });

  it('renders neither section when both arrays are empty', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, catalysts: [], long_term_risks: [] }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.queryByText('Growth Catalysts')).not.toBeInTheDocument();
    expect(screen.queryByText('Long-Term Risks')).not.toBeInTheDocument();
  });
});

// ===========================================================================
// Bottom Line Card
// ===========================================================================

describe('InvestmentOutlook — Bottom Line Card', () => {
  it('renders the ticker symbol in the bottom line sentence', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker="TSLA"
      />,
    );
    expect(screen.getByText('TSLA')).toBeInTheDocument();
  });

  it('renders the verdict label in the bottom line sentence', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    // "BUY" appears both in the banner and the bottom line
    const buyMatches = screen.getAllByText('BUY');
    expect(buyMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('applies emerald text class for buy verdicts in the bottom line', () => {
    const { container } = render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    // The verdict span in the bottom-line card carries text-emerald-600 for 'buy'
    const emeraldSpan = container.querySelector('span.text-emerald-600');
    expect(emeraldSpan).toBeInTheDocument();
  });

  it('applies red text class for sell verdicts in the bottom line', () => {
    const { container } = render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, verdict: 'strong_sell' }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    const redSpan = container.querySelector('span.text-red-600');
    expect(redSpan).toBeInTheDocument();
  });

  it('applies amber text class for hold verdict in the bottom line', () => {
    const { container } = render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, verdict: 'hold' }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    const amberSpan = container.querySelector('span.text-amber-600');
    expect(amberSpan).toBeInTheDocument();
  });

  it('renders the long-term disclaimer text at the bottom', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(
      screen.getByText(
        'Long-term investing historically outperforms short-term trading. Time in the market beats timing the market.',
      ),
    ).toBeInTheDocument();
  });

  it('renders "for long-term investors" text in the bottom line', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText(/for long-term investors\./)).toBeInTheDocument();
  });
});

// ===========================================================================
// Edge Cases & Integration
// ===========================================================================

describe('InvestmentOutlook — Edge Cases', () => {
  it('renders without crashing when verdict_rationale is an empty string', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, verdict_rationale: '' }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('BUY FOR LONG TERM')).toBeInTheDocument();
  });

  it('renders without crashing when currentPrice is a fractional value', () => {
    render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={0.99}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('from $0.99 today')).toBeInTheDocument();
  });

  it('renders CAGR with one decimal place precision', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, compound_annual_return: 8.0 }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('~8.0% CAGR')).toBeInTheDocument();
  });

  it('renders all four section cards in the output', () => {
    const { container } = render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    // Outer wrapper is the space-y-4 div; it should have at least 3 direct children:
    // verdict card, trajectory card, catalysts+risks grid, bottom line card
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.children.length).toBeGreaterThanOrEqual(3);
  });

  it('formats investment result as plain dollar amount (no suffix) for sub-$10K outcome', () => {
    // shares = 10000 / 185.5, futureVal = shares * 195 (one_year.mid-ish)
    // Use a low mid price to keep futureVal < $10K
    const lowOutlook: LongTermOutlook = {
      ...baseOutlook,
      one_year: { low: 80, mid: 90, high: 100, confidence: 0.6 },
    };
    render(
      <InvestmentOutlook
        outlook={lowOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    // futureVal = (10000 / 185.5) * 90 ≈ $4851 → "$4851"
    const projectionElement = screen.getByText(/\$4\d{3}/);
    expect(projectionElement).toBeInTheDocument();
  });
});

// ===========================================================================
// formatCurrency helper (tested via HorizonCard rendering)
// ===========================================================================

describe('InvestmentOutlook — formatCurrency via HorizonCard', () => {
  it('formats a price of exactly $10000 as "$10.0K"', () => {
    const boundaryOutlook: LongTermOutlook = {
      ...baseOutlook,
      one_year: { low: 9999, mid: 10000, high: 10001, confidence: 0.7 },
    };
    render(
      <InvestmentOutlook
        outlook={boundaryOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('$10.0K')).toBeInTheDocument();
  });

  it('formats a price of $9999.99 with two decimal places', () => {
    const subKOutlook: LongTermOutlook = {
      ...baseOutlook,
      one_year: { low: 9000, mid: 9999.99, high: 10000, confidence: 0.7 },
    };
    render(
      <InvestmentOutlook
        outlook={subKOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('$9999.99')).toBeInTheDocument();
  });

  it('formats high forecast value using K suffix when it exceeds $10K', () => {
    const highOutlook: LongTermOutlook = {
      ...baseOutlook,
      ten_year: { low: 5000, mid: 8000, high: 12500, confidence: 0.4 },
    };
    render(
      <InvestmentOutlook
        outlook={highOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    // high: 12500 → "$12.5K"
    expect(screen.getByText('High: $12.5K')).toBeInTheDocument();
  });
});

// ===========================================================================
// InvestmentOutlook — Additional Edge Cases (uncovered paths)
// ===========================================================================

describe('InvestmentOutlook — Additional Edge Cases', () => {
  it('formats an extreme price above $100K with K suffix', () => {
    // mid = 150000 → "$150.0K"
    const extremeOutlook: LongTermOutlook = {
      ...baseOutlook,
      ten_year: { low: 100000, mid: 150000, high: 200000, confidence: 0.3 },
    };
    render(
      <InvestmentOutlook
        outlook={extremeOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('$150.0K')).toBeInTheDocument();
  });

  it('calculates investment growth correctly: $10K at $100 → $200 target yields $20K', () => {
    // shares = 10000 / 100 = 100, futureVal = 100 * 200 = 20000 → "$20.0K"
    const growthOutlook: LongTermOutlook = {
      ...baseOutlook,
      one_year: { low: 180, mid: 200, high: 220, confidence: 0.7 },
    };
    render(
      <InvestmentOutlook
        outlook={growthOutlook}
        currentPrice={100}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('$20.0K')).toBeInTheDocument();
  });

  it('renders very small confidence (0.01) as "1%"', () => {
    const tinyConfidenceOutlook: LongTermOutlook = {
      ...baseOutlook,
      one_year: { low: 180, mid: 190, high: 200, confidence: 0.01 },
    };
    render(
      <InvestmentOutlook
        outlook={tinyConfidenceOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('Confidence: 1%')).toBeInTheDocument();
  });

  it('applies red border accent for HorizonCard when forecast mid is below current price', () => {
    // one_year.mid = 100 < CURRENT_PRICE (185.5) → border-l-red-500
    const bearOutlook: LongTermOutlook = {
      ...baseOutlook,
      one_year: { low: 80, mid: 100, high: 130, confidence: 0.6 },
    };
    const { container } = render(
      <InvestmentOutlook
        outlook={bearOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    const redAccentCard = container.querySelector('.border-l-red-500');
    expect(redAccentCard).toBeInTheDocument();
  });

  it('applies emerald border accent for HorizonCard when forecast mid is above current price', () => {
    // one_year.mid = 210 > CURRENT_PRICE (185.5) → border-l-emerald-500
    const { container } = render(
      <InvestmentOutlook
        outlook={baseOutlook}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    const emeraldAccentCard = container.querySelector('.border-l-emerald-500');
    expect(emeraldAccentCard).toBeInTheDocument();
  });

  it('renders only verdict and trajectory when both catalysts and risks are empty', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, catalysts: [], long_term_risks: [] }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('BUY FOR LONG TERM')).toBeInTheDocument();
    expect(screen.getByText('Price Trajectory')).toBeInTheDocument();
    expect(screen.queryByText('Growth Catalysts')).not.toBeInTheDocument();
    expect(screen.queryByText('Long-Term Risks')).not.toBeInTheDocument();
  });

  it('renders correct label for strong_buy verdict in the banner', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, verdict: 'strong_buy' }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('STRONG BUY FOR LONG TERM')).toBeInTheDocument();
  });

  it('renders correct label for sell verdict in the banner', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, verdict: 'sell' }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('SELL FOR LONG TERM')).toBeInTheDocument();
  });

  it('renders correct label for strong_sell verdict in the banner', () => {
    render(
      <InvestmentOutlook
        outlook={{ ...baseOutlook, verdict: 'strong_sell' }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    expect(screen.getByText('STRONG SELL FOR LONG TERM')).toBeInTheDocument();
  });

  it('falls back to HOLD styling for an unknown verdict string', () => {
    const { container } = render(
      <InvestmentOutlook
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        outlook={{ ...baseOutlook, verdict: 'garbage' as any }}
        currentPrice={CURRENT_PRICE}
        ticker={TICKER}
      />,
    );
    // verdictBg fallback → bg-amber-50 border-amber-200 (hold)
    const holdBg = container.querySelector('.bg-amber-50');
    expect(holdBg).toBeInTheDocument();
  });
});

// ===========================================================================
// FinancierInsights component tests
// ===========================================================================

import { FinancierInsights } from '../../components/invest/FinancierInsights';
import type { FinancierAnalysis, FinancierPerspective } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makePerspective = (
  overrides: Partial<FinancierPerspective> = {},
): FinancierPerspective => ({
  name: 'Warren Buffett',
  framework: 'Value Investing',
  verdict: 'buy',
  reasoning: 'Strong moat and consistent cash flows.',
  key_metrics_evaluated: ['ROE', 'P/E ratio'],
  ...overrides,
});

const baseFinancierAnalysis: FinancierAnalysis = {
  perspectives: [
    makePerspective({ name: 'Warren Buffett', verdict: 'buy' }),
    makePerspective({ name: 'Peter Lynch', framework: 'Growth at Reasonable Price', verdict: 'buy' }),
    makePerspective({ name: 'Benjamin Graham', framework: 'Deep Value', verdict: 'hold' }),
    makePerspective({ name: 'Ray Dalio', framework: 'Risk Parity', verdict: 'hold' }),
    makePerspective({ name: 'Cathie Wood', framework: 'Disruptive Innovation', verdict: 'sell' }),
  ],
  consensus_verdict: 'hold',
  consensus_reasoning: 'Mixed signals across frameworks suggest a cautious hold.',
};

// ===========================================================================
// FinancierInsights — Empty perspectives (returns null)
// ===========================================================================

describe('FinancierInsights — Empty perspectives', () => {
  it('renders nothing when perspectives array is empty', () => {
    const { container } = render(
      <FinancierInsights
        analysis={{ ...baseFinancierAnalysis, perspectives: [] }}
        ticker="AAPL"
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});

// ===========================================================================
// FinancierInsights — Header and consensus
// ===========================================================================

describe('FinancierInsights — Header and consensus', () => {
  it('renders the "Legendary Investor Analysis" heading', () => {
    render(<FinancierInsights analysis={baseFinancierAnalysis} ticker="AAPL" />);
    expect(screen.getByText('Legendary Investor Analysis')).toBeInTheDocument();
  });

  it('renders the consensus verdict badge', () => {
    render(<FinancierInsights analysis={baseFinancierAnalysis} ticker="AAPL" />);
    expect(screen.getByText('Consensus: HOLD')).toBeInTheDocument();
  });

  it('renders consensus_reasoning when it is non-empty', () => {
    render(<FinancierInsights analysis={baseFinancierAnalysis} ticker="AAPL" />);
    // The reasoning text is a sibling text node to the ticker <span>,
    // so match with a regex against the containing paragraph.
    expect(
      screen.getByText(/Mixed signals across frameworks suggest a cautious hold\./),
    ).toBeInTheDocument();
  });

  it('does not render consensus summary section when consensus_reasoning is empty', () => {
    render(
      <FinancierInsights
        analysis={{ ...baseFinancierAnalysis, consensus_reasoning: '' }}
        ticker="AAPL"
      />,
    );
    // The ticker + reasoning paragraph only appears inside the consensus Card
    expect(
      screen.queryByText(/Mixed signals/),
    ).not.toBeInTheDocument();
  });

  it('renders the ticker inside the consensus summary', () => {
    render(<FinancierInsights analysis={baseFinancierAnalysis} ticker="NVDA" />);
    expect(screen.getByText('NVDA')).toBeInTheDocument();
  });
});

// ===========================================================================
// FinancierInsights — Perspective cards
// ===========================================================================

describe('FinancierInsights — Perspective cards', () => {
  it('renders exactly one card when there is a single perspective', () => {
    const singleAnalysis: FinancierAnalysis = {
      perspectives: [makePerspective({ name: 'Warren Buffett', verdict: 'buy' })],
      consensus_verdict: 'buy',
      consensus_reasoning: 'Only one voice but a strong one.',
    };
    render(<FinancierInsights analysis={singleAnalysis} ticker="AAPL" />);
    expect(screen.getByText('Warren Buffett')).toBeInTheDocument();
    expect(screen.getByText('Value Investing')).toBeInTheDocument();
    expect(screen.getByText('Strong moat and consistent cash flows.')).toBeInTheDocument();
  });

  it('renders the correct BUY badge for a buy verdict', () => {
    const buyOnlyAnalysis: FinancierAnalysis = {
      perspectives: [makePerspective({ verdict: 'buy' })],
      consensus_verdict: 'buy',
      consensus_reasoning: '',
    };
    render(<FinancierInsights analysis={buyOnlyAnalysis} ticker="AAPL" />);
    // Both the perspective card badge and the consensus badge say "BUY"
    const buyBadges = screen.getAllByText('BUY');
    expect(buyBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the correct SELL badge for a sell verdict', () => {
    const sellAnalysis: FinancierAnalysis = {
      perspectives: [makePerspective({ verdict: 'sell' })],
      consensus_verdict: 'sell',
      consensus_reasoning: '',
    };
    render(<FinancierInsights analysis={sellAnalysis} ticker="AAPL" />);
    const sellBadges = screen.getAllByText('SELL');
    expect(sellBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the correct HOLD badge for a hold verdict', () => {
    const holdAnalysis: FinancierAnalysis = {
      perspectives: [makePerspective({ verdict: 'hold' })],
      consensus_verdict: 'hold',
      consensus_reasoning: '',
    };
    render(<FinancierInsights analysis={holdAnalysis} ticker="AAPL" />);
    const holdBadges = screen.getAllByText('HOLD');
    expect(holdBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('uses Users fallback icon for an unknown financier name', () => {
    // The Users icon is used for the component header and as the fallback icon.
    // With an unknown name we cannot distinguish the icon visually in JSDOM,
    // but the card must render the name and not throw.
    render(
      <FinancierInsights
        analysis={{
          ...baseFinancierAnalysis,
          perspectives: [
            makePerspective({ name: 'Unknown Guru', verdict: 'hold' }),
          ],
        }}
        ticker="AAPL"
      />,
    );
    expect(screen.getByText('Unknown Guru')).toBeInTheDocument();
  });

  it('renders metric pills when key_metrics_evaluated is non-empty', () => {
    render(
      <FinancierInsights
        analysis={{
          ...baseFinancierAnalysis,
          perspectives: [
            makePerspective({ key_metrics_evaluated: ['P/E', 'ROE', 'FCF'] }),
          ],
        }}
        ticker="AAPL"
      />,
    );
    expect(screen.getByText('P/E')).toBeInTheDocument();
    expect(screen.getByText('ROE')).toBeInTheDocument();
    expect(screen.getByText('FCF')).toBeInTheDocument();
  });

  it('does not render any metric pills when key_metrics_evaluated is empty', () => {
    render(
      <FinancierInsights
        analysis={{
          ...baseFinancierAnalysis,
          perspectives: [
            makePerspective({ key_metrics_evaluated: [] }),
          ],
        }}
        ticker="AAPL"
      />,
    );
    // No pill-like spans with metric text should appear for the empty array case.
    // We verify the cards section is present but no metric text renders.
    expect(screen.getByText('Warren Buffett')).toBeInTheDocument();
    // The metric container is conditionally rendered; query for a known absent metric.
    expect(screen.queryByText('P/E')).not.toBeInTheDocument();
    expect(screen.queryByText('ROE')).not.toBeInTheDocument();
  });

  it('renders all five perspective cards for full financier set', () => {
    render(<FinancierInsights analysis={baseFinancierAnalysis} ticker="AAPL" />);
    expect(screen.getByText('Warren Buffett')).toBeInTheDocument();
    expect(screen.getByText('Peter Lynch')).toBeInTheDocument();
    expect(screen.getByText('Benjamin Graham')).toBeInTheDocument();
    expect(screen.getByText('Ray Dalio')).toBeInTheDocument();
    expect(screen.getByText('Cathie Wood')).toBeInTheDocument();
  });
});

// ===========================================================================
// FinancierInsights — ConsensusBar segment visibility
// ===========================================================================

describe('FinancierInsights — ConsensusBar', () => {
  it('renders only the green segment when all perspectives are buy', () => {
    const allBuy: FinancierAnalysis = {
      perspectives: [
        makePerspective({ name: 'Warren Buffett', verdict: 'buy' }),
        makePerspective({ name: 'Peter Lynch', verdict: 'buy' }),
        makePerspective({ name: 'Benjamin Graham', verdict: 'buy' }),
      ],
      consensus_verdict: 'buy',
      consensus_reasoning: 'Unanimous buy.',
    };
    const { container } = render(
      <FinancierInsights analysis={allBuy} ticker="AAPL" />,
    );
    // Green bar present, amber and red absent from the consensus bar
    expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument();
    // "3 Buy" label visible, no Hold or Sell labels in the bar legend
    expect(screen.getByText('3 Buy')).toBeInTheDocument();
    expect(screen.queryByText(/Hold/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sell/)).not.toBeInTheDocument();
  });

  it('renders only the red segment when all perspectives are sell', () => {
    const allSell: FinancierAnalysis = {
      perspectives: [
        makePerspective({ name: 'Warren Buffett', verdict: 'sell' }),
        makePerspective({ name: 'Peter Lynch', verdict: 'sell' }),
        makePerspective({ name: 'Benjamin Graham', verdict: 'sell' }),
      ],
      consensus_verdict: 'sell',
      consensus_reasoning: 'Unanimous sell.',
    };
    const { container } = render(
      <FinancierInsights analysis={allSell} ticker="AAPL" />,
    );
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
    expect(screen.getByText('3 Sell')).toBeInTheDocument();
    expect(screen.queryByText(/Buy/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hold/)).not.toBeInTheDocument();
  });

  it('renders all three segments when verdicts are mixed', () => {
    // baseFinancierAnalysis has 2 buy, 2 hold, 1 sell
    const { container } = render(
      <FinancierInsights analysis={baseFinancierAnalysis} ticker="AAPL" />,
    );
    expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument();
    expect(container.querySelector('.bg-amber-400')).toBeInTheDocument();
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
    expect(screen.getByText('2 Buy')).toBeInTheDocument();
    expect(screen.getByText('2 Hold')).toBeInTheDocument();
    expect(screen.getByText('1 Sell')).toBeInTheDocument();
  });

  it('renders bar widths proportional to verdict counts', () => {
    // 3 perspectives: 2 buy (66.67%), 1 hold (33.33%), 0 sell
    const twoOneZero: FinancierAnalysis = {
      perspectives: [
        makePerspective({ name: 'Warren Buffett', verdict: 'buy' }),
        makePerspective({ name: 'Peter Lynch', verdict: 'buy' }),
        makePerspective({ name: 'Benjamin Graham', verdict: 'hold' }),
      ],
      consensus_verdict: 'buy',
      consensus_reasoning: '',
    };
    const { container } = render(
      <FinancierInsights analysis={twoOneZero} ticker="AAPL" />,
    );
    const greenBar = container.querySelector<HTMLElement>('.bg-emerald-500[style]');
    const amberBar = container.querySelector<HTMLElement>('.bg-amber-400[style]');
    expect(greenBar?.style.width).toBe('66.66666666666666%');
    expect(amberBar?.style.width).toBe('33.33333333333333%');
  });
});

// ===========================================================================
// FinancierInsights — uncovered line gaps
// ===========================================================================

describe('FinancierInsights — PerspectiveCard with unknown financier name (line 64)', () => {
  // financierIcons lookup falls back to Users when the name is not in the map.
  // The card must still render and not throw, and the name must be visible.
  it('renders perspective card for a completely unknown financier name', () => {
    render(
      <FinancierInsights
        analysis={{
          perspectives: [
            {
              name: 'Unknown Legend',
              framework: 'Mystery Framework',
              verdict: 'buy',
              reasoning: 'Unknown reasons.',
              key_metrics_evaluated: [],
            },
          ],
          consensus_verdict: 'buy',
          consensus_reasoning: '',
        }}
        ticker="AAPL"
      />,
    );
    expect(screen.getByText('Unknown Legend')).toBeInTheDocument();
    expect(screen.getByText('Mystery Framework')).toBeInTheDocument();
    expect(screen.getByText('Unknown reasons.')).toBeInTheDocument();
  });

  it('renders a BUY badge for the unknown-name perspective card', () => {
    render(
      <FinancierInsights
        analysis={{
          perspectives: [
            {
              name: 'Ghost Investor',
              framework: 'Quantum Investing',
              verdict: 'buy',
              reasoning: 'Vibes.',
              key_metrics_evaluated: ['EV/EBITDA'],
            },
          ],
          consensus_verdict: 'buy',
          consensus_reasoning: '',
        }}
        ticker="TSLA"
      />,
    );
    // Both the perspective badge and consensus badge say BUY
    const buyBadges = screen.getAllByText('BUY');
    expect(buyBadges.length).toBeGreaterThanOrEqual(1);
  });
});

describe('FinancierInsights — consensusStyle fallback for unknown verdict (line 112)', () => {
  // verdictStyles lookup falls back to verdictStyles.hold when consensus_verdict
  // is not one of buy/hold/sell. The component must render without throwing.
  it('falls back to HOLD styling when consensus_verdict is an unknown string', () => {
    const { container } = render(
      <FinancierInsights
        analysis={{
          perspectives: [
            {
              name: 'Warren Buffett',
              framework: 'Value Investing',
              verdict: 'buy',
              reasoning: 'Strong moat.',
              key_metrics_evaluated: [],
            },
          ],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          consensus_verdict: 'unknown_verdict' as any,
          consensus_reasoning: 'Mixed signals.',
        }}
        ticker="AAPL"
      />,
    );
    // The consensus badge should display "HOLD" (fallback label)
    expect(screen.getByText('Consensus: HOLD')).toBeInTheDocument();
    // The badge should carry the amber hold background class
    const holdBadge = container.querySelector('.bg-amber-100');
    expect(holdBadge).toBeInTheDocument();
  });

  it('renders the component body correctly when consensus_verdict falls back to hold', () => {
    render(
      <FinancierInsights
        analysis={{
          perspectives: [
            {
              name: 'Peter Lynch',
              framework: 'Growth',
              verdict: 'sell',
              reasoning: 'Overvalued.',
              key_metrics_evaluated: ['PEG'],
            },
          ],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          consensus_verdict: 'garbage' as any,
          consensus_reasoning: '',
        }}
        ticker="NVDA"
      />,
    );
    // Header and perspective card must still render
    expect(screen.getByText('Legendary Investor Analysis')).toBeInTheDocument();
    expect(screen.getByText('Peter Lynch')).toBeInTheDocument();
  });
});
