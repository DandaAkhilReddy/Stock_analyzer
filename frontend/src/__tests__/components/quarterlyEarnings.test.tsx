/**
 * Tests for QuarterlyEarnings component.
 *
 * The component renders two parallel representations of the same data:
 *   - A desktop <table> (hidden at mobile via Tailwind's `hidden md:block`)
 *   - A stack of mobile <div> cards (shown only on mobile via `md:hidden`)
 *
 * Both are present in the JSDOM; CSS visibility is irrelevant in test context.
 * As a result, every per-quarter value appears at minimum twice in the DOM
 * (once in the table row, once in the mobile card). getAllBy* queries are used
 * wherever this duplication is expected.
 *
 * The `formatMoney` helper is module-private, so all formatter assertions are
 * exercised indirectly through rendered output.
 *
 * NOTE: The QuarterlyEarning type has no `eps_estimated` field — the component
 * does not implement a beat/miss indicator.  YoY revenue growth (positive vs.
 * negative) is the closest analog and is tested as positive/negative styling.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { QuarterlyEarning } from '../../types/analysis';

// ---------------------------------------------------------------------------
// framer-motion stub — replaces animated elements with plain HTML counterparts
// so tests are fast and deterministic.
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    tr: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLTableRowElement> & { children?: React.ReactNode }) => (
      <tr {...props}>{children}</tr>
    ),
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useTransform: () => 0,
}));

// Import after mock registration
import { QuarterlyEarnings } from '../../components/financials/QuarterlyEarnings';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Single quarter — used for single-item edge cases. */
const singleQuarter: QuarterlyEarning = {
  quarter: 'Q1 2025',
  revenue: 94_900,
  net_income: 23_600,
  eps: 1.53,
  yoy_revenue_growth: 0.05,
};

