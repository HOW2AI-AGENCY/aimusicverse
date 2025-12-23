import { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { navigateTo, forceReload } from '@/hooks/useAppNavigate';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundaryWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error caught by boundary', { error, componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-6 m-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-semibold">Что-то пошло не так</h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'Произошла неожиданная ошибка'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  navigateTo('/');
                }}
              >
                На главную
              </Button>
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
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
