/**
 * Route Error Boundary Component
 * Catches errors in specific routes and provides route-specific error handling
 * @module components/ui/RouteErrorBoundary
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { captureException } from '../../utils/sentry';

/**
 * Route-specific error boundary wrapper
 * Provides navigation context and route-specific error handling
 */
export const RouteErrorBoundary = ({ children, routeName = 'page' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleReset = () => {
    // Optionally navigate back or to a safe route
    if (location.pathname !== '/') {
      navigate(-1);
    }
  };

  const fallback = (error, resetError) => {
    // Capture error with route context
    captureException(error, {
      tags: {
        route: location.pathname,
        routeName,
      },
      contexts: {
        route: {
          pathname: location.pathname,
          search: location.search,
        },
      },
    });

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">
            Error loading {routeName}
          </h2>
          <p className="text-muted-foreground mb-6">
            Something went wrong while loading this {routeName}. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={resetError}
              className="btn-primary"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary fallback={fallback} onReset={handleReset} onReload>
      {children}
    </ErrorBoundary>
  );
};

export default RouteErrorBoundary;

