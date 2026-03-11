/**
 * Tests for TabBar component.
 *
 * Globals (describe, it, expect, vi) are injected by vitest's `globals: true` config.
 * jest-dom matchers are available via the setup file (src/test/setup.ts).
 *
 * framer-motion is mocked so that <motion.div> renders as a plain <div>;
 * this avoids animation / layout-measurement side effects in jsdom.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TabBar } from '../../components/navigation/TabBar';
import type { AnalysisTab } from '../../types/analysis';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that pull framer-motion
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layoutId, transition, className, ...rest }: React.HTMLAttributes<HTMLDivElement> & { layoutId?: string; transition?: unknown }) => (
      <div className={className} data-testid={layoutId ?? 'motion-div'} {...rest}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTabBar(activeTab: AnalysisTab = 'news', onTabChange = vi.fn()) {
  return { onTabChange, ...render(<TabBar activeTab={activeTab} onTabChange={onTabChange} />) };
}

// ---------------------------------------------------------------------------
// TabBar
// ---------------------------------------------------------------------------

describe('TabBar', () => {
  // --- Rendering ------------------------------------------------------------

  it('renders exactly 3 tab buttons', () => {
    renderTabBar();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('renders a "News" tab button', () => {
    renderTabBar();
    expect(screen.getByRole('button', { name: /news/i })).toBeInTheDocument();
  });

  it('renders a "Financials" tab button', () => {
    renderTabBar();
    expect(screen.getByRole('button', { name: /financials/i })).toBeInTheDocument();
  });

  it('renders a "Growth" tab button', () => {
    renderTabBar();
    expect(screen.getByRole('button', { name: /growth/i })).toBeInTheDocument();
  });

  // --- Active tab styling ---------------------------------------------------

  it('applies text-white class to the active tab button', () => {
    renderTabBar('news');
    const activeButton = screen.getByRole('button', { name: /news/i });
    expect(activeButton).toHaveClass('text-white');
  });

  it('does not apply text-white to inactive tab buttons', () => {
    renderTabBar('news');
    expect(screen.getByRole('button', { name: /financials/i })).not.toHaveClass('text-white');
    expect(screen.getByRole('button', { name: /growth/i })).not.toHaveClass('text-white');
  });

  it('applies text-gray-500 to inactive tab buttons', () => {
    renderTabBar('news');
    expect(screen.getByRole('button', { name: /financials/i })).toHaveClass('text-gray-500');
    expect(screen.getByRole('button', { name: /growth/i })).toHaveClass('text-gray-500');
  });

  it('marks "financials" button as active when activeTab is "financials"', () => {
    renderTabBar('financials');
    expect(screen.getByRole('button', { name: /financials/i })).toHaveClass('text-white');
    expect(screen.getByRole('button', { name: /news/i })).toHaveClass('text-gray-500');
    expect(screen.getByRole('button', { name: /growth/i })).toHaveClass('text-gray-500');
  });

  it('marks "growth" button as active when activeTab is "growth"', () => {
    renderTabBar('growth');
    expect(screen.getByRole('button', { name: /growth/i })).toHaveClass('text-white');
    expect(screen.getByRole('button', { name: /news/i })).toHaveClass('text-gray-500');
    expect(screen.getByRole('button', { name: /financials/i })).toHaveClass('text-gray-500');
  });

  // --- Underline indicator --------------------------------------------------

  it('renders the animated underline only for the active tab', () => {
    renderTabBar('news');
    // The mocked motion.div carries data-testid="tab-underline"
    const underlines = screen.getAllByTestId('tab-underline');
    expect(underlines).toHaveLength(1);
  });

  it('does not render the underline when a different tab is active', () => {
    renderTabBar('financials');
    // Only one underline exists and it sits inside the Financials button
    const [underline] = screen.getAllByTestId('tab-underline');
    expect(screen.getByRole('button', { name: /financials/i })).toContainElement(underline);
  });

  // --- Click callbacks ------------------------------------------------------

  it('calls onTabChange with "news" when the News button is clicked', () => {
    const { onTabChange } = renderTabBar('financials');
    fireEvent.click(screen.getByRole('button', { name: /news/i }));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('news');
  });

  it('calls onTabChange with "financials" when the Financials button is clicked', () => {
    const { onTabChange } = renderTabBar('news');
    fireEvent.click(screen.getByRole('button', { name: /financials/i }));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('financials');
  });

  it('calls onTabChange with "growth" when the Growth button is clicked', () => {
    const { onTabChange } = renderTabBar('news');
    fireEvent.click(screen.getByRole('button', { name: /growth/i }));
    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('growth');
  });

  it('calls onTabChange even when the already-active tab is clicked', () => {
    const { onTabChange } = renderTabBar('news');
    fireEvent.click(screen.getByRole('button', { name: /news/i }));
    expect(onTabChange).toHaveBeenCalledWith('news');
  });

  it('does not call onTabChange when no button is clicked', () => {
    const { onTabChange } = renderTabBar();
    expect(onTabChange).not.toHaveBeenCalled();
  });

  // --- Tab order ------------------------------------------------------------

  it('renders tabs in the order: News, Financials, Growth', () => {
    renderTabBar();
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAccessibleName(/news/i);
    expect(buttons[1]).toHaveAccessibleName(/financials/i);
    expect(buttons[2]).toHaveAccessibleName(/growth/i);
  });

  // --- Container structure --------------------------------------------------

  it('wraps all buttons in a flex container with a bottom border', () => {
    const { container } = renderTabBar();
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper).toHaveClass('flex');
    expect(wrapper).toHaveClass('border-b');
  });
});
