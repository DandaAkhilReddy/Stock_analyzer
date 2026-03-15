/**
 * Tests for common UI components: Card, Badge, LoadingSpinner.
 *
 * Globals (describe, it, expect) are injected by vitest's `globals: true` config.
 * jest-dom matchers are available via the setup file (src/test/setup.ts).
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('framer-motion', () => {
  const createMotionComponent = (tag: string) => {
    // Use forwardRef so that ref={ref} in Card reaches the real DOM element
    const Component = React.forwardRef(({ children, ...props }: any, ref: any) => {
      const Tag = tag as any;
      // Filter out framer-motion specific props that aren't valid HTML
      const { style, className, ...rest } = props;
      const htmlProps: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(rest)) {
        if (!key.startsWith('on') || key === 'onClick' || key === 'onMouseMove' || key === 'onMouseLeave') {
          if (typeof val !== 'function' || key.startsWith('on')) {
            htmlProps[key] = val;
          }
        }
      }
      return <Tag ref={ref} style={style} className={className} {...htmlProps}>{children}</Tag>;
    });
    Component.displayName = `motion.${tag}`;
    return Component;
  };
  return {
    motion: new Proxy({}, {
      get: (_target, prop: string) => createMotionComponent(prop),
    }),
    useMotionValue: () => ({ set: vi.fn() }),
    useSpring: (v: any) => v,
    useTransform: () => 0,
  };
});

import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

describe('Card', () => {
  it('renders children content', () => {
    render(<Card>card body</Card>);
    expect(screen.getByText('card body')).toBeInTheDocument();
  });

  it('applies extra className alongside base styles', () => {
    const { container } = render(<Card className="my-custom-class">content</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(div).toHaveClass('my-custom-class');
    // Base styles should still be present
    expect(div).toHaveClass('rounded-2xl');
  });

  it('renders a title element when title prop is supplied', () => {
    render(<Card title="Sector Breakdown">content</Card>);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Sector Breakdown');
  });

  it('omits the title element when title prop is not supplied', () => {
    render(<Card>content</Card>);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders multiple children correctly', () => {
    render(
      <Card>
        <span>first</span>
        <span>second</span>
      </Card>,
    );
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('fires onMouseMove without throwing', () => {
    const { container } = render(<Card>content</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(() => fireEvent.mouseMove(div, { clientX: 100, clientY: 50 })).not.toThrow();
  });

  it('fires onMouseLeave without throwing', () => {
    const { container } = render(<Card>content</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(() => fireEvent.mouseLeave(div)).not.toThrow();
  });

  it('fires onMouseMove then onMouseLeave in sequence without throwing', () => {
    const { container } = render(<Card>content</Card>);
    const div = container.firstElementChild as HTMLElement;
    expect(() => {
      fireEvent.mouseMove(div, { clientX: 200, clientY: 100 });
      fireEvent.mouseLeave(div);
    }).not.toThrow();
  });

  it('takes the early-return path when getBoundingClientRect returns null (rect is falsy)', () => {
    // With forwardRef mock, ref.current is set. Return null from getBoundingClientRect
    // to exercise the `if (!rect) return` early-exit branch.
    const { container } = render(<Card>content</Card>);
    const div = container.firstElementChild as HTMLElement;
    div.getBoundingClientRect = vi.fn().mockReturnValue(null as unknown as DOMRect);
    // Should return early without throwing
    expect(() => fireEvent.mouseMove(div, { clientX: 100, clientY: 50 })).not.toThrow();
    expect(div.getBoundingClientRect).toHaveBeenCalled();
  });

  it('executes x.set / y.set when ref is forwarded and getBoundingClientRect returns a real rect', () => {
    // With forwardRef mock, ref.current is set. Return a real rect to exercise
    // the non-early-return path (rect is truthy → x.set / y.set are called).
    const { container } = render(<Card>content</Card>);
    const div = container.firstElementChild as HTMLElement;
    div.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 10,
      top: 10,
      width: 200,
      height: 100,
    } as DOMRect);
    expect(() => fireEvent.mouseMove(div, { clientX: 110, clientY: 60 })).not.toThrow();
    expect(div.getBoundingClientRect).toHaveBeenCalled();
  });

  it('wraps card in gradient div when gradient={true}', () => {
    const { container } = render(<Card gradient={true}>content</Card>);
    // gradient=true adds a wrapper div with the gradient class outside the motion.div
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper).toHaveClass('bg-gradient-to-r');
    // The inner card (motion.div → rendered as div) should contain children
    expect(wrapper.querySelector('div')).toBeInTheDocument();
    expect(wrapper).toHaveTextContent('content');
  });

  it('does not wrap card in gradient div when gradient is omitted', () => {
    const { container } = render(<Card>content</Card>);
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toHaveClass('bg-gradient-to-r');
  });
});

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge variant="neutral">Hold</Badge>);
    expect(screen.getByText('Hold')).toBeInTheDocument();
  });

  it('renders as a <span> element', () => {
    render(<Badge variant="neutral">label</Badge>);
    expect(screen.getByText('label').tagName).toBe('SPAN');
  });

  // Variant → expected text colour token (Tailwind class fragment)
  const variantColorMap: Array<[string, string]> = [
    ['strong_buy', 'text-emerald-700'],
    ['buy', 'text-emerald-600'],
    ['hold', 'text-amber-700'],
    ['sell', 'text-orange-600'],
    ['strong_sell', 'text-red-600'],
    ['positive', 'text-emerald-700'],
    ['negative', 'text-red-700'],
    ['neutral', 'text-stone-600'],
  ];

  it.each(variantColorMap)(
    'applies correct colour class for variant "%s"',
    (variant, expectedClass) => {
      render(
        <Badge variant={variant as Parameters<typeof Badge>[0]['variant']}>
          {variant}
        </Badge>,
      );
      const span = screen.getByText(variant);
      expect(span).toHaveClass(expectedClass);
    },
  );

  it('defaults to sm size (text-xs, px-2, py-0.5)', () => {
    render(<Badge variant="neutral">small</Badge>);
    const span = screen.getByText('small');
    expect(span).toHaveClass('text-xs');
    expect(span).toHaveClass('px-2');
    expect(span).toHaveClass('py-0.5');
  });

  it('applies md size classes when size="md"', () => {
    render(
      <Badge variant="neutral" size="md">
        medium
      </Badge>,
    );
    const span = screen.getByText('medium');
    expect(span).toHaveClass('text-sm');
    expect(span).toHaveClass('px-3');
    expect(span).toHaveClass('py-1');
  });

  it('applies lg size classes when size="lg"', () => {
    render(
      <Badge variant="neutral" size="lg">
        large
      </Badge>,
    );
    const span = screen.getByText('large');
    expect(span).toHaveClass('text-base');
    expect(span).toHaveClass('px-4');
    expect(span).toHaveClass('py-1.5');
  });

  it('falls back to neutral styles for an unrecognised variant', () => {
    // Cast to bypass TS so we can test the runtime fallback path.
    render(
      <Badge variant={'unknown_variant' as Parameters<typeof Badge>[0]['variant']}>
        fallback
      </Badge>,
    );
    expect(screen.getByText('fallback')).toHaveClass('text-stone-600');
  });
});

// ---------------------------------------------------------------------------
// LoadingSpinner
// ---------------------------------------------------------------------------

describe('LoadingSpinner', () => {
  it('renders without crashing when called with no props', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it('includes the animate-spin icon', () => {
    const { container } = render(<LoadingSpinner />);
    // lucide-react renders an <svg>; the spin class is on the svg element
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  it('does not render a text span when text prop is omitted', () => {
    const { container } = render(<LoadingSpinner />);
    // The component only adds a <span> when `text` is provided.
    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(0);
  });

  it('renders custom text in a span when text prop is supplied', () => {
    render(<LoadingSpinner text="Analysing stock…" />);
    const textNode = screen.getByText('Analysing stock…');
    expect(textNode).toBeInTheDocument();
    expect(textNode.tagName).toBe('SPAN');
  });

  it('passes size prop to the Loader2 icon', () => {
    const { container } = render(<LoadingSpinner size={48} />);
    const svg = container.querySelector('svg');
    // lucide-react sets width/height attributes from the size prop
    expect(svg).toHaveAttribute('width', '48');
    expect(svg).toHaveAttribute('height', '48');
  });

  it('uses 24 as the default icon size', () => {
    const { container } = render(<LoadingSpinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });
});
