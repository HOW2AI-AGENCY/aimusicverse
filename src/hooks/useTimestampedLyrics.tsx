import { useQuery } from '@tanstack/react-query';
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

/**
 * useTimestampedLyrics - Fetch timestamped lyrics with TanStack Query
 * Optimized with localStorage cache and proper stale time
 */
export function useTimestampedLyrics(taskId: string | null, audioId: string | null) {
  return useQuery({
    queryKey: ['timestamped-lyrics', taskId, audioId],
    queryFn: async (): Promise<TimestampedLyricsData | null> => {
      if (!taskId || !audioId) {
        return null;
      }

      // Try cache first
      const cached = await getCachedLyrics(taskId, audioId);
      if (cached) {
        logger.debug('Using cached lyrics', { taskId, audioId });
        return cached as TimestampedLyricsData;
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

      // Cache the response (non-blocking, errors are logged but don't fail the fetch)
      if (responseData) {
        try {
          await setCachedLyrics(taskId, audioId, responseData);
        } catch (cacheError) {
          // Log cache error but don't fail the entire operation
          logger.warn('Failed to cache lyrics, continuing with response data', {
            error: cacheError instanceof Error ? cacheError.message : String(cacheError),
            taskId,
            audioId
          });
        }
      }

      return responseData;
    },
    enabled: !!taskId && !!audioId,
    staleTime: 30 * 60 * 1000, // 30 minutes - lyrics don't change often
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache for a while
    retry: 2, // Retry failed requests twice
  });
}
