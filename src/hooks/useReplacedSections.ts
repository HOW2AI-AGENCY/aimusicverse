import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ReplacedSection {
  start: number;
  end: number;
  taskId: string;
  createdAt: string;
  audioUrl?: string;
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

      // Also query change log for metadata
      const { data: logs, error: logsError } = await supabase
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
        .eq('change_type', 'replace_section_started')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      const sections: ReplacedSection[] = [];
      
      // Match tasks with their log entries for full metadata
      for (const task of tasks || []) {
        // Find matching log entry
        const matchingLog = logs?.find(log => {
          const metadata = log.metadata as { taskId?: string } | null;
          return metadata?.taskId === task.suno_task_id;
        });

        const metadata = matchingLog?.metadata as { 
          infillStartS?: number; 
          infillEndS?: number;
        } | null;
        
        if (metadata?.infillStartS !== undefined && metadata?.infillEndS !== undefined) {
          // Get audio URL from completed clips or version
          let audioUrl: string | undefined;
          
          if (task.status === 'completed' && task.audio_clips) {
            try {
              const clips = typeof task.audio_clips === 'string' 
                ? JSON.parse(task.audio_clips) 
                : task.audio_clips;
              audioUrl = clips?.[0]?.source_audio_url || clips?.[0]?.audio_url;
            } catch {}
          }
          
          audioUrl = audioUrl || matchingLog?.track_versions?.audio_url;

          sections.push({
            start: metadata.infillStartS,
            end: metadata.infillEndS,
            taskId: task.id,
            createdAt: task.created_at || '',
            audioUrl,
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
