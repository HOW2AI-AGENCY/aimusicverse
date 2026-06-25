/**
 * Studio Shell
 * Main layout wrapper for the unified studio with full audio integration
 * Supports both desktop and mobile layouts
 *
 * **Tab System (Mobile):**
 * - **Tracks Tab (Дорожки):** Displays the multi-track timeline with sortable track list
 * - **Lyrics Tab (Текст):** Opens the LyricsPanel for editing, version history, and AI assistance
 *
 * **Tab System (Desktop):**
 * - **Timeline (Дорожки):** Timeline view with track waveforms
 * - **Mixer (Микшер):** Mixing console with volume/pan controls
 *
 * @example
 * ```tsx
 * <StudioShell />
 * ```
 *
 * @see src/components/studio/unified/LyricsPanel.tsx for lyrics editing functionality
 * @see src/components/studio/unified/SortableTrackList.tsx for track list component
 * @see src/stores/useUnifiedStudioStore.ts for studio state management
 */

import { memo, useState, useCallback, useEffect, useMemo, useRef, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "@/lib/motion";
import { useUnifiedStudioStore, ViewMode, TrackType, TRACK_COLORS, StudioTrack } from "@/stores/useUnifiedStudioStore";
import { OptimizedTransport } from "./OptimizedTransport";
import { SortableTrackList } from "./SortableTrackList";
import { StudioLyricsPanelCompact } from "@/components/stem-studio/StudioLyricsPanelCompact";
import { StudioWaveformTimeline } from "./StudioWaveformTimeline";
import { StudioMixerPanel } from "./StudioMixerPanel";
import { ExportMixDialog } from "./ExportMixDialog";
import { StemEffectsDrawer } from "./StemEffectsDrawer";
import { MobileAudioWarning } from "@/components/studio/MobileAudioWarning";
import { MobileStudioPlayerBar } from "./MobileStudioPlayerBar";
import { StudioActionsSheet } from "./StudioActionsSheet";
import { useStudioAudioEngine, AudioTrack } from "@/hooks/studio/useStudioAudioEngine";
import { useMobileAudioFallback } from "@/hooks/studio/useMobileAudioFallback";
import { useStudioOptimizations } from "@/hooks/studio/useStudioOptimizations";
import { useAutoSave } from "@/hooks/studio/useAutoSave";
import { registerStudioAudio, unregisterStudioAudio, pauseAllStudioAudio } from "@/hooks/studio/useStudioAudio";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { LazyAddVocalsDrawer, LazyGenerateSheet } from "@/components/lazy";
import { ExtendTrackDialog } from "@/components/ExtendTrackDialog";
import { SectionEditorSheet } from "@/components/studio/editor/SectionEditorSheet";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { LyricsPanel } from "./LyricsPanel";
import { StudioLyricsSheet } from "./StudioLyricsSheet";
import { StudioMusicLabSheet } from "./StudioMusicLabSheet";
import { StudioPresetsSheet } from "./StudioPresetsSheet";
import { StudioDashboardSheet } from "./StudioDashboardSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Save,
  Download,
  Undo2,
  Redo2,
  LayoutGrid,
  Rows3,
  Sliders,
  Plus,
  Loader2,
  Upload,
  Cloud,
  CloudOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Mic2,
  Sparkles,
  FileText,
  FlaskConical,
} from "@/lib/icons";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { formatTime } from "@/lib/formatters";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { ImportAudioDialog } from "./ImportAudioDialog";
import type { StemEffects, EQSettings, CompressorSettings, ReverbSettings } from "@/hooks/studio/types";
import { defaultStemEffects } from "@/hooks/studio/stemEffectsConfig";
import type { TrackStem } from "@/hooks/useTrackStems";
import type { Track } from "@/types/track";
import { useSectionDetection } from "@/hooks/useSectionDetection";
import { useTimestampedLyrics } from "@/hooks/useTimestampedLyrics";
import { useReplacedSections } from "@/hooks/useReplacedSections";
import { useSectionEditorStore } from "@/stores/useSectionEditorStore";
import { StudioDownloadPanel } from "./StudioDownloadPanel";
import { StudioTranscriptionPanel } from "./StudioTranscriptionPanel";
import { StudioNotationPanel } from "./StudioNotationPanel";
import { SaveVersionDialog } from "./SaveVersionDialog";
import { StudioArrangementDialog } from "./StudioArrangementDialog";
import { useTelegramBackButton } from "@/hooks/telegram/useTelegramBackButton";
import { useProjectTrackSync } from "@/hooks/studio/useProjectTrackSync";
import { useStudioOperationLock } from "@/hooks/studio/useStudioOperationLock";
import { InstrumentalResultHandler, InstrumentalResultData } from "./InstrumentalResultHandler";
import { AIActionsFAB } from "./AIActionsFAB";
import { StemSeparationModeDialog } from "./StemSeparationModeDialog";
import { useStemSeparation } from "@/hooks/useStemSeparation";

interface StudioShellProps {
  className?: string;
}

// Track effects state (stored per track)
interface TrackEffectsState {
  [trackId: string]: StemEffects;
}

