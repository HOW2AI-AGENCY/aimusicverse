/**
 * Studio Shell
 * Main layout wrapper for the unified studio with full audio integration
 */

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import { useUnifiedStudioStore, ViewMode, TrackType, TRACK_COLORS, StudioTrack } from '@/stores/useUnifiedStudioStore';
import { StudioTransport } from './StudioTransport';
import { StudioTrackRow } from './StudioTrackRow';
import { StudioPendingTrackRow } from './StudioPendingTrackRow';
import { StudioWaveformTimeline } from './StudioWaveformTimeline';
import { StudioMixerPanel } from './StudioMixerPanel';
import { ExportMixDialog } from './ExportMixDialog';
import { StemEffectsDrawer } from './StemEffectsDrawer';
import { MobileAudioWarning } from '@/components/studio/MobileAudioWarning';
import { useStudioAudioEngine, AudioTrack } from '@/hooks/studio/useStudioAudioEngine';
import { useMobileAudioFallback } from '@/hooks/studio/useMobileAudioFallback';
import { useStudioOptimizations } from '@/hooks/studio/useStudioOptimizations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
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
  Cloud,
  CloudOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatTime } from '@/lib/formatters';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { StemEffects, EQSettings, CompressorSettings, ReverbSettings } from '@/hooks/studio/types';
import { defaultStemEffects } from '@/hooks/studio/stemEffectsConfig';
import type { TrackStem } from '@/hooks/useTrackStems';

interface StudioShellProps {
  className?: string;
}

// Track effects state (stored per track)
interface TrackEffectsState {
  [trackId: string]: StemEffects;
}

