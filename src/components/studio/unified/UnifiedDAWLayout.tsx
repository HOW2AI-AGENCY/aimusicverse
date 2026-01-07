/**
 * UnifiedDAWLayout - Single-view DAW interface WITHOUT tabs
 * 
 * Implements the unified DAW-like interface as specified in ADR-011.
 * All functionality visible in one screen:
 * - Timeline ruler at top
 * - Track lanes in middle (vertically stacked)
 * - Transport controls at bottom
 * - Floating AI actions button (FAB)
 * - Collapsible mixer panel on right
 * 
 * NO tab navigation - everything in one view.
 * 
 * @see ADR-011 for architecture decisions
 * @see SPRINT-030-UNIFIED-STUDIO-MOBILE.md line 278
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Sliders, X, Plus, Sparkles, Download, Undo2, Redo2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { useHaptic } from '@/hooks/useHaptic';
import { AIActionsFAB } from './AIActionsFAB';
import { SortableTrackList } from './SortableTrackList';

interface Track {
  id: string;
  name: string;
  audioUrl: string;
  stemType: string;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
}

interface Project {
  id: string;
  name: string;
  masterVolume: number;
  tracks: Track[];
  bpm?: number; // BPM for beat grid display
}

interface UnifiedDAWLayoutProps {
  project: Project;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onStop?: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  onMasterVolumeChange: (volume: number) => void;
  onTrackMuteToggle: (trackId: string) => void;
  onTrackSoloToggle: (trackId: string) => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackPanChange?: (trackId: string, pan: number) => void;
  onTrackRemove?: (trackId: string) => void;
  onAddTrack?: () => void;
  onExport?: () => void;
  onSave?: () => Promise<boolean> | void;
  // Undo/Redo
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  // AI Actions
  onGenerate?: () => void;
  onExtend?: () => void;
  onCover?: () => void;
  onAddVocals?: () => void;
  onSeparateStems?: () => void;
  onSaveAsVersion?: () => void;
  onRecord?: () => void;
  onAddInstrumental?: () => void;
  // Operation lock state
  hasStems?: boolean;
  hasPendingTracks?: boolean;
  className?: string;
}

export const UnifiedDAWLayout = memo(function UnifiedDAWLayout({
  project,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onStop,
  onSkipBack,
  onSkipForward,
  onMasterVolumeChange,
  onTrackMuteToggle,
  onTrackSoloToggle,
  onTrackVolumeChange,
  onTrackPanChange,
  onTrackRemove,
  onAddTrack,
  onExport,
  onSave,
  // Undo/Redo
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  // AI Actions
  onGenerate,
  onExtend,
  onCover,
  onAddVocals,
  onSeparateStems,
  onSaveAsVersion,
  onRecord,
  onAddInstrumental,
  // Operation lock state
  hasStems = false,
  hasPendingTracks = false,
  className,
}: UnifiedDAWLayoutProps) {
  const { patterns } = useHaptic();
  const [mixerOpen, setMixerOpen] = useState(false);
  const [masterMuted, setMasterMuted] = useState(false);

  // Compute disabled operations based on state
  const disabledOperations = useMemo(() => {
    const disabled: string[] = [];
    if (hasStems) {
      disabled.push('extend', 'replace_section', 'separate_stems');
    }
    if (hasPendingTracks) {
      disabled.push('generate', 'extend', 'replace_section', 'add_instrumental', 
        'add_vocals', 'cover', 'replace_instrumental', 'separate_stems');
    }
    return disabled;
  }, [hasStems, hasPendingTracks]);

  const getDisabledReason = useCallback((op: string): string | null => {
    if (hasPendingTracks && ['generate', 'extend', 'replace_section', 'add_instrumental', 
      'add_vocals', 'cover', 'replace_instrumental', 'separate_stems'].includes(op)) {
      return 'Дождитесь завершения текущей генерации.';
    }
    if (hasStems) {
      if (op === 'extend' || op === 'replace_section') {
        return 'Стемы блокируют изменение структуры. Создайте новую версию.';
      }
      if (op === 'separate_stems') {
        return 'Стемы уже разделены.';
      }
    }
    return null;
  }, [hasStems, hasPendingTracks]);

  // Track states for DAWTrackLane
  const trackStates = useMemo(() => {
    return project.tracks.reduce((acc, track) => {
      acc[track.id] = {
        muted: track.muted,
        solo: track.solo,
        volume: track.volume,
      };
      return acc;
    }, {} as Record<string, { muted: boolean; solo: boolean; volume: number }>);
  }, [project.tracks]);

  const handleMasterMuteToggle = useCallback(() => {
    patterns.tap();
    setMasterMuted(!masterMuted);
  }, [masterMuted, patterns]);

  const handleMixerToggle = useCallback(() => {
    patterns.select();
    setMixerOpen(!mixerOpen);
  }, [mixerOpen, patterns]);

  const handleTrackToggle = useCallback((trackId: string, type: 'mute' | 'solo') => {
    patterns.select();
    if (type === 'mute') {
      onTrackMuteToggle(trackId);
    } else {
      onTrackSoloToggle(trackId);
    }
  }, [onTrackMuteToggle, onTrackSoloToggle, patterns]);

  const handleTrackVolume = useCallback((trackId: string, volume: number) => {
    onTrackVolumeChange(trackId, volume);
  }, [onTrackVolumeChange]);

  const handlePlayPause = useCallback(() => {
    patterns.tap();
    onPlayPause();
  }, [onPlayPause, patterns]);

  const handleSeek = useCallback((time: number) => {
    onSeek(time);
  }, [onSeek]);

  // Telegram safe area - proper handling for both top and bottom
  const safeAreaTop = 'calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)))';
  const safeAreaBottom = 'calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))';

  return (
    <div 
      className={cn(
        'flex flex-col h-screen w-full bg-background overflow-hidden',
        className
      )}
      style={{ paddingTop: safeAreaTop }}
    >
      {/* Header with project name and actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold truncate max-w-[140px]">
            {project.name}
          </h1>
          
          {/* Undo/Redo buttons */}
          {(onUndo || onRedo) && (
            <div className="flex items-center gap-0.5 ml-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  patterns.tap();
                  onUndo?.();
                }}
                disabled={!canUndo}
                className="h-8 w-8"
                title="Отменить (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  patterns.tap();
                  onRedo?.();
                }}
                disabled={!canRedo}
                className="h-8 w-8"
                title="Повторить (Ctrl+Shift+Z)"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          {onSave && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              className="h-8 px-2 text-xs"
            >
              Сохранить
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleMixerToggle}
            className="h-9 w-9"
          >
            <Sliders className="h-4 w-4" />
          </Button>
          {onExport && (
            <Button
              variant="outline"
              size="icon"
              onClick={onExport}
              className="h-9 w-9"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Timeline Ruler with BPM markers */}
      {(() => {
        const bpm = project.bpm || 120;
        const beatDuration = 60 / bpm;
        const barDuration = beatDuration * 4;
        const beatCount = Math.ceil(duration / beatDuration);
        
        return (
          <div 
            className="shrink-0 border-b border-border/30 h-10 relative bg-muted/20 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percent = x / rect.width;
              handleSeek(percent * duration);
            }}
          >
            {/* BPM indicator */}
            <div className="absolute left-2 top-1 text-[10px] text-muted-foreground font-mono">
              {bpm} BPM
            </div>
            
            {/* Beat markers */}
            <div className="absolute left-0 right-0 bottom-0 h-6">
              {Array.from({ length: beatCount + 1 }).map((_, i) => {
                const time = i * beatDuration;
                if (time > duration) return null;
                const isBar = i % 4 === 0;
                const barNumber = Math.floor(i / 4) + 1;
                
                return (
                  <div
                    key={i}
                    className="absolute bottom-0"
                    style={{ left: `${(time / duration) * 100}%` }}
                  >
                    <div 
                      className={cn(
                        "w-px",
                        isBar ? "h-4 bg-foreground/40" : "h-2 bg-foreground/15"
                      )} 
                    />
                    {isBar && (
                      <span className="absolute -top-3 text-[9px] text-muted-foreground -translate-x-1/2 font-mono">
                        {barNumber}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              {/* Playhead head */}
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
            </div>
          </div>
        );
      })()}

      {/* Track Lanes - Scrollable middle area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {project.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No tracks yet. Add tracks to get started.
            </p>
            {onAddTrack && (
              <Button onClick={onAddTrack} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Track
              </Button>
            )}
          </div>
        ) : (
          <div className="min-h-full">
            {project.tracks.map((track) => {
              const state = trackStates[track.id];
              return (
                <div 
                  key={track.id} 
                  className="flex items-center gap-2 p-2 border-b border-border/20 hover:bg-muted/30"
                >
                  <div className="w-24 truncate text-sm font-medium">{track.name}</div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={state?.muted ? "default" : "ghost"}
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleTrackToggle(track.id, 'mute')}
                    >
                      {state?.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </Button>
                    <Slider
                      value={[state?.volume ?? 0.85]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={(v) => handleTrackVolume(track.id, v[0])}
                      className="w-20"
                    />
                  </div>
                  <div className="flex-1 h-8 bg-muted/20 rounded relative overflow-hidden">
                    {/* Playhead indicator */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-primary/50"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transport Controls Bar */}
      <div 
        className="shrink-0 border-t border-border/50 bg-card/95 backdrop-blur-md"
        style={{ paddingBottom: safeAreaBottom }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Time display */}
          <div className="flex items-center gap-2 min-w-[100px]">
            <span className="text-xs font-mono text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Center: Transport controls */}
          <div className="flex items-center gap-1">
            {onSkipBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSkipBack}
                className="h-10 w-10"
              >
                <SkipBack className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="icon"
              onClick={handlePlayPause}
              className="h-12 w-12 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-0.5" />
              )}
            </Button>
            {onSkipForward && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSkipForward}
                className="h-10 w-10"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Right: Master volume */}
          <div className="flex items-center gap-2 min-w-[100px] justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMasterMuteToggle}
              className="h-8 w-8"
            >
              {masterMuted || project.masterVolume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[masterMuted ? 0 : project.masterVolume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v: number[]) => onMasterVolumeChange(v[0])}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Floating AI Actions Button */}
      {project.tracks.length > 0 && (
        <AIActionsFAB
          onGenerate={onGenerate || (() => {
            patterns.select();
            console.log('AI Action: Generate');
          })}
          onExtend={onExtend || (() => {
            patterns.select();
            console.log('AI Action: Extend', project.tracks[0]?.id);
          })}
          onCover={onCover || (() => {
            patterns.select();
            console.log('AI Action: Cover');
          })}
          onAddVocals={onAddVocals || (() => {
            patterns.select();
            console.log('AI Action: Add Vocals');
          })}
          onSeparateStems={onSeparateStems || (() => {
            patterns.select();
            console.log('AI Action: Separate Stems');
          })}
          onSaveAsVersion={onSaveAsVersion}
          onRecord={onRecord}
          onAddInstrumental={onAddInstrumental}
          disabledOperations={disabledOperations as any}
          getDisabledReason={getDisabledReason as any}
          canSaveAsNewVersion={hasStems && !!onSaveAsVersion}
          className="fixed bottom-24 right-4 z-40"
        />
      )}

      {/* Mixer Panel - Slide from right */}
      <Sheet open={mixerOpen} onOpenChange={setMixerOpen}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Mixer</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-60px)]">
            {/* Master Volume */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Master Volume</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMasterMuteToggle}
                  className="h-8 w-8 shrink-0"
                >
                  {masterMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[masterMuted ? 0 : project.masterVolume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v: number[]) => onMasterVolumeChange(v[0])}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-12 text-right">
                  {Math.round((masterMuted ? 0 : project.masterVolume) * 100)}%
                </span>
              </div>
            </div>

            {/* Individual Track Controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Track Controls</h3>
              {project.tracks.map((track, index) => (
                <div key={track.id} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Track {index + 1}: {track.name}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant={track.muted ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => onTrackMuteToggle(track.id)}
                        className="h-7 w-7 p-0 text-xs"
                      >
                        M
                      </Button>
                      <Button
                        variant={track.solo ? "default" : "outline"}
                        size="sm"
                        onClick={() => onTrackSoloToggle(track.id)}
                        className="h-7 w-7 p-0 text-xs"
                      >
                        S
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Volume</label>
                    <Slider
                      value={[track.volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={(v: number[]) => onTrackVolumeChange(track.id, v[0])}
                      disabled={track.muted}
                    />
                  </div>
                  {onTrackPanChange && (
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Pan</label>
                      <Slider
                        value={[track.pan || 0]}
                        min={-1}
                        max={1}
                        step={0.01}
                        onValueChange={(v: number[]) => onTrackPanChange(track.id, v[0])}
                        disabled={track.muted}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});
