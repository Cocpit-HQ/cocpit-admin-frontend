import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Error Boundary Caught Exception]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-surface p-6 text-center font-body-md text-on-surface">
          <div className="max-w-md rounded-2xl bg-surface-variant p-8 shadow-xl border border-outline/10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error mb-4">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold font-title text-on-surface mb-2">Something went wrong</h1>
            <p className="text-on-surface-variant mb-6 text-sm">
              An unexpected rendering error occurred. Please try reloading the page or contact the development team if the problem persists.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow transition hover:opacity-90 active:scale-95"
              >
                Reload Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="cursor-pointer rounded-xl bg-outline/10 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-outline/20 active:scale-95"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