export const StudioShell = memo(function StudioShell({ className }: StudioShellProps) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
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
  } = useUnifiedStudioStore();

  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  const [showMixerSheet, setShowMixerSheet] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showEffectsDrawer, setShowEffectsDrawer] = useState(false);
  const [selectedEffectsTrack, setSelectedEffectsTrack] = useState<StudioTrack | null>(null);
  const [trackEffects, setTrackEffects] = useState<TrackEffectsState>({});

  // Convert store tracks to AudioTrack format for engine
  const audioTracks = useMemo((): AudioTrack[] => {
    if (!project) return [];
    
    return project.tracks
      .filter(t => t.status !== 'pending' && t.status !== 'failed')
      .map(track => {
        // Get audio URL from track or active version
        let audioUrl = track.audioUrl;
        if (!audioUrl && track.versions?.length) {
          const activeVersion = track.versions.find(v => v.label === track.activeVersionLabel);
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
      .filter(t => t.status !== 'pending' && t.status !== 'failed')
      .map(track => ({
        id: track.id,
        track_id: project.id,
        stem_type: track.type,
        audio_url: track.audioUrl || '',
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
  const mainAudioUrl = project?.tracks[0]?.audioUrl || project?.tracks[0]?.clips[0]?.audioUrl;
  const duration = audioEngine.duration || project?.durationSeconds || 180;

  // Sync playback state with store
  useEffect(() => {
    if (isPlaying && !audioEngine.isPlaying) {
      audioEngine.play();
    } else if (!isPlaying && audioEngine.isPlaying) {
      audioEngine.pause();
    }
  }, [isPlaying, audioEngine]);

  // Sync seek with audio engine
  const handleSeek = useCallback((time: number) => {
    audioEngine.seek(time);
    seek(time);
  }, [audioEngine, seek]);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      pause();
    } else {
      audioEngine.play();
      play();
    }
  }, [isPlaying, play, pause, audioEngine]);

  // Update track volumes in engine when they change
  useEffect(() => {
    if (!project) return;
    project.tracks.forEach(track => {
      audioEngine.setTrackVolume(track.id, track.volume);
    });
  }, [project?.tracks, audioEngine]);

  // Handle save
  const handleSave = useCallback(async () => {
    const success = await saveProject();
    if (success) {
      toast.success('Проект сохранён');
    } else {
      toast.error('Ошибка сохранения');
    }
  }, [saveProject]);

  // Handle export
  const handleExport = useCallback(() => {
    setShowExportDialog(true);
  }, []);

  // Handle back
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('Есть несохранённые изменения. Выйти?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }, [hasUnsavedChanges, navigate]);

  // Handle add track
  const handleAddTrack = useCallback((type: TrackType, name: string) => {
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
  }, [addTrack]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'KeyZ':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, undo, redo]);

  // Track pending track IDs to detect when they become ready
  const pendingTrackIds = useMemo(() => {
    if (!project) return new Set<string>();
    return new Set(
      project.tracks
        .filter(t => t.status === 'pending')
        .map(t => t.id)
    );
  }, [project?.tracks]);

  // Realtime subscription for project updates (e.g., when instrumental generation completes)
  useEffect(() => {
    if (!project?.id) return;

    const channel = supabase
      .channel(`studio-project-${project.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'studio_projects',
        filter: `id=eq.${project.id}`,
      }, async (payload) => {
        logger.info('Studio project updated via realtime', { projectId: project.id });
        
        // Check if any pending track became ready
        const newTracks = (payload.new as any)?.tracks as StudioTrack[] | undefined;
        if (newTracks) {
          const resolvedTracks = newTracks.filter(t => 
            t.status === 'ready' && pendingTrackIds.has(t.id)
          );
          
          if (resolvedTracks.length > 0) {
            // Reload project to get updated tracks
            await loadProject(project.id);
            toast.success('Инструментал готов! 🎸', {
              description: `${resolvedTracks.length > 1 ? 'Выберите версии' : 'Выберите версию A или B'}`
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project?.id, loadProject, pendingTrackIds]);

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
        <Button onClick={() => navigate('/studio-v2')}>
          Открыть студию
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-screen bg-background', className)}>
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/50 bg-card/50 backdrop-blur-sm shrink-0">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm font-semibold truncate">{project.name}</h1>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {project.tracks.length} дорожек
              </Badge>
              {hasUnsavedChanges ? (
                <CloudOff className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Cloud className="h-3 w-3 text-green-500" />
              )}
            </div>
          </div>
        </div>

        {/* Center: View Switcher (desktop) */}
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

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
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
                studioOptimizations.isOnline 
                  ? "text-muted-foreground" 
                  : "text-yellow-600 bg-yellow-500/10"
              )}
              title={studioOptimizations.isOnline ? "Онлайн" : "Офлайн режим"}
            >
              {studioOptimizations.isOnline ? (
                <Cloud className="h-3 w-3" />
              ) : (
                <CloudOff className="h-3 w-3" />
              )}
            </div>
          )}

          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowMixerSheet(true)}
            >
              <Sliders className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Сохранить</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Экспорт</span>
          </Button>
        </div>
      </header>

      {/* Main Timeline */}
      <div className="px-3 py-2 border-b border-border/30 bg-card/30">
        <StudioWaveformTimeline
          audioUrl={mainAudioUrl || null}
          duration={duration}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onSeek={handleSeek}
          height={80}
        />
      </div>

      {/* Mobile Audio Fallback Warning */}
      <MobileAudioWarning
        show={showFallbackWarning}
        activeCount={activeStems.length}
        limitedStems={limitedStems}
        onDismiss={dismissWarning}
      />

      {/* Transport Controls */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/50 bg-card/50 shrink-0">
        {/* Play Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleSeek(0)}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={handlePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleSeek(duration)}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Time Display */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-medium">
            {formatTime(currentTime)}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(duration)}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Master Volume */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMasterVolume(project.masterVolume === 0 ? 0.85 : 0)}
          >
            {project.masterVolume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[project.masterVolume]}
            max={1}
            step={0.01}
            onValueChange={(v) => setMasterVolume(v[0])}
            className="w-24"
          />
          <span className="text-xs font-mono text-muted-foreground w-8">
            {Math.round(project.masterVolume * 100)}
          </span>
        </div>

        {/* Add Track */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddTrackDialog(true)}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Дорожка</span>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <AnimatePresence>
            {project.tracks.map((track) => (
              track.status === 'pending' ? (
                <StudioPendingTrackRow
                  key={track.id}
                  track={{
                    id: track.id,
                    name: track.name,
                    type: track.type,
                    taskId: track.taskId,
                    status: 'pending',
                  }}
                  onCancel={() => removeTrack(track.id)}
                />
              ) : (
                <StudioTrackRow
                  key={track.id}
                  track={track}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  onToggleMute={() => toggleTrackMute(track.id)}
                  onToggleSolo={() => toggleTrackSolo(track.id)}
                  onVolumeChange={(v) => setTrackVolume(track.id, v)}
                  onSeek={handleSeek}
                  onRemove={() => removeTrack(track.id)}
                  onVersionChange={track.versions ? (label: string) => setTrackActiveVersion(track.id, label) : undefined}
                  onAction={(action) => {
                    if (action === 'download' && track.audioUrl) {
                      window.open(track.audioUrl, '_blank');
                    } else if (action === 'effects') {
                      setSelectedEffectsTrack(track);
                      setShowEffectsDrawer(true);
                    } else if (action === 'reference') {
                      toast.info('Функция референса в разработке');
                    }
                  }}
                />
              )
            ))}
          </AnimatePresence>

          {project.tracks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Нет дорожек в проекте
              </p>
              <Button onClick={() => setShowAddTrackDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить дорожку
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

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

      {/* Add Track Dialog */}
      <AddTrackDialog
        open={showAddTrackDialog}
        onOpenChange={setShowAddTrackDialog}
        onAdd={handleAddTrack}
      />

      {/* Export Mix Dialog */}
      <ExportMixDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        tracks={audioTracks.map(t => ({
          url: t.audioUrl || '',
          volume: t.volume,
          muted: t.muted
        }))}
        masterVolume={project.masterVolume}
        trackTitle={project.name}
      />

      {/* Track Effects Drawer */}
      <StemEffectsDrawer
        open={showEffectsDrawer}
        onOpenChange={setShowEffectsDrawer}
        stem={selectedEffectsTrack ? {
          id: selectedEffectsTrack.id,
          stem_type: selectedEffectsTrack.type,
          audio_url: selectedEffectsTrack.audioUrl || '',
          track_id: project.id,
          separation_mode: null,
          version_id: null,
          created_at: new Date().toISOString(),
        } : null}
        effects={selectedEffectsTrack ? (trackEffects[selectedEffectsTrack.id] || defaultStemEffects) : defaultStemEffects}
        onUpdateEQ={(settings) => {
          if (!selectedEffectsTrack) return;
          setTrackEffects(prev => ({
            ...prev,
            [selectedEffectsTrack.id]: {
              ...(prev[selectedEffectsTrack.id] || defaultStemEffects),
              eq: { ...(prev[selectedEffectsTrack.id]?.eq || defaultStemEffects.eq), ...settings }
            }
          }));
        }}
        onUpdateCompressor={(settings) => {
          if (!selectedEffectsTrack) return;
          setTrackEffects(prev => ({
            ...prev,
            [selectedEffectsTrack.id]: {
              ...(prev[selectedEffectsTrack.id] || defaultStemEffects),
              compressor: { ...(prev[selectedEffectsTrack.id]?.compressor || defaultStemEffects.compressor), ...settings }
            }
          }));
        }}
        onUpdateReverb={(settings) => {
          if (!selectedEffectsTrack) return;
          setTrackEffects(prev => ({
            ...prev,
            [selectedEffectsTrack.id]: {
              ...(prev[selectedEffectsTrack.id] || defaultStemEffects),
              reverb: { ...(prev[selectedEffectsTrack.id]?.reverb || defaultStemEffects.reverb), ...settings }
            }
          }));
        }}
        onReset={() => {
          if (!selectedEffectsTrack) return;
          setTrackEffects(prev => ({
            ...prev,
            [selectedEffectsTrack.id]: defaultStemEffects
          }));
        }}
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
  const [type, setType] = useState<TrackType>('instrumental');
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setType('instrumental');
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
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={getDefaultTrackName(type)}
            />
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
    main: 'Main Track',
    vocal: 'Вокал',
    instrumental: 'Инструментал',
    stem: 'Stem',
    sfx: 'SFX',
    drums: 'Ударные',
    bass: 'Бас',
    other: 'Дорожка',
  };
  return names[type];
}
