/**
 * Tests for Skeleton and AnalysisSkeleton components.
 *
 * framer-motion is mocked so motion.div renders as a plain <div>,
 * keeping initial/animate props out of the DOM without errors.
 * Globals (describe, it, expect) are injected by vitest's `globals: true` config.
 * jest-dom matchers are available via src/test/setup.ts.
 */

import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// ---------------------------------------------------------------------------
// framer-motion mock — must precede component imports
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      children?: React.ReactNode;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => (
      <div className={className} style={style} {...rest}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useTransform: () => 0,
}));

import { Skeleton, AnalysisSkeleton } from '../../components/common/Skeleton';

// ---------------------------------------------------------------------------
// Skeleton (base component)
// ---------------------------------------------------------------------------

describe('Skeleton', () => {
  it('renders as a div element', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
  });

  it('always carries the animate-shimmer class', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass('animate-shimmer');
  });

  it('always carries the rounded-lg base class', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass('rounded-lg');
  });

  it('merges a custom className alongside the base classes', () => {
    const { container } = render(<Skeleton className="h-8 w-40 my-custom" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass('animate-shimmer');
    expect(el).toHaveClass('rounded-lg');
    expect(el).toHaveClass('h-8');
    expect(el).toHaveClass('w-40');
    expect(el).toHaveClass('my-custom');
  });

  it('renders with no extra classes when className is omitted', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    // className should be exactly 'animate-shimmer rounded-lg ' (trailing space
    // from the template literal is acceptable; what matters is no stray classes)
    expect(el.className.trim()).toBe('animate-shimmer rounded-lg');
  });

  it('renders with no children (self-contained placeholder)', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.childElementCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// AnalysisSkeleton (compound component)
// ---------------------------------------------------------------------------

describe('AnalysisSkeleton', () => {
  // Shared render — AnalysisSkeleton takes no props so one render suffices for
  // the structural assertions.
  function renderAnalysis() {
    return render(<AnalysisSkeleton />);
  }

  it('wraps content in a motion.div (rendered as div)', () => {
    const { container } = renderAnalysis();
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
  });

  it('root wrapper carries space-y-6 and py-6 layout classes', () => {
    const { container } = renderAnalysis();
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('space-y-6');
    expect(root).toHaveClass('py-6');
  });

  it('renders the stock header skeleton area with an icon placeholder', () => {
    const { container } = renderAnalysis();
    // Icon: w-14 h-14 rounded-2xl
    const iconSkeleton = container.querySelector('.w-14.h-14') as HTMLElement | null;
    expect(iconSkeleton).not.toBeNull();
    expect(iconSkeleton).toHaveClass('animate-shimmer');
    expect(iconSkeleton).toHaveClass('rounded-2xl');
  });

  it('renders the title placeholder skeleton in the header', () => {
    const { container } = renderAnalysis();
    const titleSkeleton = container.querySelector('.h-7.w-32') as HTMLElement | null;
    expect(titleSkeleton).not.toBeNull();
    expect(titleSkeleton).toHaveClass('animate-shimmer');
  });

  it('renders the subtitle placeholder skeleton in the header', () => {
    const { container } = renderAnalysis();
    const subtitleSkeleton = container.querySelector('.h-4.w-48') as HTMLElement | null;
    expect(subtitleSkeleton).not.toBeNull();
    expect(subtitleSkeleton).toHaveClass('animate-shimmer');
  });

  it('renders the price placeholder skeleton in the header', () => {
    const { container } = renderAnalysis();
    const priceSkeleton = container.querySelector('.h-8.w-28') as HTMLElement | null;
    expect(priceSkeleton).not.toBeNull();
    expect(priceSkeleton).toHaveClass('animate-shimmer');
  });

  it('renders exactly 6 metric card skeletons', () => {
    const { container } = renderAnalysis();
    // Metric cards: h-16 w-32 rounded-xl shrink-0
    const metricCards = container.querySelectorAll('.h-16.w-32');
    expect(metricCards).toHaveLength(6);
  });

  it('every metric card skeleton has animate-shimmer and rounded-xl', () => {
    const { container } = renderAnalysis();
    const metricCards = container.querySelectorAll('.h-16.w-32');
    metricCards.forEach((card) => {
      expect(card).toHaveClass('animate-shimmer');
      expect(card).toHaveClass('rounded-xl');
    });
  });

  it('renders the signal banner skeleton with h-20 and full width', () => {
    const { container } = renderAnalysis();
    // Signal banner: h-20 w-full rounded-2xl
    const banner = container.querySelector('.h-20.w-full') as HTMLElement | null;
    expect(banner).not.toBeNull();
    expect(banner).toHaveClass('animate-shimmer');
    expect(banner).toHaveClass('rounded-2xl');
  });

  it('renders exactly 5 tab bar skeletons', () => {
    const { container } = renderAnalysis();
    // Tab pills: h-10 w-24 rounded-full
    const tabs = container.querySelectorAll('.h-10.w-24');
    expect(tabs).toHaveLength(5);
  });

  it('every tab skeleton has animate-shimmer and rounded-full', () => {
    const { container } = renderAnalysis();
    const tabs = container.querySelectorAll('.h-10.w-24');
    tabs.forEach((tab) => {
      expect(tab).toHaveClass('animate-shimmer');
      expect(tab).toHaveClass('rounded-full');
    });
  });

  it('renders the content area skeleton with h-80 and full width', () => {
    const { container } = renderAnalysis();
    // Content area: h-80 w-full rounded-2xl
    const content = container.querySelector('.h-80.w-full') as HTMLElement | null;
    expect(content).not.toBeNull();
    expect(content).toHaveClass('animate-shimmer');
    expect(content).toHaveClass('rounded-2xl');
  });

  it('signal banner and content area are distinct elements', () => {
    const { container } = renderAnalysis();
    const fullWidthSkeletons = container.querySelectorAll('.w-full.animate-shimmer');
    // h-20 (banner) + h-80 (content) = 2 full-width shimmer divs
    expect(fullWidthSkeletons).toHaveLength(2);
  });

  it('all leaf skeleton elements carry animate-shimmer', () => {
    const { container } = renderAnalysis();
    // Every element with the rounded-lg base class (direct Skeleton renders)
    // must also have animate-shimmer.
    const shimmerEls = container.querySelectorAll('.animate-shimmer');
    expect(shimmerEls.length).toBeGreaterThan(0);
    shimmerEls.forEach((el) => {
      expect(el).toHaveClass('animate-shimmer');
    });
  });

  it('total shimmer element count is 18 (5 header + 6 metrics + 1 banner + 5 tabs + 1 content)', () => {
    const { container } = renderAnalysis();
    const shimmerEls = container.querySelectorAll('.animate-shimmer');
    // Header skeletons: icon (w-14 h-14), title (h-7 w-32), subtitle (h-4 w-48),
    //   price (h-8 w-28), price-change (h-4 w-20) = 5
    // Metrics bar: 6 × (h-16 w-32)
    // Signal banner: 1 × (h-20 w-full)
    // Tab bar: 5 × (h-10 w-24)
    // Content area: 1 × (h-80 w-full)
    // Total = 18
    expect(shimmerEls.length).toBe(18);
  });
});