export const StudioShell = memo(function StudioShell({ className }: StudioShellProps) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { pauseTrack: pauseGlobalPlayer } = usePlayerStore();

  const {
    project,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    isPlaying,
    currentTime,
    viewMode,
    setViewMode,
    saveProject,
    canUndo,
    canRedo,
    undo,
    redo,
    addTrack,
    addClip,
    addPendingTrack,
    resolvePendingTrack,
    setTrackActiveVersion,
    loadProject,
    play,
    pause,
    stop,
    seek,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackVolume,
    removeTrack,
    setMasterVolume,
    reorderTracks,
  } = useUnifiedStudioStore();

  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showMixerSheet, setShowMixerSheet] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showEffectsDrawer, setShowEffectsDrawer] = useState(false);
  const [selectedEffectsTrack, setSelectedEffectsTrack] = useState<StudioTrack | null>(null);
  const [trackEffects, setTrackEffects] = useState<TrackEffectsState>({});

  // Add Vocals state
  const [showAddVocalsDrawer, setShowAddVocalsDrawer] = useState(false);
  const [selectedVocalsTrack, setSelectedVocalsTrack] = useState<StudioTrack | null>(null);

  // Extend Track state
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [selectedExtendTrack, setSelectedExtendTrack] = useState<StudioTrack | null>(null);

  // Section Editor state
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [selectedSectionTrack, setSelectedSectionTrack] = useState<StudioTrack | null>(null);

  // Generate Sheet state
  const [showGenerateSheet, setShowGenerateSheet] = useState(false);

  // Download panel state
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);

  // Save Version Dialog state
  const [showSaveVersionDialog, setShowSaveVersionDialog] = useState(false);

  // Notation panel state (shows MusicXML/notation view)
  const [showNotationPanel, setShowNotationPanel] = useState(false);
  const [selectedNotationTrack, setSelectedNotationTrack] = useState<StudioTrack | null>(null);

  // Transcription panel state
  const [showTranscriptionPanel, setShowTranscriptionPanel] = useState(false);
  const [selectedTranscriptionTrack, setSelectedTranscriptionTrack] = useState<StudioTrack | null>(null);

  // Arrangement replacement state (replace instrumental using vocal stem)
  const [showArrangementDialog, setShowArrangementDialog] = useState(false);
  const [selectedArrangementTrack, setSelectedArrangementTrack] = useState<StudioTrack | null>(null);

  // Instrumental result handler state - for choosing action after generation
  const [showInstrumentalResult, setShowInstrumentalResult] = useState(false);
  const [instrumentalResultData, setInstrumentalResultData] = useState<InstrumentalResultData | null>(null);

  // Track generation context - which instrumental we're replacing
  const pendingGenerationContextRef = useRef<Map<string, { type: "replace_instrumental"; existingId?: string }>>(
    new Map(),
  );

  // Actions sheet state (mobile)
  const [showActionsSheet, setShowActionsSheet] = useState(false);

  // Stem separation state
  const [showStemSeparationDialog, setShowStemSeparationDialog] = useState(false);
  const { separate: separateStems, isSeparating } = useStemSeparation();
  // MusicLab sheet state (opens as overlay, not tab)
  const [showMusicLabSheet, setShowMusicLabSheet] = useState(false);

  // Lyrics sheet state (opens as overlay, not tab)
  const [showLyricsSheet, setShowLyricsSheet] = useState(false);

  // Presets sheet state (Sprint 031 US3 - opens as overlay)
  const [showPresetsSheet, setShowPresetsSheet] = useState(false);

  // Dashboard sheet state (Sprint 031 US3 - studio statistics overlay)
  const [showDashboardSheet, setShowDashboardSheet] = useState(false);

  // Section editor store
  const { selectedSection, selectedSectionIndex, selectSection, clearSelection } = useSectionEditorStore();
  // Convert store tracks to AudioTrack format for engine
  // IMPORTANT: When stems exist, use ONLY stems for playback (exclude main track)
  const audioTracks = useMemo((): AudioTrack[] => {
    if (!project) return [];

    const stemTypes = ["vocal", "instrumental", "drums", "bass", "other"];
    const readyTracks = project.tracks.filter((t) => t.status !== "pending" && t.status !== "failed");
    const stems = readyTracks.filter((t) => stemTypes.includes(t.type));

    // If stems exist, playback ONLY stems (exclude main track)
    const tracksToUse = stems.length > 0 ? stems : readyTracks;

    return tracksToUse.map((track) => {
      // Get audio URL from track or active version
      let audioUrl = track.audioUrl;
      if (!audioUrl && track.versions?.length) {
        const activeVersion = track.versions.find((v) => v.label === track.activeVersionLabel);
        audioUrl = activeVersion?.audioUrl || track.versions[0]?.audioUrl;
      }
      if (!audioUrl && track.clips?.[0]?.audioUrl) {
        audioUrl = track.clips[0].audioUrl;
      }

      return {
        id: track.id,
        audioUrl,
        volume: track.volume,
        muted: track.muted,
        solo: track.solo,
      };
    });
  }, [project?.tracks]);

  // Convert tracks to TrackStem format for mobile fallback detection
  const tracksAsStems = useMemo((): TrackStem[] => {
    if (!project) return [];
    return project.tracks
      .filter((t) => t.status !== "pending" && t.status !== "failed")
      .map((track) => ({
        id: track.id,
        track_id: project.id,
        stem_type: track.type,
        audio_url: track.audioUrl || "",
        separation_mode: null,
        version_id: null,
        created_at: new Date().toISOString(),
      }));
  }, [project?.tracks, project?.id]);

  // Mobile audio fallback handling
  const {
    activeStems,
    limitedStems,
    isLimited: isMobileAudioLimited,
    showFallbackWarning,
    dismissWarning,
    capabilities,
  } = useMobileAudioFallback({
    stems: tracksAsStems,
    enabled: isMobile,
  });

  // Auto-save hook
  const autoSave = useAutoSave({
    enabled: !!project,
    debounceMs: 30000, // 30 seconds
    onSaveComplete: (success) => {
      if (success) {
        logger.info("Auto-save completed");
      }
    },
  });

  // Studio optimizations (caching, offline support, debounced controls)
  const studioOptimizations = useStudioOptimizations({
    stems: tracksAsStems,
    audioRefs: {}, // Will be populated by audio engine
    onTimeUpdate: seek,
    onStemVolumeChange: (stemId, volume) => setTrackVolume(stemId, volume),
    onMasterVolumeChange: setMasterVolume,
    onSeek: seek,
  });

  // Multi-track audio engine
  const audioEngine = useStudioAudioEngine({
    tracks: audioTracks,
    masterVolume: project?.masterVolume ?? 0.85,
    onTimeUpdate: seek,
    onDurationChange: undefined,
    onEnded: () => {
      pause();
      seek(0);
    },
  });

  // Get main audio URL for waveform visualization
  const mainAudioUrl = project?.tracks[0]?.audioUrl || project?.tracks[0]?.clips?.[0]?.audioUrl;
  const duration = audioEngine.duration || project?.durationSeconds || 180;
  const sourceTrackId = project?.sourceTrackId;

  // Fetch source track for section detection
  const { data: sourceTrack } = useQuery({
    queryKey: ["source-track-for-studio", sourceTrackId],
    queryFn: async () => {
      if (!sourceTrackId) return null;
      const { data } = await supabase
        .from("tracks")
        .select("id, lyrics, suno_task_id, suno_id")
        .eq("id", sourceTrackId)
        .maybeSingle();
      return data;
    },
    enabled: !!sourceTrackId,
  });

  // Get timestamped lyrics for section detection
  const { data: lyricsData } = useTimestampedLyrics(sourceTrack?.suno_task_id || null, sourceTrack?.suno_id || null);

  // Detect sections from lyrics
  const detectedSections = useSectionDetection(sourceTrack?.lyrics, lyricsData?.alignedWords, duration);

  // Get replaced sections
  const { data: replacedSectionsData } = useReplacedSections(sourceTrackId || "");

  // Map replaced sections to ranges
  const replacedRanges = useMemo(() => {
    if (!replacedSectionsData) return [];
    return replacedSectionsData.map((s) => ({
      start: s.start,
      end: s.end,
    }));
  }, [replacedSectionsData]);

  // Operation lock hook - prevents conflicting operations
  const operationLock = useStudioOperationLock(project);

  // Project track sync - realtime version updates
  useProjectTrackSync(project?.id || null, sourceTrackId);

  // Check if stems exist (used to disable extend/replace) - use operationLock
  const hasStems = operationLock.hasStems;

  // Filter tracks to avoid duplicating main track when stems exist + sort vocals first
  const displayTracks = useMemo(() => {
    if (!project?.tracks || project.tracks.length === 0) return [];

    // Check if we have stems (vocal, instrumental, drums, bass)
    const stemTypes = ["vocal", "instrumental", "drums", "bass", "other"];
    const stemsPresent = project.tracks.some((t) => stemTypes.includes(t.type));

    let filtered = project.tracks;

    if (stemsPresent && project.tracks.length > 1) {
      // Filter out main/source track if it's already shown on the main timeline
      filtered = project.tracks.filter((t) => {
        // Keep if it's a stem type
        if (stemTypes.includes(t.type)) return true;
        // Filter out track with same audio as main timeline (first track)
        if (t.audioUrl === mainAudioUrl && mainAudioUrl) return false;
        return true;
      });
    }

    // Sort: vocals always first, then by type priority
    const priority: Record<string, number> = {
      vocal: 0,
      instrumental: 1,
      bass: 2,
      drums: 3,
      stem: 4,
      main: 5,
      sfx: 6,
      other: 99,
    };

    return [...filtered].sort((a, b) => {
      const pA = priority[a.type] ?? 50;
      const pB = priority[b.type] ?? 50;
      return pA - pB;
    });
  }, [project?.tracks, mainAudioUrl]);

  // Handle section click on timeline
  const handleSectionClick = useCallback(
    (section: (typeof detectedSections)[0], index: number) => {
      selectSection(section, index);
      const mainTrack = project?.tracks[0];
      if (mainTrack) {
        setSelectedSectionTrack(mainTrack);
        setShowSectionEditor(true);
      }
    },
    [selectSection, project?.tracks],
  );

  // Sync playback state with store
  useEffect(() => {
    if (isPlaying && !audioEngine.isPlaying) {
      audioEngine.play();
    } else if (!isPlaying && audioEngine.isPlaying) {
      audioEngine.pause();
    }
  }, [isPlaying, audioEngine]);

  // Sync seek with audio engine
  const handleSeek = useCallback(
    (time: number) => {
      audioEngine.seek(time);
      seek(time);
    },
    [audioEngine, seek],
  );

  // Handle play/pause with global audio coordination
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      pause();
    } else {
      // Pause global player and other studio sources before playing
      pauseGlobalPlayer();
      pauseAllStudioAudio("studio-shell");
      audioEngine.play();
      play();
    }
  }, [isPlaying, play, pause, audioEngine, pauseGlobalPlayer]);

  // Track component mount state for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Register studio audio for global coordination
  useEffect(() => {
    registerStudioAudio("studio-shell", () => {
      audioEngine.pause();
      pause();
    });
    return () => {
      unregisterStudioAudio("studio-shell");
    };
  }, [audioEngine, pause]);

  // Update track volumes in engine when they change
  useEffect(() => {
    if (!project) return;
    project.tracks.forEach((track) => {
      audioEngine.setTrackVolume(track.id, track.volume);
    });
  }, [project?.tracks, audioEngine]);

  // Handle save
  const handleSave = useCallback(async () => {
    const success = await saveProject();
    if (success) {
      toast.success("Проект сохранён");
    } else {
      toast.error("Ошибка сохранения");
    }
  }, [saveProject]);

  // Handle export
  const handleExport = useCallback(() => {
    setShowExportDialog(true);
  }, []);

  // Handle back
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm("Есть несохранённые изменения. Выйти?")) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, [hasUnsavedChanges, navigate]);

  // Telegram back button integration
  const { shouldShowUIButton } = useTelegramBackButton({
    visible: !!project,
    onClick: handleBack,
    fallbackPath: "/studio-v2",
  });

  // Handle add track
  const handleAddTrack = useCallback(
    (type: TrackType, name: string) => {
      addTrack({
        name,
        type,
        volume: 1,
        pan: 0,
        muted: false,
        solo: false,
        color: TRACK_COLORS[type],
      });
      setShowAddTrackDialog(false);
      toast.success(`Добавлена дорожка: ${name}`);
    },
    [addTrack],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handlePlayPause();
          break;
        case "KeyZ":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        // Mute selected track
        case "KeyM":
          if (project?.tracks[0]) {
            toggleTrackMute(project.tracks[0].id);
          }
          break;
        // Solo selected track
        case "KeyS":
          if (!e.ctrlKey && !e.metaKey && project?.tracks[0]) {
            toggleTrackSolo(project.tracks[0].id);
          }
          break;
        // Version switching: 1 for A, 2 for B
        case "Digit1":
          if (project?.tracks[0]?.versions?.length) {
            const trackId = project.tracks[0].id;
            const versionA = project.tracks[0].versions[0];
            if (versionA) {
              setTrackActiveVersion(trackId, versionA.label);
            }
          }
          break;
        case "Digit2":
          if (project?.tracks[0]?.versions?.length && project.tracks[0].versions.length > 1) {
            const trackId = project.tracks[0].id;
            const versionB = project.tracks[0].versions[1];
            if (versionB) {
              setTrackActiveVersion(trackId, versionB.label);
            }
          }
          break;
        // Seek shortcuts
        case "ArrowLeft":
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeek(Math.min(duration, currentTime + 5));
          break;
        case "Home":
          e.preventDefault();
          handleSeek(0);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handlePlayPause,
    undo,
    redo,
    project,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackActiveVersion,
    handleSeek,
    currentTime,
    duration,
  ]);

  // Track pending track IDs to detect when they become ready
  const pendingTrackIds = useMemo(() => {
    if (!project) return new Set<string>();
    return new Set(project.tracks.filter((t) => t.status === "pending").map((t) => t.id));
  }, [project?.tracks]);

  // Load separated stems from database into the project (DAW) tracks
  const importedStemsForTrackRef = useRef<string | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

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

  const addStemToProjectIfMissing = useCallback(
    (stem: { stem_type: string; audio_url: string }) => {
      const currentProject = useUnifiedStudioStore.getState().project;
      if (!currentProject) return;

      const alreadyExists = currentProject.tracks.some(
        (t) => (t.audioUrl || t.clips?.[0]?.audioUrl) === stem.audio_url,
      );
      if (alreadyExists) return;

      const type = mapStemTypeToTrackType(stem.stem_type);
      const name = mapStemTypeToLabel(stem.stem_type);

      const newTrackId = addTrack({
        name,
        type,
        audioUrl: stem.audio_url,
        volume: 0.9,
        pan: 0,
        muted: false,
        solo: false,
        color: TRACK_COLORS[type] || TRACK_COLORS.other,
        status: "ready",
      });

      addClip(newTrackId, {
        audioUrl: stem.audio_url,
        name,
        startTime: 0,
        duration: currentProject.durationSeconds || 180,
        trimStart: 0,
        trimEnd: 0,
        fadeIn: 0,
        fadeOut: 0,
      });
    },
    [addTrack, addClip, mapStemTypeToTrackType, mapStemTypeToLabel],
  );

  useEffect(() => {
    const sourceTrackId = project?.sourceTrackId;
    if (!project?.id || !sourceTrackId) return;

    const abortController = new AbortController();

    // (Re)import once per source track id, and also listen for new stems
    if (importedStemsForTrackRef.current !== sourceTrackId) {
      importedStemsForTrackRef.current = sourceTrackId;

      (async () => {
        try {
          const { data, error } = await supabase
            .from("track_stems")
            .select("stem_type,audio_url")
            .eq("track_id", sourceTrackId)
            .abortSignal(abortController.signal);

          if (error) {
            logger.warn("Failed to load track stems for studio project", { error });
            return;
          }

          if (!isMountedRef.current) return;

          const stems = (data || []).filter((s) => s.audio_url);
          stems.forEach((s) => addStemToProjectIfMissing(s));
        } catch (err) {
          // Ignore abort errors
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }
          logger.error("Error loading track stems", err);
        }
      })();
    }

    const channel = supabase
      .channel(`studio-stems-${sourceTrackId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "track_stems",
          filter: `track_id=eq.${sourceTrackId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;

          const stem = payload.new as any;
          if (stem?.audio_url && stem?.stem_type) {
            addStemToProjectIfMissing(stem);
            toast.success("Стем добавлен в студию");
          }
        },
      )
      .subscribe();

    return () => {
      abortController.abort();
      supabase.removeChannel(channel);
    };
  }, [project?.id, project?.sourceTrackId, addStemToProjectIfMissing]);

  // Realtime subscription for generation tasks (when instrumental generation completes)
  useEffect(() => {
    if (!project?.id) return;

    // Get all pending task IDs
    const pendingTasks = project.tracks
      .filter((t) => t.status === "pending" && t.taskId)
      .map((t) => ({ trackId: t.id, taskId: t.taskId! }));

    if (pendingTasks.length === 0) return;

    logger.info("Subscribing to pending tasks", { count: pendingTasks.length });

    // Subscribe to generation_tasks table for each pending task
    const channels = pendingTasks.map(({ trackId, taskId }) => {
      return supabase
        .channel(`task-complete-${taskId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "generation_tasks",
            filter: `suno_task_id=eq.${taskId}`,
          },
          async (payload) => {
            if (!isMountedRef.current) return;

            const newData = payload.new as any;
            logger.info("Task update received in StudioShell", {
              taskId,
              status: newData.status,
              clips: newData.audio_clips,
            });

            if (newData.status === "completed" && newData.audio_clips) {
              // Parse audio clips and resolve the pending track
              try {
                const clips =
                  typeof newData.audio_clips === "string" ? JSON.parse(newData.audio_clips) : newData.audio_clips;

                if (Array.isArray(clips) && clips.length > 0) {
                  const versions = clips.map((clip: any, idx: number) => ({
                    label: String.fromCharCode(65 + idx), // A, B, C...
                    audioUrl: clip.audio_url,
                    duration: clip.duration_seconds || 180,
                  }));

                  // Check if this is a replace_instrumental context
                  const context = pendingGenerationContextRef.current.get(taskId);

                  if (context?.type === "replace_instrumental") {
                    // Show result handler dialog instead of auto-adding
                    resolvePendingTrack(taskId, versions);
                    setInstrumentalResultData({
                      newTrackId: trackId,
                      existingInstrumentalId: context.existingId,
                      versions,
                      trackName: "Новый инструментал",
                    });
                    setShowInstrumentalResult(true);
                    pendingGenerationContextRef.current.delete(taskId);
                  } else {
                    // Standard flow - just resolve
                    resolvePendingTrack(taskId, versions);
                    toast.success("Инструментал готов! 🎸", {
                      description: versions.length > 1 ? "Выберите версию A или B" : "Трек добавлен",
                    });
                  }
                }
              } catch (err) {
                logger.error("Failed to parse audio clips", err);
              }
            } else if (newData.status === "failed") {
              toast.error("Ошибка генерации инструментала");
            }
          },
        )
        .subscribe();
    });

    // Also subscribe to studio_projects for full project updates
    const projectChannel = supabase
      .channel(`studio-project-${project.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "studio_projects",
          filter: `id=eq.${project.id}`,
        },
        async (payload) => {
          if (!isMountedRef.current) return;

          logger.info("Studio project updated via realtime", { projectId: project.id });

          // Check if any pending track became ready
          const newTracks = (payload.new as any)?.tracks as StudioTrack[] | undefined;
          if (newTracks) {
            const resolvedTracks = newTracks.filter((t) => t.status === "ready" && pendingTrackIds.has(t.id));

            if (resolvedTracks.length > 0) {
              // Reload project to get updated tracks
              await loadProject(project.id);
            }
          }
        },
      )
      .subscribe();

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
      supabase.removeChannel(projectChannel);
    };
  }, [project?.id, project?.tracks, loadProject, pendingTrackIds, resolvePendingTrack]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
        <p className="text-muted-foreground">Нет открытого проекта</p>
        <Button onClick={() => navigate("/studio-v2")}>Открыть студию</Button>
      </div>
    );
  }

  // Calculate Telegram safe area padding
  const telegramSafeAreaTop =
    "calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)))";
  const telegramSafeAreaBottom = "calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))";

  // Check if any track has solo enabled (for effective mute calculation)
  const hasSoloTracks = useMemo(() => {
    return project?.tracks?.some((t) => t.solo) ?? false;
  }, [project?.tracks]);

  // Handle stem separation request
  const handleStemSeparation = useCallback(
    async (mode: "simple" | "detailed") => {
      if (!sourceTrackId) {
        toast.error("Исходный трек не найден");
        return;
      }

      // Get source track data from database
      const { data: trackData, error } = await supabase
        .from("tracks")
        .select("id, title, audio_url, suno_id, suno_task_id")
        .eq("id", sourceTrackId)
        .maybeSingle();

      if (error || !trackData) {
        toast.error("Не удалось загрузить трек");
        return;
      }

      if (!trackData.suno_id || !trackData.audio_url) {
        toast.error("Трек не поддерживает разделение на стемы");
        return;
      }

      try {
        await separateStems(trackData as Track, mode);
        setShowStemSeparationDialog(false);
      } catch (err) {
        logger.error("Stem separation failed", err);
      }
    },
    [sourceTrackId, separateStems],
  );

  // Handle track actions from mobile UI
  const handleMobileTrackAction = useCallback(
    (trackId: string, action: string) => {
      const track = project.tracks.find((t) => t.id === trackId);
      if (!track) return;

      if (action === "download" && track.audioUrl) {
        window.open(track.audioUrl, "_blank");
      } else if (action === "effects") {
        setSelectedEffectsTrack(track);
        setShowEffectsDrawer(true);
      } else if (action === "reference") {
        toast.info("Функция референса в разработке");
      } else if (action === "add_vocals") {
        setSelectedVocalsTrack(track);
        setShowAddVocalsDrawer(true);
      } else if (action === "extend") {
        setSelectedExtendTrack(track);
        setShowExtendDialog(true);
      } else if (action === "replace_section") {
        setSelectedSectionTrack(track);
        setShowSectionEditor(true);
      } else if (action === "transcribe") {
        setSelectedTranscriptionTrack(track);
        setShowTranscriptionPanel(true);
      } else if (action === "download_all") {
        setShowDownloadPanel(true);
      } else if (action === "replace_instrumental") {
        // Find the vocal track for arrangement replacement
        const vocalTrack = project.tracks.find((t) => t.type === "vocal");
        if (vocalTrack) {
          setSelectedArrangementTrack(vocalTrack);
          setShowArrangementDialog(true);
        } else {
          toast.error("Вокальный трек не найден");
        }
      } else if (action === "separate_stems") {
        setShowStemSeparationDialog(true);
      } else if (action === "view_notation") {
        setSelectedNotationTrack(track);
        setShowNotationPanel(true);
      } else if (action === "cover") {
        // Navigate to create page with audio as reference for cover
        if (track.audioUrl) {
          navigate(`/create?mode=cover&audioUrl=${encodeURIComponent(track.audioUrl)}`);
        } else {
          toast.error("Нет аудио для референса");
        }
      }
    },
    [project?.tracks, navigate],
  );

  // Unified layout for both desktop and mobile
  // Mobile uses vertical scroll with fixed player bar at bottom
  // Desktop uses timeline view with sections

  // Common header for both layouts
  const renderHeader = () => (
    <header
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 border-b border-border/50 bg-card/50 backdrop-blur-sm shrink-0",
        isMobile && "sticky top-0 z-40",
      )}
    >
      {/* Left: Back + Title */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Always show UI back button - Telegram native button will overlay it when active */}
        <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0 h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col min-w-0">
          <h1 className="text-sm font-semibold truncate">{project.name}</h1>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {project.tracks.length} дорожек
            </Badge>
            {!isMobile && (
              <AutoSaveIndicator
                status={autoSave.status}
                lastSavedAt={autoSave.lastSavedAt}
                timeSinceLastSave={autoSave.timeSinceLastSave}
              />
            )}
          </div>
        </div>
      </div>

      {/* Center: View Switcher (desktop only) */}
      {!isMobile && (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="timeline" className="h-7 px-2 gap-1">
              <Rows3 className="h-4 w-4" />
              <span className="hidden lg:inline">Дорожки</span>
            </TabsTrigger>
            <TabsTrigger value="mixer" className="h-7 px-2 gap-1">
              <Sliders className="h-4 w-4" />
              <span className="hidden lg:inline">Микшер</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Center: Quick actions for mobile - no tabs, unified interface */}
      {isMobile && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowMixerSheet(true)}
            title="Микшер"
          >
            <Sliders className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {!isMobile && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canUndo()}
              onClick={undo}
              title="Отменить (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={!canRedo()}
              onClick={redo}
              title="Повторить (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>

            {/* Offline/Online indicator */}
            {studioOptimizations.isOfflineCapable && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs",
                  studioOptimizations.isOnline ? "text-muted-foreground" : "text-yellow-600 bg-yellow-500/10",
                )}
                title={studioOptimizations.isOnline ? "Онлайн" : "Офлайн режим"}
              >
                {studioOptimizations.isOnline ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">Сохранить</span>
            </Button>

            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setShowGenerateSheet(true)}>
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Создать</span>
            </Button>

            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleExport}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Экспорт</span>
            </Button>
          </>
        )}

        {/* Mobile: simple save indicator */}
        {isMobile && hasUnsavedChanges && (
          <Badge variant="secondary" className="text-[10px]">
            Не сохранено
          </Badge>
        )}
      </div>
    </header>
  );

  // Unified layout for desktop and mobile
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
      {/* Unified Header */}
      {renderHeader()}

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

      {/* Synchronized Lyrics Panel (collapsible) */}
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

      {/* Mobile Audio Fallback Warning */}
      <MobileAudioWarning
        show={showFallbackWarning}
        activeCount={activeStems.length}
        limitedStems={limitedStems}
        onDismiss={dismissWarning}
      />

      {/* Transport Controls - desktop only, mobile uses bottom player */}
      {!isMobile && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-card/50 shrink-0 overflow-hidden">
          {/* Play Controls - OptimizedTransport */}
          <OptimizedTransport
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlay={handlePlayPause}
            onPause={handlePlayPause}
            onStop={() => handleSeek(0)}
            onSeek={handleSeek}
            compact={true}
            className="shrink-0"
          />

          {/* Spacer */}
          <div className="flex-1 min-w-0" />

          {/* Master Volume */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMasterVolume(project.masterVolume === 0 ? 0.85 : 0)}
            >
              {project.masterVolume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[project.masterVolume]}
              max={1}
              step={0.01}
              onValueChange={(v) => setMasterVolume(v[0])}
              className="w-20"
            />
            <span className="text-xs font-mono text-muted-foreground w-6">
              {Math.round(project.masterVolume * 100)}
            </span>
          </div>

          {/* Import Audio */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowImportDialog(true)}
            className="h-8 w-8 shrink-0"
            title="Импорт аудио"
          >
            <Upload className="h-4 w-4" />
          </Button>

          {/* Add Track */}
          <Button variant="outline" size="sm" onClick={() => setShowAddTrackDialog(true)} className="h-8 px-3 shrink-0">
            <Plus className="h-4 w-4" />
            <span className="ml-1">Дорожка</span>
          </Button>
        </div>
      )}

      {/* Unified Tracks List - always visible, no tabs */}
      <ScrollArea className="flex-1">
        <div className={cn("p-3 space-y-2", isMobile && "pb-4")}>
          <SortableTrackList
            tracks={displayTracks}
            isPlaying={isPlaying}
            currentTime={audioEngine.isReady ? audioEngine.currentTime : currentTime}
            duration={duration}
            hasSoloTracks={hasSoloTracks}
            sourceTrackId={sourceTrackId}
            stemsExist={hasStems}
            onReorder={reorderTracks}
            onToggleMute={toggleTrackMute}
            onToggleSolo={toggleTrackSolo}
            onVolumeChange={setTrackVolume}
            onSeek={handleSeek}
            onRemove={removeTrack}
            onVersionChange={setTrackActiveVersion}
            onAction={handleMobileTrackAction}
          />

          {project.tracks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Нет дорожек в проекте</p>
              <Button onClick={() => setShowAddTrackDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить дорожку
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* AI Actions FAB - Mobile only */}
      {isMobile && project.tracks.length > 0 && (
        <AIActionsFAB
          onGenerate={() => setShowGenerateSheet(true)}
          onExtend={() => {
            const mainTrack = project.tracks[0];
            if (mainTrack) {
              setSelectedExtendTrack(mainTrack);
              setShowExtendDialog(true);
            }
          }}
          onCover={() => {
            const mainTrack = project.tracks[0];
            if (mainTrack?.audioUrl) {
              navigate(`/create?mode=cover&audioUrl=${encodeURIComponent(mainTrack.audioUrl)}`);
            }
          }}
          onAddVocals={() => {
            const instrumental = project.tracks.find((t) => t.type === "instrumental");
            if (instrumental) {
              setSelectedVocalsTrack(instrumental);
              setShowAddVocalsDrawer(true);
            } else {
              toast.info("Сначала разделите трек на стемы");
            }
          }}
          onSeparateStems={() => setShowStemSeparationDialog(true)}
          onSaveAsVersion={() => setShowSaveVersionDialog(true)}
          onAddInstrumental={() => {
            const vocal = project.tracks.find((t) => t.type === "vocal");
            if (vocal) {
              setSelectedArrangementTrack(vocal);
              setShowArrangementDialog(true);
            }
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

      {/* Mobile Player Bar - fixed at bottom */}
      {isMobile && (
        <MobileStudioPlayerBar
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          masterVolume={project.masterVolume}
          onPlayPause={handlePlayPause}
          onSkipBack={() => handleSeek(0)}
          onSkipForward={() => handleSeek(duration)}
          onSeek={handleSeek}
          onMasterMuteToggle={() => setMasterVolume(project.masterVolume === 0 ? 0.85 : 0)}
          onOpenActions={() => setShowActionsSheet(true)}
        />
      )}

      {/* Mobile Actions Sheet */}
      <StudioActionsSheet
        open={showActionsSheet}
        onOpenChange={setShowActionsSheet}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onExport={handleExport}
        onOpenDownload={() => setShowDownloadPanel(true)}
        onOpenTranscription={() => {
          const firstTrack = project.tracks[0];
          if (firstTrack) {
            setSelectedTranscriptionTrack(firstTrack);
            setShowTranscriptionPanel(true);
          }
        }}
        onAddTrack={() => setShowAddTrackDialog(true)}
        onGenerate={() => setShowGenerateSheet(true)}
        onImport={() => setShowImportDialog(true)}
        onBack={handleBack}
        onOpenMusicLab={() => setShowMusicLabSheet(true)}
        onOpenLyrics={() => setShowLyricsSheet(true)}
        onOpenPresets={() => setShowPresetsSheet(true)}
        onOpenDashboard={() => setShowDashboardSheet(true)}
      />

      {/* Presets Sheet - apply/save mixer & effects presets (Sprint 031 US3) */}
      <StudioPresetsSheet
        open={showPresetsSheet}
        onOpenChange={setShowPresetsSheet}
        trackId={project.id}
        currentSettings={{ mixer: { volume: project.masterVolume, pan: 0 } }}
        defaultCategory="mastering"
      />

      {/* Dashboard Sheet - studio statistics (Sprint 031 US3) */}
      <StudioDashboardSheet open={showDashboardSheet} onOpenChange={setShowDashboardSheet} />

      {/* Mobile Mixer Sheet */}
      <Sheet open={showMixerSheet} onOpenChange={setShowMixerSheet}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>Микшер</SheetTitle>
          </SheetHeader>
          <StudioMixerPanel
            className="h-full pt-4"
            onAddTrack={() => {
              setShowMixerSheet(false);
              setShowAddTrackDialog(true);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* MusicLab Sheet - full integration with recording, chords, PromptDJ */}
      <StudioMusicLabSheet
        open={showMusicLabSheet}
        onOpenChange={setShowMusicLabSheet}
        projectId={project.id}
        onRecordingComplete={(recordedTrack) => {
          // Add recorded track to project
          addTrack({
            name: recordedTrack.name,
            type: recordedTrack.type === "vocal" ? "vocal" : recordedTrack.type === "guitar" ? "other" : "other",
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
          // Add DJ generated track to project
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

      {/* Lyrics Studio Sheet - V2 with CRUD, AI, versions, notes */}
      <StudioLyricsSheet
        isOpen={showLyricsSheet}
        onClose={() => setShowLyricsSheet(false)}
        trackId={sourceTrackId || undefined}
        initialLyrics={sourceTrack?.lyrics ?? ""}
        onLyricsSaved={(content: string) => {
          logger.info("Lyrics saved", { trackId: sourceTrackId, contentLength: content.length });
        }}
      />

      {/* Add Track Dialog */}
      <AddTrackDialog open={showAddTrackDialog} onOpenChange={setShowAddTrackDialog} onAdd={handleAddTrack} />

      {/* Import Audio Dialog */}
      <ImportAudioDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        projectId={project.id}
        onImport={(audioUrl, name, type, duration) => {
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
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
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
        open={showEffectsDrawer}
        onOpenChange={setShowEffectsDrawer}
        stem={
          selectedEffectsTrack
            ? {
                id: selectedEffectsTrack.id,
                stem_type: selectedEffectsTrack.type,
                audio_url: selectedEffectsTrack.audioUrl || "",
                track_id: project.id,
                separation_mode: null,
                version_id: null,
                created_at: new Date().toISOString(),
              }
            : null
        }
        effects={
          selectedEffectsTrack ? trackEffects[selectedEffectsTrack.id] || defaultStemEffects : defaultStemEffects
        }
        onUpdateEQ={(settings) => {
          if (!selectedEffectsTrack) return;
          setTrackEffects((prev) => ({
            ...prev,
            [selectedEffectsTrack.id]: {
              ...(prev[selectedEffectsTrack.id] || defaultStemEffects),
              eq: { ...(prev[selectedEffectsTrack.id]?.eq || defaultStemEffects.eq), ...settings },
            },
          }));
        }}
        onUpdateCompressor={(settings) => {
          if (!selectedEffectsTrack) return;
          setTrackEffects((prev) => ({
            ...prev,
            [selectedEffectsTrack.id]: {
              ...(prev[selectedEffectsTrack.id] || defaultStemEffects),
              compressor: {
                ...(prev[selectedEffectsTrack.id]?.compressor || defaultStemEffects.compressor),
                ...settings,
              },
            },
          }));
        }}
        onUpdateReverb={(settings) => {
          if (!selectedEffectsTrack) return;
          setTrackEffects((prev) => ({
            ...prev,
            [selectedEffectsTrack.id]: {
              ...(prev[selectedEffectsTrack.id] || defaultStemEffects),
              reverb: { ...(prev[selectedEffectsTrack.id]?.reverb || defaultStemEffects.reverb), ...settings },
            },
          }));
        }}
        onReset={() => {
          if (!selectedEffectsTrack) return;
          setTrackEffects((prev) => ({
            ...prev,
            [selectedEffectsTrack.id]: defaultStemEffects,
          }));
        }}
      />

      {/* Add Vocals Drawer */}
      {selectedVocalsTrack && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <LazyAddVocalsDrawer
            open={showAddVocalsDrawer}
            onOpenChange={setShowAddVocalsDrawer}
            track={
              {
                id: selectedVocalsTrack.id,
                title: selectedVocalsTrack.name,
                audio_url: selectedVocalsTrack.audioUrl || selectedVocalsTrack.clips[0]?.audioUrl || "",
                cover_url: null,
                style: null,
                type: selectedVocalsTrack.type === "instrumental" ? "instrumental" : "complete",
                project_id: project.id,
                is_liked: false,
                likes_count: 0,
              } as unknown as Track
            }
            onSuccess={(newTrackId) => {
              setShowAddVocalsDrawer(false);
              setSelectedVocalsTrack(null);
              toast.success("Вокал добавлен!", { description: "Новый трек создан" });
            }}
          />
        </Suspense>
      )}

      {/* Extend Track Dialog */}
      {selectedExtendTrack && (
        <ExtendTrackDialog
          open={showExtendDialog}
          onOpenChange={(open) => {
            setShowExtendDialog(open);
            if (!open) setSelectedExtendTrack(null);
          }}
          track={
            {
              id: selectedExtendTrack.id,
              title: selectedExtendTrack.name,
              audio_url: selectedExtendTrack.audioUrl || selectedExtendTrack.clips[0]?.audioUrl || "",
              cover_url: null,
              style: null,
              duration_seconds:
                selectedExtendTrack.clips[0]?.duration || selectedExtendTrack.versions?.[0]?.duration || 60,
              project_id: project.id,
              suno_id: null,
              is_liked: false,
              likes_count: 0,
            } as unknown as Track
          }
        />
      )}

      {/* Section Editor Sheet */}
      {selectedSectionTrack && (
        <SectionEditorSheet
          open={showSectionEditor}
          onClose={() => {
            setShowSectionEditor(false);
            setSelectedSectionTrack(null);
            clearSelection();
          }}
          trackId={sourceTrackId || selectedSectionTrack.id}
          trackTitle={selectedSectionTrack.name}
          audioUrl={selectedSectionTrack.audioUrl || selectedSectionTrack.clips?.[0]?.audioUrl}
          duration={duration}
          detectedSections={detectedSections}
        />
      )}

      {/* Download Panel Sheet */}
      <Sheet open={showDownloadPanel} onOpenChange={setShowDownloadPanel}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(isMobile ? "h-[80vh]" : "w-full sm:max-w-md", "p-0")}
        >
          <StudioDownloadPanel
            tracks={project.tracks}
            projectName={project.name}
            onClose={() => setShowDownloadPanel(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Transcription Panel Sheet */}
      <Sheet
        open={showTranscriptionPanel}
        onOpenChange={(open) => {
          setShowTranscriptionPanel(open);
          if (!open) setSelectedTranscriptionTrack(null);
        }}
      >
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(isMobile ? "h-[80vh]" : "w-full sm:max-w-md", "p-0")}
        >
          {selectedTranscriptionTrack && (
            <StudioTranscriptionPanel
              track={selectedTranscriptionTrack}
              audioUrl={selectedTranscriptionTrack.audioUrl || selectedTranscriptionTrack.clips?.[0]?.audioUrl || ""}
              trackId={sourceTrackId || undefined}
              stemType={selectedTranscriptionTrack.type}
              onComplete={() => {
                // Keep panel open so user can download/view results immediately
              }}
              onClose={() => {
                setShowTranscriptionPanel(false);
                setSelectedTranscriptionTrack(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Generate Sheet for creating new tracks */}
      <Suspense fallback={null}>
        <LazyGenerateSheet open={showGenerateSheet} onOpenChange={setShowGenerateSheet} />
      </Suspense>

      {/* Arrangement Replacement Dialog */}
      {selectedArrangementTrack && (
        <StudioArrangementDialog
          open={showArrangementDialog}
          onClose={() => {
            setShowArrangementDialog(false);
            setSelectedArrangementTrack(null);
          }}
          vocalTrack={selectedArrangementTrack}
          projectName={project.name}
          onSuccess={(taskId, title) => {
            // Find existing instrumental for context
            const existingInstrumental = project.tracks.find((t) => t.type === "instrumental" && t.status === "ready");

            // Store context for this generation
            pendingGenerationContextRef.current.set(taskId, {
              type: "replace_instrumental",
              existingId: existingInstrumental?.id,
            });

            // Add pending track for the new arrangement
            addPendingTrack({
              name: title,
              type: "instrumental",
              taskId,
            });
            toast.success("Генерация запущена", {
              description: "Новая аранжировка будет готова через 1-2 минуты",
            });
          }}
        />
      )}

      {/* Instrumental Result Handler Dialog */}
      <InstrumentalResultHandler
        open={showInstrumentalResult}
        onClose={() => {
          setShowInstrumentalResult(false);
          setInstrumentalResultData(null);
        }}
        data={instrumentalResultData}
        onApply={(action, selectedVersionLabel) => {
          if (!instrumentalResultData) return;

          const { newTrackId, existingInstrumentalId, versions } = instrumentalResultData;
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

          setShowInstrumentalResult(false);
          setInstrumentalResultData(null);
        }}
      />

      {/* Save Version Dialog */}
      <SaveVersionDialog
        open={showSaveVersionDialog}
        onOpenChange={setShowSaveVersionDialog}
        projectId={project.id}
        sourceTrackId={sourceTrackId || undefined}
        tracks={project.tracks}
        masterVolume={project.masterVolume}
        onVersionSaved={(version) => {
          // Refresh versions in project if needed
          toast.success(`Версия "${version.label}" сохранена`);
        }}
      />

      {/* Notation Panel Sheet */}
      <Sheet
        open={showNotationPanel}
        onOpenChange={(open) => {
          setShowNotationPanel(open);
          if (!open) setSelectedNotationTrack(null);
        }}
      >
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(isMobile ? "h-[85vh]" : "w-full sm:max-w-lg", "p-0")}
        >
          {selectedNotationTrack && (
            <StudioNotationPanel
              track={selectedNotationTrack}
              trackId={sourceTrackId || undefined}
              stemType={selectedNotationTrack.type}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onSeek={handleSeek}
              onClose={() => {
                setShowNotationPanel(false);
                setSelectedNotationTrack(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Stem Separation Mode Dialog */}
      <StemSeparationModeDialog
        open={showStemSeparationDialog}
        onOpenChange={setShowStemSeparationDialog}
        onConfirm={handleStemSeparation}
        isProcessing={isSeparating}
      />
    </div>
  );
});

// ============ Add Track Dialog ============

interface AddTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: TrackType, name: string) => void;
}

function AddTrackDialog({ open, onOpenChange, onAdd }: AddTrackDialogProps) {
  const [type, setType] = useState<TrackType>("instrumental");
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setType("instrumental");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trackName = name.trim() || getDefaultTrackName(type);
    onAdd(type, trackName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить дорожку</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Тип дорожки</Label>
            <Select value={type} onValueChange={(v) => setType(v as TrackType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vocal">🎤 Вокал</SelectItem>
                <SelectItem value="instrumental">🎸 Инструментал</SelectItem>
                <SelectItem value="drums">🥁 Ударные</SelectItem>
                <SelectItem value="bass">🎸 Бас</SelectItem>
                <SelectItem value="sfx">✨ SFX / Эффекты</SelectItem>
                <SelectItem value="other">📁 Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={getDefaultTrackName(type)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-1" />
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultTrackName(type: TrackType): string {
  const names: Record<TrackType, string> = {
    main: "Main Track",
    vocal: "Вокал",
    instrumental: "Инструментал",
    stem: "Stem",
    sfx: "SFX",
    drums: "Ударные",
    bass: "Бас",
    other: "Дорожка",
  };
  return names[type];
}
