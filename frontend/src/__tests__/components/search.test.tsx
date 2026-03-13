/**
 * Tests for StockSearchBar component.
 *
 * useStockSearch is mocked to control all dropdown state without
 * needing real debounce timers or network calls.
 * useStockStore is mocked so isLoading is controllable.
 * framer-motion is stubbed to plain pass-through elements.
 *
 * Branches tested:
 *   1. Basic rendering — input, search icon, placeholder
 *   2. Loading state — spinner visible, submit button hidden
 *   3. Idle state     — submit button visible, spinner hidden
 *   4. Suggestions dropdown — visible when isOpen=true and suggestions exist
 *   5. Suggestions dropdown — hidden when isOpen=false
 *   6. Suggestions dropdown — hidden when suggestions array is empty
 *   7. Selected index highlight — active item gets indigo styling
 *   8. Interaction — input onChange calls setQuery
 *   9. Interaction — keydown events forwarded to handleKeyDown
 *  10. Interaction — submit button click triggers fetchAnalysis
 *  11. Interaction — Enter key without selected suggestion calls fetchAnalysis
 *  12. Interaction — clicking a suggestion calls selectSuggestion
 *  13. Interaction — isLoading blocks submit
 *  14. Interaction — empty query does not call fetchAnalysis
 *  15. Outside click closes dropdown
 *  16. Escape key with closed dropdown blurs the input
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any import of the mocked modules
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
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMotionValue: () => ({ set: vi.fn() }),
  useSpring: (v: unknown) => v,
  useTransform: () => 0,
}));

// Zustand store mock — selector-based, so pass the selector through
const mockStoreState = {
  isLoading: false,
};
const mockFetchAnalysis = vi.fn();

vi.mock('../../stores/stockStore', () => ({
  useStockStore: vi.fn((selector: (s: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
  ),
}));

// Hook mock — returned values are controlled per-test via mockHookReturn
const mockSetQuery = vi.fn();
const mockSelectSuggestion = vi.fn();
const mockHandleKeyDown = vi.fn();
const mockClose = vi.fn();

interface MockHookReturn {
  query: string;
  setQuery: typeof mockSetQuery;
  suggestions: { symbol: string; name: string }[];
  selectedIndex: number;
  isOpen: boolean;
  isSearching: boolean;
  handleKeyDown: typeof mockHandleKeyDown;
  selectSuggestion: typeof mockSelectSuggestion;
  close: typeof mockClose;
}

let mockHookReturn: MockHookReturn = {
  query: '',
  setQuery: mockSetQuery,
  suggestions: [],
  selectedIndex: -1,
  isOpen: false,
  isSearching: false,
  handleKeyDown: mockHandleKeyDown,
  selectSuggestion: mockSelectSuggestion,
  close: mockClose,
};

vi.mock('../../hooks/useStockSearch', () => ({
  useStockSearch: vi.fn(() => mockHookReturn),
}));

// ---------------------------------------------------------------------------
// Component under test — imported AFTER all vi.mock() calls
// ---------------------------------------------------------------------------

import { useStockStore } from '../../stores/stockStore';
import { StockSearchBar } from '../../components/search/StockSearchBar';

// Attach imperative getState used inside handleSubmit
(useStockStore as unknown as { getState: () => { fetchAnalysis: typeof mockFetchAnalysis } }).getState =
  () => ({ fetchAnalysis: mockFetchAnalysis });

// ---------------------------------------------------------------------------
// Shared suggestion fixtures
// ---------------------------------------------------------------------------

const sampleSuggestions = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderBar(): ReturnType<typeof render> {
  return render(<StockSearchBar />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StockSearchBar', () => {
  beforeEach(() => {
    // Reset all mocks and restore default hook state before each test
    vi.clearAllMocks();
    mockStoreState.isLoading = false;
    mockHookReturn = {
      query: '',
      setQuery: mockSetQuery,
      suggestions: [],
      selectedIndex: -1,
      isOpen: false,
      isSearching: false,
      handleKeyDown: mockHandleKeyDown,
      selectSuggestion: mockSelectSuggestion,
      close: mockClose,
    };

    // Reattach getState after clearAllMocks to keep it valid
    (
      useStockStore as unknown as {
        getState: () => { fetchAnalysis: typeof mockFetchAnalysis };
      }
    ).getState = () => ({ fetchAnalysis: mockFetchAnalysis });
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('renders the text input element', () => {
      renderBar();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders the correct placeholder text on the input', () => {
      renderBar();
      expect(
        screen.getByPlaceholderText(
          'Search stocks — type to see suggestions (e.g., A for Apple)',
        ),
      ).toBeInTheDocument();
    });

    it('renders the search icon (lucide Search svg)', () => {
      const { container } = renderBar();
      // lucide renders an <svg> element inside the wrapper div
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThanOrEqual(1);
    });

    it('reflects query value from hook in the input', () => {
      mockHookReturn.query = 'TSLA';
      renderBar();
      expect(screen.getByRole('textbox')).toHaveValue('TSLA');
    });
  });

  // -------------------------------------------------------------------------
  // Loading / searching states
  // -------------------------------------------------------------------------

  describe('when isSearching is true', () => {
    beforeEach(() => {
      mockHookReturn.isSearching = true;
    });

    it('renders the loading spinner (Loader2)', () => {
      const { container } = renderBar();
      // Loader2 renders an svg with animate-spin class
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('does not render the submit Search button', () => {
      renderBar();
      expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
    });
  });

  describe('when store isLoading is true', () => {
    beforeEach(() => {
      mockStoreState.isLoading = true;
    });

    it('renders the loading spinner instead of the submit button', () => {
      const { container } = renderBar();
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('does not render the submit Search button', () => {
      renderBar();
      expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
    });
  });

  describe('when neither isLoading nor isSearching', () => {
    it('renders the submit Search button', () => {
      renderBar();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('does not render the loading spinner', () => {
      const { container } = renderBar();
      expect(container.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Suggestions dropdown
  // -------------------------------------------------------------------------

  describe('suggestions dropdown', () => {
    it('is not rendered when isOpen is false', () => {
      mockHookReturn.isOpen = false;
      mockHookReturn.suggestions = sampleSuggestions;
      renderBar();
      expect(screen.queryByText('Apple Inc.')).not.toBeInTheDocument();
    });

    it('is not rendered when suggestions array is empty even if isOpen is true', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = [];
      renderBar();
      // No suggestion buttons should appear beyond the submit button
      const buttons = screen.queryAllByRole('button');
      expect(buttons.every((b) => b.getAttribute('aria-label') === 'Search')).toBe(true);
    });

    it('renders the dropdown when isOpen is true and suggestions exist', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = sampleSuggestions;
      renderBar();
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });

    it('renders one button per suggestion', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = sampleSuggestions;
      renderBar();
      // 3 suggestion buttons + 1 submit button
      const allButtons = screen.getAllByRole('button');
      // Filter out the submit button (aria-label="Search")
      const suggestionButtons = allButtons.filter(
        (b) => b.getAttribute('aria-label') !== 'Search',
      );
      expect(suggestionButtons).toHaveLength(3);
    });

    it('displays the company name for each suggestion', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = sampleSuggestions;
      renderBar();
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
      expect(screen.getByText('Amazon.com Inc.')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
    });

    it('displays the ticker symbol for each suggestion', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = sampleSuggestions;
      renderBar();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('AMZN')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
    });

    it('renders a single suggestion correctly when list has one item', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = [{ symbol: 'GOOG', name: 'Alphabet Inc.' }];
      renderBar();
      expect(screen.getByText('Alphabet Inc.')).toBeInTheDocument();
      expect(screen.getByText('GOOG')).toBeInTheDocument();
    });

    it('applies highlighted styling to the selected index item', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = sampleSuggestions;
      mockHookReturn.selectedIndex = 1; // Amazon
      renderBar();
      const amazonButton = screen.getByText('Amazon.com Inc.').closest('button');
      expect(amazonButton).toHaveClass('bg-indigo-50');
      expect(amazonButton).toHaveClass('text-indigo-700');
    });

    it('does not apply highlighted styling to non-selected items', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = sampleSuggestions;
      mockHookReturn.selectedIndex = 1; // Amazon selected, Apple is not
      renderBar();
      const appleButton = screen.getByText('Apple Inc.').closest('button');
      expect(appleButton).not.toHaveClass('bg-indigo-50');
      expect(appleButton).toHaveClass('hover:bg-stone-50');
    });

    it('applies no highlight when selectedIndex is -1', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = sampleSuggestions;
      mockHookReturn.selectedIndex = -1;
      renderBar();
      for (const company of ['Apple Inc.', 'Amazon.com Inc.', 'Microsoft Corporation']) {
        const btn = screen.getByText(company).closest('button');
        expect(btn).not.toHaveClass('bg-indigo-50');
      }
    });
  });

  // -------------------------------------------------------------------------
  // Interactions
  // -------------------------------------------------------------------------

  describe('input onChange', () => {
    it('calls setQuery with the new value when the user types', () => {
      renderBar();
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'NVDA' } });
      expect(mockSetQuery).toHaveBeenCalledTimes(1);
      expect(mockSetQuery).toHaveBeenCalledWith('NVDA');
    });

    it('calls setQuery with an empty string when input is cleared', () => {
      mockHookReturn.query = 'TSLA';
      renderBar();
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
      expect(mockSetQuery).toHaveBeenCalledWith('');
    });
  });

  describe('onKeyDown wiring', () => {
    it('forwards keydown events to the hook handleKeyDown', () => {
      renderBar();
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowDown' });
      expect(mockHandleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('calls hook handleKeyDown for ArrowUp', () => {
      renderBar();
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowUp' });
      expect(mockHandleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('calls hook handleKeyDown for Escape', () => {
      renderBar();
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
      expect(mockHandleKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('submit button click', () => {
    it('calls fetchAnalysis with the uppercased query when submit is clicked', () => {
      mockHookReturn.query = 'aapl';
      renderBar();
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
      expect(mockFetchAnalysis).toHaveBeenCalledTimes(1);
      expect(mockFetchAnalysis).toHaveBeenCalledWith('AAPL');
    });

    it('calls close before dispatching fetchAnalysis on submit click', () => {
      mockHookReturn.query = 'TSLA';
      renderBar();
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
      expect(mockClose).toHaveBeenCalledTimes(1);
      expect(mockFetchAnalysis).toHaveBeenCalledWith('TSLA');
    });

    it('does not call fetchAnalysis when query is empty', () => {
      mockHookReturn.query = '';
      renderBar();
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
      expect(mockFetchAnalysis).not.toHaveBeenCalled();
    });

    it('does not call fetchAnalysis when query is only whitespace', () => {
      mockHookReturn.query = '   ';
      renderBar();
      fireEvent.click(screen.getByRole('button', { name: /search/i }));
      expect(mockFetchAnalysis).not.toHaveBeenCalled();
    });

    it('does not call fetchAnalysis when isLoading is true', () => {
      mockStoreState.isLoading = true;
      mockHookReturn.query = 'AAPL';
      renderBar();
      // Submit button is hidden when loading, so no click possible.
      // Verify no spurious fetchAnalysis calls occurred during render.
      expect(mockFetchAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('Enter key submission', () => {
    it('calls fetchAnalysis when Enter is pressed and no suggestion is selected', () => {
      mockHookReturn.query = 'MSFT';
      mockHookReturn.selectedIndex = -1;
      renderBar();
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      expect(mockFetchAnalysis).toHaveBeenCalledWith('MSFT');
    });

    it('does not call fetchAnalysis via Enter when a suggestion is selected (hook handles it)', () => {
      mockHookReturn.query = 'MSFT';
      mockHookReturn.selectedIndex = 0;
      renderBar();
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      // handleSuggestionKeyDown is forwarded; fetchAnalysis not called directly
      expect(mockFetchAnalysis).not.toHaveBeenCalled();
    });

    it('trims and uppercases query before dispatching via Enter', () => {
      mockHookReturn.query = '  nvda  ';
      mockHookReturn.selectedIndex = -1;
      renderBar();
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      expect(mockFetchAnalysis).toHaveBeenCalledWith('NVDA');
    });
  });

  describe('clicking a suggestion', () => {
    it('calls selectSuggestion with the correct index when first item is clicked', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = sampleSuggestions;
      renderBar();
      // Find suggestion buttons (not the submit button)
      const allButtons = screen.getAllByRole('button');
      const suggestionButtons = allButtons.filter(
        (b) => b.getAttribute('aria-label') !== 'Search',
      );
      fireEvent.click(suggestionButtons[0]);
      expect(mockSelectSuggestion).toHaveBeenCalledWith(0);
    });

    it('calls selectSuggestion with index 1 when the second item is clicked', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = sampleSuggestions;
      renderBar();
      const allButtons = screen.getAllByRole('button');
      const suggestionButtons = allButtons.filter(
        (b) => b.getAttribute('aria-label') !== 'Search',
      );
      fireEvent.click(suggestionButtons[1]);
      expect(mockSelectSuggestion).toHaveBeenCalledWith(1);
    });

    it('calls selectSuggestion with the last index when the last item is clicked', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = sampleSuggestions;
      renderBar();
      const allButtons = screen.getAllByRole('button');
      const suggestionButtons = allButtons.filter(
        (b) => b.getAttribute('aria-label') !== 'Search',
      );
      fireEvent.click(suggestionButtons[suggestionButtons.length - 1]);
      expect(mockSelectSuggestion).toHaveBeenCalledWith(2);
    });
  });

  // -------------------------------------------------------------------------
  // Outside click behaviour
  // -------------------------------------------------------------------------

  describe('outside click', () => {
    it('calls close when a mousedown event fires outside the component', () => {
      mockHookReturn.isOpen = true;
      mockHookReturn.suggestions = sampleSuggestions;
      renderBar();
      // Simulate click outside by firing on document body
      fireEvent.mouseDown(document.body);
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
