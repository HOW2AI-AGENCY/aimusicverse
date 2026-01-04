import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface StemInfo {
  id: string;
  stem_type: string;
  audio_url: string;
}

export function useTrackStemTypes(trackId: string | undefined) {
  return useQuery({
    queryKey: ['track-stem-types', trackId],
    queryFn: async () => {
      if (!trackId) return [];
      const { data, error } = await supabase
        .from('track_stems')
        .select('id, stem_type, audio_url')
        .eq('track_id', trackId);
      
      if (error) {
        logger.error('Error fetching stem types', error);
        return [];
      }
      return (data || []) as StemInfo[];
    },
    enabled: !!trackId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Helper to check if specific stem types exist
export function useStemTypeFlags(trackId: string | undefined) {
  const { data: stems = [], isLoading } = useTrackStemTypes(trackId);
  
  const hasVocalStem = stems.some(s => s.stem_type === 'vocal' || s.stem_type === 'vocals');
  const hasInstrumentalStem = stems.some(s => 
    s.stem_type === 'instrumental' || 
    s.stem_type === 'backing' || 
    s.stem_type === 'accompaniment'
  );
  const hasDrumsStem = stems.some(s => s.stem_type === 'drums');
  const hasBassStem = stems.some(s => s.stem_type === 'bass');
  
  const getVocalStem = () => stems.find(s => s.stem_type === 'vocal' || s.stem_type === 'vocals');
  const getInstrumentalStem = () => stems.find(s => 
    s.stem_type === 'instrumental' || 
    s.stem_type === 'backing' || 
    s.stem_type === 'accompaniment'
  );
  
  return {
    stems,
    isLoading,
    hasVocalStem,
    hasInstrumentalStem,
    hasDrumsStem,
    hasBassStem,
    getVocalStem,
    getInstrumentalStem,
  };
}
