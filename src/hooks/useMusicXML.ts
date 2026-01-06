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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [zoom, setZoomState] = useState(initialZoom);
  const osmdRef = useRef<OSMD | null>(null);

  const render = useCallback(async () => {
    if (!osmdRef.current) return;
    try {
      osmdRef.current.render();
    } catch (err) {
      log.error('Render error', err);
    }
  }, []);

  const setZoom = useCallback((newZoom: number) => {
    setZoomState(newZoom);
    if (osmdRef.current) {
      osmdRef.current.Zoom = newZoom;
      osmdRef.current.render();
    }
  }, []);

  useEffect(() => {
    // Validate URL - must be a non-empty string starting with http
    if (!containerRef.current || !url || typeof url !== 'string' || !url.startsWith('http')) {
      if (url && typeof url !== 'string') {
        log.warn('Invalid MusicXML URL type', { url, type: typeof url });
      }
      return;
    }

    const container = containerRef.current;
    let osmd: OSMD | null = null;

    const initOSMD = async () => {
      setIsLoading(true);
      setError(null);

      try {
        osmd = new OSMD(container, {
          autoResize,
          backend: 'svg',
          drawTitle: true,
          drawSubtitle: true,
          drawComposer: true,
        });

        osmd.Zoom = zoom;
        await osmd.load(url);
        osmd.render();
        osmdRef.current = osmd;
        log.info('MusicXML loaded successfully', { url });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load MusicXML');
        setError(error);
        log.error('Failed to load MusicXML', err);
      } finally {
        setIsLoading(false);
      }
    };

    initOSMD();

    return () => {
      if (osmd) {
        try {
          container.innerHTML = '';
        } catch {
          // Ignore cleanup errors
        }
      }
      osmdRef.current = null;
    };
  }, [url, containerRef, autoResize, zoom]);

  return {
    isLoading,
    error,
    osmd: osmdRef.current,
    zoom,
    setZoom,
    render,
  };
}
