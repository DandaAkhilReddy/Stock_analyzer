/**
 * Tests for useStockSearch hook.
 *
 * Uses renderHook from @testing-library/react to exercise state transitions
 * without needing a full component tree.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStockSearch } from '../../hooks/useStockSearch';

describe('useStockSearch', () => {
  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('initialises query as an empty string', () => {
    const { result } = renderHook(() => useStockSearch());
    expect(result.current.query).toBe('');
  });

  it('exposes setQuery function', () => {
    const { result } = renderHook(() => useStockSearch());
    expect(typeof result.current.setQuery).toBe('function');
  });

  it('exposes clearSearch function', () => {
    const { result } = renderHook(() => useStockSearch());
    expect(typeof result.current.clearSearch).toBe('function');
  });

  // -------------------------------------------------------------------------
  // setQuery
  // -------------------------------------------------------------------------

  it('updates query via setQuery', () => {
    const { result } = renderHook(() => useStockSearch());

    act(() => {
      result.current.setQuery('AAPL');
    });

    expect(result.current.query).toBe('AAPL');
  });

  it('setQuery can set an arbitrary string value', () => {
    const { result } = renderHook(() => useStockSearch());

    act(() => {
      result.current.setQuery('Microsoft Corporation');
    });

    expect(result.current.query).toBe('Microsoft Corporation');
  });

  it('setQuery can set an empty string (explicit clear)', () => {
    const { result } = renderHook(() => useStockSearch());

    act(() => {
      result.current.setQuery('TSLA');
    });
    act(() => {
      result.current.setQuery('');
    });

    expect(result.current.query).toBe('');
  });

  // -------------------------------------------------------------------------
  // clearSearch
  // -------------------------------------------------------------------------

  it('clearSearch resets query to empty string', () => {
    const { result } = renderHook(() => useStockSearch());

    act(() => {
      result.current.setQuery('NVDA');
    });
    expect(result.current.query).toBe('NVDA');

    act(() => {
      result.current.clearSearch();
    });
    expect(result.current.query).toBe('');
  });

  it('clearSearch is a stable reference (useCallback — same ref across renders)', () => {
    const { result, rerender } = renderHook(() => useStockSearch());

    const firstRef = result.current.clearSearch;
    rerender();
    const secondRef = result.current.clearSearch;

    expect(firstRef).toBe(secondRef);
  });

  it('calling clearSearch when already empty leaves query as empty string', () => {
    const { result } = renderHook(() => useStockSearch());

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe('');
  });

  // -------------------------------------------------------------------------
  // Multiple sequential updates
  // -------------------------------------------------------------------------

  it('tracks multiple sequential setQuery updates correctly', () => {
    const { result } = renderHook(() => useStockSearch());

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
