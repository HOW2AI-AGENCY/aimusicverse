import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  featureName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Feature-specific error boundary that allows recovery without full page reload
 * Usage: Wrap feature components that may fail independently
 */
export class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { featureName = 'Feature' } = this.props;
    logger.error(`${featureName} error`, { 
      error, 
      componentStack: errorInfo.componentStack 
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    // Use global navigate if available for SPA navigation
    import('@/hooks/useAppNavigate').then(({ navigateTo }) => {
      navigateTo('/');
    }).catch(() => {
      window.location.href = '/';
    });
  };

  render() {
    if (this.state.hasError) {
      const { featureName = 'Функция' } = this.props;
      
      return (
        <div className="flex items-center justify-center p-4 min-h-[400px]">
          <Card className="max-w-md w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-destructive/10 mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Ошибка загрузки</h2>
              <p className="text-sm text-muted-foreground mb-6">
                {featureName} временно недоступна. Попробуйте обновить или вернитесь на главную.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-4 w-full text-left">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    Детали ошибки
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <div className="flex gap-2 w-full">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Попробовать снова
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="default"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  На главную
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
