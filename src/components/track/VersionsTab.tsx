/**
 * VersionsTab Component
 * 
 * Displays and manages all versions of a track.
 * 
 * Key Features:
 * - Lists all versions with playback controls
 * - Shows which version is currently the primary/master version
 * - Allows switching which version is primary
 * - Logs changes to track_change_log table
 * 
 * Version System Explanation:
 * ============================
 * When Suno generates music, it typically creates 2 clips (A and B).
 * Each clip is stored as a separate row in the `track_versions` table.
 * One version is marked as primary (is_primary = true) - this is the default version
 * that plays when users click on the track in the library.
 * 
 * Database Fields:
 * - `is_primary`: Boolean field indicating the active/master version
 * - Only ONE version per track should have is_primary = true
 * - The migration 20251202112920 incorrectly added `is_master` field
 *   but the actual schema uses `is_primary` (this is the correct field)
 * 
 * Change Log:
 * - 2025-12-03: Added comprehensive comments explaining version logic
 * - Fixed to use `is_primary` consistently (not `is_master`)
 */
import { useState } from 'react';
import type { Track } from '@/types/track';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Play, Pause, Download, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
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

  // Mutation to set a version as the primary/master version
  // This is a critical operation that affects which version users hear by default
  const setMasterMutation = useMutation({
    mutationFn: async (versionId: string) => {
      // Optimistically update UI immediately for better UX
      setOptimisticMasterId(versionId);

      // Step 1: Unset is_primary for ALL versions of this track
      const { error: unsetError } = await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', track.id);

      if (unsetError) throw unsetError;

      // Step 2: Set the selected version as primary
      const { error: setError } = await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', versionId);

      if (setError) throw setError;

      // Step 3: Also update active_version_id on tracks table for consistency
      const { error: trackError } = await supabase
        .from('tracks')
        .update({ active_version_id: versionId })
        .eq('id', track.id);

      if (trackError) throw trackError;

      // Step 4: Log this change to the changelog for audit trail
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
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success('Мастер-версия обновлена');
      setOptimisticMasterId(null);
    },
    onError: (error) => {
      toast.error('Ошибка установки мастер-версии');
      logger.error('Set master version error', error);
      setOptimisticMasterId(null);
    },
  });

  const handlePlayVersion = (version: any) => {
    // Create a track-like object from the version for playback
    // Use version's audio_url which always exists in track_versions table
    const versionTrack: Track = {
      ...track,
      // Override audio URL with version-specific one
      audio_url: version.audio_url,
      // Version may have its own cover
      cover_url: version.cover_url || track.cover_url,
      // Use version ID directly for tracking
      id: version.id,
    };

    // Check if this version is currently playing
    const isThisVersionPlaying = activeTrack?.id === version.id && isPlaying;

    if (isThisVersionPlaying) {
      pauseTrack();
    } else {
      playTrack(versionTrack);
    }
  };

  const isVersionPlaying = (versionId: string) => {
    return activeTrack?.id === versionId && isPlaying;
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
