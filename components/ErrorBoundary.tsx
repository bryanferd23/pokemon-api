'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private goHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container mx-auto px-4 py-16 max-w-2xl" role="alert" aria-live="assertive">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  An unexpected error occurred while loading this page. 
                  This might be due to a network issue or a problem with the application.
                </AlertDescription>
              </Alert>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto whitespace-pre-wrap">
                    <strong>Error:</strong> {this.state.error.message}
                    {this.state.error.stack && (
                      <>
                        {'\n\n'}
                        <strong>Stack Trace:</strong>
                        {'\n'}
                        {this.state.error.stack}
                      </>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        {'\n\n'}
                        <strong>Component Stack:</strong>
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4" role="group" aria-label="Error recovery actions">
                <Button onClick={this.handleReset} className="gap-2" aria-describedby="try-again-description">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleReload} className="gap-2" aria-describedby="reload-description">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Reload Page
                </Button>
                <Button variant="outline" onClick={this.goHome} className="gap-2" aria-describedby="home-description">
                  <Home className="h-4 w-4" aria-hidden="true" />
                  Go Home
                </Button>
              </div>
              
              {/* Screen reader descriptions */}
              <div className="sr-only">
                <div id="try-again-description">Attempt to recover from the error by retrying the failed operation</div>
                <div id="reload-description">Refresh the entire page to clear any cached errors</div>
                <div id="home-description">Navigate to the homepage to start fresh</div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    captureError,
    resetError,
  };
}

// Simple error fallback component
export function ErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="text-center py-12">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong</h2>
      <p className="text-muted-foreground mb-6">
        {error.message || 'An unexpected error occurred'}
      </p>
      <Button onClick={resetErrorBoundary} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}