/**
 * Tests for the AnalysisError component.
 *
 * The component:
 *   - Accepts { ticker, error } props
 *   - Maps error strings to friendly messages via friendlyMessage()
 *   - Runs a useEffect that calls searchStocks(ticker) on mount
 *   - Displays "Searching…" while loading, "Did you mean?" after suggestions arrive
 *   - Falls back to POPULAR_STOCKS when searchStocks rejects
 *   - Renders clickable suggestion buttons that call fetchAnalysis
 *   - Renders a retry link that calls fetchAnalysis with the original ticker
 *
 * Mocking strategy:
 *   - framer-motion stubbed to plain HTML wrappers (no animations in jsdom)
 *   - useStockStore mocked; fetchAnalysis is a vi.fn() spy
 *   - searchStocks mocked per-test via mockResolvedValue / mockRejectedValue
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — must precede any import of the mocked modules
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => {
  const createMotionComponent = (tag: string) => {
    const Component = ({ children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
      const Tag = tag as keyof JSX.IntrinsicElements;
      return <Tag {...(props as object)}>{children}</Tag>;
    };
    Component.displayName = `motion.${tag}`;
    return Component;
  };
  return {
    motion: new Proxy({}, {
      get: (_target, prop: string) => createMotionComponent(prop),
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useMotionValue: () => ({ set: vi.fn() }),
    useSpring: (v: unknown) => v,
    useTransform: () => 0,
  };
});

vi.mock('../../services/stockApi', () => ({
  searchStocks: vi.fn(),
  analyzeStock: vi.fn(),
}));

const mockFetchAnalysis = vi.fn();

vi.mock('../../stores/stockStore', () => ({
  useStockStore: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { useStockStore } from '../../stores/stockStore';
import { searchStocks } from '../../services/stockApi';
import { AnalysisError } from '../../components/error/AnalysisError';
import type { SearchResult } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Constants mirroring the component's POPULAR_STOCKS list
// ---------------------------------------------------------------------------

const POPULAR_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupStore(): void {
  vi.mocked(useStockStore).mockImplementation(
    (selector: (s: { fetchAnalysis: typeof mockFetchAnalysis }) => unknown) =>
      selector({ fetchAnalysis: mockFetchAnalysis }),
  );
}

function renderError(ticker = 'INVALID', error = 'Some error occurred'): ReturnType<typeof render> {
  return render(<AnalysisError ticker={ticker} error={error} />);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('AnalysisError', () => {
  beforeEach(() => {
    mockFetchAnalysis.mockClear();
    vi.mocked(searchStocks).mockClear();
    setupStore();
  });

  // -------------------------------------------------------------------------
  // 1. Heading renders with the failed ticker name
  // -------------------------------------------------------------------------

  describe('heading', () => {
    it('renders "Couldn\'t analyze" heading containing the ticker', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('BADTICKER', 'Some error');
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/Couldn.*t analyze/);
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('BADTICKER');
      });
    });

    it('renders the exact ticker value passed as a prop', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('XYZCO', 'error');
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('XYZCO');
      });
    });
  });

  // -------------------------------------------------------------------------
  // 2–6. friendlyMessage — per-error-type mapping
  // -------------------------------------------------------------------------

  describe('friendlyMessage — 402 / subscription / Premium', () => {
    it('shows subscription message for a 402 status code string', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('GOOGL', '402 Payment Required');
      await waitFor(() => {
        expect(screen.getByText(/premium data subscription/i)).toBeInTheDocument();
      });
    });

    it('shows subscription message when error contains "subscription"', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('GOOGL', 'subscription limit exceeded');
      await waitFor(() => {
        expect(screen.getByText(/premium data subscription/i)).toBeInTheDocument();
      });
    });

    it('shows subscription message when error contains "Premium"', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('GOOGL', 'Premium tier required');
      await waitFor(() => {
        expect(screen.getByText(/premium data subscription/i)).toBeInTheDocument();
      });
    });
  });

  describe('friendlyMessage — 404 / not found / NOT_FOUND', () => {
    it('shows "couldn\'t find that stock" message for a 404 status code string', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('BADCO', '404 Not Found');
      await waitFor(() => {
        expect(screen.getByText(/couldn.*t find that stock/i)).toBeInTheDocument();
      });
    });

    it('shows "couldn\'t find that stock" message when error contains "not found"', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('BADCO', 'Ticker not found');
      await waitFor(() => {
        expect(screen.getByText(/couldn.*t find that stock/i)).toBeInTheDocument();
      });
    });

    it('shows "couldn\'t find that stock" message when error contains "NOT_FOUND"', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('BADCO', 'ERROR_CODE: NOT_FOUND');
      await waitFor(() => {
        expect(screen.getByText(/couldn.*t find that stock/i)).toBeInTheDocument();
      });
    });
  });

  describe('friendlyMessage — 502 / Bad Gateway / EXTERNAL_API', () => {
    it('shows "data provider" message for a 502 status code string', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('AAPL', '502 Bad Gateway');
      await waitFor(() => {
        expect(screen.getByText(/data provider is temporarily unavailable/i)).toBeInTheDocument();
      });
    });

    it('shows "data provider" message when error contains "Bad Gateway"', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('AAPL', 'Bad Gateway received from upstream');
      await waitFor(() => {
        expect(screen.getByText(/data provider is temporarily unavailable/i)).toBeInTheDocument();
      });
    });

    it('shows "data provider" message when error contains "EXTERNAL_API"', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('AAPL', 'EXTERNAL_API error');
      await waitFor(() => {
        expect(screen.getByText(/data provider is temporarily unavailable/i)).toBeInTheDocument();
      });
    });
  });

  describe('friendlyMessage — timeout / TIMEOUT / 408', () => {
    it('shows "took too long" message when error contains "timeout"', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('TSLA', 'request timeout exceeded');
      await waitFor(() => {
        expect(screen.getByText(/took too long/i)).toBeInTheDocument();
      });
    });

    it('shows "took too long" message when error contains "TIMEOUT"', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('TSLA', 'TIMEOUT after 30s');
      await waitFor(() => {
        expect(screen.getByText(/took too long/i)).toBeInTheDocument();
      });
    });

    it('shows "took too long" message when error contains "408"', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('TSLA', '408 Request Timeout');
      await waitFor(() => {
        expect(screen.getByText(/took too long/i)).toBeInTheDocument();
      });
    });
  });

  describe('friendlyMessage — unknown / generic error', () => {
    it('shows generic message for an unrecognised error string', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('AAPL', 'Some totally unknown internal error');
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('shows generic message for an empty error string', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('AAPL', '');
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // 7. Shows "Searching…" while suggestions are loading
  // -------------------------------------------------------------------------

  describe('loading state', () => {
    it('shows "Searching..." text immediately before searchStocks resolves', () => {
      // Return a promise that never resolves during this test to keep loading state
      vi.mocked(searchStocks).mockReturnValue(new Promise(() => {}));
      renderError('GOOG', 'error');
      expect(screen.getByText(/searching\.\.\./i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // 8. Shows "Did you mean?" after suggestions load
  // -------------------------------------------------------------------------

  describe('suggestions loaded', () => {
    it('shows "Did you mean?" label after searchStocks resolves with results', async () => {
      const results: SearchResult[] = [
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'GOOG', name: 'Alphabet Inc. Class C' },
      ];
      vi.mocked(searchStocks).mockResolvedValue(results);
      renderError('GOOG', '404 not found');
      await waitFor(() => {
        expect(screen.getByText(/did you mean\?/i)).toBeInTheDocument();
      });
    });

    it('does not show "Searching..." once results have loaded', async () => {
      vi.mocked(searchStocks).mockResolvedValue([
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      ]);
      renderError('GOOG', 'error');
      await waitFor(() => {
        expect(screen.queryByText(/searching\.\.\./i)).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // 9. Shows suggestion buttons from search results (GOOGL, GOOG)
  // -------------------------------------------------------------------------

  describe('suggestion buttons from search results', () => {
    it('renders a button for each symbol returned by searchStocks', async () => {
      const results: SearchResult[] = [
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'GOOG', name: 'Alphabet Inc. Class C' },
      ];
      vi.mocked(searchStocks).mockResolvedValue(results);
      renderError('google', 'error');
      await waitFor(() => {
        expect(screen.getByText('GOOGL')).toBeInTheDocument();
        expect(screen.getByText('GOOG')).toBeInTheDocument();
      });
    });

    it('renders the stock name alongside each symbol', async () => {
      const results: SearchResult[] = [
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      ];
      vi.mocked(searchStocks).mockResolvedValue(results);
      renderError('google', 'error');
      await waitFor(() => {
        expect(screen.getByText('Alphabet Inc.')).toBeInTheDocument();
      });
    });

    it('limits displayed suggestions to 5 even when more are returned', async () => {
      const results: SearchResult[] = Array.from({ length: 8 }, (_, i) => ({
        symbol: `SYM${i}`,
        name: `Company ${i}`,
      }));
      vi.mocked(searchStocks).mockResolvedValue(results);
      renderError('anything', 'error');
      await waitFor(() => {
        expect(screen.getByText('SYM0')).toBeInTheDocument();
        expect(screen.getByText('SYM4')).toBeInTheDocument();
        // 6th result (index 5) should not appear
        expect(screen.queryByText('SYM5')).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // 10. Clicking a suggestion calls fetchAnalysis with that symbol
  // -------------------------------------------------------------------------

  describe('clicking a suggestion button', () => {
    it('calls fetchAnalysis with the symbol of the clicked suggestion', async () => {
      const results: SearchResult[] = [
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'GOOG', name: 'Alphabet Inc. Class C' },
      ];
      vi.mocked(searchStocks).mockResolvedValue(results);
      renderError('google', 'error');
      await waitFor(() => expect(screen.getByText('GOOGL')).toBeInTheDocument());
      fireEvent.click(screen.getByText('GOOGL'));
      expect(mockFetchAnalysis).toHaveBeenCalledWith('GOOGL');
    });

    it('calls fetchAnalysis with the correct symbol when the second suggestion is clicked', async () => {
      const results: SearchResult[] = [
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'GOOG', name: 'Alphabet Inc. Class C' },
      ];
      vi.mocked(searchStocks).mockResolvedValue(results);
      renderError('google', 'error');
      await waitFor(() => expect(screen.getByText('GOOG')).toBeInTheDocument());
      fireEvent.click(screen.getByText('GOOG'));
      expect(mockFetchAnalysis).toHaveBeenCalledWith('GOOG');
    });

    it('calls fetchAnalysis exactly once per click', async () => {
      vi.mocked(searchStocks).mockResolvedValue([
        { symbol: 'TSLA', name: 'Tesla Inc.' },
      ]);
      renderError('tesla', 'error');
      await waitFor(() => expect(screen.getByText('TSLA')).toBeInTheDocument());
      fireEvent.click(screen.getByText('TSLA'));
      expect(mockFetchAnalysis).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // 11. Falls back to popular stocks when search fails
  // -------------------------------------------------------------------------

  describe('fallback to popular stocks on search failure', () => {
    it('shows popular stock symbols when searchStocks rejects', async () => {
      vi.mocked(searchStocks).mockRejectedValue(new Error('Network error'));
      renderError('INVALID', 'error');
      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
      });
    });

    it('does not show "Did you mean?" label when search fails', async () => {
      vi.mocked(searchStocks).mockRejectedValue(new Error('Network error'));
      renderError('INVALID', 'error');
      await waitFor(() => {
        expect(screen.queryByText(/did you mean\?/i)).not.toBeInTheDocument();
      });
    });

    it('does not show "Searching..." after the failed search settles', async () => {
      vi.mocked(searchStocks).mockRejectedValue(new Error('Network error'));
      renderError('INVALID', 'error');
      await waitFor(() => {
        expect(screen.queryByText(/searching\.\.\./i)).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // 12. Shows popular stock labels (AAPL, MSFT, etc.) as fallback
  // -------------------------------------------------------------------------

  describe('popular stocks fallback content', () => {
    beforeEach(() => {
      vi.mocked(searchStocks).mockRejectedValue(new Error('Search unavailable'));
    });

    it('shows "Try one of these popular stocks" label', async () => {
      renderError('NOEXIST', 'error');
      await waitFor(() => {
        expect(screen.getByText(/try one of these popular stocks/i)).toBeInTheDocument();
      });
    });

    it.each(POPULAR_SYMBOLS)('renders popular stock symbol %s', async (symbol) => {
      renderError('NOEXIST', 'error');
      await waitFor(() => {
        expect(screen.getByText(symbol)).toBeInTheDocument();
      });
    });

    it('renders Apple Inc. name in the popular list', async () => {
      renderError('NOEXIST', 'error');
      await waitFor(() => {
        expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      });
    });

    it('renders Microsoft Corporation name in the popular list', async () => {
      renderError('NOEXIST', 'error');
      await waitFor(() => {
        expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
      });
    });

    it('renders NVIDIA Corporation name in the popular list', async () => {
      renderError('NOEXIST', 'error');
      await waitFor(() => {
        expect(screen.getByText('NVIDIA Corporation')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // 13. Renders retry link with original ticker text
  // -------------------------------------------------------------------------

  describe('retry link', () => {
    it('renders retry button containing the original ticker', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('BADCO', 'error');
      await waitFor(() => {
        expect(screen.getByText(/Try.*BADCO.*again/)).toBeInTheDocument();
      });
    });

    it('renders only one retry button', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('BADCO', 'error');
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const retryButtons = buttons.filter((b) => /again/i.test(b.textContent ?? ''));
        expect(retryButtons).toHaveLength(1);
      });
    });
  });

  // -------------------------------------------------------------------------
  // 14. Clicking retry calls fetchAnalysis with the original ticker
  // -------------------------------------------------------------------------

  describe('retry button interaction', () => {
    it('calls fetchAnalysis with the original ticker when retry is clicked', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('BADCO', 'error');
      await waitFor(() => {
        expect(screen.getByText(/Try.*BADCO.*again/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/Try.*BADCO.*again/));
      expect(mockFetchAnalysis).toHaveBeenCalledWith('BADCO');
    });

    it('does not call fetchAnalysis before retry is clicked', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('BADCO', 'error');
      await waitFor(() => {
        expect(screen.getByText(/Try.*BADCO.*again/)).toBeInTheDocument();
      });
      expect(mockFetchAnalysis).not.toHaveBeenCalled();
    });

    it('calls fetchAnalysis with the ticker, not any suggestion symbol', async () => {
      vi.mocked(searchStocks).mockResolvedValue([
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      ]);
      renderError('google', 'error');
      await waitFor(() => {
        expect(screen.getByText(/Try.*google.*again/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/Try.*google.*again/));
      expect(mockFetchAnalysis).toHaveBeenCalledWith('google');
      expect(mockFetchAnalysis).not.toHaveBeenCalledWith('GOOGL');
    });
  });

  // -------------------------------------------------------------------------
  // 15. searchStocks is called with the provided ticker on mount
  // -------------------------------------------------------------------------

  describe('useEffect — searchStocks invocation', () => {
    it('calls searchStocks with the ticker prop on mount', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('NFLX', 'error');
      await waitFor(() => {
        expect(vi.mocked(searchStocks)).toHaveBeenCalledWith('NFLX');
      });
    });

    it('calls searchStocks exactly once on initial render', async () => {
      vi.mocked(searchStocks).mockResolvedValue([]);
      renderError('NFLX', 'error');
      await waitFor(() => {
        expect(vi.mocked(searchStocks)).toHaveBeenCalledTimes(1);
      });
    });
  });
});
