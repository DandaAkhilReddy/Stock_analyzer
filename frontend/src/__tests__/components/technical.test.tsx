/**
 * Tests for technical components: SupportResistance, TechnicalSummary.
 *
 * TechnicalSummary maps TechnicalSnapshot fields to indicator rows and
 * derives per-row buy/sell/neutral signals; all branches are exercised here.
 *
 * SupportResistance renders level grids or an empty-state null.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useTransform: () => 0,
}));

import { SupportResistance } from '../../components/technical/SupportResistance';
import { TechnicalSummary } from '../../components/technical/TechnicalSummary';
import type { TechnicalSnapshot } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseTechnical: TechnicalSnapshot = {
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
  support_levels: [180.0, 175.0],
  resistance_levels: [190.0, 195.0],
  signal: 'buy',
};

// ===========================================================================
// SupportResistance
// ===========================================================================

describe('SupportResistance', () => {
  // -------------------------------------------------------------------------
  // Empty state — returns null when both arrays are empty
  // -------------------------------------------------------------------------

  it('renders nothing when both support and resistance arrays are empty', () => {
    const { container } = render(
      <SupportResistance currentPrice={185.5} supportLevels={[]} resistanceLevels={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Section heading rendered when data is present
  // -------------------------------------------------------------------------

  it('renders the "Support & Resistance" heading when data is present', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[180.0]}
        resistanceLevels={[190.0]}
      />,
    );
    expect(screen.getByText('Support & Resistance')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Support levels
  // -------------------------------------------------------------------------

  it('renders "Support Levels" section label', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[180.0]}
        resistanceLevels={[]}
      />,
    );
    expect(screen.getByText('Support Levels')).toBeInTheDocument();
  });

  it('renders support level value formatted to 2 decimal places', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[180.0]}
        resistanceLevels={[]}
      />,
    );
    expect(screen.getByText('$180.00')).toBeInTheDocument();
  });

  it('renders S1 label for the first support level', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[180.0]}
        resistanceLevels={[]}
      />,
    );
    expect(screen.getByText('S1')).toBeInTheDocument();
  });

  it('renders multiple support levels with incremented labels', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[180.0, 175.0]}
        resistanceLevels={[]}
      />,
    );
    expect(screen.getByText('S1')).toBeInTheDocument();
    expect(screen.getByText('S2')).toBeInTheDocument();
    expect(screen.getByText('$180.00')).toBeInTheDocument();
    expect(screen.getByText('$175.00')).toBeInTheDocument();
  });

  it('renders distance percentage below current price for support', () => {
    // currentPrice=185.5, support=180 → (185.5-180)/185.5 * 100 = 2.965... → "3.0% below"
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[180.0]}
        resistanceLevels={[]}
      />,
    );
    expect(screen.getByText(/% below/)).toBeInTheDocument();
  });

  it('renders "No support levels found" when support array is empty but resistance is present', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[]}
        resistanceLevels={[190.0]}
      />,
    );
    expect(screen.getByText('No support levels found')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Resistance levels
  // -------------------------------------------------------------------------

  it('renders "Resistance Levels" section label', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[]}
        resistanceLevels={[190.0]}
      />,
    );
    expect(screen.getByText('Resistance Levels')).toBeInTheDocument();
  });

  it('renders resistance level value formatted to 2 decimal places', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[180.0]}
        resistanceLevels={[190.0]}
      />,
    );
    expect(screen.getByText('$190.00')).toBeInTheDocument();
  });

  it('renders R1 label for the first resistance level', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[180.0]}
        resistanceLevels={[190.0]}
      />,
    );
    expect(screen.getByText('R1')).toBeInTheDocument();
  });

  it('renders multiple resistance levels with incremented labels', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[]}
        resistanceLevels={[190.0, 195.0]}
      />,
    );
    expect(screen.getByText('R1')).toBeInTheDocument();
    expect(screen.getByText('R2')).toBeInTheDocument();
    expect(screen.getByText('$190.00')).toBeInTheDocument();
    expect(screen.getByText('$195.00')).toBeInTheDocument();
  });

  it('renders distance percentage above current price for resistance', () => {
    // currentPrice=185.5, resistance=190 → (190-185.5)/185.5 * 100 ≈ 2.4% above
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[180.0]}
        resistanceLevels={[190.0]}
      />,
    );
    expect(screen.getByText(/% above/)).toBeInTheDocument();
  });

  it('renders "No resistance levels found" when resistance array is empty but support is present', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[180.0]}
        resistanceLevels={[]}
      />,
    );
    expect(screen.getByText('No resistance levels found')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Empty individual arrays — component renders without throwing
  // -------------------------------------------------------------------------

  it('renders without error when only support array is empty', () => {
    expect(() =>
      render(
        <SupportResistance
          currentPrice={185.5}
          supportLevels={[]}
          resistanceLevels={[192.0]}
        />,
      ),
    ).not.toThrow();
  });

  it('renders without error when only resistance array is empty', () => {
    expect(() =>
      render(
        <SupportResistance
          currentPrice={185.5}
          supportLevels={[178.0]}
          resistanceLevels={[]}
        />,
      ),
    ).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // Single level entries
  // -------------------------------------------------------------------------

  it('renders exactly one support row for a single-element support array', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[178.0]}
        resistanceLevels={[]}
      />,
    );
    expect(screen.getByText('S1')).toBeInTheDocument();
    expect(screen.queryByText('S2')).not.toBeInTheDocument();
    expect(screen.getByText('$178.00')).toBeInTheDocument();
  });

  it('renders exactly one resistance row for a single-element resistance array', () => {
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[]}
        resistanceLevels={[192.0]}
      />,
    );
    expect(screen.getByText('R1')).toBeInTheDocument();
    expect(screen.queryByText('R2')).not.toBeInTheDocument();
    expect(screen.getByText('$192.00')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Price position relative to levels
  // -------------------------------------------------------------------------

  it('renders positive distance pct when price is between support and resistance', () => {
    // price=185.5 is between support=180 and resistance=192
    // support distPct = (185.5-180)/185.5 * 100 ≈ 2.97% (positive → "% below")
    // resistance distPct = (192-185.5)/185.5 * 100 ≈ 3.50% (positive → "% above")
    render(
      <SupportResistance
        currentPrice={185.5}
        supportLevels={[180.0]}
        resistanceLevels={[192.0]}
      />,
    );
    expect(screen.getByText(/% below/)).toBeInTheDocument();
    expect(screen.getByText(/% above/)).toBeInTheDocument();
  });

  it('renders negative distance pct when price is below all support levels', () => {
    // price=170 < support=180 → (170-180)/170 * 100 = -5.88... → "-5.9% below"
    render(
      <SupportResistance
        currentPrice={170}
        supportLevels={[180.0]}
        resistanceLevels={[]}
      />,
    );
    const distanceText = screen.getByText(/% below/);
    expect(distanceText.textContent).toMatch(/^-/);
  });

  it('renders negative distance pct when price is above all resistance levels', () => {
    // price=200 > resistance=192 → (192-200)/200 * 100 = -4.0 → "-4.0% above"
    render(
      <SupportResistance
        currentPrice={200}
        supportLevels={[]}
        resistanceLevels={[192.0]}
      />,
    );
    const distanceText = screen.getByText(/% above/);
    expect(distanceText.textContent).toMatch(/^-/);
  });
});

// ===========================================================================
// TechnicalSummary
// ===========================================================================

describe('TechnicalSummary', () => {
  const currentPrice = 185.5;

  // -------------------------------------------------------------------------
  // Section heading
  // -------------------------------------------------------------------------

  it('renders the "Technical Summary" heading', () => {
    render(<TechnicalSummary technical={baseTechnical} currentPrice={currentPrice} />);
    expect(screen.getByText('Technical Summary')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Overall signal badge
  // -------------------------------------------------------------------------

  it('renders the overall signal badge text (uppercased)', () => {
    render(<TechnicalSummary technical={baseTechnical} currentPrice={currentPrice} />);
    // signal: 'buy' → replace('_',' ').toUpperCase() → 'BUY'
    expect(screen.getByText('BUY')).toBeInTheDocument();
  });

  it('renders "STRONG BUY" badge for strong_buy signal', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, signal: 'strong_buy' }}
        currentPrice={currentPrice}
      />,
    );
    expect(screen.getByText('STRONG BUY')).toBeInTheDocument();
  });

  it('renders "SELL" badge for sell signal', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, signal: 'sell' }}
        currentPrice={currentPrice}
      />,
    );
    expect(screen.getByText('SELL')).toBeInTheDocument();
  });

  it('renders "STRONG SELL" badge for strong_sell signal', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, signal: 'strong_sell' }}
        currentPrice={currentPrice}
      />,
    );
    expect(screen.getByText('STRONG SELL')).toBeInTheDocument();
  });

  it('renders "NEUTRAL" badge for neutral signal', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, signal: 'neutral' }}
        currentPrice={currentPrice}
      />,
    );
    expect(screen.getByText('NEUTRAL')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Indicator row labels
  // -------------------------------------------------------------------------

  it('renders all seven indicator row labels', () => {
    render(<TechnicalSummary technical={baseTechnical} currentPrice={currentPrice} />);
    expect(screen.getByText('SMA 20')).toBeInTheDocument();
    expect(screen.getByText('SMA 50')).toBeInTheDocument();
    expect(screen.getByText('SMA 200')).toBeInTheDocument();
    expect(screen.getByText('EMA 12')).toBeInTheDocument();
    expect(screen.getByText('EMA 26')).toBeInTheDocument();
    expect(screen.getByText('RSI (14)')).toBeInTheDocument();
    expect(screen.getByText('MACD')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // deriveSignal — price vs MA
  // -------------------------------------------------------------------------

  it('shows "Buy" signal badge for SMA 20 when price > sma_20', () => {
    // currentPrice=185.5, sma_20=183.5 → price > sma → Buy
    render(<TechnicalSummary technical={baseTechnical} currentPrice={currentPrice} />);
    const buyBadges = screen.getAllByText('Buy');
    expect(buyBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Sell" signal badge for SMA when price < sma', () => {
    // Set sma_20 above price so it triggers sell
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, sma_20: 190.0, sma_50: null, sma_200: null, ema_12: null, ema_26: null }}
        currentPrice={185.5}
      />,
    );
    const sellBadges = screen.getAllByText('Sell');
    expect(sellBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('shows no signal badge when sma value is null', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, sma_20: null, sma_50: null, sma_200: null, ema_12: null, ema_26: null, rsi_14: null, macd_histogram: null }}
        currentPrice={185.5}
      />,
    );
    // No Buy/Sell/Neutral badges when all indicators are null
    expect(screen.queryByText('Buy')).not.toBeInTheDocument();
    expect(screen.queryByText('Sell')).not.toBeInTheDocument();
    expect(screen.queryByText('Neutral')).not.toBeInTheDocument();
  });

  it('renders N/A for null indicator values', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, sma_20: null }}
        currentPrice={185.5}
      />,
    );
    const naItems = screen.getAllByText('N/A');
    expect(naItems.length).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  // deriveRsiSignal
  // -------------------------------------------------------------------------

  it('shows "Sell" badge for RSI when rsi > 70 (overbought)', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, rsi_14: 75, sma_20: null, sma_50: null, sma_200: null, ema_12: null, ema_26: null, macd_histogram: null }}
        currentPrice={185.5}
      />,
    );
    expect(screen.getByText('Sell')).toBeInTheDocument();
  });

  it('shows "Buy" badge for RSI when rsi < 30 (oversold)', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, rsi_14: 25, sma_20: null, sma_50: null, sma_200: null, ema_12: null, ema_26: null, macd_histogram: null }}
        currentPrice={185.5}
      />,
    );
    expect(screen.getByText('Buy')).toBeInTheDocument();
  });

  it('shows "Neutral" badge for RSI when 30 <= rsi <= 70', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, rsi_14: 50, sma_20: null, sma_50: null, sma_200: null, ema_12: null, ema_26: null, macd_histogram: null }}
        currentPrice={185.5}
      />,
    );
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('shows no RSI badge when rsi_14 is null', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, rsi_14: null, sma_20: null, sma_50: null, sma_200: null, ema_12: null, ema_26: null, macd_histogram: null }}
        currentPrice={185.5}
      />,
    );
    expect(screen.queryByText('Neutral')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // deriveMacdSignal
  // -------------------------------------------------------------------------

  it('shows "Buy" badge for MACD when histogram > 0', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, macd_histogram: 0.3, sma_20: null, sma_50: null, sma_200: null, ema_12: null, ema_26: null, rsi_14: null }}
        currentPrice={185.5}
      />,
    );
    expect(screen.getByText('Buy')).toBeInTheDocument();
  });

  it('shows "Sell" badge for MACD when histogram <= 0', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, macd_histogram: -0.2, sma_20: null, sma_50: null, sma_200: null, ema_12: null, ema_26: null, rsi_14: null }}
        currentPrice={185.5}
      />,
    );
    expect(screen.getByText('Sell')).toBeInTheDocument();
  });

  it('shows no MACD badge when macd_histogram is null', () => {
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, macd_histogram: null, sma_20: null, sma_50: null, sma_200: null, ema_12: null, ema_26: null, rsi_14: null }}
        currentPrice={185.5}
      />,
    );
    expect(screen.queryByText('Buy')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Value formatting
  // -------------------------------------------------------------------------

  it('renders SMA 20 value formatted to 2 decimal places', () => {
    render(<TechnicalSummary technical={baseTechnical} currentPrice={currentPrice} />);
    expect(screen.getByText('183.50')).toBeInTheDocument();
  });

  it('renders RSI value formatted to 2 decimal places', () => {
    render(<TechnicalSummary technical={baseTechnical} currentPrice={currentPrice} />);
    expect(screen.getByText('62.30')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // All null indicators — every row shows N/A, no signal badges at all
  // -------------------------------------------------------------------------

  it('renders N/A for every row when all indicator values are null', () => {
    const allNull: TechnicalSnapshot = {
      ...baseTechnical,
      sma_20: null,
      sma_50: null,
      sma_200: null,
      ema_12: null,
      ema_26: null,
      rsi_14: null,
      macd_histogram: null,
      macd_line: null,
      macd_signal: null,
    };
    render(<TechnicalSummary technical={allNull} currentPrice={185.5} />);
    // Seven rows → seven N/A spans
    const naItems = screen.getAllByText('N/A');
    expect(naItems).toHaveLength(7);
  });

  it('renders no signal badges at all when all indicator values are null', () => {
    const allNull: TechnicalSnapshot = {
      ...baseTechnical,
      sma_20: null,
      sma_50: null,
      sma_200: null,
      ema_12: null,
      ema_26: null,
      rsi_14: null,
      macd_histogram: null,
      macd_line: null,
      macd_signal: null,
    };
    render(<TechnicalSummary technical={allNull} currentPrice={185.5} />);
    expect(screen.queryByText('Buy')).not.toBeInTheDocument();
    expect(screen.queryByText('Sell')).not.toBeInTheDocument();
    expect(screen.queryByText('Neutral')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // RSI boundary values — exactly 30 and exactly 70 resolve to neutral
  // -------------------------------------------------------------------------

  it('shows "Neutral" badge for RSI exactly at boundary value 30', () => {
    // deriveRsiSignal: rsi < 30 is false when rsi === 30, so neutral is returned
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, rsi_14: 30, sma_20: null, sma_50: null, sma_200: null, ema_12: null, ema_26: null, macd_histogram: null }}
        currentPrice={185.5}
      />,
    );
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.queryByText('Buy')).not.toBeInTheDocument();
  });

  it('shows "Neutral" badge for RSI exactly at boundary value 70', () => {
    // deriveRsiSignal: rsi > 70 is false when rsi === 70, so neutral is returned
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, rsi_14: 70, sma_20: null, sma_50: null, sma_200: null, ema_12: null, ema_26: null, macd_histogram: null }}
        currentPrice={185.5}
      />,
    );
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.queryByText('Sell')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // MACD histogram boundary — exactly 0 maps to sell (histogram > 0 is false)
  // -------------------------------------------------------------------------

  it('shows "Sell" badge for MACD when histogram is exactly 0', () => {
    // deriveMacdSignal: 0 > 0 is false → 'sell'
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, macd_histogram: 0, sma_20: null, sma_50: null, sma_200: null, ema_12: null, ema_26: null, rsi_14: null }}
        currentPrice={185.5}
      />,
    );
    expect(screen.getByText('Sell')).toBeInTheDocument();
    expect(screen.queryByText('Buy')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // SMA crossover signals — bullish (price > SMA20 > SMA50) vs bearish
  // -------------------------------------------------------------------------

  it('shows "Buy" for both SMA 20 and SMA 50 when price is above both (bullish crossover scenario)', () => {
    // price=200 > sma_20=185 > sma_50=180 → both rows get Buy signal
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, sma_20: 185.0, sma_50: 180.0, sma_200: null, ema_12: null, ema_26: null, rsi_14: null, macd_histogram: null }}
        currentPrice={200}
      />,
    );
    const buyBadges = screen.getAllByText('Buy');
    // SMA 20 row and SMA 50 row both show Buy
    expect(buyBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('shows "Sell" for SMA 50 and "Buy" for SMA 20 when price is between them', () => {
    // sma_50=190 > price=185 > sma_20=180 → SMA20=Buy, SMA50=Sell
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, sma_20: 180.0, sma_50: 190.0, sma_200: null, ema_12: null, ema_26: null, rsi_14: null, macd_histogram: null }}
        currentPrice={185}
      />,
    );
    expect(screen.getByText('Buy')).toBeInTheDocument();   // SMA 20
    expect(screen.getByText('Sell')).toBeInTheDocument();  // SMA 50
  });

  it('shows "Sell" for both SMA 20 and SMA 50 when price is below both (bearish crossover scenario)', () => {
    // price=170 < sma_20=180 < sma_50=185 → both rows get Sell signal
    render(
      <TechnicalSummary
        technical={{ ...baseTechnical, sma_20: 180.0, sma_50: 185.0, sma_200: null, ema_12: null, ema_26: null, rsi_14: null, macd_histogram: null }}
        currentPrice={170}
      />,
    );
    const sellBadges = screen.getAllByText('Sell');
    expect(sellBadges.length).toBeGreaterThanOrEqual(2);
  });
});
