/**
 * Tests for news components: NewsCard, NewsFeed.
 *
 * Globals (describe, it, expect) are injected by vitest's `globals: true` config.
 * jest-dom matchers are available via the setup file (src/test/setup.ts).
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }) => (
      <span {...props}>{children}</span>
    ),
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }) => (
      <p {...props}>{children}</p>
    ),
  },
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useTransform: () => 0,
}));

import { NewsCard } from '../../components/news/NewsCard';
import { NewsFeed } from '../../components/news/NewsFeed';
import type { NewsItem } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    title: 'Default headline',
    source: 'Reuters',
    sentiment: 'neutral',
    url: null,
    published_date: null,
    image_url: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// NewsCard
// ---------------------------------------------------------------------------

describe('NewsCard', () => {
  it('renders the item title', () => {
    render(<NewsCard item={makeItem({ title: 'Markets rally on Fed pivot' })} />);
    expect(screen.getByText('Markets rally on Fed pivot')).toBeInTheDocument();
  });

  it('renders the source when source is a non-null string', () => {
    render(<NewsCard item={makeItem({ source: 'Bloomberg' })} />);
    expect(screen.getByText('Bloomberg')).toBeInTheDocument();
  });

  it('hides the source element when source is null', () => {
    render(<NewsCard item={makeItem({ source: null })} />);
    // "Reuters" is the default; passing null should suppress any source span.
    // We confirm no source text appears at all.
    expect(screen.queryByText('Reuters')).not.toBeInTheDocument();
  });

  it('renders a Bullish sentiment pill for positive sentiment', () => {
    render(<NewsCard item={makeItem({ sentiment: 'positive' })} />);
    expect(screen.getByText('Bullish')).toBeInTheDocument();
  });

  it('renders a Bearish sentiment pill for negative sentiment', () => {
    render(<NewsCard item={makeItem({ sentiment: 'negative' })} />);
    expect(screen.getByText('Bearish')).toBeInTheDocument();
  });

  it('renders a Neutral sentiment pill for neutral sentiment', () => {
    render(<NewsCard item={makeItem({ sentiment: 'neutral' })} />);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('renders a Neutral sentiment pill when sentiment is null', () => {
    render(<NewsCard item={makeItem({ sentiment: null })} />);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('renders source text alongside the sentiment dot', () => {
    render(<NewsCard item={makeItem({ source: 'AP News', sentiment: 'negative' })} />);
    expect(screen.getByText('AP News')).toBeInTheDocument();
  });

  it('renders title only when both source and sentiment are null', () => {
    render(<NewsCard item={makeItem({ title: 'Bare headline', source: null, sentiment: null })} />);
    expect(screen.getByText('Bare headline')).toBeInTheDocument();
    expect(screen.queryByText('Reuters')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // timeAgo branches
  // -------------------------------------------------------------------------

  it('shows relative time in minutes', () => {
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    render(<NewsCard item={makeItem({ published_date: twoMinAgo })} />);
    expect(screen.getByText('2m ago')).toBeInTheDocument();
  });

  it('shows relative time in hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    render(<NewsCard item={makeItem({ published_date: threeHoursAgo })} />);
    expect(screen.getByText('3h ago')).toBeInTheDocument();
  });

  it('shows relative time in days', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    render(<NewsCard item={makeItem({ published_date: twoDaysAgo })} />);
    expect(screen.getByText('2d ago')).toBeInTheDocument();
  });

  it('shows formatted short date for dates older than 7 days', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    render(<NewsCard item={makeItem({ published_date: twoWeeksAgo })} />);
    // toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) → e.g. "Mar 1"
    // Just verify some non-empty text matching a short-month pattern appears.
    const el = screen.queryByText(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/);
    expect(el).toBeTruthy();
  });

  it('shows no timestamp when published_date is null', () => {
    render(<NewsCard item={makeItem({ published_date: null })} />);
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });

  it('shows no timestamp for an invalid date string', () => {
    render(<NewsCard item={makeItem({ published_date: 'not-a-date' })} />);
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Image rendering and onError handler
  // -------------------------------------------------------------------------

  it('renders an image when image_url is provided', () => {
    const { container } = render(<NewsCard item={makeItem({ image_url: 'https://img.com/photo.jpg' })} />);
    // The img has alt="" making it presentational; query the DOM directly.
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'https://img.com/photo.jpg');
  });

  it('hides the image after an error loading it', () => {
    const { container } = render(<NewsCard item={makeItem({ image_url: 'https://img.com/bad.jpg' })} />);
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    act(() => { fireEvent.error(img); });
    expect(container.querySelector('img')).toBeNull();
  });

  it('does not render an image when image_url is null', () => {
    const { container } = render(<NewsCard item={makeItem({ image_url: null })} />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('does not render an image when image_url is an empty string', () => {
    const { container } = render(<NewsCard item={makeItem({ image_url: '' })} />);
    expect(container.querySelector('img')).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Link wrapping when url is provided
  // -------------------------------------------------------------------------

  it('wraps the card in an anchor tag when url is provided', () => {
    render(<NewsCard item={makeItem({ url: 'https://example.com/article' })} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/article');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('does not render an anchor when url is null', () => {
    render(<NewsCard item={makeItem({ url: null })} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('does not render an anchor when url is an empty string', () => {
    render(<NewsCard item={makeItem({ url: '' })} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Sentiment fallback for unknown values
  // -------------------------------------------------------------------------

  it('falls back to Neutral for an unrecognised sentiment value', () => {
    render(<NewsCard item={makeItem({ sentiment: 'mixed' as never })} />);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Source hidden when empty string
  // -------------------------------------------------------------------------

  it('hides the source badge when source is an empty string', () => {
    render(<NewsCard item={makeItem({ source: '' })} />);
    expect(screen.queryByText('Reuters')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// NewsFeed
// ---------------------------------------------------------------------------

describe('NewsFeed', () => {
  it('renders the "Latest News" heading', () => {
    render(<NewsFeed items={[]} />);
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Latest News');
  });

  it('displays the correct article count when items are provided', () => {
    const items = [makeItem({ title: 'First' }), makeItem({ title: 'Second' })];
    render(<NewsFeed items={items} />);
    expect(screen.getByText('2 articles')).toBeInTheDocument();
  });

  it('shows "0 articles" when the items list is empty', () => {
    render(<NewsFeed items={[]} />);
    expect(screen.getByText('0 articles')).toBeInTheDocument();
  });

  it('renders a NewsCard for each item', () => {
    const items = [
      makeItem({ title: 'Fed holds rates steady' }),
      makeItem({ title: 'Tech earnings beat estimates' }),
      makeItem({ title: 'Oil prices surge' }),
    ];
    render(<NewsFeed items={items} />);
    expect(screen.getByText('Fed holds rates steady')).toBeInTheDocument();
    expect(screen.getByText('Tech earnings beat estimates')).toBeInTheDocument();
    expect(screen.getByText('Oil prices surge')).toBeInTheDocument();
  });

  it('shows the empty-state message when no items are provided', () => {
    render(<NewsFeed items={[]} />);
    expect(screen.getByText('No recent news found')).toBeInTheDocument();
  });

  it('does not show the empty-state message when items are present', () => {
    render(<NewsFeed items={[makeItem()]} />);
    expect(screen.queryByText('No recent news found')).not.toBeInTheDocument();
  });

  it('renders exactly one card per item — no duplicates', () => {
    const items = [makeItem({ title: 'Unique story A' }), makeItem({ title: 'Unique story B' })];
    render(<NewsFeed items={items} />);
    // getAllByText would throw if there were duplicates; getByText already asserts uniqueness.
    expect(screen.getByText('Unique story A')).toBeInTheDocument();
    expect(screen.getByText('Unique story B')).toBeInTheDocument();
  });
});
