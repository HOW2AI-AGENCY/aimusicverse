import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ReplacedSection {
  start: number;
  end: number;
  taskId: string;
  createdAt: string;
  audioUrl?: string;
  audioUrlB?: string; // Second variant from Suno API
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export function useReplacedSections(trackId: string) {
  return useQuery({
    queryKey: ['replaced-sections', trackId],
    queryFn: async () => {
      // Query generation_tasks for replace_section mode
      const { data: tasks, error: tasksError } = await supabase
        .from('generation_tasks')
        .select(`
          id,
          suno_task_id,
          status,
          prompt,
          created_at,
          completed_at,
          audio_clips
        `)
        .eq('track_id', trackId)
        .eq('generation_mode', 'replace_section')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      // Query started logs for timing metadata
      const { data: startedLogs, error: startedLogsError } = await supabase
        .from('track_change_log')
        .select('id, created_at, metadata')
        .eq('track_id', trackId)
        .eq('change_type', 'replace_section_started')
        .order('created_at', { ascending: false });

      if (startedLogsError) throw startedLogsError;

      // Query completed logs for version audio URLs
      const { data: completedLogs, error: completedLogsError } = await supabase
        .from('track_change_log')
        .select(`
          id,
          metadata,
          version_id,
          track_versions (
            audio_url
          )
        `)
        .eq('track_id', trackId)
        .eq('change_type', 'replace_section_completed')
        .order('created_at', { ascending: false });

      if (completedLogsError) throw completedLogsError;

      const sections: ReplacedSection[] = [];
      
      // Match tasks with their log entries for full metadata
      for (const task of tasks || []) {
        // Find matching started log entry for timing
        const matchingStartLog = startedLogs?.find((log) => {
          const metadata = log.metadata as { taskId?: string } | null;
          return metadata?.taskId === task.suno_task_id;
        });

        const startMetadata = matchingStartLog?.metadata as { 
          infillStartS?: number; 
          infillEndS?: number;
        } | null;
        
        if (startMetadata?.infillStartS !== undefined && startMetadata?.infillEndS !== undefined) {
          // Get audio URLs from completed log or clips
          let audioUrl: string | undefined;
          let audioUrlB: string | undefined;
          
          // First try to get from completed log's version
          const matchingCompletedLog = completedLogs?.find((log) => {
            const metadata = log.metadata as { taskId?: string } | null;
            return metadata?.taskId === task.suno_task_id;
          });
          
          audioUrl = (matchingCompletedLog?.track_versions as { audio_url?: string } | null)?.audio_url;
          
          // Always check audio_clips for both variants (Suno returns 2 clips)
          if (task.status === 'completed' && task.audio_clips) {
            try {
              const clips = typeof task.audio_clips === 'string' 
                ? JSON.parse(task.audio_clips) 
                : task.audio_clips;
              // First variant
              if (!audioUrl) {
                audioUrl = clips?.[0]?.source_audio_url || clips?.[0]?.audio_url;
              }
              // Second variant
              audioUrlB = clips?.[1]?.source_audio_url || clips?.[1]?.audio_url;
            } catch {}
          }

          sections.push({
            start: startMetadata.infillStartS,
            end: startMetadata.infillEndS,
            taskId: task.id,
            createdAt: task.created_at || '',
            audioUrl,
            audioUrlB,
            status: task.status as ReplacedSection['status'],
          });
        }
      }

      return sections;
    },
    enabled: !!trackId,
    staleTime: 30000,
    refetchInterval: (query) => {
      // Refetch more often if there are pending tasks
      const data = query.state.data;
      if (data?.some(s => s.status === 'pending' || s.status === 'processing')) {
        return 5000;
      }
      return false;
    },
  });
}
