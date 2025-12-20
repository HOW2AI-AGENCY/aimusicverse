import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { isAppError, getUserErrorMessage, logError } from '@/lib/errors';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Log to boot log for critical debugging
    console.error('[ErrorBoundary] Error caught:', error);
    try {
      const existing = JSON.parse(sessionStorage.getItem('musicverse_boot_log') || '[]');
      existing.push(`[${new Date().toISOString()}] [ErrorBoundary] CRITICAL: ${error.message}`);
      existing.push(`[${new Date().toISOString()}] [ErrorBoundary] Stack: ${error.stack?.substring(0, 500)}`);
      sessionStorage.setItem('musicverse_boot_log', JSON.stringify(existing));
    } catch (e) {
      // Ignore storage errors
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to boot log
    console.error('[ErrorBoundary] componentDidCatch:', error, errorInfo);
    try {
      const existing = JSON.parse(sessionStorage.getItem('musicverse_boot_log') || '[]');
      existing.push(`[${new Date().toISOString()}] [ErrorBoundary] componentDidCatch: ${error.message}`);
      if (errorInfo.componentStack) {
        existing.push(`[${new Date().toISOString()}] [ErrorBoundary] ComponentStack: ${errorInfo.componentStack.substring(0, 300)}`);
      }
      sessionStorage.setItem('musicverse_boot_log', JSON.stringify(existing));
    } catch (e) {
      // Ignore storage errors
    }
    
    // Use structured error logging
    logError(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'ErrorBoundary',
    });

    // Also log to existing logger for backwards compatibility
    logger.error('Error caught by boundary', { 
      error: error.message, 
      stack: error.stack,
      componentStack: errorInfo.componentStack 
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Get user-friendly error message
      const userMessage = getUserErrorMessage(this.state.error);
      const errorCode = isAppError(this.state.error) ? this.state.error.code : 'UNKNOWN_ERROR';

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full p-6 border-destructive/20">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-destructive/10 mb-4">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Что-то пошло не так</h1>
              <p className="text-muted-foreground mb-6">
                Произошла ошибка при загрузке приложения.
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-4 w-full text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Детали ошибки
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.error.stack && (
                      <>\n\n{this.state.error.stack}</>
                    )}
                  </pre>
                </details>
              )}
              
              <div className="w-full space-y-2">
                <Button
                  onClick={this.handleReload}
                  className="w-full"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Перезагрузить страницу
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  На главную
                </Button>
              </div>
              
              <p className="mt-6 text-xs text-muted-foreground">
                Если ошибка повторяется, сообщите в @AIMusicVerseBot
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
