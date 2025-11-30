import { useTrackVersions } from '@/hooks/useTrackVersions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Music2, Clock, Play, Download, Check, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTrackVersionManagement } from '@/hooks/useTrackVersionManagement';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Track } from '@/hooks/useTracksOptimized';

interface TrackVersionsTabProps {
  trackId: string;
}

export function TrackVersionsTab({ trackId }: TrackVersionsTabProps) {
  const { data: versions, isLoading } = useTrackVersions(trackId);
  const { 
    isProcessing, 
    createVersionFromTrack, 
    setVersionAsPrimary, 
    deleteVersion 
  } = useTrackVersionManagement();

  // Fetch main track data
  const { data: mainTrack } = useQuery({
    queryKey: ['track', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', trackId)
        .single();
      
      if (error) throw error;
      return data as Track;
    },
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVersionLabel = (type: string) => {
    const labels: Record<string, string> = {
      initial: 'Оригинал',
      remix: 'Ремикс',
      extend: 'Продление',
      cover: 'Кавер',
      instrumental: 'Инструментал',
      vocal: 'Вокал добавлен',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Combine main track with versions
  const allVersions = [
    ...(mainTrack ? [{
      id: mainTrack.id,
      track_id: mainTrack.id,
      audio_url: mainTrack.audio_url || '',
      cover_url: mainTrack.cover_url,
      duration_seconds: mainTrack.duration_seconds,
      version_type: 'current',
      is_primary: true,
      parent_version_id: null,
      metadata: {
        prompt: mainTrack.prompt,
        style: mainTrack.style,
        tags: mainTrack.tags,
      },
      created_at: mainTrack.created_at,
    }] : []),
    ...(versions || []),
  ];

  if (!allVersions || allVersions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Music2 className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Версии отсутствуют</p>
      </div>
    );
  }

  const handlePlayVersion = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  return (
    <div className="relative">
      {/* Action buttons */}
      {mainTrack && (
        <div className="mb-6 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => createVersionFromTrack(mainTrack)}
            disabled={isProcessing}
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать версию из текущего трека
          </Button>
        </div>
      )}

      {/* Timeline line */}
      <div className="absolute left-6 top-20 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

      <div className="space-y-6">
        {allVersions.map((version, index) => (
          <div key={version.id} className="relative pl-16 group">
            {/* Timeline dot */}
            <div
              className={`absolute left-4 top-6 w-5 h-5 rounded-full border-4 transition-all ${
                version.is_primary
                  ? 'bg-primary border-primary shadow-lg shadow-primary/50'
                  : 'bg-background border-primary/50 group-hover:border-primary'
              }`}
            />

            {/* Version card */}
            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {version.cover_url ? (
                    <img
                      src={version.cover_url}
                      alt="Version cover"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Music2 className="w-8 h-8 text-primary/40" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={version.is_primary ? 'default' : 'secondary'}>
                        {getVersionLabel(version.version_type)}
                      </Badge>
                      {version.is_primary && (
                        <Badge variant="outline" className="border-primary text-primary">
                          Текущая
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {version.created_at &&
                        format(new Date(version.created_at), 'dd MMM yyyy, HH:mm', {
                          locale: ru,
                        })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{formatDuration(version.duration_seconds)}</span>
                </div>
              </div>

              {/* Metadata */}
              {version.metadata && (
                <div className="mb-3 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    {JSON.stringify(version.metadata, null, 2)}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handlePlayVersion(version.audio_url)}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Прослушать
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(version.audio_url, '_blank')}
                >
                  <Download className="w-3 h-3" />
                </Button>
                
                {!version.is_primary && version.version_type !== 'current' && (
                  <>
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => setVersionAsPrimary(version.id, trackId)}
                      disabled={isProcessing}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Сделать текущей
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteVersion(version.id)}
                      disabled={isProcessing}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Connection line to parent */}
            {version.parent_version_id && index > 0 && (
              <div className="absolute left-6 top-0 w-10 h-6 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
