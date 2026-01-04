import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { getCachedLyrics, setCachedLyrics } from '@/lib/lyricsCache';

export interface AlignedWord {
  word: string;
  success: boolean;
  startS: number;
  endS: number;
  palign: number;
}

export interface TimestampedLyricsData {
  alignedWords: AlignedWord[];
  waveformData: number[];
  hootCer: number;
  isStreamed: boolean;
}

export function useTimestampedLyrics(taskId: string | null, audioId: string | null) {
  const [data, setData] = useState<TimestampedLyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!taskId || !audioId) {
      setData(null);
      setFromCache(false);
      return;
    }

    const cacheKey = `${taskId}_${audioId}`;
    
    // Avoid duplicate fetches for same taskId/audioId
    if (fetchedRef.current === cacheKey && data) {
      return;
    }

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try cache first
        const cached = await getCachedLyrics(taskId, audioId);
        if (cached) {
          logger.debug('Using cached lyrics', { taskId, audioId });
          setData(cached as TimestampedLyricsData);
          setFromCache(true);
          setLoading(false);
          fetchedRef.current = cacheKey;
          return;
        }

        // Fetch from API
        const { data: responseData, error: functionError } = await supabase.functions.invoke(
          'get-timestamped-lyrics',
          {
            body: { taskId, audioId },
          }
        );

        if (functionError) {
          throw functionError;
        }

        // Cache the response
        if (responseData) {
          await setCachedLyrics(taskId, audioId, responseData);
        }

        setData(responseData);
        setFromCache(false);
        fetchedRef.current = cacheKey;
      } catch (err) {
        logger.error('Error fetching timestamped lyrics', { error: err instanceof Error ? err.message : String(err) });
        setError(err instanceof Error ? err.message : 'Failed to load lyrics');
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [taskId, audioId]);

  return { data, loading, error, fromCache };
}
