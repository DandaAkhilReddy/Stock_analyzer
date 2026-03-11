/**
 * Tests for App component.
 *
 * App sets up BrowserRouter → AppLayout → StockAnalysis route.
 * The store is mocked so StockAnalysis renders the empty-state branch
 * (the path exercised when no ticker has been selected yet).
 * The store mock also satisfies StockSearchBar which reads isLoading.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockFetchAnalysis = vi.fn();

vi.mock('../stores/stockStore', () => ({
  useStockStore: vi.fn(),
}));

import { useStockStore } from '../stores/stockStore';

function setupDefaultStore(): void {
  const store = {
    currentTicker: null,
    analysis: null,
    isLoading: false,
    error: null,
    activeTab: 'news' as const,
    setActiveTab: vi.fn(),
    fetchAnalysis: mockFetchAnalysis,
  };

  vi.mocked(useStockStore).mockImplementation(
    (selector: (s: typeof store) => unknown) => selector(store),
  );
  (useStockStore as unknown as { getState: () => typeof store }).getState = () => store;
}

import App from '../App';

// ===========================================================================
// App
// ===========================================================================

describe('App', () => {
  beforeEach(() => {
    setupDefaultStore();
  });

  it('renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('renders the Header brand title "Stock Analyzer"', () => {
    render(<App />);
    expect(screen.getByText('Stock Analyzer')).toBeInTheDocument();
  });

  it('renders the StockAnalysis empty state prompt on the root route', () => {
    render(<App />);
    expect(screen.getByText('Search for a stock to begin')).toBeInTheDocument();
  });

  it('renders the search input in the header', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(
      'Enter ticker or company name (e.g., AAPL, Microsoft, Tesla)',
    );
    expect(input).toBeInTheDocument();
  });
});
