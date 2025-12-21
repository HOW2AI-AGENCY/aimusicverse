/**
 * useMusicXML - Hook for managing OpenSheetMusicDisplay instance
 * Handles loading, rendering, zoom, and cursor control for MusicXML files
 */

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import { OpenSheetMusicDisplay as OSMD } from 'opensheetmusicdisplay';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'useMusicXML' });

interface UseMusicXMLOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  url: string | null;
  autoResize?: boolean;
  initialZoom?: number;
}

interface UseMusicXMLReturn {
  isLoading: boolean;
  error: Error | null;
  osmd: OSMD | null;
  zoom: number;
  setZoom: (zoom: number) => void;
  render: () => Promise<void>;
}

export function useMusicXML({
  containerRef,
  url,
  autoResize = true,
  initialZoom = 1.0,
}: UseMusicXMLOptions): UseMusicXMLReturn {
  const osmdRef = useRef<OSMD | null>(null);
  const isLoadedRef = useRef(false); // Track if load() has completed
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [zoom, setZoomState] = useState(initialZoom);

  // Initialize OSMD instance
  useEffect(() => {
    if (!containerRef.current || !url) return;

    const container = containerRef.current;
    let isCancelled = false;
    
    const initOSMD = async () => {
      setIsLoading(true);
      setError(null);
      isLoadedRef.current = false;

      try {
        // Clear previous instance
        if (osmdRef.current) {
          osmdRef.current.clear();
          osmdRef.current = null;
        }
        container.innerHTML = '';

        // Create new OSMD instance
        const osmd = new OSMD(container, {
          autoResize,
          backend: 'svg',
          drawTitle: true,
          drawSubtitle: true,
          drawComposer: true,
          drawCredits: true,
          drawPartNames: true,
          drawMeasureNumbers: true,
          drawTimeSignatures: true,
          drawingParameters: 'default',
        });

        osmd.setLogLevel('warn');

        // Load MusicXML - MUST complete before render()
        log.info('Loading MusicXML', { url });
        await osmd.load(url);

        // Check if cancelled during async operation
        if (isCancelled) {
          osmd.clear();
          return;
        }

        // Only set ref AFTER load() completes successfully
        osmdRef.current = osmd;
        isLoadedRef.current = true;

        // Set zoom and render
        osmd.zoom = zoom;
        await osmd.render();

        log.info('MusicXML rendered successfully');
      } catch (err) {
        if (isCancelled) return;
        const error = err instanceof Error ? err : new Error('Failed to load MusicXML');
        log.error('Failed to load MusicXML', error);
        setError(error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    initOSMD();

    return () => {
      isCancelled = true;
      isLoadedRef.current = false;
      if (osmdRef.current) {
        osmdRef.current.clear();
        osmdRef.current = null;
      }
    };
  }, [url, containerRef, autoResize]);

  // Handle zoom changes - only if loaded
  const setZoom = useCallback((newZoom: number) => {
    const clampedZoom = Math.max(0.3, Math.min(3.0, newZoom));
    setZoomState(clampedZoom);

    if (osmdRef.current && isLoadedRef.current) {
      osmdRef.current.zoom = clampedZoom;
      osmdRef.current.render();
    }
  }, []);

  // Manual render trigger - only if loaded
  const render = useCallback(async () => {
    if (osmdRef.current && isLoadedRef.current) {
      await osmdRef.current.render();
    }
  }, []);

  // Handle window resize - only if loaded
  useEffect(() => {
    if (!autoResize) return;

    const handleResize = () => {
      if (osmdRef.current && isLoadedRef.current) {
        osmdRef.current.render();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoResize]);

  return {
    isLoading,
    error,
    osmd: osmdRef.current,
    zoom,
    setZoom,
    render,
  };
}
