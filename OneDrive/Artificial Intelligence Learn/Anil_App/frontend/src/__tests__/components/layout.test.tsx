/**
 * Tests for layout components: AppLayout, Header.
 *
 * Header renders StockSearchBar which depends on useStockStore — the store is
 * mocked here so the test remains isolated and synchronous.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the store so StockSearchBar (rendered inside Header) doesn't hit zustand
// ---------------------------------------------------------------------------

vi.mock('../../stores/stockStore', () => ({
  useStockStore: vi.fn((selector: (s: { isLoading: boolean }) => boolean) =>
    selector({ isLoading: false }),
  ),
}));

// Attach getState so the imperative call in StockSearchBar works too
import { useStockStore } from '../../stores/stockStore';
(useStockStore as unknown as { getState: () => { fetchAnalysis: () => void } }).getState = () => ({
  fetchAnalysis: vi.fn(),
});

import { AppLayout } from '../../components/layout/AppLayout';
import { Header } from '../../components/layout/Header';

// ===========================================================================
// AppLayout
// ===========================================================================

describe('AppLayout', () => {
  it('renders children inside the layout', () => {
    render(
      <AppLayout>
        <span>inner content</span>
      </AppLayout>,
    );
    expect(screen.getByText('inner content')).toBeInTheDocument();
  });

  it('renders the Header inside AppLayout (Stock Analyzer brand text is present)', () => {
    render(
      <AppLayout>
        <span>child</span>
      </AppLayout>,
    );
    expect(screen.getByText('Stock Analyzer')).toBeInTheDocument();
  });

  it('renders a <main> element that wraps children', () => {
    render(
      <AppLayout>
        <p data-testid="child-node">content</p>
      </AppLayout>,
    );
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toContainElement(screen.getByTestId('child-node'));
  });

  it('wraps everything in a min-h-screen container', () => {
    const { container } = render(<AppLayout><span /></AppLayout>);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('min-h-screen');
  });

  it('renders multiple children correctly', () => {
    render(
      <AppLayout>
        <span>first</span>
        <span>second</span>
      </AppLayout>,
    );
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });
});

// ===========================================================================
// Header
// ===========================================================================

describe('Header', () => {
  it('renders the "Stock Analyzer" brand title', () => {
    render(<Header />);
    expect(screen.getByText('Stock Analyzer')).toBeInTheDocument();
  });

  it('renders the "AI-Powered Analysis" subtitle', () => {
    render(<Header />);
    expect(screen.getByText('AI-Powered Analysis')).toBeInTheDocument();
  });

  it('renders a <header> element', () => {
    render(<Header />);
    expect(document.querySelector('header')).toBeInTheDocument();
  });

  it('renders the StockSearchBar input within the header', () => {
    render(<Header />);
    const input = screen.getByPlaceholderText(
      'Enter ticker or company name (e.g., AAPL, Microsoft, Tesla)',
    );
    expect(input).toBeInTheDocument();
  });

  it('header has sticky positioning class', () => {
    render(<Header />);
    const header = document.querySelector('header') as HTMLElement;
    expect(header).toHaveClass('sticky');
  });
});
