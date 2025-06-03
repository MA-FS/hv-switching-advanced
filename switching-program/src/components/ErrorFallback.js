import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles.css';

/**
 * Error Fallback UI component that displays user-friendly error messages
 * and provides recovery options when an error boundary catches an error.
 * 
 * @param {Object} props - Component props
 * @param {Error} props.error - The error that was caught
 * @param {Object} props.errorInfo - Component stack information
 * @param {string} props.errorId - Unique error identifier
 * @param {string} props.fallbackType - Type of fallback UI ('full', 'section', 'inline')
 * @param {string} props.componentName - Name of the component that failed
 * @param {Function} props.onRetry - Callback to retry the failed operation
 * @param {Function} props.onRefreshSection - Callback to refresh the section
 * @param {Function} props.onReloadPage - Callback to reload the entire page
 */
const ErrorFallback = ({
  error,
  errorInfo,
  errorId,
  fallbackType = 'section',
  componentName = 'Component',
  onRetry,
  onRefreshSection,
  onReloadPage
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const timeoutRef = useRef(null);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Handles error reporting - copies error details to clipboard
   */
  const handleReportError = async () => {
    const errorReport = {
      errorId,
      timestamp: new Date().toISOString(),
      component: componentName,
      message: error?.message || 'Unknown error',
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    const reportText = JSON.stringify(errorReport, null, 2);

    try {
      // Check for clipboard API support
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }

      await navigator.clipboard.writeText(reportText);
      setReportSent(true);
      timeoutRef.current = setTimeout(() => setReportSent(false), 3000);
    } catch (clipboardError) {
      console.warn('Failed to copy error report to clipboard:', clipboardError);

      // Fallback: Create a text area and copy manually
      try {
        const textArea = document.createElement('textarea');
        textArea.value = reportText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.top = '0';
        textArea.style.left = '0';
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error('Copy command failed');
        }

        setReportSent(true);
        timeoutRef.current = setTimeout(() => setReportSent(false), 3000);
      } catch (fallbackError) {
        console.error('Fallback copy method also failed:', fallbackError);
        // Final fallback: show error details in alert
        alert(`Error Report (ID: ${errorId}):\n\n${reportText}`);
      }
    }
  };

  /**
   * Gets appropriate error message based on component and error type
   */
  const getErrorMessage = () => {
    const componentMessages = {
      'InfoForm': 'There was an issue with the form. Your data has been preserved.',
      'ProgramTable': 'There was an issue with the switching program table. Your data has been preserved.',
      'PDF': 'There was an issue generating the PDF. Please try again.',
      'App': 'The application encountered an unexpected error.',
      'default': `The ${componentName} encountered an unexpected error.`
    };

    return componentMessages[componentName] || componentMessages.default;
  };

  /**
   * Gets appropriate recovery suggestions based on component
   */
  const getRecoverySuggestions = () => {
    const suggestions = {
      'InfoForm': [
        'Try refreshing the form section',
        'Check if all required fields are filled correctly',
        'Save your work and reload the page if the issue persists'
      ],
      'ProgramTable': [
        'Try refreshing the table section',
        'Check if your table data is valid',
        'Save your work before making further changes'
      ],
      'PDF': [
        'Ensure all form fields are completed',
        'Check that your table has valid data',
        'Try reducing the size of your switching program'
      ],
      'default': [
        'Try refreshing this section',
        'Save your work if possible',
        'Reload the page if the issue persists'
      ]
    };

    return suggestions[componentName] || suggestions.default;
  };

  // Styling based on fallback type
  const getContainerStyle = () => {
    const baseStyle = {
      backgroundColor: 'var(--bg-dark)',
      color: 'var(--off-white)',
      border: '2px solid var(--danger)',
      borderRadius: '8px',
      padding: '20px',
      margin: '10px 0',
      textAlign: 'center'
    };

    switch (fallbackType) {
      case 'full':
        return {
          ...baseStyle,
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        };
      case 'inline':
        return {
          ...baseStyle,
          padding: '10px',
          margin: '5px 0',
          fontSize: '0.9rem'
        };
      default: // 'section'
        return baseStyle;
    }
  };

  const containerStyle = getContainerStyle();
  const errorMessage = getErrorMessage();
  const suggestions = getRecoverySuggestions();

  return (
    <div
      style={containerStyle}
      role="alert"
      aria-live="polite"
      aria-labelledby="error-heading"
      aria-describedby="error-message"
    >
      <div style={{ marginBottom: '20px' }}>
        <i
          className="bi bi-exclamation-triangle-fill"
          aria-hidden="true"
          style={{
            fontSize: fallbackType === 'inline' ? '1.5rem' : '3rem',
            color: 'var(--danger)',
            marginBottom: '10px',
            display: 'block'
          }}
        ></i>

        <h3
          id="error-heading"
          style={{
            color: 'var(--danger)',
            marginBottom: '10px',
            fontSize: fallbackType === 'inline' ? '1.1rem' : '1.5rem'
          }}
        >
          <span className="sr-only">Error: </span>
          Something went wrong
        </h3>

        <p
          id="error-message"
          style={{
            marginBottom: '15px',
            fontSize: fallbackType === 'inline' ? '0.9rem' : '1rem'
          }}
        >
          {errorMessage}
        </p>
      </div>

      {fallbackType !== 'inline' && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: 'var(--copper-light)', marginBottom: '10px' }}>
            What you can do:
          </h4>
          <ul style={{ 
            textAlign: 'left', 
            display: 'inline-block',
            paddingLeft: '20px'
          }}>
            {suggestions.map((suggestion, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '15px'
      }}>
        {onRetry && (
          <button
            className="btn btn-primary"
            onClick={onRetry}
            style={{ minWidth: '100px' }}
            aria-label="Retry the failed operation"
          >
            <i className="bi bi-arrow-clockwise" aria-hidden="true"></i> Try Again
          </button>
        )}
        
        {onRefreshSection && fallbackType !== 'full' && (
          <button
            className="btn btn-secondary"
            onClick={onRefreshSection}
            style={{ minWidth: '100px' }}
            aria-label="Refresh this section to recover from the error"
          >
            <i className="bi bi-arrow-repeat" aria-hidden="true"></i> Refresh Section
          </button>
        )}
        
        {fallbackType === 'full' && (
          <button
            className="btn btn-secondary"
            onClick={onReloadPage || (() => window.location.reload())}
            style={{ minWidth: '100px' }}
            aria-label="Reload the entire page to recover from the error"
          >
            <i className="bi bi-arrow-repeat" aria-hidden="true"></i> Reload Page
          </button>
        )}
      </div>

      {fallbackType !== 'inline' && (
        <div style={{ borderTop: '1px solid var(--copper-primary)', paddingTop: '15px' }}>
          <button
            className="btn btn-link"
            onClick={() => setShowDetails(!showDetails)}
            style={{ 
              color: 'var(--copper-light)',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            {showDetails ? 'Hide' : 'Show'} Technical Details
          </button>
          
          <button
            className="btn btn-link"
            onClick={handleReportError}
            style={{ 
              color: 'var(--copper-light)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              marginLeft: '15px'
            }}
          >
            {reportSent ? 'Report Copied!' : 'Copy Error Report'}
          </button>

          {showDetails && (
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '4px',
              textAlign: 'left',
              fontSize: '0.8rem',
              fontFamily: 'monospace'
            }}>
              <strong>Error ID:</strong> {errorId}<br/>
              <strong>Component:</strong> {componentName}<br/>
              <strong>Message:</strong> {error?.message || 'Unknown error'}<br/>
              {error?.stack && (
                <>
                  <strong>Stack:</strong>
                  <pre style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontSize: '0.7rem',
                    marginTop: '5px',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {error.stack}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ErrorFallback.propTypes = {
  error: PropTypes.object,
  errorInfo: PropTypes.object,
  errorId: PropTypes.string,
  fallbackType: PropTypes.oneOf(['full', 'section', 'inline']),
  componentName: PropTypes.string,
  onRetry: PropTypes.func,
  onRefreshSection: PropTypes.func,
  onReloadPage: PropTypes.func
};

ErrorFallback.defaultProps = {
  fallbackType: 'section',
  componentName: 'Component'
};

export default ErrorFallback;
