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
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) => (
      <h1 {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) => (
      <h2 {...props}>{children}</h2>
    ),
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) => (
      <p {...props}>{children}</p>
    ),
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
      <button {...props}>{children}</button>
    ),
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }) => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useTransform: () => 0,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
}));

const mockFetchAnalysis = vi.fn();

vi.mock('../stores/stockStore', () => ({
  useStockStore: vi.fn(),
}));

// Mock the stock API so useStockSearch's debounced fetch never hits the network
vi.mock('../services/stockApi', () => ({
  searchStocks: vi.fn().mockResolvedValue([]),
  analyzeStock: vi.fn().mockResolvedValue({}),
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

  // Persist middleware API used by hydration guard
  (useStockStore as unknown as Record<string, unknown>).persist = {
    hasHydrated: () => true,
    onFinishHydration: () => () => {},
  };
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
    // Use heading role to distinguish the Header <h1> from the Footer <span>
    expect(screen.getByRole('heading', { name: 'Stock Analyzer' })).toBeInTheDocument();
  });

  it('renders the LandingHero on the root route when no ticker is selected', () => {
    render(<App />);
    // "Reddy" is the h1 brand name in HeroTitle — rendered as individual motion.span
    // characters (one per letter). There are multiple h1s on the page (Header + HeroTitle),
    // so find the one whose combined textContent matches "Reddy".
    const headings = screen.getAllByRole('heading', { level: 1 });
    const reddyHeading = headings.find((h) => h.textContent === 'Reddy');
    expect(reddyHeading).toBeDefined();
  });

  it('renders the hero search input on landing', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(
      /Search any stock/,
    );
    expect(input).toBeInTheDocument();
  });
});
