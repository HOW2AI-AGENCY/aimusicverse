/**
 * MusicXMLViewer - Component for rendering MusicXML notation using OpenSheetMusicDisplay
 * Provides interactive viewing with zoom controls and loading states
 */

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMusicXML } from '@/hooks/useMusicXML';

interface MusicXMLViewerProps {
  url: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onLoaded?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  showControls?: boolean;
}

export function MusicXMLViewer({
  url,
  zoom: externalZoom,
  onZoomChange,
  onLoaded,
  onError,
  className,
  showControls = false,
}: MusicXMLViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    isLoading,
    error,
    zoom: internalZoom,
    setZoom,
    render,
  } = useMusicXML({
    containerRef,
    url,
    autoResize: true,
    initialZoom: externalZoom ? externalZoom / 100 : 1.0,
  });

  // Sync external zoom
  useEffect(() => {
    if (externalZoom !== undefined) {
      setZoom(externalZoom / 100);
    }
  }, [externalZoom, setZoom]);

  // Callbacks
  useEffect(() => {
    if (!isLoading && !error) {
      onLoaded?.();
    }
  }, [isLoading, error, onLoaded]);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleZoomIn = () => {
    const newZoom = internalZoom + 0.1;
    setZoom(newZoom);
    onZoomChange?.(newZoom * 100);
  };

  const handleZoomOut = () => {
    const newZoom = internalZoom - 0.1;
    setZoom(newZoom);
    onZoomChange?.(newZoom * 100);
  };

  const handleRetry = () => {
    render();
  };

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          Не удалось загрузить ноты
        </p>
        <p className="text-xs text-muted-foreground mb-4 max-w-sm text-center">
          {error.message}
        </p>
        <Button variant="outline" size="sm" onClick={handleRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Загрузка нот...</p>
          </div>
        </div>
      )}

      {/* Inline zoom controls */}
      {showControls && !isLoading && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/90 rounded-md p-1 shadow-sm border">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleZoomOut}
            disabled={internalZoom <= 0.3}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">
            {Math.round(internalZoom * 100)}%
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleZoomIn}
            disabled={internalZoom >= 3.0}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* OSMD render container */}
      <div
        ref={containerRef}
        className={cn(
          'w-full min-h-[400px] bg-white rounded-lg overflow-auto',
          isLoading && 'opacity-50'
        )}
        style={{
          // OSMD renders black notes, so we need white background
          backgroundColor: '#ffffff',
        }}
      />
    </div>
  );
}
