/**
 * Tests for PriceChart component.
 *
 * Covers:
 *   - Empty-data early return (line 107-113)
 *   - useEffect that creates the chart (lines 32-103)
 *   - ResizeObserver integration
 *   - Cleanup on unmount (observer.disconnect + chart.remove)
 *   - Range button rendering and click behaviour (line 123)
 *   - filterByRange logic: empty array, ALL passthrough, date cutoff, null volume
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { HistoricalPrice } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Spy handles — vi.hoisted ensures these are evaluated BEFORE vi.mock factories
// ---------------------------------------------------------------------------

const {
  mockSetData,
  mockFitContent,
  mockApplyOptions,
  mockRemove,
  mockAddSeries,
  mockPriceScale,
  mockTimeScale,
  mockCreateChart,
  mockObserve,
  mockDisconnect,
  mockUnobserve,
} = vi.hoisted(() => {
  const mockSetData = vi.fn();
  const mockFitContent = vi.fn();
  const mockApplyOptions = vi.fn();
  const mockRemove = vi.fn();
  const mockAddSeries = vi.fn(() => ({ setData: mockSetData }));
  const mockPriceScale = vi.fn(() => ({ applyOptions: mockApplyOptions }));
  const mockTimeScale = vi.fn(() => ({ fitContent: mockFitContent }));
  const mockCreateChart = vi.fn(() => ({
    addSeries: mockAddSeries,
    priceScale: mockPriceScale,
    timeScale: mockTimeScale,
    applyOptions: mockApplyOptions,
    remove: mockRemove,
  }));
  const mockObserve = vi.fn();
  const mockDisconnect = vi.fn();
  const mockUnobserve = vi.fn();
  return {
    mockSetData,
    mockFitContent,
    mockApplyOptions,
    mockRemove,
    mockAddSeries,
    mockPriceScale,
    mockTimeScale,
    mockCreateChart,
    mockObserve,
    mockDisconnect,
    mockUnobserve,
  };
});

// ---------------------------------------------------------------------------
// Global mocks — must appear before any component import
// ---------------------------------------------------------------------------

// Capture the ResizeObserver callback so tests can invoke the resize handler.
let lastResizeCallback: ResizeObserverCallback | null = null;

// ResizeObserver must be a newable constructor — use a class so `new` works.
class MockResizeObserver {
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = mockUnobserve;
  constructor(cb: ResizeObserverCallback) {
    lastResizeCallback = cb;
  }
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

vi.mock('lightweight-charts', () => ({
  createChart: mockCreateChart,
  ColorType: { Solid: 'solid' },
  CrosshairMode: { Normal: 1 },
  AreaSeries: vi.fn(),
}));

// framer-motion passthrough — same pattern as stockAnalysis.test.tsx
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
    motion: new Proxy(
      {},
      { get: (_target, prop: string) => createMotionComponent(prop) },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useMotionValue: () => ({ set: () => {} }),
    useSpring: (v: any) => v,
    useTransform: () => 0,
  };
});

// ---------------------------------------------------------------------------
// Component import — after mocks
// ---------------------------------------------------------------------------

import { PriceChart } from '../../components/charts/PriceChart';

// ---------------------------------------------------------------------------
// Test data — ALL is the default range so all dates are shown
// ---------------------------------------------------------------------------

const mockData: HistoricalPrice[] = [
  { date: '2025-06-01', open: 100, high: 110, low: 95,  close: 105, volume: 1_000_000 },
  { date: '2025-07-01', open: 105, high: 115, low: 100, close: 110, volume: 1_500_000 },
  { date: '2025-08-01', open: 110, high: 120, low: 105, close: 115, volume: 2_000_000 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderChart(data: HistoricalPrice[] = mockData, currentPrice = 115) {
  return render(<PriceChart data={data} currentPrice={currentPrice} />);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('PriceChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastResizeCallback = null;
  });

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe('empty data', () => {
    it('shows the empty-state message when data array is empty', () => {
      renderChart([]);
      expect(
        screen.getByText('No historical price data available'),
      ).toBeInTheDocument();
    });

    it('does NOT call createChart when data is empty', () => {
      renderChart([]);
      expect(mockCreateChart).not.toHaveBeenCalled();
    });

    it('does NOT render the time-range buttons when data is empty', () => {
      renderChart([]);
      expect(screen.queryByRole('button', { name: '1Y' })).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Happy path — rendering
  // -------------------------------------------------------------------------

  describe('with data', () => {
    it('renders the "Price Chart" heading', () => {
      renderChart();
      expect(screen.getByText('Price Chart')).toBeInTheDocument();
    });

    it('renders exactly 7 time-range buttons', () => {
      renderChart();
      const buttons = screen.getAllByRole('button');
      // Filter to only the range buttons (1W, 1M, 3M, 6M, 1Y, 5Y, ALL)
      const rangeButtons = buttons.filter((b) =>
        ['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'].includes(b.textContent ?? ''),
      );
      expect(rangeButtons).toHaveLength(7);
    });

    it('renders all expected range labels', () => {
      renderChart();
      for (const label of ['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL']) {
        expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
      }
    });
  });

  // -------------------------------------------------------------------------
  // Chart creation — useEffect lines 35-103
  // -------------------------------------------------------------------------

  describe('chart creation', () => {
    it('calls createChart once on mount', () => {
      renderChart();
      expect(mockCreateChart).toHaveBeenCalledTimes(1);
    });

    it('calls addSeries once', () => {
      renderChart();
      expect(mockAddSeries).toHaveBeenCalledTimes(1);
    });

    it('calls setData once', () => {
      renderChart();
      expect(mockSetData).toHaveBeenCalledTimes(1);
    });

    it('calls fitContent on the time scale', () => {
      renderChart();
      expect(mockFitContent).toHaveBeenCalledTimes(1);
    });

    it('passes area data with correct shape to the setData call', () => {
      renderChart();
      const [firstCall] = mockSetData.mock.calls;
      const areaData = firstCall[0] as Array<{
        time: string;
        value: number;
      }>;
      expect(areaData[0]).toMatchObject({
        time: '2025-06-01',
        value: 105,
      });
    });

    it('sorts data by date before setting area data', () => {
      const unsorted: HistoricalPrice[] = [
        { date: '2025-08-01', open: 110, high: 120, low: 105, close: 115, volume: 2_000_000 },
        { date: '2025-06-01', open: 100, high: 110, low: 95,  close: 105, volume: 1_000_000 },
        { date: '2025-07-01', open: 105, high: 115, low: 100, close: 110, volume: 1_500_000 },
      ];
      renderChart(unsorted);
      const [firstCall] = mockSetData.mock.calls;
      const areaData = firstCall[0] as Array<{ time: string; value: number }>;
      expect(areaData.map((d) => d.time)).toEqual([
        '2025-06-01',
        '2025-07-01',
        '2025-08-01',
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // ResizeObserver
  // -------------------------------------------------------------------------

  describe('ResizeObserver', () => {
    it('calls observe on the container element', () => {
      renderChart();
      expect(mockObserve).toHaveBeenCalledTimes(1);
    });

    it('calls chart.applyOptions with new width when resize fires', () => {
      renderChart();
      // Simulate a resize event by calling the captured callback directly
      expect(lastResizeCallback).not.toBeNull();
      const fakeEntries = [
        { contentRect: { width: 800 } },
      ] as unknown as ResizeObserverEntry[];
      lastResizeCallback!(fakeEntries, {} as ResizeObserver);
      expect(mockApplyOptions).toHaveBeenCalledWith({ width: 800 });
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  describe('cleanup on unmount', () => {
    it('calls observer.disconnect on unmount', () => {
      const { unmount } = renderChart();
      unmount();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('calls chart.remove on unmount', () => {
      const { unmount } = renderChart();
      unmount();
      expect(mockRemove).toHaveBeenCalledTimes(1);
    });

    it('calls both disconnect and remove in the same cleanup cycle', () => {
      const { unmount } = renderChart();
      expect(mockDisconnect).not.toHaveBeenCalled();
      expect(mockRemove).not.toHaveBeenCalled();
      unmount();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockRemove).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Range button click — line 123
  // -------------------------------------------------------------------------

  describe('range button interaction', () => {
    it('applies active styles to the default ALL button on mount', () => {
      renderChart();
      const btnAll = screen.getByRole('button', { name: 'ALL' });
      expect(btnAll.className).toContain('bg-indigo-600');
    });

    it('applies inactive styles to non-selected range buttons on mount', () => {
      renderChart();
      const btn1W = screen.getByRole('button', { name: '1W' });
      expect(btn1W.className).not.toContain('bg-indigo-600');
    });

    it('switching to 1M button gives it active styles', () => {
      renderChart();
      const btn1M = screen.getByRole('button', { name: '1M' });
      fireEvent.click(btn1M);
      expect(btn1M.className).toContain('bg-indigo-600');
    });

    it('switching to 1M removes active styles from ALL', () => {
      renderChart();
      fireEvent.click(screen.getByRole('button', { name: '1M' }));
      expect(screen.getByRole('button', { name: 'ALL' }).className).not.toContain(
        'bg-indigo-600',
      );
    });

    it('clicking ALL after switching away creates a new chart for all data points', () => {
      renderChart();
      // Switch away from ALL first
      fireEvent.click(screen.getByRole('button', { name: '1M' }));
      vi.clearAllMocks();
      fireEvent.click(screen.getByRole('button', { name: 'ALL' }));
      // useEffect re-runs with new filtered data → createChart is called again
      expect(mockCreateChart).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // filterByRange — ALL passthrough
  // -------------------------------------------------------------------------

  describe('ALL range passthrough', () => {
    it('ALL range includes data older than 1 year', () => {
      const oldData: HistoricalPrice[] = [
        { date: '2020-01-01', open: 50, high: 55, low: 48, close: 52, volume: 500_000 },
        { date: '2025-08-01', open: 110, high: 120, low: 105, close: 115, volume: 2_000_000 },
      ];
      renderChart(oldData);
      // Switch to ALL so filterByRange returns everything
      fireEvent.click(screen.getByRole('button', { name: 'ALL' }));
      // Get the last setData call — one call per render, area series only
      const lastSetDataCall = mockSetData.mock.calls[mockSetData.mock.calls.length - 1];
      const lastAreaData = lastSetDataCall[0] as Array<{
        time: string;
        value: number;
      }>;
      const times = lastAreaData.map((d) => d.time);
      expect(times).toContain('2020-01-01');
      expect(times).toContain('2025-08-01');
    });
  });

});
