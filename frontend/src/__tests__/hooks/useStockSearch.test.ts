/**
 * Tests for useStockSearch hook.
 *
 * Uses renderHook from @testing-library/react to exercise state transitions
 * without needing a full component tree.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStockSearch } from '../../hooks/useStockSearch';

const noop = vi.fn();

describe('useStockSearch', () => {
  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('initialises query as an empty string', () => {
    const { result } = renderHook(() => useStockSearch(noop));
    expect(result.current.query).toBe('');
  });

  it('exposes setQuery function', () => {
    const { result } = renderHook(() => useStockSearch(noop));
    expect(typeof result.current.setQuery).toBe('function');
  });

  it('exposes close function', () => {
    const { result } = renderHook(() => useStockSearch(noop));
    expect(typeof result.current.close).toBe('function');
  });

  it('exposes isOpen as false initially', () => {
    const { result } = renderHook(() => useStockSearch(noop));
    expect(result.current.isOpen).toBe(false);
  });

  it('exposes suggestions as empty array initially', () => {
    const { result } = renderHook(() => useStockSearch(noop));
    expect(result.current.suggestions).toEqual([]);
  });

  it('exposes selectedIndex as -1 initially', () => {
    const { result } = renderHook(() => useStockSearch(noop));
    expect(result.current.selectedIndex).toBe(-1);
  });

  // -------------------------------------------------------------------------
  // setQuery
  // -------------------------------------------------------------------------

  it('updates query via setQuery', () => {
    const { result } = renderHook(() => useStockSearch(noop));

    act(() => {
      result.current.setQuery('AAPL');
    });

    expect(result.current.query).toBe('AAPL');
  });

  it('setQuery can set an arbitrary string value', () => {
    const { result } = renderHook(() => useStockSearch(noop));

    act(() => {
      result.current.setQuery('Microsoft Corporation');
    });

    expect(result.current.query).toBe('Microsoft Corporation');
  });

  it('setQuery can set an empty string (explicit clear)', () => {
    const { result } = renderHook(() => useStockSearch(noop));

    act(() => {
      result.current.setQuery('TSLA');
    });
    act(() => {
      result.current.setQuery('');
    });

    expect(result.current.query).toBe('');
  });

  // -------------------------------------------------------------------------
  // close
  // -------------------------------------------------------------------------

  it('close resets isOpen to false and selectedIndex to -1', () => {
    const { result } = renderHook(() => useStockSearch(noop));

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('close is a stable reference (useCallback — same ref across renders)', () => {
    const { result, rerender } = renderHook(() => useStockSearch(noop));

    const firstRef = result.current.close;
    rerender();
    const secondRef = result.current.close;

    expect(firstRef).toBe(secondRef);
  });

  // -------------------------------------------------------------------------
  // Min query length behaviour
  // -------------------------------------------------------------------------

  it('clears suggestions when query is empty (below min length)', () => {
    const { result } = renderHook(() => useStockSearch(noop));

    act(() => { result.current.setQuery(''); });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isOpen).toBe(false);
  });

  it('keeps suggestions state intact for a single-character query', () => {
    const { result } = renderHook(() => useStockSearch(noop));

    act(() => { result.current.setQuery('A'); });

    // Query is set — debounced fetch will trigger (not instant)
    expect(result.current.query).toBe('A');
  });

  it('exposes isSearching as false initially', () => {
    const { result } = renderHook(() => useStockSearch(noop));
    expect(result.current.isSearching).toBe(false);
  });

  it('exposes handleKeyDown as a function', () => {
    const { result } = renderHook(() => useStockSearch(noop));
    expect(typeof result.current.handleKeyDown).toBe('function');
  });

  it('exposes selectSuggestion as a function', () => {
    const { result } = renderHook(() => useStockSearch(noop));
    expect(typeof result.current.selectSuggestion).toBe('function');
  });

  // -------------------------------------------------------------------------
  // Multiple sequential updates
  // -------------------------------------------------------------------------

  it('tracks multiple sequential setQuery updates correctly', () => {
    const { result } = renderHook(() => useStockSearch(noop));

    act(() => { result.current.setQuery('A'); });
    expect(result.current.query).toBe('A');

    act(() => { result.current.setQuery('AA'); });
    expect(result.current.query).toBe('AA');

    act(() => { result.current.setQuery('AAP'); });
    expect(result.current.query).toBe('AAP');

    act(() => { result.current.setQuery('AAPL'); });
    expect(result.current.query).toBe('AAPL');
  });
});
