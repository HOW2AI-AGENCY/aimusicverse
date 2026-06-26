import { memo, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useUnifiedStudioStore, ViewMode, TrackType, TRACK_COLORS, StudioTrack } from "@/stores/useUnifiedStudioStore";
import { SortableTrackList } from "./SortableTrackList";
import { StudioLyricsPanelCompact } from "@/components/stem-studio/StudioLyricsPanelCompact";
import { StudioWaveformTimeline } from "./StudioWaveformTimeline";
import { OptimizedTransport } from "./OptimizedTransport";
import { MobileAudioWarning } from "@/components/studio/MobileAudioWarning";
import { MobileStudioPlayerBar } from "./MobileStudioPlayerBar";
import { AIActionsFAB } from "./AIActionsFAB";
import { StudioShellHeader } from "./StudioShellHeader";
import { StudioShellDialogs } from "./StudioShellDialogs";
import { useStudioAudioEngine, AudioTrack } from "@/hooks/studio/useStudioAudioEngine";
import { useMobileAudioFallback } from "@/hooks/studio/useMobileAudioFallback";
import { useStudioOptimizations } from "@/hooks/studio/useStudioOptimizations";
import { useAutoSave } from "@/hooks/studio/useAutoSave";
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from "@/hooks/studio/useStudioAudio";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useSectionDetection } from "@/hooks/useSectionDetection";
import { useTimestampedLyrics } from "@/hooks/useTimestampedLyrics";
import { useReplacedSections } from "@/hooks/useReplacedSections";
import { useSectionEditorStore } from "@/stores/useSectionEditorStore";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { useProjectTrackSync } from "@/hooks/studio/useProjectTrackSync";
import { useStudioOperationLock } from "@/hooks/studio/useStudioOperationLock";
import { useStemSeparation } from "@/hooks/useStemSeparation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Loader2, Volume2, VolumeX, Upload, Plus } from "@/lib/icons";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { InstrumentalResultData } from "./InstrumentalResultHandler";
import type { StemEffects } from "@/hooks/studio/types";
import type { TrackStem } from "@/hooks/useTrackStems";
import type { Track } from "@/types/track";

interface StudioShellProps {
  className?: string;
}

interface TrackEffectsState {
  [trackId: string]: StemEffects;
}

