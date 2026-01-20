/**
 * MusicXMLViewer - Component for rendering MusicXML notation using OpenSheetMusicDisplay
 * Provides interactive viewing with zoom controls and loading states
 * Mobile-optimized with touch gestures and responsive layout
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, AlertCircle, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMusicXML } from '@/hooks/useMusicXML';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface MusicXMLViewerProps {
  url: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  onLoaded?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  showControls?: boolean;
  /**
   * Minimum height for the notation viewport.
   * Use px string (e.g. "320px").
   */
  minHeight?: string;
}

export function MusicXMLViewer({
  url,
  zoom: externalZoom,
  onZoomChange,
  onLoaded,
  onError,
  className,
  showControls = false,
  minHeight = '300px',
}: MusicXMLViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeContainerRef = useMemo(
    () => (isFullscreen ? fullscreenContainerRef : containerRef),
    [isFullscreen]
  );

  const {
    isLoading,
    error,
    zoom: internalZoom,
    setZoom,
    render,
  } = useMusicXML({
    containerRef: activeContainerRef,
    url,
    autoResize: true,
    initialZoom: externalZoom ? externalZoom / 100 : 0.8, // Start smaller on mobile
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

  // Re-render when fullscreen changes or container size becomes available.
  // OSMD часто рендерит в контейнер с шириной 0 (вкладки/диалоги), из-за чего получается пустой экран.
  useEffect(() => {
    if (isLoading || error) return;

    const el = activeContainerRef.current;
    if (!el) return;

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Re-render only when we actually have a measurable width
        if (el.clientWidth > 0) render();
      });
    };

    // Initial attempt when switching modes
    const t = window.setTimeout(schedule, 50);

    // Observe size changes (tabs, drawers, fullscreen)
    const ro = new ResizeObserver(() => schedule());
    ro.observe(el);

    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [isFullscreen, isLoading, error, render, activeContainerRef]);

  // При ошибке вызываем callback и показываем сообщение
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-6 px-4 min-h-[200px]', className)} style={{ minHeight }}>
        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500 mb-3" />
        <p className="text-sm text-muted-foreground mb-2 text-center">
          MusicXML недоступен
        </p>
        <p className="text-xs text-muted-foreground/70 mb-4 max-w-xs text-center">
          Используйте Piano Roll для просмотра нот
        </p>
        <Button variant="outline" size="sm" onClick={handleRetry} className="h-8">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Повторить
        </Button>
      </div>
    );
  }

  const ZoomControls = ({ className: controlsClassName }: { className?: string }) => (
    <div className={cn(
      'flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-lg p-1 shadow-md border',
      controlsClassName
    )}>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 sm:h-7 sm:w-7"
        onClick={handleZoomOut}
        disabled={internalZoom <= 0.3}
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <span className="text-xs text-muted-foreground w-10 text-center font-medium">
        {Math.round(internalZoom * 100)}%
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 sm:h-7 sm:w-7"
        onClick={handleZoomIn}
        disabled={internalZoom >= 3.0}
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <div className="w-px h-5 bg-border mx-1" />
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 sm:h-7 sm:w-7"
        onClick={() => setIsFullscreen(!isFullscreen)}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  const NotationContent = ({ containerRefProp, minHeight }: { 
    containerRefProp: React.RefObject<HTMLDivElement | null>;
    minHeight: string;
  }) => (
    <div className="relative w-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
          <div className="text-center">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">Загрузка нот...</p>
          </div>
        </div>
      )}

      {/* OSMD render container */}
      <div
        ref={containerRefProp}
        className={cn(
          'w-full bg-white rounded-lg overflow-x-auto overflow-y-auto touch-pan-x touch-pan-y',
          // Mobile-optimized
          'scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent',
          isLoading && 'opacity-50'
        )}
        style={{
          backgroundColor: '#ffffff',
          minHeight,
          // Enable smooth scrolling on touch devices
          WebkitOverflowScrolling: 'touch',
          // Prevent overscroll bounce on iOS
          overscrollBehavior: 'contain',
        }}
      />
    </div>
  );

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Mobile-friendly floating controls */}
        {!isLoading && (
          <div className="absolute top-2 right-2 z-20">
            <ZoomControls />
          </div>
        )}

        {/* Hint for mobile users */}
        {!isLoading && (
          <div className="absolute bottom-2 left-2 z-10 sm:hidden">
            <span className="text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
              Прокрутите для просмотра →
            </span>
          </div>
        )}

        <NotationContent 
          containerRefProp={containerRef} 
          minHeight={minHeight} 
        />
      </div>

      {/* Fullscreen dialog - mobile optimized */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100dvh] max-h-[100dvh] p-0 rounded-none gap-0">
          <DialogHeader className="px-2 sm:px-4 py-2 border-b flex-row items-center justify-between space-y-0 flex-shrink-0">
            <DialogTitle className="text-xs sm:text-base">Ноты</DialogTitle>
            <VisuallyHidden>
              <DialogDescription>Полноэкранный просмотр нотной записи</DialogDescription>
            </VisuallyHidden>
            <ZoomControls className="mr-6 sm:mr-8" />
          </DialogHeader>
          <div className="flex-1 overflow-auto p-1 sm:p-4 bg-muted/20 min-h-0">
            <NotationContent 
              containerRefProp={fullscreenContainerRef} 
              minHeight="calc(100dvh - 60px)" 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
