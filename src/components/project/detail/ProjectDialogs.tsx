/**
 * ProjectDialogs - All dialog components for ProjectDetail
 * 
 * Consolidates dialog rendering to reduce noise in main component
 */

import { memo } from 'react';
import { AIActionsDialog } from '@/components/project/AIActionsDialog';
import { ProjectSettingsSheet } from '@/components/project/ProjectSettingsSheet';
import { AddTrackDialog } from '@/components/project/AddTrackDialog';
import { LyricsPreviewSheet } from '@/components/project/LyricsPreviewSheet';
import { LyricsChatAssistant } from '@/components/generate-form/LyricsChatAssistant';
import { ProjectMediaGenerator } from '@/components/project/ProjectMediaGenerator';
import { PublishProjectDialog } from '@/components/project/PublishProjectDialog';
import type { UseProjectDetailStateReturn } from '@/hooks/project/useProjectDetailState';
import { useQueryClient } from '@tanstack/react-query';
import type { Project } from '@/hooks/useProjects';
import type { ProjectTrack } from '@/hooks/useProjectTracks';

interface ProjectDialogsProps {
  project: Project;
  tracks: ProjectTrack[] | undefined;
  totalTracks: number;
  state: UseProjectDetailStateReturn;
}

export const ProjectDialogs = memo(function ProjectDialogs({
  project,
  tracks,
  totalTracks,
  state,
}: ProjectDialogsProps) {
  const queryClient = useQueryClient();

  return (
    <>
      {/* AI Actions Dialog */}
      <AIActionsDialog
        open={state.aiDialogOpen}
        onOpenChange={state.setAiDialogOpen}
        projectId={project.id}
        onApply={state.handleApplyUpdates}
      />
      
      {/* Project Settings */}
      <ProjectSettingsSheet
        open={state.settingsOpen}
        onOpenChange={state.setSettingsOpen}
        project={project}
      />

      {/* Add Track Dialog */}
      <AddTrackDialog
        open={state.addTrackOpen}
        onOpenChange={state.setAddTrackOpen}
        projectId={project.id}
        tracksCount={totalTracks}
      />

      {/* Lyrics Preview Sheet */}
      <LyricsPreviewSheet
        open={state.lyricsSheetOpen}
        onOpenChange={state.setLyricsSheetOpen}
        track={state.selectedTrackForLyrics as any}
        onSaveLyrics={state.handleSaveLyrics}
        onSaveNotes={state.handleSaveNotes}
        onOpenWizard={() => {
          state.setLyricsSheetOpen(false);
          state.setLyricsWizardOpen(true);
        }}
        projectContext={{
          projectId: project.id,
          projectTitle: project.title,
          genre: project.genre || undefined,
          mood: project.mood || undefined,
          language: project.language as 'ru' | 'en' | undefined,
          concept: project.concept || undefined,
        }}
      />

      {/* AI Lyrics Chat Assistant */}
      <LyricsChatAssistant
        open={state.lyricsWizardOpen}
        onOpenChange={state.setLyricsWizardOpen}
        onLyricsGenerated={state.handleLyricsGenerated}
        initialGenre={project.genre || undefined}
        initialMood={project.mood ? [project.mood] : undefined}
        initialLanguage={project.language as 'ru' | 'en' | undefined}
        projectContext={{
          projectId: project.id,
          projectTitle: project.title,
          genre: project.genre || undefined,
          mood: project.mood || undefined,
          language: project.language as 'ru' | 'en' | undefined,
          concept: project.concept || undefined,
          targetAudience: project.target_audience || undefined,
          existingTracks: tracks?.map(t => ({
            position: t.position,
            title: t.title,
            stylePrompt: t.style_prompt || undefined,
            draftLyrics: t.lyrics || undefined,
            generatedLyrics: t.linked_track?.lyrics || undefined,
            recommendedTags: t.recommended_tags || undefined,
            recommendedStructure: t.recommended_structure || undefined,
            notes: t.notes || undefined,
            lyrics: t.lyrics || undefined,
            lyricsStatus: t.lyrics_status as 'draft' | 'prompt' | 'generated' | 'approved' | undefined,
          })),
        }}
        trackContext={state.selectedTrackForLyrics ? {
          position: state.selectedTrackForLyrics.position,
          title: state.selectedTrackForLyrics.title,
          stylePrompt: state.selectedTrackForLyrics.style_prompt || undefined,
          draftLyrics: state.selectedTrackForLyrics.lyrics || undefined,
          generatedLyrics: state.selectedTrackForLyrics.linked_track?.lyrics || undefined,
          recommendedTags: state.selectedTrackForLyrics.recommended_tags || undefined,
          recommendedStructure: state.selectedTrackForLyrics.recommended_structure || undefined,
          notes: state.selectedTrackForLyrics.notes || undefined,
          lyrics: state.selectedTrackForLyrics.lyrics || undefined,
          lyricsStatus: state.selectedTrackForLyrics.lyrics_status as 'draft' | 'prompt' | 'generated' | 'approved' | undefined,
        } : undefined}
      />

      {/* Project Media Generator */}
      <ProjectMediaGenerator
        open={state.mediaGeneratorOpen}
        onOpenChange={state.setMediaGeneratorOpen}
        project={{
          id: project.id,
          title: project.title,
          genre: project.genre,
          mood: project.mood,
          concept: project.concept,
          cover_url: project.cover_url,
        }}
        track={state.selectedTrackForMedia ? {
          id: state.selectedTrackForMedia.id,
          title: state.selectedTrackForMedia.title,
          style_prompt: state.selectedTrackForMedia.style_prompt,
          notes: state.selectedTrackForMedia.notes,
        } : null}
        onCoverGenerated={() => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }}
      />

      {/* Publish Project Dialog */}
      <PublishProjectDialog
        open={state.publishDialogOpen}
        onOpenChange={state.setPublishDialogOpen}
        project={project}
        tracks={(tracks as any) || []}
      />
    </>
  );
});

export default ProjectDialogs;
