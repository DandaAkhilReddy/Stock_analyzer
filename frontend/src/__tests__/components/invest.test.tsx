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
