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

describe('HeroSearchBar', () => {
  beforeEach(() => {
    mockFetchAnalysis.mockClear();
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

  it('renders the Enter kbd hint when not loading', () => {
    render(<HeroSearchBar />);
    expect(screen.getByText(/Enter/i)).toBeInTheDocument();
  });

  it('updates input value as the user types', () => {
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'AAPL' } });
    expect(input.value).toBe('AAPL');
  });

  it('calls fetchAnalysis with uppercased ticker on Enter key', () => {
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i);
    fireEvent.change(input, { target: { value: 'aapl' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockFetchAnalysis).toHaveBeenCalledTimes(1);
    expect(mockFetchAnalysis).toHaveBeenCalledWith('AAPL');
  });

  it('does not call fetchAnalysis when Enter is pressed on an empty input', () => {
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockFetchAnalysis).not.toHaveBeenCalled();
  });

  it('does not call fetchAnalysis when Enter is pressed on a whitespace-only input', () => {
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockFetchAnalysis).not.toHaveBeenCalled();
  });

  it('does not call fetchAnalysis when a non-Enter key is pressed', () => {
    render(<HeroSearchBar />);
    const input = screen.getByPlaceholderText(/Search any stock/i);
    fireEvent.change(input, { target: { value: 'TSLA' } });
    fireEvent.keyDown(input, { key: 'a' });
    expect(mockFetchAnalysis).not.toHaveBeenCalled();
  });

  it('shows the Loader2 spinner and hides the kbd hint when isLoading is true', () => {
    vi.mocked(useStockStore).mockImplementationOnce(
      (selector: (s: { isLoading: boolean }) => unknown) => selector({ isLoading: true }),
    );
    render(<HeroSearchBar />);
    // The spinner SVG should be present
    const svg = document.querySelector('svg.animate-spin');
    expect(svg).toBeInTheDocument();
    // The kbd hint should not be present
    expect(screen.queryByText(/Enter/i)).not.toBeInTheDocument();
  });
});

// ===========================================================================
// LandingHero
// ===========================================================================

describe('LandingHero', () => {
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

  it('renders the HeroSearchBar input', () => {
    render(<LandingHero />);
    expect(screen.getByPlaceholderText(/Search any stock/i)).toBeInTheDocument();
  });

  it('renders floating icon SVGs from FloatingElements', () => {
    render(<LandingHero />);
    // FloatingElements renders 8 lucide SVG icons; they should all be present.
    const svgs = document.querySelectorAll('svg');
    // At least 8 SVGs from FloatingElements plus any from HeroSearchBar icons
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
});
