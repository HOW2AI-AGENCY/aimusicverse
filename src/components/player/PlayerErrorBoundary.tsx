/**
 * Player Error Boundary
 * 
 * Catches and handles errors in player components.
 * Provides fallback UI and error recovery options.
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface PlayerErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  showDetails?: boolean;
}

interface PlayerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number;
}

/**
 * Error boundary specifically designed for player components
 * Provides graceful degradation and recovery mechanisms
 */
export class PlayerErrorBoundary extends Component<
  PlayerErrorBoundaryProps,
  PlayerErrorBoundaryState
> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: PlayerErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<PlayerErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const now = Date.now();
    const { lastErrorTime, errorCount } = this.state;

    // Track error frequency (reset count if > 5 seconds since last error)
    const isRepeatingError = now - lastErrorTime < 5000;
    const newErrorCount = isRepeatingError ? errorCount + 1 : 1;

    this.setState({
      error,
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: now,
    });

    // Log error with context
    logger.error('Player component error', error, {
      componentStack: errorInfo.componentStack,
      errorCount: newErrorCount,
      isRepeating: isRepeatingError,
    });

    // Auto-recovery for single errors (not repeated)
    if (newErrorCount === 1 && !isRepeatingError) {
      this.scheduleAutoReset();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  /**
   * Schedule automatic error recovery
   */
  scheduleAutoReset = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    // Auto-reset after 3 seconds for single errors
    this.resetTimeoutId = setTimeout(() => {
      logger.debug('Auto-recovering from player error');
      this.handleReset();
    }, 3000);
  };

  /**
   * Reset error state and attempt recovery
   */
  handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler if provided
    this.props.onReset?.();

    logger.debug('Player error boundary reset');
  };

  /**
   * Dismiss error without reset (for non-critical errors)
   */
  handleDismiss = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      const isRepeatingError = errorCount > 1;

      return (
        <div className="flex items-center justify-center min-h-[200px] p-6 bg-background/95 backdrop-blur-sm border border-destructive/20 rounded-lg">
          <div className="text-center space-y-4 max-w-md">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {isRepeatingError ? 'Повторяющаяся ошибка плеера' : 'Ошибка плеера'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRepeatingError
                  ? 'Не удалось восстановить работу плеера. Попробуйте перезагрузить страницу.'
                  : 'Произошла ошибка при воспроизведении. Попробуйте снова.'}
              </p>
            </div>

            {/* Error Details (dev mode) */}
            {showDetails && (
              <div className="text-left p-3 bg-muted/50 rounded-md text-xs font-mono">
                <div className="text-destructive font-semibold mb-1">
                  {error.name}: {error.message}
                </div>
                {errorInfo?.componentStack && (
                  <div className="text-muted-foreground overflow-auto max-h-32">
                    {errorInfo.componentStack.slice(0, 200)}...
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-center">
              {!isRepeatingError && (
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Попробовать снова
                </Button>
              )}
              <Button
                onClick={this.handleDismiss}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Закрыть
              </Button>
            </div>

            {/* Error Count Indicator */}
            {errorCount > 1 && (
              <p className="text-xs text-muted-foreground">
                Ошибка повторялась {errorCount} раз
              </p>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook to wrap player components with error boundary
 */
export function withPlayerErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    onReset?: () => void;
  }
): React.FC<P> {
  return function PlayerComponentWithErrorBoundary(props: P) {
    return (
      <PlayerErrorBoundary fallback={options?.fallback} onReset={options?.onReset}>
        <Component {...props} />
      </PlayerErrorBoundary>
    );
  };
}
