import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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

  useEffect(() => {
    if (!taskId || !audioId) {
      setData(null);
      return;
    }

    const fetchLyrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: responseData, error: functionError } = await supabase.functions.invoke(
          'get-timestamped-lyrics',
          {
            body: { taskId, audioId },
          }
        );

        if (functionError) {
          throw functionError;
        }

        setData(responseData);
      } catch (err) {
        logger.error('Error fetching timestamped lyrics', err);
        setError(err instanceof Error ? err.message : 'Failed to load lyrics');
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [taskId, audioId]);

  return { data, loading, error };
}
