/**
 * Tests for chart components: MACDChart, RSIChart.
 *
 * Both components are pure presentational — no framer-motion, no store
 * dependencies. Tests drive all conditional branches via props.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MACDChart } from '../../components/charts/MACDChart';
import { RSIChart } from '../../components/charts/RSIChart';

// ===========================================================================
// MACDChart
// ===========================================================================

describe('MACDChart', () => {
  // -------------------------------------------------------------------------
  // Heading
  // -------------------------------------------------------------------------

  it('renders the MACD heading', () => {
    render(<MACDChart macdLine={1.5} signalLine={1.2} histogram={0.3} />);
    expect(screen.getByText('MACD (12, 26, 9)')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Bullish / bearish signal
  // -------------------------------------------------------------------------

  it('shows "Bullish" when histogram is positive', () => {
    render(<MACDChart macdLine={1.5} signalLine={1.2} histogram={0.3} />);
    expect(screen.getByText('Bullish')).toBeInTheDocument();
  });

  it('shows "Bullish" when histogram is exactly 0 (boundary: >= 0)', () => {
    render(<MACDChart macdLine={0} signalLine={0} histogram={0} />);
    expect(screen.getByText('Bullish')).toBeInTheDocument();
  });

  it('shows "Bearish" when histogram is negative', () => {
    render(<MACDChart macdLine={-0.5} signalLine={0.1} histogram={-0.6} />);
    expect(screen.getByText('Bearish')).toBeInTheDocument();
  });

  it('shows "Bullish" when histogram is null (defaults to 0)', () => {
    render(<MACDChart macdLine={null} signalLine={null} histogram={null} />);
    expect(screen.getByText('Bullish')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // MACD Line value
  // -------------------------------------------------------------------------

  it('renders MACD Line formatted to 2 decimal places', () => {
    render(<MACDChart macdLine={1.5} signalLine={1.2} histogram={0.3} />);
    expect(screen.getByText('1.50')).toBeInTheDocument();
  });

  it('renders "N/A" for MACD Line when null', () => {
    render(<MACDChart macdLine={null} signalLine={1.2} histogram={0.3} />);
    const naItems = screen.getAllByText('N/A');
    expect(naItems.length).toBeGreaterThanOrEqual(1);
  });

  it('renders negative MACD Line correctly', () => {
    render(<MACDChart macdLine={-2.34} signalLine={0.1} histogram={-0.5} />);
    expect(screen.getByText('-2.34')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Signal Line value
  // -------------------------------------------------------------------------

  it('renders Signal Line formatted to 2 decimal places', () => {
    render(<MACDChart macdLine={1.5} signalLine={1.2} histogram={0.3} />);
    expect(screen.getByText('1.20')).toBeInTheDocument();
  });

  it('renders "N/A" for Signal Line when null', () => {
    render(<MACDChart macdLine={1.5} signalLine={null} histogram={0.3} />);
    const naItems = screen.getAllByText('N/A');
    expect(naItems.length).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  // Histogram value
  // -------------------------------------------------------------------------

  it('renders Histogram formatted to 2 decimal places', () => {
    render(<MACDChart macdLine={1.5} signalLine={1.2} histogram={0.3} />);
    expect(screen.getByText('0.30')).toBeInTheDocument();
  });

  it('renders "N/A" for Histogram when null', () => {
    render(<MACDChart macdLine={1.5} signalLine={1.2} histogram={null} />);
    const naItems = screen.getAllByText('N/A');
    expect(naItems.length).toBeGreaterThanOrEqual(1);
  });

  it('renders negative histogram value correctly', () => {
    render(<MACDChart macdLine={-0.5} signalLine={0.1} histogram={-0.60} />);
    expect(screen.getByText('-0.60')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Section labels
  // -------------------------------------------------------------------------

  it('renders all three section labels: MACD Line, Signal, Histogram', () => {
    render(<MACDChart macdLine={1.5} signalLine={1.2} histogram={0.3} />);
    expect(screen.getByText('MACD Line')).toBeInTheDocument();
    expect(screen.getByText('Signal')).toBeInTheDocument();
    expect(screen.getByText('Histogram')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Color styling
  // -------------------------------------------------------------------------

  it('applies emerald colour (#059669) for bullish histogram', () => {
    render(<MACDChart macdLine={1.5} signalLine={1.2} histogram={0.3} />);
    const bullishLabel = screen.getByText('Bullish');
    expect(bullishLabel).toHaveStyle({ color: '#059669' });
  });

  it('applies red colour (#dc2626) for bearish histogram', () => {
    render(<MACDChart macdLine={-0.5} signalLine={0.1} histogram={-0.6} />);
    const bearishLabel = screen.getByText('Bearish');
    expect(bearishLabel).toHaveStyle({ color: '#dc2626' });
  });
});

// ===========================================================================
// RSIChart
// ===========================================================================

describe('RSIChart', () => {
  // -------------------------------------------------------------------------
  // Null handling — returns null
  // -------------------------------------------------------------------------

  it('renders nothing when rsiValue is null', () => {
    const { container } = render(<RSIChart rsiValue={null} />);
    expect(container.firstChild).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Heading
  // -------------------------------------------------------------------------

  it('renders the RSI heading when a value is provided', () => {
    render(<RSIChart rsiValue={55} />);
    expect(screen.getByText('RSI (14)')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // RSI value display
  // -------------------------------------------------------------------------

  it('renders the RSI value formatted to one decimal place', () => {
    render(<RSIChart rsiValue={62.3} />);
    expect(screen.getByText('62.3')).toBeInTheDocument();
  });

  it('renders an integer RSI value with .0 suffix', () => {
    render(<RSIChart rsiValue={50} />);
    expect(screen.getByText('50.0')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Zone labels
  // -------------------------------------------------------------------------

  it('shows "Overbought" label when RSI > 70', () => {
    render(<RSIChart rsiValue={75} />);
    expect(screen.getByText('Overbought')).toBeInTheDocument();
  });

  it('shows "Oversold" label when RSI < 30', () => {
    render(<RSIChart rsiValue={25} />);
    expect(screen.getByText('Oversold')).toBeInTheDocument();
  });

  it('shows "Neutral" label when RSI is in 30–70 range', () => {
    render(<RSIChart rsiValue={55} />);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('shows "Neutral" at exactly RSI = 30 (boundary: not < 30)', () => {
    render(<RSIChart rsiValue={30} />);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('shows "Neutral" at exactly RSI = 70 (boundary: not > 70)', () => {
    render(<RSIChart rsiValue={70} />);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('shows "Overbought" at RSI = 71 (just above threshold)', () => {
    render(<RSIChart rsiValue={71} />);
    expect(screen.getByText('Overbought')).toBeInTheDocument();
  });

  it('shows "Oversold" at RSI = 29 (just below threshold)', () => {
    render(<RSIChart rsiValue={29} />);
    expect(screen.getByText('Oversold')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Colour styling
  // -------------------------------------------------------------------------

  it('applies red colour (#dc2626) for overbought RSI', () => {
    render(<RSIChart rsiValue={80} />);
    const label = screen.getByText('Overbought');
    expect(label).toHaveStyle({ color: '#dc2626' });
  });

  it('applies emerald colour (#059669) for oversold RSI', () => {
    render(<RSIChart rsiValue={20} />);
    const label = screen.getByText('Oversold');
    expect(label).toHaveStyle({ color: '#059669' });
  });

  it('applies amber colour (#d97706) for neutral RSI', () => {
    render(<RSIChart rsiValue={55} />);
    const label = screen.getByText('Neutral');
    expect(label).toHaveStyle({ color: '#d97706' });
  });

  // -------------------------------------------------------------------------
  // Position marker inline style
  // -------------------------------------------------------------------------

  it('sets the marker left position matching the RSI value %', () => {
    const { container } = render(<RSIChart rsiValue={62} />);
    const marker = container.querySelector<HTMLElement>('[style*="left: 62%"]');
    expect(marker).toBeInTheDocument();
  });

  it('clamps RSI > 100 to 100% position', () => {
    const { container } = render(<RSIChart rsiValue={110} />);
    const marker = container.querySelector<HTMLElement>('[style*="left: 100%"]');
    expect(marker).toBeInTheDocument();
  });

  it('clamps RSI < 0 to 0% position', () => {
    const { container } = render(<RSIChart rsiValue={-5} />);
    const marker = container.querySelector<HTMLElement>('[style*="left: 0%"]');
    expect(marker).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Scale labels
  // -------------------------------------------------------------------------

  it('renders the five RSI scale labels: 0, 30, 50, 70, 100', () => {
    render(<RSIChart rsiValue={55} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
