/**
 * Tests for src/components/error/ErrorBoundary.tsx
 *
 * This is the simpler error boundary in the `error/` subdirectory, distinct
 * from `common/ErrorBoundary` which has a custom fallback prop and try-again
 * button. This one renders a fixed fallback with a "Reload" button that calls
 * window.location.reload().
 *
 * console.error is suppressed globally because React logs the caught error to
 * the console before the boundary handles it.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../../components/error/ErrorBoundary';

// ---------------------------------------------------------------------------
// Helper — unconditionally throws on render
// ---------------------------------------------------------------------------

function ThrowingChild() {
  throw new Error('boom');
}

// ---------------------------------------------------------------------------
// Suppress React's own console.error calls around error boundary catches
// ---------------------------------------------------------------------------

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

// ===========================================================================
// ErrorBoundary (error/)
// ===========================================================================

describe('ErrorBoundary (error/)', () => {
  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <span>healthy child</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText('healthy child')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Error fallback UI
  // -------------------------------------------------------------------------

  it('shows "Something went wrong." when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
  });

  it('shows a "Reload" button when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('does not render children in the error state', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
        <span>sibling should be gone</span>
      </ErrorBoundary>,
    );
    expect(screen.queryByText('sibling should be gone')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // componentDidCatch — verified via the console.error spy
  // -------------------------------------------------------------------------

  it('logs the error via console.error when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    // componentDidCatch calls console.error('ErrorBoundary caught:', error, ...)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught:',
      expect.any(Error),
      expect.anything(),
    );
  });

  // -------------------------------------------------------------------------
  // Reload button — calls window.location.reload
  // -------------------------------------------------------------------------

  it('calls window.location.reload when the Reload button is clicked', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: /reload/i }));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});
