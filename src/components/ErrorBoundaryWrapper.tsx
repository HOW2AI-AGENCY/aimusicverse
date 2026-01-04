import { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { navigateTo, forceReload } from '@/hooks/useAppNavigate';
import { captureError, isSentryEnabled, Sentry } from '@/lib/sentry';

const log = logger.child({ module: 'ErrorBoundary' });

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional name for this boundary (for better error context) */
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundaryWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { name = 'unknown' } = this.props;
    const context = {
      componentStack: errorInfo.componentStack,
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      boundaryName: name,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
    
    // Log to our logger
    log.error('Error caught by boundary', error, context);
    
    // Save errorInfo for potential display
    this.setState({ errorInfo });
    
    // Send to Sentry with full context
    if (isSentryEnabled) {
      Sentry.withScope((scope) => {
        scope.setTag('error_boundary', name);
        scope.setExtra('componentStack', errorInfo.componentStack);
        scope.setExtra('page', context.page);
        scope.setExtra('timestamp', context.timestamp);
        
        // Set fingerprint for better grouping
        scope.setFingerprint([
          'error-boundary',
          name,
          error.name || 'Error',
          error.message?.substring(0, 50) || 'unknown',
        ]);
        
        Sentry.captureException(error);
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env.DEV;

      return (
        <Card className="p-6 m-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-semibold">Что-то пошло не так</h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'Произошла неожиданная ошибка'}
            </p>
            
            {/* Show stack trace in dev mode */}
            {isDev && this.state.error?.stack && (
              <details className="w-full text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Подробности ошибки (dev)
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  this.handleReset();
                  navigateTo('/');
                }}
              >
                На главную
              </Button>
              <Button
                onClick={() => {
                  this.handleReset();
                  forceReload();
                }}
              >
                Перезагрузить
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