export const StudioShell = memo(function StudioShell({ className }: StudioShellProps) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { pauseTrack: pauseGlobalPlayer } = usePlayerStore();

  const {
    project, isLoading, isSaving, hasUnsavedChanges, isPlaying, currentTime, viewMode,
    setViewMode, saveProject, canUndo, canRedo, undo, redo,
    addTrack, addClip, addPendingTrack, resolvePendingTrack, setTrackActiveVersion,
    loadProject, play, pause, stop, seek, toggleTrackMute, toggleTrackSolo,
    setTrackVolume, removeTrack, setMasterVolume, reorderTracks,
  } = useUnifiedStudioStore();

  // Dialog visibility states
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showMixerSheet, setShowMixerSheet] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showEffectsDrawer, setShowEffectsDrawer] = useState(false);
  const [selectedEffectsTrack, setSelectedEffectsTrack] = useState<StudioTrack | null>(null);
  const [trackEffects, setTrackEffects] = useState<TrackEffectsState>({});
  const [showAddVocalsDrawer, setShowAddVocalsDrawer] = useState(false);
  const [selectedVocalsTrack, setSelectedVocalsTrack] = useState<StudioTrack | null>(null);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [selectedExtendTrack, setSelectedExtendTrack] = useState<StudioTrack | null>(null);
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [selectedSectionTrack, setSelectedSectionTrack] = useState<StudioTrack | null>(null);
  const [showGenerateSheet, setShowGenerateSheet] = useState(false);
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);
  const [showSaveVersionDialog, setShowSaveVersionDialog] = useState(false);
  const [showNotationPanel, setShowNotationPanel] = useState(false);
  const [selectedNotationTrack, setSelectedNotationTrack] = useState<StudioTrack | null>(null);
  const [showTranscriptionPanel, setShowTranscriptionPanel] = useState(false);
  const [selectedTranscriptionTrack, setSelectedTranscriptionTrack] = useState<StudioTrack | null>(null);
  const [showArrangementDialog, setShowArrangementDialog] = useState(false);
  const [selectedArrangementTrack, setSelectedArrangementTrack] = useState<StudioTrack | null>(null);
  const [showInstrumentalResult, setShowInstrumentalResult] = useState(false);
  const [instrumentalResultData, setInstrumentalResultData] = useState<InstrumentalResultData | null>(null);
  const pendingGenerationContextRef = useRef<Map<string, { type: "replace_instrumental"; existingId?: string }>>(new Map());
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showStemSeparationDialog, setShowStemSeparationDialog] = useState(false);
  const { separate: separateStems, isSeparating } = useStemSeparation();
  const [showMusicLabSheet, setShowMusicLabSheet] = useState(false);
  const [showLyricsSheet, setShowLyricsSheet] = useState(false);
  const [showPresetsSheet, setShowPresetsSheet] = useState(false);
  const [showDashboardSheet, setShowDashboardSheet] = useState(false);

  const { selectedSection, selectedSectionIndex, selectSection, clearSelection } = useSectionEditorStore();

  // Convert store tracks to AudioTrack format for engine
  const audioTracks = useMemo((): AudioTrack[] => {
    if (!project) return [];
    const stemTypes = ["vocal", "instrumental", "drums", "bass", "other"];
    const readyTracks = project.tracks.filter((t) => t.status !== "pending" && t.status !== "failed");
    const stems = readyTracks.filter((t) => stemTypes.includes(t.type));
    const tracksToUse = stems.length > 0 ? stems : readyTracks;

    return tracksToUse.map((track) => {
      let audioUrl = track.audioUrl;
      if (!audioUrl && track.versions?.length) {
        const activeVersion = track.versions.find((v) => v.label === track.activeVersionLabel);
        audioUrl = activeVersion?.audioUrl || track.versions[0]?.audioUrl;
      }
      if (!audioUrl && track.clips?.[0]?.audioUrl) {
        audioUrl = track.clips[0].audioUrl;
      }
      return { id: track.id, audioUrl, volume: track.volume, muted: track.muted, solo: track.solo };
    });
  }, [project?.tracks]);

  // Convert tracks to TrackStem format for mobile fallback
  const tracksAsStems = useMemo((): TrackStem[] => {
    if (!project) return [];
    return project.tracks
      .filter((t) => t.status !== "pending" && t.status !== "failed")
      .map((track) => ({
        id: track.id, track_id: project.id, stem_type: track.type,
        audio_url: track.audioUrl || "", separation_mode: null, version_id: null,
        created_at: new Date().toISOString(),
      }));
  }, [project?.tracks, project?.id]);

  const { activeStems, limitedStems, isLimited: isMobileAudioLimited, showFallbackWarning, dismissWarning } =
    useMobileAudioFallback({ stems: tracksAsStems, enabled: isMobile });

  const autoSave = useAutoSave({
    enabled: !!project, debounceMs: 30000,
    onSaveComplete: (success) => { if (success) logger.info("Auto-save completed"); },
  });

  const studioOptimizations = useStudioOptimizations({
    stems: tracksAsStems, audioRefs: {}, onTimeUpdate: seek,
    onStemVolumeChange: (stemId, volume) => setTrackVolume(stemId, volume),
    onMasterVolumeChange: setMasterVolume, onSeek: seek,
  });

  const audioEngine = useStudioAudioEngine({
    tracks: audioTracks, masterVolume: project?.masterVolume ?? 0.85,
    onTimeUpdate: seek, onDurationChange: undefined,
    onEnded: () => { pause(); seek(0); },
  });

  const mainAudioUrl = project?.tracks[0]?.audioUrl || project?.tracks[0]?.clips?.[0]?.audioUrl;
  const duration = audioEngine.duration || project?.durationSeconds || 180;
  const sourceTrackId = project?.sourceTrackId;

  const { data: sourceTrack } = useQuery({
    queryKey: ["source-track-for-studio", sourceTrackId],
    queryFn: async () => {
      if (!sourceTrackId) return null;
      const { data } = await supabase.from("tracks").select("id, lyrics, suno_task_id, suno_id").eq("id", sourceTrackId).maybeSingle();
      return data;
    },
    enabled: !!sourceTrackId,
  });

  const { data: lyricsData } = useTimestampedLyrics(sourceTrack?.suno_task_id || null, sourceTrack?.suno_id || null);
  const detectedSections = useSectionDetection(sourceTrack?.lyrics, lyricsData?.alignedWords, duration);
  const { data: replacedSectionsData } = useReplacedSections(sourceTrackId || "");

  const replacedRanges = useMemo(() => {
    if (!replacedSectionsData) return [];
    return replacedSectionsData.map((s) => ({ start: s.start, end: s.end }));
  }, [replacedSectionsData]);

  const operationLock = useStudioOperationLock(project);
  useProjectTrackSync(project?.id || null, sourceTrackId);
  const hasStems = operationLock.hasStems;

  // Display tracks: filter duplicates, sort by type priority
  const displayTracks = useMemo(() => {
    if (!project?.tracks || project.tracks.length === 0) return [];
    const stemTypes = ["vocal", "instrumental", "drums", "bass", "other"];
    const stemsPresent = project.tracks.some((t) => stemTypes.includes(t.type));
    let filtered = project.tracks;
    if (stemsPresent && project.tracks.length > 1) {
      filtered = project.tracks.filter((t) => {
        if (stemTypes.includes(t.type)) return true;
        if (t.audioUrl === mainAudioUrl && mainAudioUrl) return false;
        return true;
      });
    }
    const priority: Record<string, number> = { vocal: 0, instrumental: 1, bass: 2, drums: 3, stem: 4, main: 5, sfx: 6, other: 99 };
    return [...filtered].sort((a, b) => (priority[a.type] ?? 50) - (priority[b.type] ?? 50));
  }, [project?.tracks, mainAudioUrl]);

  const handleSectionClick = useCallback((section: (typeof detectedSections)[0], index: number) => {
    selectSection(section, index);
    const mainTrack = project?.tracks[0];
    if (mainTrack) { setSelectedSectionTrack(mainTrack); setShowSectionEditor(true); }
  }, [selectSection, project?.tracks]);

  // Sync playback state with engine
  useEffect(() => {
    if (isPlaying && !audioEngine.isPlaying) audioEngine.play();
    else if (!isPlaying && audioEngine.isPlaying) audioEngine.pause();
  }, [isPlaying, audioEngine]);

  const handleSeek = useCallback((time: number) => { audioEngine.seek(time); seek(time); }, [audioEngine, seek]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) { audioEngine.pause(); pause(); }
    else { pauseGlobalPlayer(); pauseAllStudioAudio("studio-shell"); audioEngine.play(); play(); }
  }, [isPlaying, play, pause, audioEngine, pauseGlobalPlayer]);

  const isMountedRef = useRef(true);
  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  useEffect(() => {
    registerStudioAudio("studio-shell", () => { audioEngine.pause(); pause(); });
    return () => { unregisterStudioAudio("studio-shell"); };
  }, [audioEngine, pause]);

  useEffect(() => {
    if (!project) return;
    project.tracks.forEach((track) => { audioEngine.setTrackVolume(track.id, track.volume); });
  }, [project?.tracks, audioEngine]);

  const handleSave = useCallback(async () => {
    const success = await saveProject();
    toast[success ? "success" : "error"](success ? "Проект сохранён" : "Ошибка сохранения");
  }, [saveProject]);

  const handleExport = useCallback(() => { setShowExportDialog(true); }, []);

  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) { if (confirm("Есть несохранённые изменения. Выйти?")) navigate(-1); }
    else navigate(-1);
  }, [hasUnsavedChanges, navigate]);

  useTelegramBackButton({ visible: !!project, onClick: handleBack, fallbackPath: "/studio-v2" });

  const handleAddTrack = useCallback((type: TrackType, name: string) => {
    addTrack({ name, type, volume: 1, pan: 0, muted: false, solo: false, color: TRACK_COLORS[type] });
    setShowAddTrackDialog(false);
    toast.success(`Добавлена дорожка: ${name}`);
  }, [addTrack]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case "Space": e.preventDefault(); handlePlayPause(); break;
        case "KeyZ":
          if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.shiftKey ? redo() : undo(); } break;
        case "KeyM": if (project?.tracks[0]) toggleTrackMute(project.tracks[0].id); break;
        case "KeyS":
          if (!e.ctrlKey && !e.metaKey && project?.tracks[0]) toggleTrackSolo(project.tracks[0].id); break;
        case "Digit1":
          if (project?.tracks[0]?.versions?.[0]) setTrackActiveVersion(project.tracks[0].id, project.tracks[0].versions[0].label); break;
        case "Digit2":
          if (project?.tracks[0]?.versions?.[1]) setTrackActiveVersion(project.tracks[0].id, project.tracks[0].versions[1].label); break;
        case "ArrowLeft": e.preventDefault(); handleSeek(Math.max(0, currentTime - 5)); break;
        case "ArrowRight": e.preventDefault(); handleSeek(Math.min(duration, currentTime + 5)); break;
        case "Home": e.preventDefault(); handleSeek(0); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlayPause, undo, redo, project, toggleTrackMute, toggleTrackSolo, setTrackActiveVersion, handleSeek, currentTime, duration]);

  // Stem import from database
  const pendingTrackIds = useMemo(() => {
    if (!project) return new Set<string>();
    return new Set(project.tracks.filter((t) => t.status === "pending").map((t) => t.id));
  }, [project?.tracks]);

  const importedStemsForTrackRef = useRef<string | null>(null);

  const mapStemTypeToTrackType = useCallback((stemType: string): TrackType => {
    const t = stemType.toLowerCase();
    if (t === "vocals" || t === "vocal") return "vocal";
    if (t === "instrumental") return "instrumental";
    if (t === "drums") return "drums";
    if (t === "bass") return "bass";
    return "other";
  }, []);

  const mapStemTypeToLabel = useCallback((stemType: string): string => {
    const t = stemType.toLowerCase();
    if (t === "vocals" || t === "vocal") return "Вокал";
    if (t === "instrumental") return "Инструментал";
    if (t === "drums") return "Ударные";
    if (t === "bass") return "Бас";
    return "Другое";
  }, []);

  const addStemToProjectIfMissing = useCallback((stem: { stem_type: string; audio_url: string }) => {
    const currentProject = useUnifiedStudioStore.getState().project;
    if (!currentProject) return;
    const alreadyExists = currentProject.tracks.some((t) => (t.audioUrl || t.clips?.[0]?.audioUrl) === stem.audio_url);
    if (alreadyExists) return;
    const type = mapStemTypeToTrackType(stem.stem_type);
    const name = mapStemTypeToLabel(stem.stem_type);
    const newTrackId = addTrack({
      name, type, audioUrl: stem.audio_url, volume: 0.9, pan: 0,
      muted: false, solo: false, color: TRACK_COLORS[type] || TRACK_COLORS.other, status: "ready",
    });
    addClip(newTrackId, {
      audioUrl: stem.audio_url, name, startTime: 0,
      duration: currentProject.durationSeconds || 180, trimStart: 0, trimEnd: 0, fadeIn: 0, fadeOut: 0,
    });
  }, [addTrack, addClip, mapStemTypeToTrackType, mapStemTypeToLabel]);

  // Load stems from DB + realtime subscription
  useEffect(() => {
    const srcId = project?.sourceTrackId;
    if (!project?.id || !srcId) return;
    const abortController = new AbortController();
    if (importedStemsForTrackRef.current !== srcId) {
      importedStemsForTrackRef.current = srcId;
      (async () => {
        try {
          const { data, error } = await supabase.from("track_stems").select("stem_type,audio_url").eq("track_id", srcId).abortSignal(abortController.signal);
          if (error) { logger.warn("Failed to load track stems", { error }); return; }
          if (!isMountedRef.current) return;
          (data || []).filter((s) => s.audio_url).forEach((s) => addStemToProjectIfMissing(s));
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
          logger.error("Error loading track stems", err);
        }
      })();
    }
    const channel = supabase.channel(`studio-stems-${srcId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "track_stems", filter: `track_id=eq.${srcId}` }, (payload) => {
        if (!isMountedRef.current) return;
        const stem = payload.new as any;
        if (stem?.audio_url && stem?.stem_type) { addStemToProjectIfMissing(stem); toast.success("Стем добавлен в студию"); }
      }).subscribe();
    return () => { abortController.abort(); supabase.removeChannel(channel); };
  }, [project?.id, project?.sourceTrackId, addStemToProjectIfMissing]);

  // Realtime subscription for generation tasks
  useEffect(() => {
    if (!project?.id) return;
    const pendingTasks = project.tracks.filter((t) => t.status === "pending" && t.taskId).map((t) => ({ trackId: t.id, taskId: t.taskId! }));
    if (pendingTasks.length === 0) return;
    logger.info("Subscribing to pending tasks", { count: pendingTasks.length });
    const channels = pendingTasks.map(({ trackId, taskId }) => {
      return supabase.channel(`task-complete-${taskId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "generation_tasks", filter: `suno_task_id=eq.${taskId}` }, async (payload) => {
          if (!isMountedRef.current) return;
          const newData = payload.new as any;
          if (newData.status === "completed" && newData.audio_clips) {
            try {
              const clips = typeof newData.audio_clips === "string" ? JSON.parse(newData.audio_clips) : newData.audio_clips;
              if (Array.isArray(clips) && clips.length > 0) {
                const versions = clips.map((clip: any, idx: number) => ({ label: String.fromCharCode(65 + idx), audioUrl: clip.audio_url, duration: clip.duration_seconds || 180 }));
                const context = pendingGenerationContextRef.current.get(taskId);
                if (context?.type === "replace_instrumental") {
                  resolvePendingTrack(taskId, versions);
                  setInstrumentalResultData({ newTrackId: trackId, existingInstrumentalId: context.existingId, versions, trackName: "Новый инструментал" });
                  setShowInstrumentalResult(true);
                  pendingGenerationContextRef.current.delete(taskId);
                } else {
                  resolvePendingTrack(taskId, versions);
                  toast.success("Инструментал готов! 🎸", { description: versions.length > 1 ? "Выберите версию A или B" : "Трек добавлен" });
                }
              }
            } catch (err) { logger.error("Failed to parse audio clips", err); }
          } else if (newData.status === "failed") { toast.error("Ошибка генерации инструментала"); }
        }).subscribe();
    });
    const projectChannel = supabase.channel(`studio-project-${project.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "studio_projects", filter: `id=eq.${project.id}` }, async (payload) => {
        if (!isMountedRef.current) return;
        const newTracks = (payload.new as any)?.tracks as StudioTrack[] | undefined;
        if (newTracks) {
          const resolvedTracks = newTracks.filter((t) => t.status === "ready" && pendingTrackIds.has(t.id));
          if (resolvedTracks.length > 0) await loadProject(project.id);
        }
      }).subscribe();
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); supabase.removeChannel(projectChannel); };
  }, [project?.id, project?.tracks, loadProject, pendingTrackIds, resolvePendingTrack]);

  // Handle stem separation
  const handleStemSeparation = useCallback(async (mode: "simple" | "detailed") => {
    if (!sourceTrackId) { toast.error("Исходный трек не найден"); return; }
    const { data: trackData, error } = await supabase.from("tracks").select("id, title, audio_url, suno_id, suno_task_id").eq("id", sourceTrackId).maybeSingle();
    if (error || !trackData) { toast.error("Не удалось загрузить трек"); return; }
    if (!trackData.suno_id || !trackData.audio_url) { toast.error("Трек не поддерживает разделение на стемы"); return; }
    try { await separateStems(trackData as Track, mode); setShowStemSeparationDialog(false); }
    catch (err) { logger.error("Stem separation failed", err); }
  }, [sourceTrackId, separateStems]);

  // Handle track actions from mobile UI
  const handleMobileTrackAction = useCallback((trackId: string, action: string) => {
    const track = project?.tracks.find((t) => t.id === trackId);
    if (!track) return;
    switch (action) {
      case "download": if (track.audioUrl) window.open(track.audioUrl, "_blank"); break;
      case "effects": setSelectedEffectsTrack(track); setShowEffectsDrawer(true); break;
      case "reference": toast.info("Функция референса в разработке"); break;
      case "add_vocals": setSelectedVocalsTrack(track); setShowAddVocalsDrawer(true); break;
      case "extend": setSelectedExtendTrack(track); setShowExtendDialog(true); break;
      case "replace_section": setSelectedSectionTrack(track); setShowSectionEditor(true); break;
      case "transcribe": setSelectedTranscriptionTrack(track); setShowTranscriptionPanel(true); break;
      case "download_all": setShowDownloadPanel(true); break;
      case "replace_instrumental": {
        const vocalTrack = project.tracks.find((t) => t.type === "vocal");
        if (vocalTrack) { setSelectedArrangementTrack(vocalTrack); setShowArrangementDialog(true); }
        else toast.error("Вокальный трек не найден");
        break;
      }
      case "separate_stems": setShowStemSeparationDialog(true); break;
      case "view_notation": setSelectedNotationTrack(track); setShowNotationPanel(true); break;
      case "cover":
        if (track.audioUrl) navigate(`/create?mode=cover&audioUrl=${encodeURIComponent(track.audioUrl)}`);
        else toast.error("Нет аудио для референса");
        break;
    }
  }, [project?.tracks, navigate]);

  const hasSoloTracks = useMemo(() => project?.tracks?.some((t) => t.solo) ?? false, [project?.tracks]);

  // Loading & empty states
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <p className="text-muted-foreground">Нет открытого проекта</p>
        <Button onClick={() => navigate("/studio-v2")}>Открыть студию</Button>
      </div>
    );
  }

  const telegramSafeAreaTop = "calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)))";
  const telegramSafeAreaBottom = "calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))";

  return (
    <div
      className={cn("flex flex-col h-screen bg-background overflow-x-hidden", className)}
      style={{
        paddingTop: isMobile
          ? "calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.75rem, env(safe-area-inset-top, 0px) + 0.75rem))"
          : telegramSafeAreaTop,
        paddingBottom: isMobile
          ? "calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)) + 5.5rem)"
          : telegramSafeAreaBottom,
      }}
    >
      <StudioShellHeader
        projectName={project.name}
        trackCount={project.tracks.length}
        isMobile={isMobile}
        viewMode={viewMode}
        onViewModeChange={(v) => setViewMode(v)}
        canUndo={canUndo()}
        canRedo={canRedo()}
        onUndo={undo}
        onRedo={redo}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isOfflineCapable={studioOptimizations.isOfflineCapable}
        isOnline={studioOptimizations.isOnline}
        autoSaveStatus={autoSave.status}
        autoSaveLastSavedAt={autoSave.lastSavedAt}
        autoSaveTimeSinceLastSave={autoSave.timeSinceLastSave}
        onBack={handleBack}
        onSave={handleSave}
        onExport={handleExport}
        onGenerate={() => setShowGenerateSheet(true)}
        onMixerOpen={() => setShowMixerSheet(true)}
      />

      {/* Main Timeline with Sections */}
      <div className={cn("px-3 py-2 border-b border-border/30 bg-card/30", isMobile && "sticky top-12 z-30")}>
        <StudioWaveformTimeline
          audioUrl={mainAudioUrl || null}
          duration={duration}
          currentTime={audioEngine.isReady ? audioEngine.currentTime : currentTime}
          isPlaying={isPlaying}
          onSeek={handleSeek}
          height={isMobile ? 60 : 80}
          sections={detectedSections}
          selectedSectionIndex={selectedSectionIndex}
          replacedRanges={replacedRanges}
          onSectionClick={handleSectionClick}
        />
      </div>

      {/* Synchronized Lyrics Panel */}
      {sourceTrack && (
        <StudioLyricsPanelCompact
          taskId={sourceTrack.suno_task_id}
          audioId={sourceTrack.suno_id}
          plainLyrics={sourceTrack.lyrics}
          currentTime={audioEngine.isReady ? audioEngine.currentTime : currentTime}
          isPlaying={isPlaying}
          onSeek={handleSeek}
        />
      )}

      <MobileAudioWarning
        show={showFallbackWarning}
        activeCount={activeStems.length}
        limitedStems={limitedStems}
        onDismiss={dismissWarning}
      />

      {/* Transport Controls - desktop only */}
      {!isMobile && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-card/50 shrink-0 overflow-hidden">
          <OptimizedTransport
            isPlaying={isPlaying} currentTime={currentTime} duration={duration}
            onPlay={handlePlayPause} onPause={handlePlayPause}
            onStop={() => handleSeek(0)} onSeek={handleSeek} compact={true} className="shrink-0"
          />
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMasterVolume(project.masterVolume === 0 ? 0.85 : 0)}>
              {project.masterVolume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider value={[project.masterVolume]} max={1} step={0.01} onValueChange={(v) => setMasterVolume(v[0])} className="w-20" />
            <span className="text-xs font-mono text-muted-foreground w-6">{Math.round(project.masterVolume * 100)}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowImportDialog(true)} className="h-8 w-8 shrink-0" title="Импорт аудио">
            <Upload className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddTrackDialog(true)} className="h-8 px-3 shrink-0">
            <Plus className="h-4 w-4" /><span className="ml-1">Дорожка</span>
          </Button>
        </div>
      )}

      {/* Track List */}
      <ScrollArea className="flex-1">
        <div className={cn("p-3 space-y-2", isMobile && "pb-4")}>
          <SortableTrackList
            tracks={displayTracks} isPlaying={isPlaying}
            currentTime={audioEngine.isReady ? audioEngine.currentTime : currentTime}
            duration={duration} hasSoloTracks={hasSoloTracks} sourceTrackId={sourceTrackId}
            stemsExist={hasStems} onReorder={reorderTracks} onToggleMute={toggleTrackMute}
            onToggleSolo={toggleTrackSolo} onVolumeChange={setTrackVolume} onSeek={handleSeek}
            onRemove={removeTrack} onVersionChange={setTrackActiveVersion} onAction={handleMobileTrackAction}
          />
          {project.tracks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Нет дорожек в проекте</p>
              <Button onClick={() => setShowAddTrackDialog(true)}><Plus className="h-4 w-4 mr-2" />Добавить дорожку</Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* AI Actions FAB - Mobile */}
      {isMobile && project.tracks.length > 0 && (
        <AIActionsFAB
          onGenerate={() => setShowGenerateSheet(true)}
          onExtend={() => { const t = project.tracks[0]; if (t) { setSelectedExtendTrack(t); setShowExtendDialog(true); } }}
          onCover={() => { const t = project.tracks[0]; if (t?.audioUrl) navigate(`/create?mode=cover&audioUrl=${encodeURIComponent(t.audioUrl)}`); }}
          onAddVocals={() => {
            const inst = project.tracks.find((t) => t.type === "instrumental");
            if (inst) { setSelectedVocalsTrack(inst); setShowAddVocalsDrawer(true); }
            else toast.info("Сначала разделите трек на стемы");
          }}
          onSeparateStems={() => setShowStemSeparationDialog(true)}
          onSaveAsVersion={() => setShowSaveVersionDialog(true)}
          onAddInstrumental={() => {
            const vocal = project.tracks.find((t) => t.type === "vocal");
            if (vocal) { setSelectedArrangementTrack(vocal); setShowArrangementDialog(true); }
          }}
          onOpenMusicLab={() => setShowMusicLabSheet(true)}
          onOpenLyrics={() => setShowLyricsSheet(true)}
          onOpenPresets={() => setShowPresetsSheet(true)}
          onOpenDashboard={() => setShowDashboardSheet(true)}
          disabledOperations={operationLock.blockedOperations}
          getDisabledReason={operationLock.getBlockReason}
          canSaveAsNewVersion={operationLock.canSaveAsNewVersion}
          disabled={isSeparating}
          className="fixed bottom-28 right-4 z-40"
        />
      )}

      {/* Mobile Player Bar */}
      {isMobile && (
        <MobileStudioPlayerBar
          isPlaying={isPlaying} currentTime={currentTime} duration={duration}
          masterVolume={project.masterVolume} onPlayPause={handlePlayPause}
          onSkipBack={() => handleSeek(0)} onSkipForward={() => handleSeek(duration)}
          onSeek={handleSeek} onMasterMuteToggle={() => setMasterVolume(project.masterVolume === 0 ? 0.85 : 0)}
          onOpenActions={() => setShowActionsSheet(true)}
        />
      )}

      {/* All Dialogs & Sheets */}
      <StudioShellDialogs
        isMobile={isMobile}
        project={project}
        sourceTrackId={sourceTrackId}
        sourceTrack={sourceTrack}
        duration={duration}
        currentTime={currentTime}
        isPlaying={isPlaying}
        audioTracks={audioTracks}
        detectedSections={detectedSections}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        isSeparating={isSeparating}
        operationLock={operationLock}
        showActionsSheet={showActionsSheet} setShowActionsSheet={setShowActionsSheet}
        showPresetsSheet={showPresetsSheet} setShowPresetsSheet={setShowPresetsSheet}
        showDashboardSheet={showDashboardSheet} setShowDashboardSheet={setShowDashboardSheet}
        showMixerSheet={showMixerSheet} setShowMixerSheet={setShowMixerSheet}
        showMusicLabSheet={showMusicLabSheet} setShowMusicLabSheet={setShowMusicLabSheet}
        showLyricsSheet={showLyricsSheet} setShowLyricsSheet={setShowLyricsSheet}
        showAddTrackDialog={showAddTrackDialog} setShowAddTrackDialog={setShowAddTrackDialog}
        showImportDialog={showImportDialog} setShowImportDialog={setShowImportDialog}
        showExportDialog={showExportDialog} setShowExportDialog={setShowExportDialog}
        showEffectsDrawer={showEffectsDrawer} setShowEffectsDrawer={setShowEffectsDrawer}
        showAddVocalsDrawer={showAddVocalsDrawer} setShowAddVocalsDrawer={setShowAddVocalsDrawer}
        showExtendDialog={showExtendDialog} setShowExtendDialog={setShowExtendDialog}
        showSectionEditor={showSectionEditor} setShowSectionEditor={setShowSectionEditor}
        showGenerateSheet={showGenerateSheet} setShowGenerateSheet={setShowGenerateSheet}
        showDownloadPanel={showDownloadPanel} setShowDownloadPanel={setShowDownloadPanel}
        showSaveVersionDialog={showSaveVersionDialog} setShowSaveVersionDialog={setShowSaveVersionDialog}
        showNotationPanel={showNotationPanel} setShowNotationPanel={setShowNotationPanel}
        showTranscriptionPanel={showTranscriptionPanel} setShowTranscriptionPanel={setShowTranscriptionPanel}
        showArrangementDialog={showArrangementDialog} setShowArrangementDialog={setShowArrangementDialog}
        showInstrumentalResult={showInstrumentalResult} setShowInstrumentalResult={setShowInstrumentalResult}
        showStemSeparationDialog={showStemSeparationDialog} setShowStemSeparationDialog={setShowStemSeparationDialog}
        selectedEffectsTrack={selectedEffectsTrack} setSelectedEffectsTrack={setSelectedEffectsTrack}
        selectedVocalsTrack={selectedVocalsTrack} setSelectedVocalsTrack={setSelectedVocalsTrack}
        selectedExtendTrack={selectedExtendTrack} setSelectedExtendTrack={setSelectedExtendTrack}
        selectedSectionTrack={selectedSectionTrack} setSelectedSectionTrack={setSelectedSectionTrack}
        selectedNotationTrack={selectedNotationTrack} setSelectedNotationTrack={setSelectedNotationTrack}
        selectedTranscriptionTrack={selectedTranscriptionTrack} setSelectedTranscriptionTrack={setSelectedTranscriptionTrack}
        selectedArrangementTrack={selectedArrangementTrack} setSelectedArrangementTrack={setSelectedArrangementTrack}
        instrumentalResultData={instrumentalResultData} setInstrumentalResultData={setInstrumentalResultData}
        trackEffects={trackEffects} setTrackEffects={setTrackEffects}
        onSave={handleSave}
        onExport={handleExport}
        onBack={handleBack}
        onAddTrack={handleAddTrack}
        onStemSeparation={handleStemSeparation}
        onSeek={handleSeek}
        pendingGenerationContextRef={pendingGenerationContextRef}
      />
    </div>
  );
});
