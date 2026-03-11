import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-white border border-stone-200 rounded-xl text-center shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-200">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 mb-1">Something went wrong</h3>
            <p className="text-xs text-stone-500 max-w-xs">
              {this.state.error?.message ?? 'An unexpected error occurred. Please try again.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg text-sm text-stone-600 transition-colors"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
