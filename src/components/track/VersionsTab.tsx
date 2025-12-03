import { useState } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Play, Pause, Download, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { cn } from '@/lib/utils';

interface VersionsTabProps {
  track: Track;
}

export function VersionsTab({ track }: VersionsTabProps) {
  const queryClient = useQueryClient();
  const [optimisticMasterId, setOptimisticMasterId] = useState<string | null>(null);
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();

  const { data: versions, isLoading } = useQuery({
    queryKey: ['track-versions', track.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_versions')
        .select('*')
        .eq('track_id', track.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const setMasterMutation = useMutation({
    mutationFn: async (versionId: string) => {
      setOptimisticMasterId(versionId);

      // First, unset all is_primary for this track
      const { error: unsetError } = await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', track.id);

      if (unsetError) throw unsetError;

      // Then set the new primary version
      const { error: setError } = await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', versionId);

      if (setError) throw setError;

      // Log to changelog
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('track_change_log').insert({
          track_id: track.id,
          version_id: versionId,
          change_type: 'master_changed',
          changed_by: 'user',
          user_id: userData.user.id,
          new_value: versionId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['track-versions', track.id] });
      queryClient.invalidateQueries({ queryKey: ['track-change-log', track.id] });
      toast.success('Мастер-версия обновлена');
      setOptimisticMasterId(null);
    },
    onError: (error) => {
      toast.error('Ошибка установки мастер-версии');
      console.error('Set master version error:', error);
      setOptimisticMasterId(null);
    },
  });

  const handlePlayVersion = (version: any) => {
    // Create a track-like object from the version for playback
    const versionTrack: Track = {
      ...track,
      // Override audio URLs with version-specific ones
      audio_url: version.audio_url || track.audio_url,
      streaming_url: version.streaming_url || track.streaming_url,
      local_audio_url: version.local_audio_url || track.local_audio_url,
      // Add version identifier to track id for unique identification
      id: `${track.id}_v${version.id}`,
    };

    // Check if this version is currently playing
    const isThisVersionPlaying = activeTrack?.id === versionTrack.id && isPlaying;

    if (isThisVersionPlaying) {
      pauseTrack();
    } else {
      playTrack(versionTrack);
    }
  };

  const isVersionPlaying = (versionId: string) => {
    return activeTrack?.id === `${track.id}_v${versionId}` && isPlaying;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Версии трека отсутствуют</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Версии</h3>
        <p className="text-sm text-muted-foreground">
          Управляйте версиями трека. Мастер-версия используется по умолчанию.
        </p>
      </div>

      <div className="space-y-3">
        {versions.map((version, index) => {
          const isMaster = optimisticMasterId
            ? version.id === optimisticMasterId
            : version.is_primary;
          const isCurrentlyPlaying = isVersionPlaying(version.id);

          return (
            <Card
              key={version.id}
              className={cn(
                'p-4 transition-colors',
                isMaster && 'border-primary bg-primary/5',
                isCurrentlyPlaying && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Play button */}
                <Button
                  size="icon"
                  variant={isCurrentlyPlaying ? "default" : "outline"}
                  className="h-12 w-12 rounded-full flex-shrink-0"
                  onClick={() => handlePlayVersion(version)}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>

                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold">
                      Версия {versions.length - index}
                    </h4>
                    {isMaster && (
                      <Badge variant="default" className="gap-1">
                        <Crown className="w-3 h-3" />
                        Мастер
                      </Badge>
                    )}
                    {version.version_type && version.version_type !== 'original' && (
                      <Badge variant="outline">
                        {version.version_type}
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    {version.created_at && (
                      <p>Создано: {format(new Date(version.created_at), 'dd.MM.yyyy HH:mm')}</p>
                    )}
                    {version.duration_seconds && (
                      <p>Длительность: {Math.floor(version.duration_seconds / 60)}:{String(Math.floor(version.duration_seconds % 60)).padStart(2, '0')}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!isMaster && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMasterMutation.mutate(version.id)}
                      disabled={setMasterMutation.isPending}
                      className="gap-1"
                    >
                      <Crown className="w-3 h-3" />
                      <span className="hidden sm:inline">Сделать мастером</span>
                    </Button>
                  )}
                  {isMaster && (
                    <Badge variant="secondary" className="gap-1 justify-center">
                      <Check className="w-3 h-3" />
                      <span className="hidden sm:inline">Активная</span>
                    </Badge>
                  )}

                  {version.audio_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => window.open(version.audio_url, '_blank')}
                    >
                      <Download className="w-3 h-3" />
                      <span className="hidden sm:inline">Скачать</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