/** Two quarters in descending chronological order (as the backend provides). */
const twoQuarters: QuarterlyEarning[] = [
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

/** Four quarters for ordering and large-dataset tests. */
const fourQuarters: QuarterlyEarning[] = [
  { quarter: 'Q1 2025', revenue: 94_900,  net_income: 23_600, eps: 1.53, yoy_revenue_growth: 0.05 },
  { quarter: 'Q4 2024', revenue: 124_300, net_income: 36_300, eps: 2.40, yoy_revenue_growth: -0.02 },
  { quarter: 'Q3 2024', revenue: 94_900,  net_income: 23_600, eps: 1.46, yoy_revenue_growth: 0.01 },
  { quarter: 'Q2 2024', revenue: 85_777,  net_income: 21_448, eps: 1.40, yoy_revenue_growth: -0.10 },
];

/** Quarter with all nullable fields set to null. */
const allNullQuarter: QuarterlyEarning = {
  quarter: 'Q2 2025',
  revenue: null,
  net_income: null,
  eps: null,
  yoy_revenue_growth: null,
};

// ===========================================================================
// 1. Renders earnings table/cards with quarter labels
// ===========================================================================

describe('QuarterlyEarnings — quarter labels', () => {
  it('renders all quarter label strings from the input array', () => {
    render(<QuarterlyEarnings earnings={twoQuarters} />);
    // Each label is present in both desktop table and mobile card stack
    expect(screen.getAllByText('Q1 2025').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Q4 2024').length).toBeGreaterThanOrEqual(2);
  });

  it('renders the heading "Quarterly Earnings"', () => {
    render(<QuarterlyEarnings earnings={twoQuarters} />);
    expect(screen.getByText('Quarterly Earnings')).toBeInTheDocument();
  });

  it('renders the quarter count badge in the header', () => {
    render(<QuarterlyEarnings earnings={twoQuarters} />);
    expect(screen.getByText(/2 quarters/)).toBeInTheDocument();
  });

  it('renders the desktop table with five column headers', () => {
    render(<QuarterlyEarnings earnings={twoQuarters} />);
    expect(screen.getByRole('columnheader', { name: /quarter/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /revenue/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /net income/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /eps/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /yoy growth/i })).toBeInTheDocument();
  });

  it('renders one data row per quarter in the desktop table', () => {
    render(<QuarterlyEarnings earnings={twoQuarters} />);
    // getAllByRole('row') includes the single header row
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(1 + twoQuarters.length);
  });

  it('renders one mobile card per quarter', () => {
    const { container } = render(<QuarterlyEarnings earnings={twoQuarters} />);
    // Mobile cards live inside the `md:hidden` div; each card is a direct child
    const mobileWrapper = container.querySelector('.md\\:hidden');
    expect(mobileWrapper).not.toBeNull();
    // Two child divs, one per quarter
    expect(mobileWrapper!.children).toHaveLength(twoQuarters.length);
  });
});

// ===========================================================================
// 2. Empty earnings array — shows "no data" message
// ===========================================================================

describe('QuarterlyEarnings — empty state', () => {
  it('renders the "No quarterly data available" message', () => {
    render(<QuarterlyEarnings earnings={[]} />);
    expect(screen.getByText('No quarterly data available')).toBeInTheDocument();
  });

  it('does not render a table when earnings is empty', () => {
    render(<QuarterlyEarnings earnings={[]} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('does not render the quarters count span when earnings is empty', () => {
    render(<QuarterlyEarnings earnings={[]} />);
    expect(screen.queryByText(/quarters/)).not.toBeInTheDocument();
  });

  it('still renders the section heading when earnings is empty', () => {
    render(<QuarterlyEarnings earnings={[]} />);
    expect(screen.getByText('Quarterly Earnings')).toBeInTheDocument();
  });
});

// ===========================================================================
// 3. Single quarter — renders without error
// ===========================================================================

describe('QuarterlyEarnings — single quarter', () => {
  it('renders without throwing for a single-element array', () => {
    expect(() =>
      render(<QuarterlyEarnings earnings={[singleQuarter]} />),
    ).not.toThrow();
  });

  it('shows "1 quarters" in the header count for a single row', () => {
    render(<QuarterlyEarnings earnings={[singleQuarter]} />);
    expect(screen.getByText(/1 quarters/)).toBeInTheDocument();
  });

  it('renders the quarter label for a single row', () => {
    render(<QuarterlyEarnings earnings={[singleQuarter]} />);
    expect(screen.getAllByText('Q1 2025').length).toBeGreaterThanOrEqual(1);
  });

  it('renders exactly one data row in the table for a single quarter', () => {
    render(<QuarterlyEarnings earnings={[singleQuarter]} />);
    const rows = screen.getAllByRole('row');
    // header row + 1 data row
    expect(rows).toHaveLength(2);
  });
});

// ===========================================================================
// 4 & 5. YoY growth positive styling (analog to EPS beat) /
//         YoY growth negative styling (analog to EPS miss)
//
// The QuarterlyEarning type has no eps_estimated field so there is no explicit
// beat/miss indicator.  Positive yoy_revenue_growth (>= 0) uses emerald-600
// and a "+" prefix; negative uses red-600 with no prefix.
// ===========================================================================

describe('QuarterlyEarnings — positive growth styling (beat analog)', () => {
  it('prefixes positive growth with "+"', () => {
    render(<QuarterlyEarnings earnings={[singleQuarter]} />);
    // 0.05 * 100 = 5.0 → "+5.0%"
    const positiveGrowth = screen.getAllByText(/^\+5\.0%$/);
    expect(positiveGrowth.length).toBeGreaterThanOrEqual(1);
  });

  it('applies emerald colour class to positive growth spans', () => {
    const { container } = render(<QuarterlyEarnings earnings={[singleQuarter]} />);
    const emeraldSpans = container.querySelectorAll('.text-emerald-600');
    expect(emeraldSpans.length).toBeGreaterThan(0);
  });

  it('treats zero growth as non-negative, rendering "+0.0%"', () => {
    const zeroGrowth: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 1_000, net_income: 200, eps: 1.0, yoy_revenue_growth: 0 },
    ];
    render(<QuarterlyEarnings earnings={zeroGrowth} />);
    expect(screen.getAllByText(/^\+0\.0%$/).length).toBeGreaterThanOrEqual(1);
  });

  it('does not apply red colour class when growth is positive', () => {
    const { container } = render(<QuarterlyEarnings earnings={[singleQuarter]} />);
    // There should be no red-600 text when every row is positive
    const redSpans = container.querySelectorAll('.text-red-600');
    expect(redSpans).toHaveLength(0);
  });
});

describe('QuarterlyEarnings — negative growth styling (miss analog)', () => {
  const missQuarter: QuarterlyEarning = {
    quarter: 'Q4 2024',
    revenue: 124_300,
    net_income: 36_300,
    eps: 2.40,
    yoy_revenue_growth: -0.02,
  };

  it('does not prefix negative growth with "+"', () => {
    render(<QuarterlyEarnings earnings={[missQuarter]} />);
    // -0.02 * 100 = -2.0 → "-2.0%"
    const negativeGrowth = screen.getAllByText(/^-2\.0%$/);
    expect(negativeGrowth.length).toBeGreaterThanOrEqual(1);
  });

  it('applies red colour class to negative growth spans', () => {
    const { container } = render(<QuarterlyEarnings earnings={[missQuarter]} />);
    const redSpans = container.querySelectorAll('.text-red-600');
    expect(redSpans.length).toBeGreaterThan(0);
  });

  it('does not apply emerald colour class when growth is negative', () => {
    const { container } = render(<QuarterlyEarnings earnings={[missQuarter]} />);
    const emeraldSpans = container.querySelectorAll('.text-emerald-600');
    expect(emeraldSpans).toHaveLength(0);
  });

  it('renders mixed positive and negative growth in the same dataset', () => {
    render(<QuarterlyEarnings earnings={twoQuarters} />);
    expect(screen.getAllByText(/^\+5\.0%$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/^-2\.0%$/).length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================================================
// 6. Revenue formatting (millions / billions / trillions)
// ===========================================================================

describe('QuarterlyEarnings — revenue formatting', () => {
  it('formats revenue < 1 000 as $X.XM (millions suffix)', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 500, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    expect(screen.getAllByText('$500.0M').length).toBeGreaterThanOrEqual(1);
  });

  it('formats revenue >= 1 000 and < 1 000 000 as $X.XB (billions suffix)', () => {
    render(<QuarterlyEarnings earnings={[singleQuarter]} />);
    // 94 900 / 1 000 = 94.9 → "$94.9B"
    expect(screen.getAllByText('$94.9B').length).toBeGreaterThanOrEqual(1);
  });

  it('formats revenue >= 1 000 000 as $X.XT (trillions suffix)', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 1_500_000, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    // 1 500 000 / 1 000 000 = 1.5 → "$1.5T"
    expect(screen.getAllByText('$1.5T').length).toBeGreaterThanOrEqual(1);
  });

  it('formats net_income independently using the same scale rules', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: null, net_income: 2_000, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    // 2 000 / 1 000 = 2.0 → "$2.0B"
    expect(screen.getAllByText('$2.0B').length).toBeGreaterThanOrEqual(1);
  });

  it('formats a large trillion-scale net_income value correctly', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: null, net_income: 3_200_000, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    expect(screen.getAllByText('$3.2T').length).toBeGreaterThanOrEqual(1);
  });

  it('formats boundary value of exactly 1 000 as $1.0B (not $1000.0M)', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 1_000, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    expect(screen.getAllByText('$1.0B').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('$1000.0M')).not.toBeInTheDocument();
  });

  it('formats boundary value of exactly 1 000 000 as $1.0T (not $1000.0B)', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 1_000_000, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    expect(screen.getAllByText('$1.0T').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('$1000.0B')).not.toBeInTheDocument();
  });
});

// ===========================================================================
// 7. Null/missing EPS values — graceful rendering
// ===========================================================================

describe('QuarterlyEarnings — null/missing values', () => {
  it('renders "N/A" for null revenue', () => {
    render(<QuarterlyEarnings earnings={[allNullQuarter]} />);
    const naItems = screen.getAllByText('N/A');
    // revenue + net_income null → at least 2 N/A (desktop + mobile doubles them)
    expect(naItems.length).toBeGreaterThanOrEqual(2);
  });

  it('renders "N/A" for null EPS in the EPS column', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 1_000, net_income: 200, eps: null, yoy_revenue_growth: 0.1 },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    const naItems = screen.getAllByText('N/A');
    expect(naItems.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "N/A" for null yoy_revenue_growth', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 1_000, net_income: 200, eps: 1.0, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(1);
  });

  it('renders without crashing when every nullable field is null', () => {
    expect(() =>
      render(<QuarterlyEarnings earnings={[allNullQuarter]} />),
    ).not.toThrow();
  });

  it('shows the quarter label even when all numeric fields are null', () => {
    render(<QuarterlyEarnings earnings={[allNullQuarter]} />);
    expect(screen.getAllByText('Q2 2025').length).toBeGreaterThanOrEqual(1);
  });

  it('does not render a dollar-sign prefix for null EPS', () => {
    render(<QuarterlyEarnings earnings={[allNullQuarter]} />);
    // Should not find any "$null" or "$undefined" rendered text
    expect(screen.queryByText(/\$null/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$undefined/)).not.toBeInTheDocument();
  });
});

// ===========================================================================
// 8. Quarter label (date) formatting
//
// The component renders `q.quarter` as-is — no date parsing is performed.
// Tests verify that whatever string the caller provides is displayed verbatim,
// including common quarter label patterns.
// ===========================================================================

describe('QuarterlyEarnings — quarter label display', () => {
  it('renders a standard "Q1 2025" label verbatim', () => {
    render(<QuarterlyEarnings earnings={[singleQuarter]} />);
    expect(screen.getAllByText('Q1 2025').length).toBeGreaterThanOrEqual(1);
  });

  it('renders an alternative label format "Q4 2024" verbatim', () => {
    render(<QuarterlyEarnings earnings={twoQuarters} />);
    expect(screen.getAllByText('Q4 2024').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a calendar-style label "Jan 2025" verbatim when provided', () => {
    const calRow: QuarterlyEarning[] = [
      { quarter: 'Jan 2025', revenue: 1_000, net_income: 200, eps: 1.0, yoy_revenue_growth: 0.1 },
    ];
    render(<QuarterlyEarnings earnings={calRow} />);
    expect(screen.getAllByText('Jan 2025').length).toBeGreaterThanOrEqual(1);
  });

  it('renders a fiscal-year label "FY2024" verbatim when provided', () => {
    const fyRow: QuarterlyEarning[] = [
      { quarter: 'FY2024', revenue: 400_000, net_income: 100_000, eps: 6.12, yoy_revenue_growth: 0.08 },
    ];
    render(<QuarterlyEarnings earnings={fyRow} />);
    expect(screen.getAllByText('FY2024').length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================================================
// 9. Multiple quarters sorted correctly (preserves insertion order)
//
// The component renders earnings in the same order they are provided. The
// backend is responsible for sorting; the component must not re-order them.
// ===========================================================================

describe('QuarterlyEarnings — order preservation', () => {
  it('renders rows in the same order as the input array', () => {
    render(<QuarterlyEarnings earnings={fourQuarters} />);
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');

    // Row 0 is the header; data rows start at index 1
    const dataRows = rows.slice(1);
    expect(dataRows).toHaveLength(fourQuarters.length);

    fourQuarters.forEach((q, i) => {
      expect(dataRows[i]).toHaveTextContent(q.quarter);
    });
  });

  it('renders "Q1 2025" before "Q4 2024" when provided in that order', () => {
    render(<QuarterlyEarnings earnings={twoQuarters} />);
    const table = screen.getByRole('table');
    const dataRows = within(table).getAllByRole('row').slice(1);

    expect(dataRows[0]).toHaveTextContent('Q1 2025');
    expect(dataRows[1]).toHaveTextContent('Q4 2024');
  });

  it('renders reversed order when the input is reversed', () => {
    const reversed = [...twoQuarters].reverse();
    render(<QuarterlyEarnings earnings={reversed} />);
    const table = screen.getByRole('table');
    const dataRows = within(table).getAllByRole('row').slice(1);

    expect(dataRows[0]).toHaveTextContent('Q4 2024');
    expect(dataRows[1]).toHaveTextContent('Q1 2025');
  });

  it('renders four quarter labels in insertion order', () => {
    render(<QuarterlyEarnings earnings={fourQuarters} />);
    const table = screen.getByRole('table');
    const dataRows = within(table).getAllByRole('row').slice(1);

    const labels = dataRows.map((r) => r.textContent ?? '');
    expect(labels[0]).toContain('Q1 2025');
    expect(labels[1]).toContain('Q4 2024');
    expect(labels[2]).toContain('Q3 2024');
    expect(labels[3]).toContain('Q2 2024');
  });
});

// ===========================================================================
// 10. Large numbers formatted properly
// ===========================================================================

describe('QuarterlyEarnings — large number formatting', () => {
  it('formats a revenue of 999 999 correctly as $1000.0B (just under trillion threshold)', () => {
    // 999 999 / 1 000 = 999.999 → rounds to "$1000.0B" via toFixed(1)
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 999_999, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    // The abs check uses `abs >= 1_000_000` for the T tier, so 999 999 falls
    // into the B tier: 999 999 / 1 000 = 999.999 → toFixed(1) = "1000.0"
    expect(screen.getAllByText('$1000.0B').length).toBeGreaterThanOrEqual(1);
  });

  it('formats a revenue of 10 000 000 as $10.0T', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 10_000_000, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    expect(screen.getAllByText('$10.0T').length).toBeGreaterThanOrEqual(1);
  });

  it('formats an EPS of 100.00 correctly as $100.00', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: null, net_income: null, eps: 100, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    expect(screen.getAllByText('$100.00').length).toBeGreaterThanOrEqual(1);
  });

  it('formats negative revenue using absolute value for tier selection', () => {
    // -94 900: abs = 94 900 >= 1 000 → B tier; value / 1 000 = -94.9 → "$-94.9B"
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: -94_900, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    expect(screen.getAllByText('$-94.9B').length).toBeGreaterThanOrEqual(1);
  });

  it('formats a very small positive revenue as $X.XM', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 0.1, net_income: null, eps: null, yoy_revenue_growth: null },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    expect(screen.getAllByText('$0.1M').length).toBeGreaterThanOrEqual(1);
  });

  it('handles a very large YoY growth percentage without overflow', () => {
    const row: QuarterlyEarning[] = [
      { quarter: 'Q1 2025', revenue: 1_000, net_income: 200, eps: 1.0, yoy_revenue_growth: 10 },
    ];
    render(<QuarterlyEarnings earnings={row} />);
    // 10 * 100 = 1000.0 → "+1000.0%"
    expect(screen.getAllByText(/^\+1000\.0%$/).length).toBeGreaterThanOrEqual(1);
  });
});

// ===========================================================================
// Mobile card structure
// ===========================================================================

describe('QuarterlyEarnings — mobile card structure', () => {
  it('renders Revenue, Net Income, and EPS labels inside each mobile card', () => {
    render(<QuarterlyEarnings earnings={[singleQuarter]} />);
    // Labels appear in mobile cards (may also appear in table headers)
    expect(screen.getAllByText('Revenue').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Net Income').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('EPS').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the quarter label inside the mobile card header', () => {
    const { container } = render(<QuarterlyEarnings earnings={[singleQuarter]} />);
    const mobileWrapper = container.querySelector('.md\\:hidden');
    expect(mobileWrapper).not.toBeNull();
    expect(within(mobileWrapper! as HTMLElement).getAllByText('Q1 2025').length).toBeGreaterThanOrEqual(1);
  });

  it('renders YoY growth in mobile cards when yoy_revenue_growth is not null', () => {
    render(<QuarterlyEarnings earnings={[singleQuarter]} />);
    // "+5.0%" appears at least once from the mobile card
    expect(screen.getAllByText(/^\+5\.0%$/).length).toBeGreaterThanOrEqual(1);
  });

  it('does not render YoY growth span in a mobile card when yoy_revenue_growth is null', () => {
    const { container } = render(<QuarterlyEarnings earnings={[allNullQuarter]} />);
    const mobileWrapper = container.querySelector('.md\\:hidden');
    expect(mobileWrapper).not.toBeNull();
    // No emerald or red growth spans should be present for a null growth row
    const growthSpans = (mobileWrapper! as HTMLElement).querySelectorAll(
      '.text-emerald-600, .text-red-600',
    );
    expect(growthSpans).toHaveLength(0);
  });
});

// ===========================================================================
// Component-level smoke tests
// ===========================================================================

describe('QuarterlyEarnings — smoke tests', () => {
  it('renders without crashing for an empty array', () => {
    expect(() => render(<QuarterlyEarnings earnings={[]} />)).not.toThrow();
  });

  it('renders without crashing for a large dataset', () => {
    const large: QuarterlyEarning[] = Array.from({ length: 20 }, (_, i) => ({
      quarter: `Q${(i % 4) + 1} ${2020 + Math.floor(i / 4)}`,
      revenue: 50_000 + i * 1_000,
      net_income: 10_000 + i * 500,
      eps: 1.0 + i * 0.05,
      yoy_revenue_growth: i % 3 === 0 ? null : (i % 2 === 0 ? 0.05 : -0.03),
    }));
    expect(() => render(<QuarterlyEarnings earnings={large} />)).not.toThrow();
  });

  it('renders the correct count for a large dataset', () => {
    const large: QuarterlyEarning[] = Array.from({ length: 8 }, (_, i) => ({
      quarter: `Q${(i % 4) + 1} ${2022 + Math.floor(i / 4)}`,
      revenue: 10_000,
      net_income: 2_000,
      eps: 1.0,
      yoy_revenue_growth: 0.05,
    }));
    render(<QuarterlyEarnings earnings={large} />);
    expect(screen.getByText(/8 quarters/)).toBeInTheDocument();
  });
});
