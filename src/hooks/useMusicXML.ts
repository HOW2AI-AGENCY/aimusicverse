/**
 * useMusicXML - Hook for managing OpenSheetMusicDisplay instance
 * Handles loading, rendering, zoom, and cursor control for MusicXML files
 */

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import type { OpenSheetMusicDisplay as OSMD } from 'opensheetmusicdisplay';
import { logger } from '@/lib/logger';

type OSMDConstructor = typeof import('opensheetmusicdisplay').OpenSheetMusicDisplay;

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
    // Validate/normalize URL (поддерживаем относительные ссылки)
    if (!containerRef.current || !url || typeof url !== 'string') return;

    const trimmed = url.trim();
    if (!trimmed || trimmed === '0') return;

    const normalizedUrl = (() => {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      if (trimmed.startsWith('/')) {
        try {
          return new URL(trimmed, window.location.origin).toString();
        } catch {
          return null;
        }
      }
      return trimmed; // allow OSMD to try (could be raw xml string)
    })();

    if (!normalizedUrl) return;

    const container = containerRef.current;
    let osmd: OSMD | null = null;

    const initOSMD = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Lazy-load OSMD (очень тяжёлая библиотека) только при открытии нотного/гитарного view
        const mod = await import('opensheetmusicdisplay');
        const OpenSheetMusicDisplay = (mod as unknown as { OpenSheetMusicDisplay: OSMDConstructor }).OpenSheetMusicDisplay;

        osmd = new OpenSheetMusicDisplay(container, {
          autoResize,
          backend: 'svg',
          drawTitle: true,
          drawSubtitle: true,
          drawComposer: true,
        });

        osmd.Zoom = zoom;

        // OSMD sometimes mis-detects a URL string as raw XML.
        // To make rendering reliable, we fetch the XML ourselves and pass the content.
        const isLikelyXmlString = normalizedUrl.trimStart().startsWith('<');
        const xmlContent = isLikelyXmlString
          ? normalizedUrl
          : await (async () => {
              const res = await fetch(normalizedUrl);
              if (!res.ok) throw new Error(`Failed to fetch MusicXML: ${res.status}`);
              const text = await res.text();
              return text.replace(/^\uFEFF/, '').trimStart();
            })();

        await osmd.load(xmlContent);
        osmd.render();
        osmdRef.current = osmd;
        log.info('MusicXML loaded successfully', { url: normalizedUrl });
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
