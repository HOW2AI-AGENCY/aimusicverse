import { memo, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StudioMixerPanel } from "./StudioMixerPanel";
import { StudioMusicLabSheet } from "./StudioMusicLabSheet";
import { StudioLyricsSheet } from "./StudioLyricsSheet";
import { StudioPresetsSheet } from "./StudioPresetsSheet";
import { StudioDashboardSheet } from "./StudioDashboardSheet";
import { StudioActionsSheet } from "./StudioActionsSheet";
import { StudioDownloadPanel } from "./StudioDownloadPanel";
import { StudioTranscriptionPanel } from "./StudioTranscriptionPanel";
import { StudioNotationPanel } from "./StudioNotationPanel";
import { StudioArrangementDialog } from "./StudioArrangementDialog";
import { SaveVersionDialog } from "./SaveVersionDialog";
import { StemSeparationModeDialog } from "./StemSeparationModeDialog";
import { StemEffectsDrawer } from "./StemEffectsDrawer";
import { ExportMixDialog } from "./ExportMixDialog";
import { ImportAudioDialog } from "./ImportAudioDialog";
import { AddTrackDialog } from "./AddTrackDialog";
import { InstrumentalResultHandler, InstrumentalResultData } from "./InstrumentalResultHandler";
import { SectionEditorSheet } from "@/components/studio/editor/SectionEditorSheet";
import { ExtendTrackDialog } from "@/components/ExtendTrackDialog";
import { LazyAddVocalsDrawer, LazyGenerateSheet } from "@/components/lazy";
import { Loader2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useUnifiedStudioStore, TRACK_COLORS, type StudioTrack, type TrackType } from "@/stores/useUnifiedStudioStore";
import type { AudioTrack } from "@/hooks/studio/useStudioAudioEngine";
import type { StemEffects } from "@/hooks/studio/types";
import { defaultStemEffects } from "@/hooks/studio/stemEffectsConfig";
import type { Track } from "@/types/track";

interface TrackEffectsState {
  [trackId: string]: StemEffects;
}

export interface StudioShellDialogsProps {
  isMobile: boolean;
  project: NonNullable<ReturnType<typeof useUnifiedStudioStore.getState>["project"]>;
  sourceTrackId: string | undefined;
  sourceTrack: { suno_task_id: string | null; suno_id: string | null; lyrics: string | null } | null | undefined;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  audioTracks: AudioTrack[];
  detectedSections: Array<{ label: string; start: number; end: number }>;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isSeparating: boolean;
  operationLock: {
    blockedOperations: string[];
    getBlockReason: (op: string) => string | undefined;
    canSaveAsNewVersion: boolean;
  };

  // Dialog states
  showActionsSheet: boolean;
  setShowActionsSheet: (v: boolean) => void;
  showPresetsSheet: boolean;
  setShowPresetsSheet: (v: boolean) => void;
  showDashboardSheet: boolean;
  setShowDashboardSheet: (v: boolean) => void;
  showMixerSheet: boolean;
  setShowMixerSheet: (v: boolean) => void;
  showMusicLabSheet: boolean;
  setShowMusicLabSheet: (v: boolean) => void;
  showLyricsSheet: boolean;
  setShowLyricsSheet: (v: boolean) => void;
  showAddTrackDialog: boolean;
  setShowAddTrackDialog: (v: boolean) => void;
  showImportDialog: boolean;
  setShowImportDialog: (v: boolean) => void;
  showExportDialog: boolean;
  setShowExportDialog: (v: boolean) => void;
  showEffectsDrawer: boolean;
  setShowEffectsDrawer: (v: boolean) => void;
  showAddVocalsDrawer: boolean;
  setShowAddVocalsDrawer: (v: boolean) => void;
  showExtendDialog: boolean;
  setShowExtendDialog: (v: boolean) => void;
  showSectionEditor: boolean;
  setShowSectionEditor: (v: boolean) => void;
  showGenerateSheet: boolean;
  setShowGenerateSheet: (v: boolean) => void;
  showDownloadPanel: boolean;
  setShowDownloadPanel: (v: boolean) => void;
  showSaveVersionDialog: boolean;
  setShowSaveVersionDialog: (v: boolean) => void;
  showNotationPanel: boolean;
  setShowNotationPanel: (v: boolean) => void;
  showTranscriptionPanel: boolean;
  setShowTranscriptionPanel: (v: boolean) => void;
  showArrangementDialog: boolean;
  setShowArrangementDialog: (v: boolean) => void;
  showInstrumentalResult: boolean;
  setShowInstrumentalResult: (v: boolean) => void;
  showStemSeparationDialog: boolean;
  setShowStemSeparationDialog: (v: boolean) => void;

