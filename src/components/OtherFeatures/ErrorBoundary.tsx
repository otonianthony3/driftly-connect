import React, { Component, ErrorInfo, ReactNode } from "react";
import PropTypes from "prop-types";

// Define a custom window interface to include trackEvent
declare global {
  interface Window {
    trackEvent?: (eventName: string, data: any) => void;
  }
}

// Define prop and state interfaces
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; errorInfo: ErrorInfo; resetErrorBoundary: () => void }) => ReactNode);
  onReset?: () => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole application.
 *
 * @example
 * <ErrorBoundary fallback={<div>Something went wrong</div>}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    onReset: PropTypes.func,
    showDetails: PropTypes.bool
  };

  static defaultProps = {
    fallback: null,
    onReset: null,
    showDetails: process.env.NODE_ENV !== 'production'
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Update state when an error occurs
   * This is called during the "render" phase, so side-effects are not permitted
   * 
   * @param {Error} error - The error that was caught
   * @returns {object} The new state
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error
    };
  }

  /**
   * This lifecycle method is called after an error has been thrown by a descendant component
   * It's used for side effects like logging the error
   * 
   * @param {Error} error - The error that was thrown
   * @param {React.ErrorInfo} errorInfo - Information about the component stack
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    this.setState({ errorInfo });
    
    // We can log the error to a reporting service here
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component stack:", errorInfo?.componentStack);
    
    // Track error if analytics is available - using optional chaining
    if (typeof window !== 'undefined' && window.trackEvent) {
      window.trackEvent('error_boundary_triggered', {
        error: error.toString(),
        componentStack: errorInfo?.componentStack
      });
    }
  }

  /**
   * Reset the error state to allow for recovery
   */
  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Call the optional onReset callback if provided - using optional chaining
    this.props.onReset?.();
  };

  render(): ReactNode {
    // If there is an error, render the fallback UI
    if (this.state.hasError) {
      // If a custom fallback component is provided, use it
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error as Error,
            errorInfo: this.state.errorInfo as ErrorInfo,
            resetErrorBoundary: this.resetErrorBoundary
          });
        }
        return this.props.fallback;
      }
      
      // Default fallback UI if no custom one is provided
      return (
        <div 
          role="alert"
          className="p-6 border border-red-200 rounded-lg bg-red-50 text-center"
        >
          <h2 className="text-lg font-medium text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600 mb-4">
            An error occurred in this component.
          </p>
          <button
            onClick={this.resetErrorBoundary}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Try again
          </button>
          {this.props.showDetails && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-red-700 cursor-pointer">Error details</summary>
              <pre className="mt-2 p-4 bg-red-100 rounded text-xs text-red-800 overflow-auto max-h-96">
                {this.state.error.toString()}
                {this.state.errorInfo && (
                  <div className="mt-2 border-t border-red-200 pt-2">
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // If there's no error, render the children
    return this.props.children;
  }
}

export default ErrorBoundary;