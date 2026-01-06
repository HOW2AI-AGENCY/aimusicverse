import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrackStem {
  id: string;
  track_id: string;
  stem_type: string;
  audio_url: string;
  separation_mode: string | null;
  version_id: string | null;
  source?: 'separated' | 'generated' | 'uploaded' | string | null;
  generation_prompt?: string | null;
  generation_model?: string | null;
  created_at: string | null;
}

export const useTrackStems = (trackId: string) => {
  return useQuery({
    queryKey: ['track-stems', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_stems')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Sort stems: vocals always first
      const stems = (data || []) as TrackStem[];
      const priority: Record<string, number> = {
        vocals: 0, vocal: 0, voice: 0, lead_vocal: 0, main_vocal: 0,
        backing_vocals: 1, backing_vocal: 1, harmonies: 1,
        instrumental: 2,
        bass: 3, drums: 4, guitar: 5, piano: 6, keyboard: 6,
        synth: 7, strings: 8, other: 99,
      };
      
      return stems.sort((a, b) => {
        const typeA = a.stem_type.toLowerCase();
        const typeB = b.stem_type.toLowerCase();
        
        const isVocalA = typeA.includes('vocal') || typeA === 'voice';
        const isVocalB = typeB.includes('vocal') || typeB === 'voice';
        
        if (isVocalA && !isVocalB) return -1;
        if (!isVocalA && isVocalB) return 1;
        
        const pA = priority[typeA] ?? 50;
        const pB = priority[typeB] ?? 50;
        return pA - pB;
      });
    },
    enabled: !!trackId,
  });
};