  // Selected items
  selectedEffectsTrack: StudioTrack | null;
  setSelectedEffectsTrack: (v: StudioTrack | null) => void;
  selectedVocalsTrack: StudioTrack | null;
  setSelectedVocalsTrack: (v: StudioTrack | null) => void;
  selectedExtendTrack: StudioTrack | null;
  setSelectedExtendTrack: (v: StudioTrack | null) => void;
  selectedSectionTrack: StudioTrack | null;
  setSelectedSectionTrack: (v: StudioTrack | null) => void;
  selectedNotationTrack: StudioTrack | null;
  setSelectedNotationTrack: (v: StudioTrack | null) => void;
  selectedTranscriptionTrack: StudioTrack | null;
  setSelectedTranscriptionTrack: (v: StudioTrack | null) => void;
  selectedArrangementTrack: StudioTrack | null;
  setSelectedArrangementTrack: (v: StudioTrack | null) => void;
  instrumentalResultData: InstrumentalResultData | null;
  setInstrumentalResultData: (v: InstrumentalResultData | null) => void;
  trackEffects: TrackEffectsState;
  setTrackEffects: React.Dispatch<React.SetStateAction<TrackEffectsState>>;

  // Callbacks
  onSave: () => void;
  onExport: () => void;
  onBack: () => void;
  onAddTrack: (type: TrackType, name: string) => void;
  onStemSeparation: (mode: "simple" | "detailed") => Promise<void>;
  onSeek: (time: number) => void;
  pendingGenerationContextRef: React.MutableRefObject<Map<string, { type: "replace_instrumental"; existingId?: string }>>;
}

