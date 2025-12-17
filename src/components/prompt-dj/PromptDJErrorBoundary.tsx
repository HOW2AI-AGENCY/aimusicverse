/**
 * PromptDJErrorBoundary - Error boundary with recovery for PromptDJ
 * Handles audio context errors, network failures, and component crashes
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import * as Tone from 'tone';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'PromptDJErrorBoundary' });

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: 'audio' | 'network' | 'component' | 'unknown';
  retryCount: number;
}

export class PromptDJErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private audioCheckInterval: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Categorize error
    const errorMessage = error.message.toLowerCase();
    let errorType: State['errorType'] = 'unknown';
    
    if (errorMessage.includes('audio') || 
        errorMessage.includes('context') ||
        errorMessage.includes('tone') ||
        errorMessage.includes('worklet')) {
      errorType = 'audio';
    } else if (errorMessage.includes('network') || 
               errorMessage.includes('fetch') ||
               errorMessage.includes('supabase')) {
      errorType = 'network';
    } else {
      errorType = 'component';
    }

    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PromptDJ Error]', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      type: this.state.errorType,
    });
  }

  componentDidMount() {
    // Monitor audio context state
    this.startAudioMonitoring();
    
    // Handle global unhandled rejections related to audio
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    if (this.audioCheckInterval) {
      clearInterval(this.audioCheckInterval);
    }
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason?.message || String(event.reason);
    if (reason.includes('audio') || reason.includes('context')) {
      console.warn('[PromptDJ] Audio-related unhandled rejection:', reason);
      this.attemptAudioRecovery();
    }
  };

  private startAudioMonitoring = () => {
    this.audioCheckInterval = setInterval(() => {
      try {
        const context = Tone.getContext();
        if (context.state === 'suspended' || context.state === 'closed') {
          log.warn('Audio context in bad state:', { state: context.state });
          this.attemptAudioRecovery();
        }
      } catch {
        // Context not available yet
      }
    }, 5000);
  };

  private attemptAudioRecovery = async () => {
    try {
      log.info('Attempting audio recovery...');
      
      // Try to resume context
      await Tone.start();
      const context = Tone.getContext();
      
      if (context.state === 'suspended') {
        await context.resume();
      }
      
      log.info('Audio recovery successful');
      toast.success('Аудио восстановлено');
      
      // Clear error state if we recovered
      if (this.state.errorType === 'audio') {
        this.handleRetry();
      }
    } catch (error) {
      log.error('Audio recovery failed:', { error });
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prev => ({
        hasError: false,
        error: null,
        retryCount: prev.retryCount + 1,
      }));
      this.props.onReset?.();
    } else {
      toast.error('Превышено количество попыток');
    }
  };

  private handleFullReset = () => {
    // Reset retry count and try again
    this.setState({
      hasError: false,
      error: null,
      errorType: 'unknown',
      retryCount: 0,
    });
    this.props.onReset?.();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorContent = () => {
    const { error, errorType, retryCount } = this.state;
    
    switch (errorType) {
      case 'audio':
        return {
          icon: <Volume2 className="w-12 h-12 text-amber-500" />,
          title: 'Проблема с аудио',
          description: 'Произошла ошибка аудио-системы. Это может быть связано с браузером или системными настройками.',
          actions: (
            <>
              <Button onClick={this.attemptAudioRecovery} variant="default">
                <Volume2 className="w-4 h-4 mr-2" />
                Восстановить аудио
              </Button>
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Попробовать снова
              </Button>
            </>
          ),
        };
        
      case 'network':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
          title: 'Ошибка сети',
          description: 'Не удалось подключиться к серверу. Проверьте интернет-соединение.',
          actions: (
            <>
              <Button onClick={this.handleRetry} variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Повторить ({this.maxRetries - retryCount} попыток)
              </Button>
            </>
          ),
        };
        
      default:
        return {
          icon: <AlertTriangle className="w-12 h-12 text-red-500" />,
          title: 'Что-то пошло не так',
          description: error?.message || 'Произошла неожиданная ошибка в PromptDJ.',
          actions: (
            <>
              <Button onClick={this.handleFullReset} variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Перезагрузить
              </Button>
              <Button onClick={this.handleGoHome} variant="outline">
                <Home className="w-4 h-4 mr-2" />
                На главную
              </Button>
            </>
          ),
        };
    }
  };

  render() {
    if (this.state.hasError) {
      const content = this.getErrorContent();
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="mb-4">
            {content.icon}
          </div>
          
          <h2 className="text-xl font-semibold mb-2">
            {content.title}
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-md">
            {content.description}
          </p>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {content.actions}
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-left w-full max-w-md">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Техническая информация
              </summary>
              <pre className="mt-2 p-2 bg-muted/20 rounded text-[10px] overflow-auto max-h-40">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for functional components
export function withPromptDJErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  onReset?: () => void
) {
  return function WithErrorBoundary(props: P) {
    return (
      <PromptDJErrorBoundary onReset={onReset}>
        <WrappedComponent {...props} />
      </PromptDJErrorBoundary>
    );
  };
}
