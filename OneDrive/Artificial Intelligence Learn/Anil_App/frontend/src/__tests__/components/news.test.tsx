/**
 * Tests for news components: NewsCard, NewsFeed.
 *
 * Globals (describe, it, expect) are injected by vitest's `globals: true` config.
 * jest-dom matchers are available via the setup file (src/test/setup.ts).
 */

import { render, screen } from '@testing-library/react';
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

  it('renders the sentiment label when sentiment is provided', () => {
    render(<NewsCard item={makeItem({ sentiment: 'positive' })} />);
    expect(screen.getByText('positive')).toBeInTheDocument();
  });

  it('hides the sentiment element when sentiment is null', () => {
    render(<NewsCard item={makeItem({ sentiment: null })} />);
    expect(screen.queryByText('positive')).not.toBeInTheDocument();
    expect(screen.queryByText('negative')).not.toBeInTheDocument();
    expect(screen.queryByText('neutral')).not.toBeInTheDocument();
  });

  it('applies the emerald colour class for positive sentiment', () => {
    render(<NewsCard item={makeItem({ sentiment: 'positive' })} />);
    const label = screen.getByText('positive');
    expect(label).toHaveClass('text-emerald-600');
  });

  it('applies the red colour class for negative sentiment', () => {
    render(<NewsCard item={makeItem({ sentiment: 'negative' })} />);
    const label = screen.getByText('negative');
    expect(label).toHaveClass('text-red-600');
  });

  it('applies the gray colour class for neutral sentiment', () => {
    render(<NewsCard item={makeItem({ sentiment: 'neutral' })} />);
    const label = screen.getByText('neutral');
    expect(label).toHaveClass('text-stone-400');
  });

  it('renders both source and sentiment together when both are provided', () => {
    render(<NewsCard item={makeItem({ source: 'AP News', sentiment: 'negative' })} />);
    expect(screen.getByText('AP News')).toBeInTheDocument();
    expect(screen.getByText('negative')).toBeInTheDocument();
  });

  it('renders title only when both source and sentiment are null', () => {
    render(<NewsCard item={makeItem({ title: 'Bare headline', source: null, sentiment: null })} />);
    expect(screen.getByText('Bare headline')).toBeInTheDocument();
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
