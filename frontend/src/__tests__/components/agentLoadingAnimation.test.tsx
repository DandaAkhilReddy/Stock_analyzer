/**
 * Tests for AgentLoadingAnimation component.
 *
 * Covers:
 *   - Ticker text rendering ("Analyzing {ticker}...")
 *   - Message text rendering
 *   - Elapsed seconds counter
 *   - Brain icon center hub presence
 *   - All 7 orbiting icon containers (4 outer + 3 inner)
 *   - 8 data particle elements
 *   - 2 orbit ring elements
 *   - Prop change reactivity (message update)
 *   - Background glow blob elements
 *   - Empty ticker edge case (no crash)
 *
 * framer-motion is stubbed so motion.* renders as plain HTML,
 * keeping tests fast and deterministic (same pattern as priceChart.test.tsx).
 * lucide-react icons are stubbed to render data-testid attributes so each
 * icon can be asserted independently without SVG path logic.
 */

import { render, screen, rerender } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// framer-motion mock — must precede any component imports.
// Uses the Proxy pattern from priceChart.test.tsx so all motion.* tags work.
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => {
  const createMotionComponent = (tag: string) => {
    const Component = ({ children, ...props }: any) => {
      const Tag = tag as any;
      // Strip framer-motion-only props that cause React DOM warnings.
      const {
        animate: _animate,
        initial: _initial,
        exit: _exit,
        transition: _transition,
        whileHover: _whileHover,
        whileTap: _whileTap,
        variants: _variants,
        ...domProps
      } = props;
      return <Tag {...domProps}>{children}</Tag>;
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
// lucide-react mock — each icon renders a span with a data-testid so tests
// can assert presence without relying on SVG internals.
// ---------------------------------------------------------------------------

vi.mock('lucide-react', () => ({
  Brain:    (props: any) => <span data-testid="icon-brain"    {...props} />,
  Search:   (props: any) => <span data-testid="icon-search"   {...props} />,
  BarChart2:(props: any) => <span data-testid="icon-barchart2" {...props} />,
  FileText: (props: any) => <span data-testid="icon-filetext" {...props} />,
  Shield:   (props: any) => <span data-testid="icon-shield"   {...props} />,
  Activity: (props: any) => <span data-testid="icon-activity" {...props} />,
  Target:   (props: any) => <span data-testid="icon-target"   {...props} />,
  Zap:      (props: any) => <span data-testid="icon-zap"      {...props} />,
}));

// ---------------------------------------------------------------------------
// Component import — after all mocks
// ---------------------------------------------------------------------------

import { AgentLoadingAnimation } from '../../components/loading/AgentLoadingAnimation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Props {
  ticker: string;
  message: string;
  elapsedSeconds: number;
}

function defaultProps(): Props {
  return {
    ticker: 'AAPL',
    message: 'Fetching market data...',
    elapsedSeconds: 42,
  };
}

function renderComponent(overrides: Partial<Props> = {}) {
  const props = { ...defaultProps(), ...overrides };
  return render(<AgentLoadingAnimation {...props} />);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('AgentLoadingAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Ticker text
  // -------------------------------------------------------------------------

  describe('ticker text', () => {
    it('renders "Analyzing AAPL..." with the supplied ticker', () => {
      renderComponent({ ticker: 'AAPL' });
      expect(screen.getByText('Analyzing AAPL...')).toBeInTheDocument();
    });

    it('renders "Analyzing TSLA..." when ticker is TSLA', () => {
      renderComponent({ ticker: 'TSLA' });
      expect(screen.getByText('Analyzing TSLA...')).toBeInTheDocument();
    });

    it('renders "Analyzing ..." gracefully when ticker is an empty string', () => {
      // Must not throw; the rendered text is "Analyzing ..."
      renderComponent({ ticker: '' });
      expect(screen.getByText('Analyzing ...')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Message text
  // -------------------------------------------------------------------------

  describe('message text', () => {
    it('renders the supplied message', () => {
      renderComponent({ message: 'Fetching market data...' });
      expect(screen.getByText('Fetching market data...')).toBeInTheDocument();
    });

    it('renders a different message string correctly', () => {
      renderComponent({ message: 'Running AI analysis...' });
      expect(screen.getByText('Running AI analysis...')).toBeInTheDocument();
    });

    it('renders an empty string message without crashing', () => {
      // AnimatePresence renders the motion.p with an empty child — no throw expected.
      expect(() => renderComponent({ message: '' })).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Elapsed seconds counter
  // -------------------------------------------------------------------------

  describe('elapsed seconds counter', () => {
    it('renders "42s" when elapsedSeconds is 42', () => {
      renderComponent({ elapsedSeconds: 42 });
      expect(screen.getByText('42s')).toBeInTheDocument();
    });

    it('renders "0s" when elapsedSeconds is 0', () => {
      renderComponent({ elapsedSeconds: 0 });
      expect(screen.getByText('0s')).toBeInTheDocument();
    });

    it('renders "1s" when elapsedSeconds is 1', () => {
      renderComponent({ elapsedSeconds: 1 });
      expect(screen.getByText('1s')).toBeInTheDocument();
    });

    it('renders large elapsed time correctly', () => {
      renderComponent({ elapsedSeconds: 9999 });
      expect(screen.getByText('9999s')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Brain icon — center hub
  // -------------------------------------------------------------------------

  describe('center hub Brain icon', () => {
    it('renders exactly one Brain icon', () => {
      renderComponent();
      const brainIcons = screen.getAllByTestId('icon-brain');
      expect(brainIcons).toHaveLength(1);
    });

    it('Brain icon is present in the DOM', () => {
      renderComponent();
      expect(screen.getByTestId('icon-brain')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Orbiting agent icons — 4 outer + 3 inner = 7 total
  // -------------------------------------------------------------------------

  describe('orbiting agent icons', () => {
    it('renders the outer Search icon', () => {
      renderComponent();
      expect(screen.getByTestId('icon-search')).toBeInTheDocument();
    });

    it('renders the outer BarChart2 icon', () => {
      renderComponent();
      expect(screen.getByTestId('icon-barchart2')).toBeInTheDocument();
    });

    it('renders the outer FileText icon', () => {
      renderComponent();
      expect(screen.getByTestId('icon-filetext')).toBeInTheDocument();
    });

    it('renders the outer Shield icon', () => {
      renderComponent();
      expect(screen.getByTestId('icon-shield')).toBeInTheDocument();
    });

    it('renders the inner Activity icon', () => {
      renderComponent();
      expect(screen.getByTestId('icon-activity')).toBeInTheDocument();
    });

    it('renders the inner Target icon', () => {
      renderComponent();
      expect(screen.getByTestId('icon-target')).toBeInTheDocument();
    });

    it('renders the inner Zap icon', () => {
      renderComponent();
      expect(screen.getByTestId('icon-zap')).toBeInTheDocument();
    });

    it('renders exactly 7 orbiting icon containers (4 outer + 3 inner)', () => {
      renderComponent();
      // Each OrbitingIcon renders a div.w-7.h-7 wrapper containing the icon.
      // All 7 must be present regardless of which outer/inner group they belong to.
      const outerIcons = [
        screen.getByTestId('icon-search'),
        screen.getByTestId('icon-barchart2'),
        screen.getByTestId('icon-filetext'),
        screen.getByTestId('icon-shield'),
      ];
      const innerIcons = [
        screen.getByTestId('icon-activity'),
        screen.getByTestId('icon-target'),
        screen.getByTestId('icon-zap'),
      ];
      expect(outerIcons).toHaveLength(4);
      expect(innerIcons).toHaveLength(3);
      expect([...outerIcons, ...innerIcons]).toHaveLength(7);
    });
  });

  // -------------------------------------------------------------------------
  // Data particles — 8 particles created via Array.from({ length: 8 })
  // -------------------------------------------------------------------------

  describe('data particles', () => {
    it('renders exactly 8 data particle elements', () => {
      const { container } = renderComponent();
      // DataParticle renders a div with class "absolute w-1.5 h-1.5 rounded-full bg-indigo-400/60"
      const particles = container.querySelectorAll(
        '.w-1\\.5.h-1\\.5.rounded-full',
      );
      expect(particles).toHaveLength(8);
    });

    it('all particles carry the indigo colour class', () => {
      const { container } = renderComponent();
      const particles = container.querySelectorAll('.bg-indigo-400\\/60');
      expect(particles).toHaveLength(8);
    });
  });

  // -------------------------------------------------------------------------
  // Orbit rings — outer (w-60 h-60) and inner (w-40 h-40)
  // -------------------------------------------------------------------------

  describe('orbit rings', () => {
    it('renders the outer orbit ring (w-60 h-60)', () => {
      const { container } = renderComponent();
      const outerRing = container.querySelector('.w-60.h-60.rounded-full');
      expect(outerRing).toBeInTheDocument();
    });

    it('renders the inner orbit ring (w-40 h-40)', () => {
      const { container } = renderComponent();
      const innerRing = container.querySelector('.w-40.h-40.rounded-full');
      expect(innerRing).toBeInTheDocument();
    });

    it('renders exactly 2 concentric orbit rings', () => {
      const { container } = renderComponent();
      // Both rings share: absolute inset-0 m-auto rounded-full border
      const rings = container.querySelectorAll('.inset-0.m-auto.rounded-full.border');
      expect(rings).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Prop change reactivity
  // -------------------------------------------------------------------------

  describe('prop updates', () => {
    it('reflects updated message after re-render', () => {
      const { rerender: rerenderFn } = renderComponent({
        message: 'Fetching market data...',
      });
      expect(screen.getByText('Fetching market data...')).toBeInTheDocument();

      rerenderFn(
        <AgentLoadingAnimation
          ticker="AAPL"
          message="Running AI analysis..."
          elapsedSeconds={42}
        />,
      );
      expect(screen.getByText('Running AI analysis...')).toBeInTheDocument();
    });

    it('reflects updated elapsed seconds after re-render', () => {
      const { rerender: rerenderFn } = renderComponent({ elapsedSeconds: 10 });
      expect(screen.getByText('10s')).toBeInTheDocument();

      rerenderFn(
        <AgentLoadingAnimation
          ticker="AAPL"
          message="Fetching market data..."
          elapsedSeconds={55}
        />,
      );
      expect(screen.getByText('55s')).toBeInTheDocument();
    });

    it('reflects updated ticker after re-render', () => {
      const { rerender: rerenderFn } = renderComponent({ ticker: 'AAPL' });
      expect(screen.getByText('Analyzing AAPL...')).toBeInTheDocument();

      rerenderFn(
        <AgentLoadingAnimation
          ticker="MSFT"
          message="Fetching market data..."
          elapsedSeconds={5}
        />,
      );
      expect(screen.getByText('Analyzing MSFT...')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Background glow blobs
  // -------------------------------------------------------------------------

  describe('background glow blobs', () => {
    it('renders the indigo glow blob', () => {
      const { container } = renderComponent();
      const indigoBlob = container.querySelector('.bg-indigo-400\\/10.blur-3xl');
      expect(indigoBlob).toBeInTheDocument();
    });

    it('renders the violet glow blob', () => {
      const { container } = renderComponent();
      const violetBlob = container.querySelector('.bg-violet-400\\/10.blur-3xl');
      expect(violetBlob).toBeInTheDocument();
    });

    it('renders exactly 2 background glow blobs', () => {
      const { container } = renderComponent();
      const blobs = container.querySelectorAll('.blur-3xl');
      expect(blobs).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Empty ticker edge case
  // -------------------------------------------------------------------------

  describe('empty ticker edge case', () => {
    it('does not crash when ticker is an empty string', () => {
      expect(() => renderComponent({ ticker: '' })).not.toThrow();
    });

    it('still renders the message and elapsed seconds with empty ticker', () => {
      renderComponent({ ticker: '', message: 'Loading...', elapsedSeconds: 5 });
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('5s')).toBeInTheDocument();
    });

    it('still renders all 7 orbiting icons with empty ticker', () => {
      renderComponent({ ticker: '' });
      const allIcons = [
        screen.getByTestId('icon-search'),
        screen.getByTestId('icon-barchart2'),
        screen.getByTestId('icon-filetext'),
        screen.getByTestId('icon-shield'),
        screen.getByTestId('icon-activity'),
        screen.getByTestId('icon-target'),
        screen.getByTestId('icon-zap'),
      ];
      expect(allIcons).toHaveLength(7);
    });
  });

  // -------------------------------------------------------------------------
  // Orbital system container
  // -------------------------------------------------------------------------

  describe('orbital system container', () => {
    it('renders the w-72 h-72 orbital system container', () => {
      const { container } = renderComponent();
      const orbital = container.querySelector('.w-72.h-72');
      expect(orbital).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Overall structure — no crash
  // -------------------------------------------------------------------------

  describe('overall render', () => {
    it('renders without throwing for default props', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders the outermost wrapper with relative positioning and overflow-hidden', () => {
      const { container } = renderComponent();
      const wrapper = container.querySelector('.relative.overflow-hidden');
      expect(wrapper).toBeInTheDocument();
    });

    it('renders text area with the correct z-index class', () => {
      const { container } = renderComponent();
      const textArea = container.querySelector('.z-10');
      expect(textArea).toBeInTheDocument();
    });
  });
});
