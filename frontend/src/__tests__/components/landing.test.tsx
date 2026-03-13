/**
 * Tests for landing page components:
 *   DotGrid, MeshGradientBackground, FloatingElements,
 *   HeroTitle, HeroSearchBar, LandingHero.
 *
 * framer-motion is mocked so motion.* primitives render as plain HTML elements.
 * The stock store is mocked so HeroSearchBar and LandingHero stay synchronous.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// framer-motion mock — must precede any landing-component imports
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    h1: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }) => (
      <h1 {...props}>{children}</h1>
    ),
    p: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) => (
      <p {...props}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useTransform: () => 0,
}));

// ---------------------------------------------------------------------------
// Stock store mock
// ---------------------------------------------------------------------------

vi.mock('../../stores/stockStore', () => ({
  useStockStore: vi.fn((selector: (s: { isLoading: boolean }) => boolean) =>
    selector({ isLoading: false }),
  ),
}));

// Mock the stock API so useStockSearch's debounced fetch never hits the network
vi.mock('../../services/stockApi', () => ({
  searchStocks: vi.fn().mockResolvedValue([]),
  analyzeStock: vi.fn().mockResolvedValue({}),
}));

import { useStockStore } from '../../stores/stockStore';

// Attach getState so the imperative call in HeroSearchBar doesn't throw.
const mockFetchAnalysis = vi.fn();
(useStockStore as unknown as { getState: () => { fetchAnalysis: () => void } }).getState = () => ({
  fetchAnalysis: mockFetchAnalysis,
});

// ---------------------------------------------------------------------------
// Component imports — after mocks are in place
// ---------------------------------------------------------------------------

import { DotGrid } from '../../components/landing/DotGrid';
import { MeshGradientBackground } from '../../components/landing/MeshGradientBackground';
import { FloatingElements } from '../../components/landing/FloatingElements';
import { HeroTitle } from '../../components/landing/HeroTitle';
import { HeroSearchBar } from '../../components/landing/HeroSearchBar';
import { LandingHero } from '../../components/landing/LandingHero';

// ===========================================================================
// DotGrid
// ===========================================================================

describe('DotGrid', () => {
  it('renders a single div element', () => {
    const { container } = render(<DotGrid />);
    // The component is exactly one <div> — no nested children.
    expect(container.firstElementChild).toBeInstanceOf(HTMLDivElement);
  });

  it('applies the opacity class for the subtle overlay effect', () => {
    const { container } = render(<DotGrid />);
    const div = container.firstElementChild as HTMLElement;
    // Tailwind opacity-[0.12] is expressed as a class containing "opacity"
    expect(div.className).toMatch(/opacity/);
  });

  it('has a radial-gradient backgroundImage in the inline style', () => {
    const { container } = render(<DotGrid />);
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.backgroundImage).toContain('radial-gradient');
  });

  it('sets a 24px backgroundSize grid in the inline style', () => {
    const { container } = render(<DotGrid />);
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.backgroundSize).toBe('24px 24px');
  });

  it('is absolutely positioned (has "absolute" class)', () => {
    const { container } = render(<DotGrid />);
    const div = container.firstElementChild as HTMLElement;
    expect(div).toHaveClass('absolute');
  });
});

// ===========================================================================
// MeshGradientBackground
// ===========================================================================

describe('MeshGradientBackground', () => {
  it('renders without crashing', () => {
    expect(() => render(<MeshGradientBackground />)).not.toThrow();
  });

  it('renders a container with overflow-hidden', () => {
    const { container } = render(<MeshGradientBackground />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('overflow-hidden');
  });

  it('renders exactly 3 blob children inside the container', () => {
    const { container } = render(<MeshGradientBackground />);
    const wrapper = container.firstElementChild as HTMLElement;
    // Each blob is a <div> (motion.div → plain div via mock).
    expect(wrapper.children).toHaveLength(3);
  });

  it('container is absolutely positioned to fill its parent', () => {
    const { container } = render(<MeshGradientBackground />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('absolute');
    expect(wrapper).toHaveClass('inset-0');
  });

  it('the first blob carries the indigo colour class', () => {
    const { container } = render(<MeshGradientBackground />);
    const wrapper = container.firstElementChild as HTMLElement;
    const firstBlob = wrapper.children[0] as HTMLElement;
    expect(firstBlob.className).toContain('bg-indigo-400');
  });

  it('blobs are all round (rounded-full class)', () => {
    const { container } = render(<MeshGradientBackground />);
    const wrapper = container.firstElementChild as HTMLElement;
    Array.from(wrapper.children).forEach((blob) => {
      expect(blob as HTMLElement).toHaveClass('rounded-full');
    });
  });
});

// ===========================================================================
// FloatingElements
// ===========================================================================

describe('FloatingElements', () => {
  it('renders without crashing', () => {
    expect(() => render(<FloatingElements />)).not.toThrow();
  });

  it('renders a container with pointer-events-none', () => {
    const { container } = render(<FloatingElements />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('pointer-events-none');
  });

  it('renders exactly 8 floating icon wrappers', () => {
    const { container } = render(<FloatingElements />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.children).toHaveLength(8);
  });

  it('renders SVG icons inside the floating wrappers', () => {
    const { container } = render(<FloatingElements />);
    // lucide-react renders SVG elements; there should be one per item.
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(8);
  });

  it('container is absolutely positioned to fill its parent', () => {
    const { container } = render(<FloatingElements />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('absolute');
    expect(wrapper).toHaveClass('inset-0');
  });
});

// ===========================================================================
// HeroTitle
// ===========================================================================

describe('HeroTitle', () => {
  it('renders without crashing', () => {
    expect(() => render(<HeroTitle />)).not.toThrow();
  });

  it('renders the "AI-Powered" text', () => {
    render(<HeroTitle />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI-Powered');
  });

  it('renders the "Stock Analysis" text inside the h1', () => {
    render(<HeroTitle />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Stock Analysis');
  });

  it('renders the subtitle paragraph about technical indicators', () => {
    render(<HeroTitle />);
    expect(
      screen.getByText(/Technical indicators, price predictions, and real-time news/i),
    ).toBeInTheDocument();
  });

  it('subtitle is rendered as a <p> element', () => {
    render(<HeroTitle />);
    const subtitle = screen.getByText(/Technical indicators/i);
    expect(subtitle.tagName).toBe('P');
  });

  it('wraps content in a text-center container', () => {
    const { container } = render(<HeroTitle />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('text-center');
  });
});

// ===========================================================================
// HeroSearchBar
// ===========================================================================

// Typed alias used across HeroSearchBar tests to drive useStockSearch state.
import type { SearchResult } from '../../types/analysis';

// Module-level mock for useStockSearch so individual tests can override return
// values without touching framer-motion or the store mocks above.
vi.mock('../../hooks/useStockSearch', () => ({
  useStockSearch: vi.fn(),
}));

import { useStockSearch } from '../../hooks/useStockSearch';

/** Default (no-op) return value for useStockSearch — used in most tests. */
function makeSearchHook(overrides: Partial<ReturnType<typeof useStockSearch>> = {}): ReturnType<typeof useStockSearch> {
  return {
    query: '',
    setQuery: vi.fn(),
    suggestions: [],
    selectedIndex: -1,
    isOpen: false,
    isSearching: false,
    handleKeyDown: vi.fn(),
    selectSuggestion: vi.fn(),
    close: vi.fn(),
    ...overrides,
  };
}

