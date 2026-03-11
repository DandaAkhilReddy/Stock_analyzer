/**
 * Tests for technical components: SupportResistance, TechnicalSummary.
 *
 * TechnicalSummary maps TechnicalSnapshot fields to indicator rows and
 * derives per-row buy/sell/neutral signals; all branches are exercised here.
 *
 * SupportResistance renders level grids or an empty-state null.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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
});
