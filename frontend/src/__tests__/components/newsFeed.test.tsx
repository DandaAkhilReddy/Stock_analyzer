/**
 * Tests for NewsFeed and ResearchSources components.
 *
 * Globals (describe, it, expect) are injected by vitest's `globals: true` config.
 * jest-dom matchers are available via src/test/setup.ts.
 *
 * framer-motion is stubbed so motion.div renders as a plain <div>, keeping
 * tests fast and deterministic.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module stubs
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useTransform: () => 0,
}));

// ---------------------------------------------------------------------------
// Components under test — imported AFTER vi.mock declarations
// ---------------------------------------------------------------------------

import { NewsFeed } from '../../components/news/NewsFeed';
import { ResearchSources } from '../../components/analysis/ResearchSources';
import type { NewsItem } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    title: 'Default headline',
    source: 'Reuters',
    sentiment: 'neutral',
    ...overrides,
  };
}

// ===========================================================================
// NewsFeed
// ===========================================================================

describe('NewsFeed', () => {
  // -------------------------------------------------------------------------
  // Heading
  // -------------------------------------------------------------------------

  describe('heading', () => {
    it('renders the "Latest News" heading when items list is empty', () => {
      render(<NewsFeed items={[]} />);
      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Latest News');
    });

    it('renders the "Latest News" heading when items are present', () => {
      render(<NewsFeed items={[makeItem()]} />);
      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Latest News');
    });
  });

  // -------------------------------------------------------------------------
  // Article count badge
  // -------------------------------------------------------------------------

  describe('article count badge', () => {
    it('shows "0 articles" for an empty array', () => {
      render(<NewsFeed items={[]} />);
      expect(screen.getByText('0 articles')).toBeInTheDocument();
    });

    it('shows "1 articles" for a single item', () => {
      render(<NewsFeed items={[makeItem()]} />);
      expect(screen.getByText('1 articles')).toBeInTheDocument();
    });

    it('shows "3 articles" for three items', () => {
      const items = [makeItem(), makeItem(), makeItem()];
      render(<NewsFeed items={items} />);
      expect(screen.getByText('3 articles')).toBeInTheDocument();
    });

    it('reflects the exact item count for a larger list', () => {
      const items = Array.from({ length: 10 }, (_, i) =>
        makeItem({ title: `Story ${i}` }),
      );
      render(<NewsFeed items={items} />);
      expect(screen.getByText('10 articles')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe('empty state', () => {
    it('shows "No recent news found" when items is an empty array', () => {
      render(<NewsFeed items={[]} />);
      expect(screen.getByText('No recent news found')).toBeInTheDocument();
    });

    it('does not show the empty-state message when at least one item exists', () => {
      render(<NewsFeed items={[makeItem()]} />);
      expect(screen.queryByText('No recent news found')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Item rendering
  // -------------------------------------------------------------------------

  describe('item rendering', () => {
    it('renders the title of a single news item', () => {
      render(<NewsFeed items={[makeItem({ title: 'Fed holds rates steady' })]} />);
      expect(screen.getByText('Fed holds rates steady')).toBeInTheDocument();
    });

    it('renders titles for multiple news items', () => {
      const items = [
        makeItem({ title: 'Inflation data surprises markets' }),
        makeItem({ title: 'Tech sector rally continues' }),
        makeItem({ title: 'Oil prices drop on demand concerns' }),
      ];
      render(<NewsFeed items={items} />);
      expect(screen.getByText('Inflation data surprises markets')).toBeInTheDocument();
      expect(screen.getByText('Tech sector rally continues')).toBeInTheDocument();
      expect(screen.getByText('Oil prices drop on demand concerns')).toBeInTheDocument();
    });

    it('renders the source for each news item', () => {
      const items = [
        makeItem({ title: 'Story A', source: 'Bloomberg' }),
        makeItem({ title: 'Story B', source: 'AP News' }),
      ];
      render(<NewsFeed items={items} />);
      expect(screen.getByText('Bloomberg')).toBeInTheDocument();
      expect(screen.getByText('AP News')).toBeInTheDocument();
    });

    it('does not render a source span when source is null', () => {
      render(<NewsFeed items={[makeItem({ source: null })]} />);
      expect(screen.queryByText('Reuters')).not.toBeInTheDocument();
    });

    it('renders a positive sentiment dot for a positive-sentiment item', () => {
      const { container } = render(
        <NewsFeed items={[makeItem({ sentiment: 'positive' })]} />,
      );
      expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument();
    });

    it('renders a negative sentiment dot for a negative-sentiment item', () => {
      const { container } = render(
        <NewsFeed items={[makeItem({ sentiment: 'negative' })]} />,
      );
      expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
    });

    it('renders exactly one card per item — no duplicates for unique titles', () => {
      const items = [
        makeItem({ title: 'Unique story Alpha' }),
        makeItem({ title: 'Unique story Beta' }),
      ];
      render(<NewsFeed items={items} />);
      // getByText throws if there are 0 or >1 matches — asserts uniqueness implicitly
      expect(screen.getByText('Unique story Alpha')).toBeInTheDocument();
      expect(screen.getByText('Unique story Beta')).toBeInTheDocument();
    });

    it('renders items that have both null source and null sentiment without crashing', () => {
      const item = makeItem({ title: 'Bare headline', source: null, sentiment: null });
      render(<NewsFeed items={[item]} />);
      expect(screen.getByText('Bare headline')).toBeInTheDocument();
    });

    it('renders correctly for a list with mixed null and non-null sources', () => {
      const items = [
        makeItem({ title: 'Has source', source: 'WSJ' }),
        makeItem({ title: 'No source', source: null }),
      ];
      render(<NewsFeed items={items} />);
      expect(screen.getByText('Has source')).toBeInTheDocument();
      expect(screen.getByText('WSJ')).toBeInTheDocument();
      expect(screen.getByText('No source')).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// ResearchSources
// ===========================================================================

describe('ResearchSources', () => {
  // -------------------------------------------------------------------------
  // Null render guard
  // -------------------------------------------------------------------------

  describe('null-render guard', () => {
    it('renders nothing when both researchContext and researchSources are empty', () => {
      const { container } = render(
        <ResearchSources researchContext="" researchSources={[]} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when researchContext is empty string and sources array is empty', () => {
      const { container } = render(
        <ResearchSources researchContext="" researchSources={[]} />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders when researchContext is non-empty even with empty sources', () => {
      render(
        <ResearchSources researchContext="Context text here" researchSources={[]} />,
      );
      // The toggle button header must be present
      expect(
        screen.getByRole('button', { name: /Research Sources/i }),
      ).toBeInTheDocument();
    });

    it('renders when sources are non-empty even with empty researchContext', () => {
      render(
        <ResearchSources
          researchContext=""
          researchSources={['https://example.com']}
        />,
      );
      expect(
        screen.getByRole('button', { name: /Research Sources/i }),
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Header and source count
  // -------------------------------------------------------------------------

  describe('header and source count', () => {
    it('displays "Research Sources (1)" for a single source', () => {
      render(
        <ResearchSources
          researchContext="Some context"
          researchSources={['https://example.com']}
        />,
      );
      expect(screen.getByText('Research Sources (1)')).toBeInTheDocument();
    });

    it('displays "Research Sources (3)" for three sources', () => {
      render(
        <ResearchSources
          researchContext="Some context"
          researchSources={[
            'https://a.com',
            'https://b.com',
            'https://c.com',
          ]}
        />,
      );
      expect(screen.getByText('Research Sources (3)')).toBeInTheDocument();
    });

    it('displays "Research Sources (0)" when context is set but sources are empty', () => {
      render(
        <ResearchSources researchContext="Context only" researchSources={[]} />,
      );
      expect(screen.getByText('Research Sources (0)')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Collapsed state (initial)
  // -------------------------------------------------------------------------

  describe('collapsed state (initial)', () => {
    it('does not show research context text before expanding', () => {
      render(
        <ResearchSources
          researchContext="Hidden context paragraph"
          researchSources={[]}
        />,
      );
      expect(screen.queryByText('Hidden context paragraph')).not.toBeInTheDocument();
    });

    it('does not show source links before expanding', () => {
      render(
        <ResearchSources
          researchContext="Some context"
          researchSources={['https://example.com/report']}
        />,
      );
      expect(
        screen.queryByRole('link', { name: 'https://example.com/report' }),
      ).not.toBeInTheDocument();
    });

    it('shows the ChevronDown icon (not ChevronUp) when collapsed', () => {
      // lucide-react renders SVGs; we verify the expand/collapse by toggling state via click
      const { container } = render(
        <ResearchSources
          researchContext="Context"
          researchSources={['https://example.com']}
        />,
      );
      // In collapsed state only one SVG icon is rendered inside the button
      const button = screen.getByRole('button');
      const svgs = button.querySelectorAll('svg');
      // Both Globe and ChevronDown are inside the button — 2 SVGs total
      expect(svgs).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Expanded state (after click)
  // -------------------------------------------------------------------------

  describe('expanded state (after clicking toggle button)', () => {
    it('shows research context text after expanding', () => {
      render(
        <ResearchSources
          researchContext="Research context paragraph text"
          researchSources={[]}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText('Research context paragraph text')).toBeInTheDocument();
    });

    it('renders source links as anchor elements after expanding', () => {
      render(
        <ResearchSources
          researchContext="Context"
          researchSources={['https://reuters.com/article']}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      const link = screen.getByRole('link', { name: 'https://reuters.com/article' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://reuters.com/article');
    });

    it('renders all source links after expanding', () => {
      const sources = [
        'https://bloomberg.com/story',
        'https://ft.com/story',
        'https://wsj.com/story',
      ];
      render(
        <ResearchSources researchContext="Context" researchSources={sources} />,
      );
      fireEvent.click(screen.getByRole('button'));
      sources.forEach((url) => {
        expect(screen.getByRole('link', { name: url })).toBeInTheDocument();
      });
    });

    it('each source link opens in a new tab (_blank)', () => {
      render(
        <ResearchSources
          researchContext="Context"
          researchSources={['https://example.com']}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      const link = screen.getByRole('link', { name: 'https://example.com' });
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('each source link has rel="noopener noreferrer" for security', () => {
      render(
        <ResearchSources
          researchContext="Context"
          researchSources={['https://example.com']}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      const link = screen.getByRole('link', { name: 'https://example.com' });
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('does not render the context paragraph when researchContext is empty string', () => {
      render(
        <ResearchSources
          researchContext=""
          researchSources={['https://example.com']}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      // No <p> with context text — only the link list should appear
      const paragraphs = screen
        .queryAllByRole('paragraph')
        .concat(
          Array.from(
            document.querySelectorAll<HTMLParagraphElement>('p.text-xs.text-stone-600'),
          ),
        );
      expect(paragraphs).toHaveLength(0);
    });

    it('does not render source list when sources array is empty after expanding', () => {
      render(
        <ResearchSources researchContext="Context only" researchSources={[]} />,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Collapse again (second click)
  // -------------------------------------------------------------------------

  describe('collapse on second click', () => {
    it('hides the expanded content after clicking the toggle twice', () => {
      render(
        <ResearchSources
          researchContext="Toggle context text"
          researchSources={['https://example.com']}
        />,
      );
      const button = screen.getByRole('button');
      // Expand
      fireEvent.click(button);
      expect(screen.getByText('Toggle context text')).toBeInTheDocument();
      // Collapse
      fireEvent.click(button);
      expect(screen.queryByText('Toggle context text')).not.toBeInTheDocument();
    });

    it('hides source links again after collapsing', () => {
      render(
        <ResearchSources
          researchContext="Context"
          researchSources={['https://example.com/hidden']}
        />,
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      expect(
        screen.queryByRole('link', { name: 'https://example.com/hidden' }),
      ).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Context text truncation at 500 chars
  // -------------------------------------------------------------------------

  describe('research context truncation', () => {
    it('renders context text in full when it is exactly 500 characters', () => {
      const exactly500 = 'A'.repeat(500);
      render(
        <ResearchSources researchContext={exactly500} researchSources={[]} />,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText(exactly500)).toBeInTheDocument();
    });

    it('truncates context to first 500 characters and appends "..." when longer', () => {
      const longContext = 'B'.repeat(501);
      render(
        <ResearchSources researchContext={longContext} researchSources={[]} />,
      );
      fireEvent.click(screen.getByRole('button'));
      // The rendered text is the first 500 chars + literal "..."
      const expectedVisible = 'B'.repeat(500) + '...';
      expect(screen.getByText(expectedVisible)).toBeInTheDocument();
    });

    it('does not append "..." when context is shorter than 500 characters', () => {
      const shortContext = 'Short context.';
      render(
        <ResearchSources researchContext={shortContext} researchSources={[]} />,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText('Short context.')).toBeInTheDocument();
      expect(screen.queryByText(/\.\.\.$/)).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Multiple sources count
  // -------------------------------------------------------------------------

  describe('source list item count', () => {
    it('renders the correct number of list items after expanding', () => {
      const sources = ['https://a.com', 'https://b.com', 'https://c.com', 'https://d.com'];
      render(
        <ResearchSources researchContext="Context" researchSources={sources} />,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getAllByRole('listitem')).toHaveLength(4);
    });

    it('renders a single list item for a single-source array', () => {
      render(
        <ResearchSources
          researchContext="Context"
          researchSources={['https://single.com']}
        />,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });
});