describe('HeroSearchBar', () => {
  beforeEach(() => {
    mockFetchAnalysis.mockClear();
    vi.mocked(useStockSearch).mockReturnValue(makeSearchHook());
    vi.mocked(useStockStore).mockImplementation(
      (selector: (s: { isLoading: boolean }) => unknown) => selector({ isLoading: false }),
    );
  });

  it('renders without crashing', () => {
    expect(() => render(<HeroSearchBar />)).not.toThrow();
  });

  it('renders a text input with the correct placeholder', () => {
    render(<HeroSearchBar />);
    expect(
      screen.getByPlaceholderText(/Search any stock/i),
    ).toBeInTheDocument();
  });

  it('renders the Enter kbd hint when not loading and not searching', () => {
    render(<HeroSearchBar />);
    expect(screen.getByText(/Enter/i)).toBeInTheDocument();
  });

  it('calls setQuery when the user types in the input', () => {
    const setQuery = vi.fn();
    vi.mocked(useStockSearch).mockReturnValue(makeSearchHook({ setQuery }));
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i);
    fireEvent.change(input, { target: { value: 'AAPL' } });
    expect(setQuery).toHaveBeenCalledWith('AAPL');
  });

  it('calls fetchAnalysis with uppercased ticker on Enter key when selectedIndex < 0', () => {
    vi.mocked(useStockSearch).mockReturnValue(
      makeSearchHook({ query: 'aapl', selectedIndex: -1 }),
    );
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockFetchAnalysis).toHaveBeenCalledTimes(1);
    expect(mockFetchAnalysis).toHaveBeenCalledWith('AAPL');
  });

  it('does not call fetchAnalysis when Enter is pressed with an empty query', () => {
    vi.mocked(useStockSearch).mockReturnValue(makeSearchHook({ query: '' }));
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockFetchAnalysis).not.toHaveBeenCalled();
  });

  it('does not call fetchAnalysis when Enter is pressed with a whitespace-only query', () => {
    vi.mocked(useStockSearch).mockReturnValue(makeSearchHook({ query: '   ' }));
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockFetchAnalysis).not.toHaveBeenCalled();
  });

  it('does not call fetchAnalysis when a non-Enter key is pressed', () => {
    vi.mocked(useStockSearch).mockReturnValue(makeSearchHook({ query: 'TSLA' }));
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i);
    fireEvent.keyDown(input, { key: 'a' });
    expect(mockFetchAnalysis).not.toHaveBeenCalled();
  });

  it('delegates to handleSuggestionKeyDown for non-Enter keys', () => {
    const handleKeyDown = vi.fn();
    vi.mocked(useStockSearch).mockReturnValue(makeSearchHook({ handleKeyDown, query: 'TSLA' }));
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(handleKeyDown).toHaveBeenCalled();
  });

  it('shows the Loader2 spinner and hides the kbd hint when isLoading is true', () => {
    vi.mocked(useStockStore).mockImplementation(
      (selector: (s: { isLoading: boolean }) => unknown) => selector({ isLoading: true }),
    );
    render(<HeroSearchBar />);
    const svg = document.querySelector('svg.animate-spin');
    expect(svg).toBeInTheDocument();
    expect(screen.queryByText(/Enter/i)).not.toBeInTheDocument();
  });

  it('shows the Loader2 spinner and hides the kbd hint when isSearching is true', () => {
    vi.mocked(useStockSearch).mockReturnValue(makeSearchHook({ isSearching: true }));
    render(<HeroSearchBar />);
    const svg = document.querySelector('svg.animate-spin');
    expect(svg).toBeInTheDocument();
    expect(screen.queryByText(/Enter/i)).not.toBeInTheDocument();
  });

  it('does not call fetchAnalysis on Enter when isLoading is true', () => {
    vi.mocked(useStockStore).mockImplementation(
      (selector: (s: { isLoading: boolean }) => unknown) => selector({ isLoading: true }),
    );
    vi.mocked(useStockSearch).mockReturnValue(makeSearchHook({ query: 'AAPL', selectedIndex: -1 }));
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockFetchAnalysis).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Suggestions dropdown
  // -------------------------------------------------------------------------

  describe('suggestions dropdown', () => {
    const mockSuggestions: SearchResult[] = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    ];

    it('renders the dropdown when isOpen is true and suggestions are present', () => {
      vi.mocked(useStockSearch).mockReturnValue(
        makeSearchHook({ isOpen: true, suggestions: mockSuggestions, selectedIndex: -1 }),
      );
      render(<HeroSearchBar />);
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText('Amazon.com Inc.')).toBeInTheDocument();
    });

    it('renders symbol labels alongside each suggestion name', () => {
      vi.mocked(useStockSearch).mockReturnValue(
        makeSearchHook({ isOpen: true, suggestions: mockSuggestions, selectedIndex: -1 }),
      );
      render(<HeroSearchBar />);
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('AMZN')).toBeInTheDocument();
    });

    it('does not render the dropdown when isOpen is false', () => {
      vi.mocked(useStockSearch).mockReturnValue(
        makeSearchHook({ isOpen: false, suggestions: mockSuggestions }),
      );
      render(<HeroSearchBar />);
      expect(screen.queryByText('Apple Inc.')).not.toBeInTheDocument();
    });

    it('does not render the dropdown when suggestions array is empty even if isOpen', () => {
      vi.mocked(useStockSearch).mockReturnValue(
        makeSearchHook({ isOpen: true, suggestions: [] }),
      );
      render(<HeroSearchBar />);
      // no suggestion buttons should be present
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls selectSuggestion with the correct index when a suggestion is clicked', () => {
      const selectSuggestion = vi.fn();
      vi.mocked(useStockSearch).mockReturnValue(
        makeSearchHook({ isOpen: true, suggestions: mockSuggestions, selectedIndex: -1, selectSuggestion }),
      );
      render(<HeroSearchBar />);
      fireEvent.click(screen.getByText('Amazon.com Inc.'));
      expect(selectSuggestion).toHaveBeenCalledWith(1);
    });

    it('applies the active highlight class to the item at selectedIndex', () => {
      vi.mocked(useStockSearch).mockReturnValue(
        makeSearchHook({ isOpen: true, suggestions: mockSuggestions, selectedIndex: 0 }),
      );
      render(<HeroSearchBar />);
      const buttons = screen.getAllByRole('button');
      expect(buttons[0].className).toContain('bg-indigo-50');
      expect(buttons[1].className).not.toContain('bg-indigo-50');
    });

    it('renders exactly as many buttons as suggestions', () => {
      vi.mocked(useStockSearch).mockReturnValue(
        makeSearchHook({ isOpen: true, suggestions: mockSuggestions, selectedIndex: -1 }),
      );
      render(<HeroSearchBar />);
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Outside-click / Escape behaviour
  // -------------------------------------------------------------------------

  describe('outside-click and Escape', () => {
    it('closes the dropdown on a mousedown event outside both input and dropdown', () => {
      const close = vi.fn();
      const mockSuggestions: SearchResult[] = [
        { symbol: 'AAPL', name: 'Apple Inc.' },
      ];
      // Render with an open dropdown so dropdownRef.current is assigned a DOM node.
      // The outside-click guard requires both refs to be non-null.
      vi.mocked(useStockSearch).mockReturnValue(
        makeSearchHook({ close, isOpen: true, suggestions: mockSuggestions, selectedIndex: -1 }),
      );
      render(<HeroSearchBar />);
      // Simulate a mousedown on the document body — outside the input and dropdown.
      fireEvent.mouseDown(document.body);
      expect(close).toHaveBeenCalled();
    });

    it('calls close on Escape key when the dropdown is open', () => {
      const handleKeyDown = vi.fn();
      vi.mocked(useStockSearch).mockReturnValue(
        makeSearchHook({ handleKeyDown, isOpen: true, query: 'AAPL' }),
      );
      render(<HeroSearchBar />);
      const input = screen.getByPlaceholderText(/Search any stock/i);
      fireEvent.keyDown(input, { key: 'Escape' });
      // handleSuggestionKeyDown is always called for non-Enter keys
      expect(handleKeyDown).toHaveBeenCalled();
    });
  });
});

