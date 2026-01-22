/**
 * useProjectDetailHandlers - Event handlers for ProjectDetail
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { usePlanTrackStore } from '@/stores/planTrackStore';
import type { ProjectTrack } from '@/hooks/useProjectTracks';

interface UseProjectDetailHandlersProps {
  projectId?: string;
  project?: {
    id: string;
    genre?: string | null;
    mood?: string | null;
    language?: string | null;
    description?: string | null;
    concept?: string | null;
  } | null;
  tracks?: ProjectTrack[] | null;
  reorderTracks: (updates: { id: string; position: number }[]) => void;
  updateTrack: (params: { id: string; updates: Partial<ProjectTrack> }) => void;
}

export function useProjectDetailHandlers({
  projectId,
  project,
  tracks,
  reorderTracks,
  updateTrack,
}: UseProjectDetailHandlersProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPlanTrackContext } = usePlanTrackStore();

  // Apply project updates
  const handleApplyUpdates = useCallback(async (
    updates: Record<string, string | number | boolean | null>
  ) => {
    if (!project) return;
    
    try {
      const { error } = await supabase
        .from('music_projects')
        .update(updates)
        .eq('id', project.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      logger.error('Error updating project', error);
      throw error;
    }
  }, [project, queryClient]);

  // Drag and drop reorder
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || !tracks) return;

    const items = Array.from(tracks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updates = items.map((track, index) => ({
      id: track.id,
      position: index + 1,
    }));

    reorderTracks(updates);
  }, [tracks, reorderTracks]);

  // Generate from plan track
  const handleGenerateFromPlan = useCallback((track: ProjectTrack) => {
    if (!project) return;
    
    setPlanTrackContext({
      planTrackId: track.id,
      planTrackTitle: track.title,
      stylePrompt: track.style_prompt,
      notes: track.notes,
      lyrics: track.lyrics || undefined,
      recommendedTags: track.recommended_tags,
      projectId: project.id,
      projectGenre: project.genre || undefined,
      projectMood: project.mood || undefined,
      projectLanguage: project.language || undefined,
      projectDescription: project.description || undefined,
      projectConcept: project.concept || undefined,
    });
    navigate('/generate');
  }, [project, navigate, setPlanTrackContext]);

  // Open lyrics studio
  const handleOpenLyrics = useCallback((track: ProjectTrack) => {
    navigate(`/lyrics-studio?projectId=${projectId}&trackId=${track.id}`);
  }, [navigate, projectId]);

  // Save lyrics
  const handleSaveLyrics = useCallback(async (
    trackId: string, 
    lyrics: string, 
    lyricsStatus?: string
  ) => {
    try {
      await supabase.from('project_tracks')
        .update({ lyrics, lyrics_status: lyricsStatus || 'draft' })
        .eq('id', trackId);
      queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
      toast.success('Лирика сохранена');
    } catch (error) {
      logger.error('Error saving lyrics', error);
      toast.error('Ошибка сохранения');
    }
  }, [projectId, queryClient]);

  // Save notes
  const handleSaveNotes = useCallback(async (trackId: string, notes: string) => {
    try {
      updateTrack({ id: trackId, updates: { notes } });
    } catch (error) {
      logger.error('Error saving notes', error);
      toast.error('Ошибка сохранения');
    }
  }, [updateTrack]);

  // Handle lyrics generated from wizard
  const handleLyricsGenerated = useCallback(async (
    lyrics: string, 
    selectedTrackId?: string
  ) => {
    if (selectedTrackId) {
      try {
        await supabase.from('project_tracks')
          .update({ lyrics, lyrics_status: 'generated' })
          .eq('id', selectedTrackId);
        queryClient.invalidateQueries({ queryKey: ['project-tracks', projectId] });
        toast.success('Лирика сохранена');
      } catch (error) {
        logger.error('Error saving lyrics', error);
        toast.error('Ошибка сохранения');
      }
    }
  }, [projectId, queryClient]);

  return {
    handleApplyUpdates,
    handleDragEnd,
    handleGenerateFromPlan,
    handleOpenLyrics,
    handleSaveLyrics,
    handleSaveNotes,
    handleLyricsGenerated,
  };
}
