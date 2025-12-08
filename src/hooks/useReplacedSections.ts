import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ReplacedSection {
  start: number;
  end: number;
  taskId: string;
  createdAt: string;
  audioUrl?: string;
}

export function useReplacedSections(trackId: string) {
  return useQuery({
    queryKey: ['replaced-sections', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_change_log')
        .select(`
          id,
          created_at,
          metadata,
          version_id,
          track_versions (
            audio_url
          )
        `)
        .eq('track_id', trackId)
        .eq('change_type', 'section_replace')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sections: ReplacedSection[] = [];
      
      for (const record of data || []) {
        const metadata = record.metadata as { infill_start_s?: number; infill_end_s?: number } | null;
        if (metadata?.infill_start_s !== undefined && metadata?.infill_end_s !== undefined) {
          sections.push({
            start: metadata.infill_start_s,
            end: metadata.infill_end_s,
            taskId: record.id,
            createdAt: record.created_at || '',
            audioUrl: record.track_versions?.audio_url,
          });
        }
      }

      return sections;
    },
    enabled: !!trackId,
    staleTime: 30000,
  });
}