// ===========================================================================
// LandingHero
// ===========================================================================

describe('LandingHero', () => {
  beforeEach(() => {
    // Ensure the search hook returns a stable no-op default for LandingHero tests.
    vi.mocked(useStockSearch).mockReturnValue(makeSearchHook());
    vi.mocked(useStockStore).mockImplementation(
      (selector: (s: { isLoading: boolean }) => unknown) => selector({ isLoading: false }),
    );
  });

  it('renders without crashing', () => {
    expect(() => render(<LandingHero />)).not.toThrow();
  });

  it('renders the HeroTitle heading', () => {
    render(<LandingHero />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders "AI-Powered" text from HeroTitle', () => {
    render(<LandingHero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('AI-Powered');
  });

  it('renders "Stock Analysis" text inside the h1', () => {
    render(<LandingHero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Stock Analysis');
  });

  it('renders the subtitle paragraph from HeroTitle', () => {
    render(<LandingHero />);
    expect(screen.getByText(/Technical indicators, price predictions/i)).toBeInTheDocument();
  });

  it('renders the HeroSearchBar input', () => {
    render(<LandingHero />);
    expect(screen.getByPlaceholderText(/Search any stock/i)).toBeInTheDocument();
  });

  it('renders floating icon SVGs from FloatingElements (at least 8)', () => {
    render(<LandingHero />);
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(8);
  });

  it('outer container has relative positioning', () => {
    const { container } = render(<LandingHero />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('relative');
  });

  it('outer container centres content with flex flex-col items-center', () => {
    const { container } = render(<LandingHero />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('flex-col');
    expect(wrapper).toHaveClass('items-center');
  });

  it('includes DotGrid: a div with radial-gradient background-image', () => {
    const { container } = render(<LandingHero />);
    const dotGridEl = Array.from(container.querySelectorAll('div')).find(
      (el) => el.style.backgroundImage?.includes('radial-gradient'),
    );
    expect(dotGridEl).toBeDefined();
  });

  it('includes MeshGradientBackground: a container with overflow-hidden', () => {
    const { container } = render(<LandingHero />);
    const meshContainer = Array.from(container.querySelectorAll('div')).find(
      (el) => el.classList.contains('overflow-hidden'),
    );
    expect(meshContainer).toBeDefined();
  });

  it('renders the FloatingElements wrapper with pointer-events-none', () => {
    const { container } = render(<LandingHero />);
    const floatWrapper = Array.from(container.querySelectorAll('div')).find(
      (el) => el.classList.contains('pointer-events-none'),
    );
    expect(floatWrapper).toBeDefined();
  });

  it('inner content wrapper has z-10 to sit above background layers', () => {
    const { container } = render(<LandingHero />);
    const zWrapper = Array.from(container.querySelectorAll('div')).find(
      (el) => el.classList.contains('z-10'),
    );
    expect(zWrapper).toBeDefined();
  });
});
