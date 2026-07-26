import type { Dispatch, SetStateAction } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { notify } from "@/lib/notifications";
import { useGenerateForm } from "@/hooks/generation";
import { useProjects } from "@/hooks/useProjects";
import { useArtists } from "@/hooks/useArtists";
import { useTracks } from "@/hooks/useTracks";
import { useTelegram } from "@/contexts/TelegramContext";
import { ProjectTrackSelector } from "../generate-form/ProjectTrackSelector";
import { ArtistSelector } from "../generate-form/ArtistSelector";
import { AudioActionDialog } from "../generate-form/AudioActionDialog";
import { LyricsAssistantSheet } from "../generate-form/lyrics/LyricsAssistantSheet";
import { PromptHistory } from "../generate-form/PromptHistory";
import { StylePresetSelector } from "../generate-form/StylePresetSelector";
import { VoiceCloneWizard } from "../voice-clone/VoiceCloneWizard";

type GenerateForm = ReturnType<typeof useGenerateForm>;
type ProjectsList = ReturnType<typeof useProjects>["projects"];
type ArtistsList = ReturnType<typeof useArtists>["artists"];
type TracksList = ReturnType<typeof useTracks>["tracks"];

interface GenerateSheetDialogsProps {
  form: GenerateForm;
  projects: ProjectsList;
  artists: ArtistsList;
  allTracks: TracksList;
  user: { id: string } | null | undefined;
  hapticFeedback: ReturnType<typeof useTelegram>["hapticFeedback"];
  queryClient: QueryClient;

  projectDialogOpen: boolean;
  setProjectDialogOpen: (v: boolean) => void;
  projectTrackStep: "project" | "track";
  setProjectTrackStep: (v: "project" | "track") => void;
  projectTracks: TracksList | undefined;
  onProjectSelect: (projectId: string) => void;

  artistDialogOpen: boolean;
  setArtistDialogOpen: (v: boolean) => void;

  voiceCloneOpen: boolean;
  setVoiceCloneOpen: (v: boolean) => void;
  onAdvancedToggle: (open: boolean) => void;

  audioActionDialogOpen: boolean;
  setAudioActionDialogOpen: (v: boolean) => void;
  setAdvancedOpen: (v: boolean) => void;

  lyricsAssistantOpen: boolean;
  setLyricsAssistantOpen: (v: boolean) => void;

  historyOpen: boolean;
  setHistoryOpen: (v: boolean) => void;

  stylesOpen: boolean;
  setStylesOpen: (v: boolean) => void;
}