export const StudioShellDialogs = memo(function StudioShellDialogs(props: StudioShellDialogsProps) {
  const {
    isMobile, project, sourceTrackId, sourceTrack, duration, currentTime, isPlaying,
    audioTracks, detectedSections, hasUnsavedChanges, isSaving, isSeparating,
    trackEffects, setTrackEffects,
  } = props;

  const { addTrack, addClip, addPendingTrack, resolvePendingTrack, removeTrack: removeTrackFromStore } = useUnifiedStudioStore();
  const navigate = useNavigate();

  const clearSelection = () => {
    // Import from store if needed
  };

  return (
    <>
      {/* Mobile Actions Sheet */}
      <StudioActionsSheet
        open={props.showActionsSheet}
        onOpenChange={props.setShowActionsSheet}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={props.onSave}
        onExport={props.onExport}
        onOpenDownload={() => props.setShowDownloadPanel(true)}
        onOpenTranscription={() => {
          const firstTrack = project.tracks[0];
          if (firstTrack) {
            props.setSelectedTranscriptionTrack(firstTrack);
            props.setShowTranscriptionPanel(true);
          }
        }}
        onAddTrack={() => props.setShowAddTrackDialog(true)}
        onGenerate={() => props.setShowGenerateSheet(true)}
        onImport={() => props.setShowImportDialog(true)}
        onBack={props.onBack}
        onOpenMusicLab={() => props.setShowMusicLabSheet(true)}
        onOpenLyrics={() => props.setShowLyricsSheet(true)}
        onOpenPresets={() => props.setShowPresetsSheet(true)}
        onOpenDashboard={() => props.setShowDashboardSheet(true)}
      />

      {/* Presets Sheet */}
      <StudioPresetsSheet
        open={props.showPresetsSheet}
        onOpenChange={props.setShowPresetsSheet}
        trackId={project.id}
        currentSettings={{ mixer: { volume: project.masterVolume, pan: 0 } }}
        defaultCategory="mastering"
      />

      {/* Dashboard Sheet */}
      <StudioDashboardSheet open={props.showDashboardSheet} onOpenChange={props.setShowDashboardSheet} />

      {/* Mobile Mixer Sheet */}
      <Sheet open={props.showMixerSheet} onOpenChange={props.setShowMixerSheet}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>Микшер</SheetTitle>
          </SheetHeader>
          <StudioMixerPanel
            className="h-full pt-4"
            onAddTrack={() => {
              props.setShowMixerSheet(false);
              props.setShowAddTrackDialog(true);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* MusicLab Sheet */}
      <StudioMusicLabSheet
        open={props.showMusicLabSheet}
        onOpenChange={props.setShowMusicLabSheet}
        projectId={project.id}
        onRecordingComplete={(recordedTrack) => {
          addTrack({
            name: recordedTrack.name,
            type: recordedTrack.type === "vocal" ? "vocal" : "other",
            audioUrl: recordedTrack.audioUrl,
            volume: 0.85,
            pan: 0,
            muted: false,
            solo: false,
            color: TRACK_COLORS[recordedTrack.type === "vocal" ? "vocal" : "other"] || TRACK_COLORS.other,
          });
          toast.success("Запись добавлена в проект");
        }}
        onDJTrackComplete={(audioUrl) => {
          addTrack({
            name: "PromptDJ Track",
            type: "other",
            audioUrl,
            volume: 0.85,
            pan: 0,
            muted: false,
            solo: false,
            color: TRACK_COLORS.other,
          });
          toast.success("DJ трек добавлен в проект");
        }}
      />

      {/* Lyrics Studio Sheet */}
      <StudioLyricsSheet
        isOpen={props.showLyricsSheet}
        onClose={() => props.setShowLyricsSheet(false)}
        trackId={sourceTrackId || undefined}
        initialLyrics={sourceTrack?.lyrics ?? ""}
        onLyricsSaved={(content: string) => {
          logger.info("Lyrics saved", { trackId: sourceTrackId, contentLength: content.length });
        }}
      />

      {/* Add Track Dialog */}
      <AddTrackDialog open={props.showAddTrackDialog} onOpenChange={props.setShowAddTrackDialog} onAdd={props.onAddTrack} />

      {/* Import Audio Dialog */}
      <ImportAudioDialog
        open={props.showImportDialog}
        onOpenChange={props.setShowImportDialog}
        projectId={project.id}
        onImport={(audioUrl, name, type, importDuration) => {
          addTrack({
            name,
            type,
            audioUrl,
            volume: 0.85,
            pan: 0,
            muted: false,
            solo: false,
            color: TRACK_COLORS[type] || TRACK_COLORS.other,
          });
          toast.success(`Дорожка "${name}" добавлена`);
        }}
      />

      {/* Export Mix Dialog */}
      <ExportMixDialog
        open={props.showExportDialog}
        onOpenChange={props.setShowExportDialog}
        tracks={audioTracks.map((t) => ({
          url: t.audioUrl || "",
          volume: t.volume,
          muted: t.muted,
        }))}
        masterVolume={project.masterVolume}
        trackTitle={project.name}
      />

      {/* Track Effects Drawer */}
      <StemEffectsDrawer
        open={props.showEffectsDrawer}
        onOpenChange={props.setShowEffectsDrawer}
        stem={
          props.selectedEffectsTrack
            ? {
                id: props.selectedEffectsTrack.id,
                stem_type: props.selectedEffectsTrack.type,
                audio_url: props.selectedEffectsTrack.audioUrl || "",
                track_id: project.id,
                separation_mode: null,
                version_id: null,
                created_at: new Date().toISOString(),
              }
            : null
        }
        effects={
          props.selectedEffectsTrack ? trackEffects[props.selectedEffectsTrack.id] || defaultStemEffects : defaultStemEffects
        }
        onUpdateEQ={(settings) => {
          if (!props.selectedEffectsTrack) return;
          setTrackEffects((prev) => ({
            ...prev,
            [props.selectedEffectsTrack!.id]: {
              ...(prev[props.selectedEffectsTrack!.id] || defaultStemEffects),
              eq: { ...(prev[props.selectedEffectsTrack!.id]?.eq || defaultStemEffects.eq), ...settings },
            },
          }));
        }}
        onUpdateCompressor={(settings) => {
          if (!props.selectedEffectsTrack) return;
          setTrackEffects((prev) => ({
            ...prev,
            [props.selectedEffectsTrack!.id]: {
              ...(prev[props.selectedEffectsTrack!.id] || defaultStemEffects),
              compressor: {
                ...(prev[props.selectedEffectsTrack!.id]?.compressor || defaultStemEffects.compressor),
                ...settings,
              },
            },
          }));
        }}
        onUpdateReverb={(settings) => {
          if (!props.selectedEffectsTrack) return;
          setTrackEffects((prev) => ({
            ...prev,
            [props.selectedEffectsTrack!.id]: {
              ...(prev[props.selectedEffectsTrack!.id] || defaultStemEffects),
              reverb: { ...(prev[props.selectedEffectsTrack!.id]?.reverb || defaultStemEffects.reverb), ...settings },
            },
          }));
        }}
        onReset={() => {
          if (!props.selectedEffectsTrack) return;
          setTrackEffects((prev) => ({
            ...prev,
            [props.selectedEffectsTrack!.id]: defaultStemEffects,
          }));
        }}
      />

      {/* Add Vocals Drawer */}
      {props.selectedVocalsTrack && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <LazyAddVocalsDrawer
            open={props.showAddVocalsDrawer}
            onOpenChange={props.setShowAddVocalsDrawer}
            track={
              {
                id: props.selectedVocalsTrack.id,
                title: props.selectedVocalsTrack.name,
                audio_url: props.selectedVocalsTrack.audioUrl || props.selectedVocalsTrack.clips[0]?.audioUrl || "",
                cover_url: null,
                style: null,
                type: props.selectedVocalsTrack.type === "instrumental" ? "instrumental" : "complete",
                project_id: project.id,
                is_liked: false,
                likes_count: 0,
              } as unknown as Track
            }
            onSuccess={() => {
              props.setShowAddVocalsDrawer(false);
              props.setSelectedVocalsTrack(null);
              toast.success("Вокал добавлен!", { description: "Новый трек создан" });
            }}
          />
        </Suspense>
      )}

      {/* Extend Track Dialog */}
      {props.selectedExtendTrack && (
        <ExtendTrackDialog
          open={props.showExtendDialog}
          onOpenChange={(open) => {
            props.setShowExtendDialog(open);
            if (!open) props.setSelectedExtendTrack(null);
          }}
          track={
            {
              id: props.selectedExtendTrack.id,
              title: props.selectedExtendTrack.name,
              audio_url: props.selectedExtendTrack.audioUrl || props.selectedExtendTrack.clips[0]?.audioUrl || "",
              cover_url: null,
              style: null,
              duration_seconds:
                props.selectedExtendTrack.clips[0]?.duration || props.selectedExtendTrack.versions?.[0]?.duration || 60,
              project_id: project.id,
              suno_id: null,
              is_liked: false,
              likes_count: 0,
            } as unknown as Track
          }
        />
      )}

      {/* Section Editor Sheet */}
      {props.selectedSectionTrack && (
        <SectionEditorSheet
          open={props.showSectionEditor}
          onClose={() => {
            props.setShowSectionEditor(false);
            props.setSelectedSectionTrack(null);
          }}
          trackId={sourceTrackId || props.selectedSectionTrack.id}
          trackTitle={props.selectedSectionTrack.name}
          audioUrl={props.selectedSectionTrack.audioUrl || props.selectedSectionTrack.clips?.[0]?.audioUrl}
          duration={duration}
          detectedSections={detectedSections}
        />
      )}

      {/* Download Panel Sheet */}
      <Sheet open={props.showDownloadPanel} onOpenChange={props.setShowDownloadPanel}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(isMobile ? "h-[80vh]" : "w-full sm:max-w-md", "p-0")}
        >
          <StudioDownloadPanel
            tracks={project.tracks}
            projectName={project.name}
            onClose={() => props.setShowDownloadPanel(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Transcription Panel Sheet */}
      <Sheet
        open={props.showTranscriptionPanel}
        onOpenChange={(open) => {
          props.setShowTranscriptionPanel(open);
          if (!open) props.setSelectedTranscriptionTrack(null);
        }}
      >
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(isMobile ? "h-[80vh]" : "w-full sm:max-w-md", "p-0")}
        >
          {props.selectedTranscriptionTrack && (
            <StudioTranscriptionPanel
              track={props.selectedTranscriptionTrack}
              audioUrl={props.selectedTranscriptionTrack.audioUrl || props.selectedTranscriptionTrack.clips?.[0]?.audioUrl || ""}
              trackId={sourceTrackId || undefined}
              stemType={props.selectedTranscriptionTrack.type}
              onComplete={() => {}}
              onClose={() => {
                props.setShowTranscriptionPanel(false);
                props.setSelectedTranscriptionTrack(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Generate Sheet */}
      <Suspense fallback={null}>
        <LazyGenerateSheet open={props.showGenerateSheet} onOpenChange={props.setShowGenerateSheet} />
      </Suspense>

      {/* Arrangement Replacement Dialog */}
      {props.selectedArrangementTrack && (
        <StudioArrangementDialog
          open={props.showArrangementDialog}
          onClose={() => {
            props.setShowArrangementDialog(false);
            props.setSelectedArrangementTrack(null);
          }}
          vocalTrack={props.selectedArrangementTrack}
          projectName={project.name}
          onSuccess={(taskId, title) => {
            const existingInstrumental = project.tracks.find((t) => t.type === "instrumental" && t.status === "ready");
            props.pendingGenerationContextRef.current.set(taskId, {
              type: "replace_instrumental",
              existingId: existingInstrumental?.id,
            });
            addPendingTrack({ name: title, type: "instrumental", taskId });
            toast.success("Генерация запущена", {
              description: "Новая аранжировка будет готова через 1-2 минуты",
            });
          }}
        />
      )}

      {/* Instrumental Result Handler Dialog */}
      <InstrumentalResultHandler
        open={props.showInstrumentalResult}
        onClose={() => {
          props.setShowInstrumentalResult(false);
          props.setInstrumentalResultData(null);
        }}
        data={props.instrumentalResultData}
        onApply={(action, selectedVersionLabel) => {
          if (!props.instrumentalResultData) return;

          const { newTrackId, existingInstrumentalId, versions } = props.instrumentalResultData;
          const selectedVersion = versions.find((v) => v.label === selectedVersionLabel);
          if (!selectedVersion) return;

          const { replaceTrackAudio, addTrackVersion, removeTrack } = useUnifiedStudioStore.getState();

          switch (action) {
            case "replace":
              if (existingInstrumentalId) {
                replaceTrackAudio(existingInstrumentalId, selectedVersion.audioUrl, selectedVersion.duration);
                removeTrack(newTrackId);
                toast.success("Инструментал заменён");
              }
              break;
            case "version":
              if (existingInstrumentalId) {
                const existingTrack = project.tracks.find((t) => t.id === existingInstrumentalId);
                const currentVersions = existingTrack?.versions?.length || 0;
                const nextLabel = String.fromCharCode(65 + currentVersions);
                addTrackVersion(existingInstrumentalId, nextLabel, selectedVersion.audioUrl, selectedVersion.duration);
                removeTrack(newTrackId);
                toast.success(`Версия ${nextLabel} добавлена`);
              }
              break;
            case "new":
              toast.success("Новый инструментал добавлен");
              break;
          }

          props.setShowInstrumentalResult(false);
          props.setInstrumentalResultData(null);
        }}
      />

      {/* Save Version Dialog */}
      <SaveVersionDialog
        open={props.showSaveVersionDialog}
        onOpenChange={props.setShowSaveVersionDialog}
        projectId={project.id}
        sourceTrackId={sourceTrackId || undefined}
        tracks={project.tracks}
        masterVolume={project.masterVolume}
        onVersionSaved={(version) => {
          toast.success(`Версия "${version.label}" сохранена`);
        }}
      />

      {/* Notation Panel Sheet */}
      <Sheet
        open={props.showNotationPanel}
        onOpenChange={(open) => {
          props.setShowNotationPanel(open);
          if (!open) props.setSelectedNotationTrack(null);
        }}
      >
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(isMobile ? "h-[85vh]" : "w-full sm:max-w-lg", "p-0")}
        >
          {props.selectedNotationTrack && (
            <StudioNotationPanel
              track={props.selectedNotationTrack}
              trackId={sourceTrackId || undefined}
              stemType={props.selectedNotationTrack.type}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onSeek={props.onSeek}
              onClose={() => {
                props.setShowNotationPanel(false);
                props.setSelectedNotationTrack(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Stem Separation Mode Dialog */}
      <StemSeparationModeDialog
        open={props.showStemSeparationDialog}
        onOpenChange={props.setShowStemSeparationDialog}
        onConfirm={props.onStemSeparation}
        isProcessing={isSeparating}
      />
    </>
  );
});
