import React from 'react';
import ErrorFallback from './ErrorFallback';

/**
 * Reusable Error Boundary component that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @param {string} props.fallbackType - Type of fallback UI ('full', 'section', 'inline')
 * @param {string} props.componentName - Name of the component being wrapped (for logging)
 * @param {Function} props.onError - Optional callback when error occurs
 * @param {Object} props.fallbackProps - Additional props to pass to fallback component
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  /**
   * Static method called when an error is thrown during rendering
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state to trigger fallback UI
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  /**
   * Lifecycle method called when an error has been thrown by a descendant component
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Object with componentStack key containing information about component stack
   */
  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    this.logError(error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo: errorInfo
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Logs error information to console and localStorage for debugging
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Component stack information
   */
  logError = (error, errorInfo) => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      errorType: 'ComponentError',
      component: this.props.componentName || 'Unknown',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
      props: {
        fallbackType: this.props.fallbackType,
        componentName: this.props.componentName
      }
    };

    // Log to console for development
    console.error('Error Boundary caught an error:', errorLog);

    // Store in localStorage for debugging (with size limit)
    try {
      const existingLogs = JSON.parse(localStorage.getItem('hvSwitchingErrorLogs') || '[]');
      const updatedLogs = [errorLog, ...existingLogs].slice(0, 50); // Keep last 50 errors
      localStorage.setItem('hvSwitchingErrorLogs', JSON.stringify(updatedLogs));
    } catch (storageError) {
      console.warn('Failed to store error log in localStorage:', storageError);
    }
  };

  /**
   * Handles retry action from fallback UI
   */
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  /**
   * Handles refresh section action from fallback UI
   */
  handleRefreshSection = () => {
    // Force component remount by updating key
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
    
    // Trigger a small delay to ensure clean state reset
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          fallbackType={this.props.fallbackType || 'section'}
          componentName={this.props.componentName || 'Component'}
          onRetry={this.handleRetry}
          onRefreshSection={this.handleRefreshSection}
          {...(this.props.fallbackProps || {})}
        />
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