/** Secondary dialogs opened from within GenerateSheet (project/artist/voice/audio/lyrics/history/styles). */
export function GenerateSheetDialogs({
  form,
  projects,
  artists,
  allTracks,
  user,
  hapticFeedback,
  queryClient,
  projectDialogOpen,
  setProjectDialogOpen,
  projectTrackStep,
  setProjectTrackStep,
  projectTracks,
  onProjectSelect,
  artistDialogOpen,
  setArtistDialogOpen,
  voiceCloneOpen,
  setVoiceCloneOpen,
  onAdvancedToggle,
  audioActionDialogOpen,
  setAudioActionDialogOpen,
  setAdvancedOpen,
  lyricsAssistantOpen,
  setLyricsAssistantOpen,
  historyOpen,
  setHistoryOpen,
  stylesOpen,
  setStylesOpen,
}: GenerateSheetDialogsProps) {
  return (
    <>
      <ProjectTrackSelector
        type={projectTrackStep}
        open={projectDialogOpen}
        onOpenChange={(open) => {
          setProjectDialogOpen(open);
          if (!open) {
            setProjectTrackStep("project");
          }
        }}
        projects={projects}
        tracks={projectTrackStep === "track" ? projectTracks : undefined}
        selectedId={projectTrackStep === "project" ? form.selectedProjectId : form.selectedTrackId}
        onSelect={projectTrackStep === "project" ? onProjectSelect : form.handleTrackSelect}
      />

      <ArtistSelector
        open={artistDialogOpen}
        onOpenChange={setArtistDialogOpen}
        artists={artists}
        selectedArtistId={form.selectedArtistId}
        onSelect={form.handleArtistSelect}
      />

      <VoiceCloneWizard
        open={voiceCloneOpen}
        onOpenChange={setVoiceCloneOpen}
        onComplete={(voiceId) => {
          form.setCustomVoiceId(voiceId);
          form.setMode("custom");
          onAdvancedToggle(true);
          queryClient.invalidateQueries({ queryKey: ["custom-voices", user?.id] });
          notify.success("Голос подключён к генерации", {
            description: "Выбран в разделе «Кастомный голос».",
          });
        }}
      />

      {/* Audio Action Dialog - for cover/extend operations */}
      <AudioActionDialog
        open={audioActionDialogOpen}
        onOpenChange={setAudioActionDialogOpen}
        onAudioSelected={(file, mode) => {
          form.setAudioFile(file);
          form.setMode("custom");
          // Set mode-specific audio weight based on cover/extend selection
          if (mode === "extend") {
            // High audio weight for extending - preserves original characteristics
            form.setAudioWeight([0.9]);
          } else {
            // Moderate audio weight for cover - allows more creative variation
            form.setAudioWeight([0.5]);
          }
          notify.success(mode === "cover" ? "Аудио для кавера добавлено" : "Аудио для расширения добавлено");
        }}
        onAnalysisComplete={(styleDescription) => {
          form.setMode("custom");
          form.setStyle(form.style ? `${form.style}\n\n${styleDescription}` : styleDescription);
        }}
        onLyricsExtracted={(lyrics) => {
          form.setMode("custom");
          form.setHasVocals(true);
          form.setLyrics(lyrics);
        }}
        onChordsDetected={(chords, progression) => {
          form.setMode("custom");
          // Add chord progression to style description
          const chordInfo = `Guitar chord progression: ${progression}`;
          form.setStyle(form.style ? `${form.style}\n\n${chordInfo}` : chordInfo);
          notify.success(`Обнаружено ${chords.length} аккордов`);
        }}
        onOpenCoverDialog={(file, mode) => {
          // Instead of opening legacy UploadAudioDialog,
          // use unified audio reference system and switch form to custom mode
          hapticFeedback?.("light");

          // Close the audio action dialog
          setAudioActionDialogOpen(false);

          // Switch form to custom mode with appropriate audio weight
          form.setMode("custom");
          if (mode === "extend") {
            form.setAudioWeight([0.9]);
          } else {
            form.setAudioWeight([0.5]);
          }

          // Open advanced settings to show provider selector
          setAdvancedOpen(true);

          notify.success(mode === "cover" ? "Режим кавера активирован" : "Режим расширения активирован", {
            description: "Настройте параметры в форме генерации",
          });
        }}
      />

      <LyricsAssistantSheet
        open={lyricsAssistantOpen}
        onOpenChange={setLyricsAssistantOpen}
        currentText={form.lyrics}
        onApply={(newLyrics: string) => {
          form.setMode("custom");
          form.setHasVocals(true);
          form.setLyrics(newLyrics);
          notify.success("Текст песни добавлен! 🎤", {
            description: "Лирика с профессиональными тегами Suno готова к генерации",
          });
        }}
        onApplyStyle={(generatedStyle: string) => {
          if (generatedStyle && generatedStyle.trim()) {
            form.setStyle(generatedStyle);
          }
        }}
        onApplyTitle={(generatedTitle: string) => {
          if (generatedTitle && generatedTitle.trim()) {
            form.setTitle(generatedTitle);
          }
        }}
        genre={projects?.find((p) => p.id === form.selectedProjectId)?.genre || undefined}
        mood={
          projects?.find((p) => p.id === form.selectedProjectId)?.mood
            ? [projects.find((p) => p.id === form.selectedProjectId)!.mood!]
            : undefined
        }
        language={(projects?.find((p) => p.id === form.selectedProjectId)?.language as "ru" | "en") || "ru"}
        projectContext={
          form.selectedProjectId
            ? (() => {
                const project = projects?.find((p) => p.id === form.selectedProjectId);
                if (!project) return undefined;
                return {
                  projectId: project.id,
                  projectTitle: project.title,
                  genre: project.genre || undefined,
                  mood: project.mood || undefined,
                  language: project.language as "ru" | "en" | undefined,
                  concept: project.concept || undefined,
                  targetAudience: project.target_audience || undefined,
                  referenceArtists: project.reference_artists || undefined,
                  projectType: project.project_type || undefined,
                  existingTracks: allTracks
                    ?.filter((t) => t.project_id === project.id)
                    .map((t, index) => ({
                      title: t.title || "Untitled",
                      position: index + 1,
                      stylePrompt: t.style || undefined,
                      generatedLyrics: t.lyrics || undefined,
                      draftLyrics: undefined,
                    })),
                };
              })()
            : undefined
        }
        trackContext={
          form.selectedTrackId
            ? (() => {
                const track = allTracks?.find((t) => t.id === form.selectedTrackId);
                if (!track) return undefined;
                return {
                  title: track.title || "Untitled",
                  position: 1,
                  stylePrompt: track.style || undefined,
                  draftLyrics: undefined,
                  generatedLyrics: track.lyrics || undefined,
                };
              })()
            : undefined
        }
      />

      <PromptHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onSelectPrompt={(prompt) => {
          // Map wizard to custom if it exists in old history
          const mode = prompt.mode === "wizard" ? "custom" : prompt.mode;
          form.setMode(mode as "simple" | "custom");
          if (mode === "simple") {
            form.setDescription(prompt.description || "");
          } else {
            form.setTitle(prompt.title || "");
            form.setStyle(prompt.style || "");
            form.setLyrics(prompt.lyrics || "");
          }
          if (prompt.model) form.setModel(prompt.model);
        }}
      />

      <StylePresetSelector
        open={stylesOpen}
        onOpenChange={setStylesOpen}
        currentStyle={form.style}
        onSelect={(style) => {
          form.setMode("custom");
          form.setStyle(form.style && form.style.trim() ? `${form.style}, ${style}` : style);
          notify.success("Стиль применён");
        }}
      />
    </>
  );
}
