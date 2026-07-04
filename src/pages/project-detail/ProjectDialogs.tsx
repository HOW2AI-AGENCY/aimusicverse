/**
 * ProjectDialogs — все модальные окна и шторы страницы проекта.
 *
 * Извлечено из pages/ProjectDetail.tsx в Sprint 042 (god-page декомпозиция).
 */

import { useQueryClient } from "@tanstack/react-query";
import { AIActionsDialog } from "@/components/project/AIActionsDialog";
import { ProjectSettingsSheet } from "@/components/project/ProjectSettingsSheet";
import { AddTrackDialog } from "@/components/project/AddTrackDialog";
import { LyricsPreviewSheet } from "@/components/project/LyricsPreviewSheet";
import { LyricsChatAssistant } from "@/components/generate-form/LyricsChatAssistant";
import { ProjectMediaGenerator } from "@/components/project/ProjectMediaGenerator";
import { PublishProjectDialog } from "@/components/project/PublishProjectDialog";
import type { useProjectDetailData } from "@/hooks/project/useProjectDetailData";
import type { useProjectDetailDialogs } from "@/hooks/project/useProjectDetailDialogs";
import type { useProjectDetailHandlers } from "@/hooks/project/useProjectDetailHandlers";

interface ProjectDialogsProps {
  project: NonNullable<ReturnType<typeof useProjectDetailData>["project"]>;
  tracks: ReturnType<typeof useProjectDetailData>["tracks"];
  dialogs: ReturnType<typeof useProjectDetailDialogs>;
  handlers: ReturnType<typeof useProjectDetailHandlers>;
  queryClient: ReturnType<typeof useQueryClient>;
}

export function ProjectDialogs({ project, tracks, dialogs, handlers, queryClient }: ProjectDialogsProps) {
  return (
    <>
      <AIActionsDialog
        open={dialogs.aiDialogOpen}
        onOpenChange={dialogs.setAiDialogOpen}
        projectId={project.id}
        onApply={handlers.handleApplyUpdates}
      />

      <ProjectSettingsSheet open={dialogs.settingsOpen} onOpenChange={dialogs.setSettingsOpen} project={project} />

      <AddTrackDialog
        open={dialogs.addTrackOpen}
        onOpenChange={dialogs.setAddTrackOpen}
        projectId={project.id}
        tracksCount={tracks?.length || 0}
      />

      <LyricsPreviewSheet
        open={dialogs.lyricsSheetOpen}
        onOpenChange={dialogs.setLyricsSheetOpen}
        track={dialogs.selectedTrackForLyrics}
        onSaveLyrics={handlers.handleSaveLyrics}
        onSaveNotes={handlers.handleSaveNotes}
        onOpenWizard={dialogs.closeLyricsSheetAndOpenWizard}
        projectContext={{
          projectId: project.id,
          projectTitle: project.title,
          genre: project.genre || undefined,
          mood: project.mood || undefined,
          language: project.language as "ru" | "en" | undefined,
          concept: project.concept || undefined,
        }}
      />

      <LyricsChatAssistant
        open={dialogs.lyricsWizardOpen}
        onOpenChange={dialogs.setLyricsWizardOpen}
        onLyricsGenerated={(lyrics) => handlers.handleLyricsGenerated(lyrics, dialogs.selectedTrackForLyrics?.id)}
        initialGenre={project.genre || undefined}
        initialMood={project.mood ? [project.mood] : undefined}
        initialLanguage={project.language as "ru" | "en" | undefined}
        projectContext={{
          projectId: project.id,
          projectTitle: project.title,
          genre: project.genre || undefined,
          mood: project.mood || undefined,
          language: project.language as "ru" | "en" | undefined,
          concept: project.concept || undefined,
          targetAudience: project.target_audience || undefined,
          existingTracks: tracks?.map((t) => ({
            position: t.position,
            title: t.title,
            stylePrompt: t.style_prompt || undefined,
            draftLyrics: t.lyrics || undefined,
            generatedLyrics: t.linked_track?.lyrics || undefined,
            recommendedTags: t.recommended_tags || undefined,
            recommendedStructure: t.recommended_structure || undefined,
            notes: t.notes || undefined,
            lyrics: t.lyrics || undefined,
            lyricsStatus: t.lyrics_status as "draft" | "prompt" | "generated" | "approved" | undefined,
          })),
        }}
        trackContext={
          dialogs.selectedTrackForLyrics
            ? {
                position: dialogs.selectedTrackForLyrics.position,
                title: dialogs.selectedTrackForLyrics.title,
                stylePrompt: dialogs.selectedTrackForLyrics.style_prompt || undefined,
                draftLyrics: dialogs.selectedTrackForLyrics.lyrics || undefined,
                generatedLyrics: dialogs.selectedTrackForLyrics.linked_track?.lyrics || undefined,
                recommendedTags: dialogs.selectedTrackForLyrics.recommended_tags || undefined,
                recommendedStructure: dialogs.selectedTrackForLyrics.recommended_structure || undefined,
                notes: dialogs.selectedTrackForLyrics.notes || undefined,
                lyrics: dialogs.selectedTrackForLyrics.lyrics || undefined,
                lyricsStatus: dialogs.selectedTrackForLyrics.lyrics_status as
                  | "draft"
                  | "prompt"
                  | "generated"
                  | "approved"
                  | undefined,
              }
            : undefined
        }
      />

      <ProjectMediaGenerator
        open={dialogs.mediaGeneratorOpen}
        onOpenChange={dialogs.setMediaGeneratorOpen}
        project={{
          id: project.id,
          title: project.title,
          genre: project.genre,
          mood: project.mood,
          concept: project.concept,
          cover_url: project.cover_url,
        }}
        track={
          dialogs.selectedTrackForMedia
            ? {
                id: dialogs.selectedTrackForMedia.id,
                title: dialogs.selectedTrackForMedia.title,
                style_prompt: dialogs.selectedTrackForMedia.style_prompt,
                notes: dialogs.selectedTrackForMedia.notes,
              }
            : null
        }
        onCoverGenerated={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}
      />

      <PublishProjectDialog
        open={dialogs.publishDialogOpen}
        onOpenChange={dialogs.setPublishDialogOpen}
        project={project}
        tracks={tracks || []}
      />
    </>
  );
}
