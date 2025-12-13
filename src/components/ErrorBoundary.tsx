import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
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
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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
    if (this.state.hasError) {
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
