/**
 * Audio Error Boundary
 * 
 * Catches Web Audio API errors and provides recovery options.
 * Shows user-friendly error UI with reinitialize button.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  onReset?: () => void;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
}

// Audio-specific error types
const AUDIO_ERROR_TYPES = {
  CONTEXT_CLOSED: 'AudioContext is closed',
  DECODE_ERROR: 'Unable to decode audio data',
  NETWORK_ERROR: 'Failed to load audio',
  NOT_SUPPORTED: 'Audio format not supported',
  AUTOPLAY_BLOCKED: 'Autoplay was prevented',
} as const;

function getAudioErrorType(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('closed')) return AUDIO_ERROR_TYPES.CONTEXT_CLOSED;
  if (message.includes('decode')) return AUDIO_ERROR_TYPES.DECODE_ERROR;
  if (message.includes('network') || message.includes('fetch')) return AUDIO_ERROR_TYPES.NETWORK_ERROR;
  if (message.includes('not supported')) return AUDIO_ERROR_TYPES.NOT_SUPPORTED;
  if (message.includes('autoplay') || message.includes('play() failed')) return AUDIO_ERROR_TYPES.AUTOPLAY_BLOCKED;
  
  return 'An unexpected audio error occurred';
}

function getRecoveryHint(errorType: string): string {
  switch (errorType) {
    case AUDIO_ERROR_TYPES.CONTEXT_CLOSED:
      return 'The audio system was closed unexpectedly. Click reinitialize to restart.';
    case AUDIO_ERROR_TYPES.DECODE_ERROR:
      return 'There was a problem with the audio file. Try reloading or choosing a different track.';
    case AUDIO_ERROR_TYPES.NETWORK_ERROR:
      return 'Failed to load audio. Check your internet connection and try again.';
    case AUDIO_ERROR_TYPES.NOT_SUPPORTED:
      return 'This audio format is not supported by your browser.';
    case AUDIO_ERROR_TYPES.AUTOPLAY_BLOCKED:
      return 'Your browser blocked autoplay. Click play to start manually.';
    default:
      return 'Try reinitializing the audio system or reload the page.';
  }
}

export class AudioErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isRecovering: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('AudioErrorBoundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    
    this.setState({ errorInfo });
  }

  private handleReset = async (): Promise<void> => {
    this.setState({ isRecovering: true });
    
    try {
      // Attempt to close any existing audio contexts
      await this.cleanupAudioContexts();
      
      // Call parent reset handler if provided
      this.props.onReset?.();
      
      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false,
      });
      
      logger.info('Audio system recovered successfully');
    } catch (recoveryError) {
      logger.error('Failed to recover audio system', recoveryError);
      this.setState({ isRecovering: false });
    }
  };

  private cleanupAudioContexts = async (): Promise<void> => {
    // Get all audio elements and disconnect them
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach((audio) => {
      try {
        audio.pause();
        audio.src = '';
        audio.load();
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    
    // Small delay to allow cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    const { hasError, error, isRecovering } = this.state;
    const { children, fallbackMessage } = this.props;

    if (hasError && error) {
      const errorType = getAudioErrorType(error);
      const recoveryHint = getRecoveryHint(errorType);

      return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <Card className="max-w-md w-full border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-base">Ошибка аудио</CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    {fallbackMessage || errorType}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {recoveryHint}
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={this.handleReset}
                  disabled={isRecovering}
                  className="flex-1"
                  variant="default"
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Восстановление...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Перезапустить аудио
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  disabled={isRecovering}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">
                    Техническая информация
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-32">
                    {error.message}
                    {'\n\n'}
                    {error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook to wrap audio operations with error handling
 */
export function useAudioErrorHandler() {
  const handleAudioError = React.useCallback((error: unknown, context?: string) => {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(`Audio error${context ? ` (${context})` : ''}`, err);
    
    // Check if it's a recoverable error
    const errorType = getAudioErrorType(err);
    const isRecoverable = [
      AUDIO_ERROR_TYPES.CONTEXT_CLOSED,
      AUDIO_ERROR_TYPES.AUTOPLAY_BLOCKED,
    ].includes(errorType as any);
    
    return { error: err, errorType, isRecoverable };
  }, []);

  return { handleAudioError };
}
