/**
 * Tests for QuarterlyEarnings component.
 *
 * formatMoney is private to the module, so all formatter assertions are driven
 * through rendered output.  The component renders both a desktop table and
 * mobile card stack simultaneously (CSS hides one at runtime); every repeated
 * value therefore appears twice in the DOM — getAllBy* is used accordingly.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuarterlyEarnings } from '../../components/financials/QuarterlyEarnings';
import type { QuarterlyEarning } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockEarnings: QuarterlyEarning[] = [
  {
    quarter: 'Q1 2025',
    revenue: 94_900,
    net_income: 23_600,
    eps: 1.53,
    yoy_revenue_growth: 0.05,
  },
  {
    quarter: 'Q4 2024',
    revenue: 124_300,
    net_income: 36_300,
    eps: 2.40,
    yoy_revenue_growth: -0.02,
  },
];

// ---------------------------------------------------------------------------
// formatMoney — exercised via rendered output
// ---------------------------------------------------------------------------

describe('formatMoney', () => {
  it('renders N/A when revenue is null', () => {
    const nullRevenue: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: null, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={nullRevenue} />);
    // Two "N/A" labels appear: one for revenue, one for net_income (desktop + mobile = 4 total)
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThanOrEqual(2);
  });

  it('formats values >= 1_000_000 as T suffix with one decimal', () => {
    const trillionRow: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 1_500_000, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={trillionRow} />);
    // $1.5T appears in both desktop table and mobile card
    const elements = screen.getAllByText('$1.5T');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('formats values >= 1_000 and < 1_000_000 as B suffix with one decimal', () => {
    const billionRow: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 94_900, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={billionRow} />);
    const elements = screen.getAllByText('$94.9B');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('formats values < 1_000 as M suffix with one decimal', () => {
    const millionRow: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 500, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={millionRow} />);
    const elements = screen.getAllByText('$500.0M');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('formats negative values preserving sign through the absolute-value threshold check', () => {
    const negativeRow: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: -94_900, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={negativeRow} />);
    // formatMoney uses `$${value.toFixed(1)}B` — negative toFixed prefixes the
    // minus sign before the digits, yielding "$-94.9B" not "-$94.9B"
    const elements = screen.getAllByText('$-94.9B');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('formats negative trillion-tier values correctly', () => {
    const negTrillion: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: -2_000_000, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={negTrillion} />);
    // Same pattern: "$-2.0T"
    const elements = screen.getAllByText('$-2.0T');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('QuarterlyEarnings — empty state', () => {
  it('renders the "No quarterly data available" message when earnings is empty', () => {
    render(<QuarterlyEarnings earnings={[]} />);
    expect(screen.getByText('No quarterly data available')).toBeInTheDocument();
  });

  it('does not render a table when earnings is empty', () => {
    render(<QuarterlyEarnings earnings={[]} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('does not render a quarters count span when earnings is empty', () => {
    render(<QuarterlyEarnings earnings={[]} />);
    expect(screen.queryByText(/quarters/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Quarter labels
// ---------------------------------------------------------------------------

describe('QuarterlyEarnings — quarter labels', () => {
  it('renders all quarter labels from the data', () => {
    render(<QuarterlyEarnings earnings={mockEarnings} />);
    // Each label appears in both desktop table and mobile card = 2 occurrences each
    expect(screen.getAllByText('Q1 2025').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Q4 2024').length).toBeGreaterThanOrEqual(2);
  });

  it('displays the correct number of quarters in the header count', () => {
    render(<QuarterlyEarnings earnings={mockEarnings} />);
    // The span renders as two adjacent text nodes ("2" + " quarters") in jsdom,
    // so we match on the span's combined textContent with exact: false.
    expect(screen.getByText(/2 quarters/)).toBeInTheDocument();
  });

  it('displays "1 quarters" count for a single-row dataset', () => {
    render(<QuarterlyEarnings earnings={[mockEarnings[0]]} />);
    expect(screen.getByText(/1 quarters/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Revenue rendering
// ---------------------------------------------------------------------------

describe('QuarterlyEarnings — revenue', () => {
  it('renders formatted revenue for Q1 2025 ($94.9B)', () => {
    render(<QuarterlyEarnings earnings={mockEarnings} />);
    const elements = screen.getAllByText('$94.9B');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders formatted revenue for Q4 2024 ($124.3B)', () => {
    render(<QuarterlyEarnings earnings={mockEarnings} />);
    const elements = screen.getAllByText('$124.3B');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// EPS rendering
// ---------------------------------------------------------------------------

describe('QuarterlyEarnings — EPS', () => {
  it('renders EPS as $X.XX formatted with two decimal places', () => {
    render(<QuarterlyEarnings earnings={mockEarnings} />);
    const eps153 = screen.getAllByText('$1.53');
    expect(eps153.length).toBeGreaterThanOrEqual(1);
    const eps240 = screen.getAllByText('$2.40');
    expect(eps240.length).toBeGreaterThanOrEqual(1);
  });

  it('renders N/A for null EPS', () => {
    const nullEpsRow: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 1_000, net_income: 200, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={nullEpsRow} />);
    // At least one N/A cell is for EPS (desktop table cell + mobile card cell)
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// YoY growth rendering
// ---------------------------------------------------------------------------

describe('QuarterlyEarnings — YoY growth', () => {
  it('renders positive YoY growth with a + prefix', () => {
    render(<QuarterlyEarnings earnings={mockEarnings} />);
    // 0.05 * 100 = 5.0 → "+5.0%"
    const positiveGrowth = screen.getAllByText(/^\+5\.0%$/);
    expect(positiveGrowth.length).toBeGreaterThanOrEqual(1);
  });

  it('renders negative YoY growth without a + prefix', () => {
    render(<QuarterlyEarnings earnings={mockEarnings} />);
    // -0.02 * 100 = -2.0 → "-2.0%"
    const negativeGrowth = screen.getAllByText(/^-2\.0%$/);
    expect(negativeGrowth.length).toBeGreaterThanOrEqual(1);
  });

  it('renders N/A for null YoY growth', () => {
    const nullGrowthRow: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 1_000, net_income: 200, eps: 1.0, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={nullGrowthRow} />);
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThanOrEqual(1);
  });

  it('treats zero YoY growth as non-negative (renders with + prefix)', () => {
    const zeroGrowthRow: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 1_000, net_income: 200, eps: 1.0, yoy_revenue_growth: 0 },
    ];
    render(<QuarterlyEarnings earnings={zeroGrowthRow} />);
    const zeroGrowth = screen.getAllByText(/^\+0\.0%$/);
    expect(zeroGrowth.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Quarter count
// ---------------------------------------------------------------------------

describe('QuarterlyEarnings — quarter count', () => {
  it('renders the correct count for two quarters', () => {
    render(<QuarterlyEarnings earnings={mockEarnings} />);
    expect(screen.getByText(/2 quarters/)).toBeInTheDocument();
  });

  it('renders the correct count for a three-quarter dataset', () => {
    const threeQuarters: QuarterlyEarning[] = [
      ...mockEarnings,
      { quarter: 'Q3 2024', revenue: 85_000, net_income: 18_000, eps: 1.10, yoy_revenue_growth: 0.03 },
    ];
    render(<QuarterlyEarnings earnings={threeQuarters} />);
    expect(screen.getByText(/3 quarters/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Table structure (desktop)
// ---------------------------------------------------------------------------

describe('QuarterlyEarnings — table structure', () => {
  it('renders a table with the five expected column headers', () => {
    render(<QuarterlyEarnings earnings={mockEarnings} />);
    expect(screen.getByRole('columnheader', { name: /quarter/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /revenue/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /net income/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /eps/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /yoy growth/i })).toBeInTheDocument();
  });

  it('renders one table row per earning entry', () => {
    render(<QuarterlyEarnings earnings={mockEarnings} />);
    // getAllByRole('row') includes the header row
    const rows = screen.getAllByRole('row');
    // 1 header + 2 data rows
    expect(rows).toHaveLength(1 + mockEarnings.length);
  });
});
