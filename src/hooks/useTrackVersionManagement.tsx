import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Track } from '@/types/track';
import { logger } from '@/lib/logger';

export function useTrackVersionManagement() {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const createVersionFromTrack = async (track: Track) => {
    if (!track.audio_url) {
      toast.error('Трек не имеет аудио');
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      // Check if version already exists
      const { data: existingVersion } = await supabase
        .from('track_versions')
        .select('id')
        .eq('track_id', track.id)
        .eq('audio_url', track.audio_url)
        .single();

      if (existingVersion) {
        toast.info('Эта версия уже существует');
        return;
      }

      // Create version
      const { error } = await supabase
        .from('track_versions')
        .insert({
          track_id: track.id,
          audio_url: track.audio_url,
          cover_url: track.cover_url,
          duration_seconds: track.duration_seconds,
          version_type: 'initial',
          is_primary: false,
          metadata: {
            prompt: track.prompt,
            style: track.style,
            tags: track.tags,
            suno_id: track.suno_id,
            created_from_main: true,
          },
        });

      if (error) throw error;

      toast.success('Версия создана из основного трека');
    } catch (error: any) {
      logger.error('Create version error', error);
      toast.error(error.message || 'Ошибка создания версии');
    } finally {
      setIsProcessing(false);
    }
  };

  const setVersionAsPrimary = async (versionId: string, trackId: string) => {
    setIsProcessing(true);
    try {
      // Get the version data
      const { data: version, error: versionError } = await supabase
        .from('track_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      // Update all versions to not be primary
      const { error: updateError } = await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', trackId);

      if (updateError) throw updateError;

      // Set this version as primary
      const { error: setPrimaryError } = await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', versionId);

      if (setPrimaryError) throw setPrimaryError;

      // Update main track with version data including title and metadata
      const metadata = version.metadata as any;
      const versionTitle = metadata?.title || (typeof metadata?.prompt === 'string' ? metadata.prompt.split('\n')[0] : null) || null;
      
      // Also update active_version_id for proper synchronization
      const { error: trackError } = await supabase
        .from('tracks')
        .update({
          audio_url: version.audio_url,
          cover_url: version.cover_url,
          duration_seconds: version.duration_seconds,
          active_version_id: versionId,
          title: versionTitle,
          tags: metadata?.tags || null,
          lyrics: metadata?.lyrics || null,
          style: metadata?.style || null,
          suno_model: metadata?.model_name || null,
        })
        .eq('id', trackId);

      if (trackError) throw trackError;

      // Log the change
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('track_change_log')
          .insert({
            track_id: trackId,
            user_id: user.id,
            version_id: versionId,
            change_type: 'version_switched',
            changed_by: 'user',
            metadata: {
              previous_audio_url: version.audio_url,
              new_title: versionTitle,
            },
          });
      }

      toast.success('Версия установлена как основная');
      
      // Invalidate queries to refresh data without page reload
      await queryClient.invalidateQueries({ queryKey: ['tracks'] });
      await queryClient.invalidateQueries({ queryKey: ['track', trackId] });
      await queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
    } catch (error: any) {
      logger.error('Set primary error', error);
      toast.error(error.message || 'Ошибка установки версии');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteVersion = async (versionId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('track_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;

      toast.success('Версия удалена');
    } catch (error: any) {
      logger.error('Delete version error', error);
      toast.error(error.message || 'Ошибка удаления версии');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    createVersionFromTrack,
    setVersionAsPrimary,
    deleteVersion,
  };
}
