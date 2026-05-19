import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/browser';

interface Props {
  children: ReactNode;
  tenantId?: string;
  productId?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught widget error:', error, errorInfo);
    
    // Capture runtime widget crashes
    Sentry.withScope((scope) => {
      if (this.props.tenantId) scope.setTag('tenantId', this.props.tenantId);
      if (this.props.productId) scope.setTag('productId', this.props.productId);
      Sentry.captureException(error, { extra: { errorInfo } });
    });
  }

  public render() {
    if (this.state.hasError) {
      // Graceful fallback UI, never white-screen
      return (
        <div className="tryon-flex tryon-flex-col tryon-items-center tryon-justify-center tryon-h-full tryon-min-h-[300px] tryon-p-6 tryon-text-center">
          <div className="tryon-w-12 tryon-h-12 tryon-rounded-full tryon-bg-red-100 tryon-flex tryon-items-center tryon-justify-center tryon-mb-4">
            <svg className="tryon-w-6 tryon-h-6 tryon-text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="tryon-text-lg tryon-font-semibold tryon-text-slate-900 tryon-mb-2">Something went wrong</h3>
          <p className="tryon-text-sm tryon-text-slate-500 tryon-mb-6">
            We encountered an unexpected error. Please try again.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="tryon-px-4 tryon-py-2 tryon-bg-slate-900 tryon-text-white tryon-rounded-lg tryon-font-medium tryon-transition-transform tryon-active:scale-95"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
