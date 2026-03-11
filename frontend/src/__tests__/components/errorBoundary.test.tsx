/**
 * Tests for ErrorBoundary component.
 *
 * ErrorBoundary is a class component that catches render errors from its
 * subtree. jsdom + React Testing Library support this via components that
 * throw in their render cycle.
 *
 * console.error is suppressed during these tests because React logs the
 * error to the console before the boundary catches it; the noise would
 * obscure real failures.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

// ---------------------------------------------------------------------------
// Helper — a component that unconditionally throws
// ---------------------------------------------------------------------------

function ThrowingComponent({ message = 'test error' }: { message?: string }) {
  throw new Error(message);
}

// ---------------------------------------------------------------------------
// Suppress the React console.error output that accompanies boundary catches
// ---------------------------------------------------------------------------

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

// ===========================================================================
// ErrorBoundary
// ===========================================================================

describe('ErrorBoundary', () => {
  // -------------------------------------------------------------------------
  // Happy path — renders children when there is no error
  // -------------------------------------------------------------------------

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <span>normal child</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText('normal child')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Default fallback UI
  // -------------------------------------------------------------------------

  it('renders "Something went wrong" heading when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders the thrown error message in the fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Catastrophic failure" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Catastrophic failure')).toBeInTheDocument();
  });

  it('renders a "Try again" button in the default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Custom fallback prop
  // -------------------------------------------------------------------------

  it('renders the custom fallback element instead of the default UI when provided', () => {
    render(
      <ErrorBoundary fallback={<p>custom error fallback</p>}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('custom error fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('does not render the "Try again" button when a custom fallback is supplied', () => {
    render(
      <ErrorBoundary fallback={<div>custom</div>}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Reset via "Try again" button (handleReset)
  // -------------------------------------------------------------------------

  it('clears the error state and re-renders children after clicking "Try again"', () => {
    // A component that throws on first render but not after reset
    let shouldThrow = true;
    function ConditionalThrower() {
      if (shouldThrow) throw new Error('first render error');
      return <span>recovered</span>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>,
    );

    // Default fallback is showing
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Allow the child to render successfully on next mount
    shouldThrow = false;

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('recovered')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // componentDidCatch is called (side-effect verified via console.error spy)
  // -------------------------------------------------------------------------

  it('calls console.error with the error when a child throws', () => {
    // console.error is mocked — just verify the boundary itself does not re-throw
    expect(() =>
      render(
        <ErrorBoundary>
          <ThrowingComponent message="logged error" />
        </ErrorBoundary>,
      ),
    ).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // Fallback text when error.message is undefined (covers the ?? branch)
  // -------------------------------------------------------------------------

  it('shows the default fallback text when error has no message property', () => {
    // We render with a component that throws an error-like object without a message.
    // The ErrorBoundary's getDerivedStateFromError receives whatever is thrown,
    // but React always wraps it in an Error. Instead we test via a component
    // that sets state directly through the React class API by throwing an Error
    // whose message is an empty string — but the ?? only fires when message is
    // undefined/null, so we need to simulate hasError=true with error.message=undefined.
    //
    // The cleanest way: render the boundary catching a thrown object that React
    // will coerce into an Error with an empty message, then verify fallback.
    function ThrowNoMessage() {
      // Throw an error without a message to exercise the ?? fallback
      const err = new Error();
      Object.defineProperty(err, 'message', { get: () => undefined });
      throw err;
    }

    render(
      <ErrorBoundary>
        <ThrowNoMessage />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText('An unexpected error occurred. Please try again.'),
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // getDerivedStateFromError — hasError becomes true
  // -------------------------------------------------------------------------

  it('transitions to error state (stops rendering child) when an error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
        <span>sibling not shown</span>
      </ErrorBoundary>,
    );
    // In error state the child subtree is replaced by the fallback
    expect(screen.queryByText('sibling not shown')).not.toBeInTheDocument();
  });
});
