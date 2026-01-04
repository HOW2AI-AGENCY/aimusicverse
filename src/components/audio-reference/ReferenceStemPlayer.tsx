/**
 * ReferenceStemPlayer - Reusable stem mixer component
 * 
 * Features synchronized playback with mute/solo, volume control per stem
 * Designed for mobile-first with compact mode
 */

import { useState } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Loader2,
  Music2,
  SkipBack,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useReferenceStemPlayback, Stem } from '@/hooks/useReferenceStemPlayback';
import { getStemLabel, STEM_COLORS, STEM_EMOJIS } from '@/lib/stemLabels';

interface ReferenceStemPlayerProps {
  stems: Stem[];
  compact?: boolean;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ReferenceStemPlayer({ stems, compact = false, className }: ReferenceStemPlayerProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    masterVolume,
    stemStates,
    isLoading,
    togglePlay,
    seek,
    setMasterVolume,
    toggleMute,
    toggleSolo,
    setStemVolume,
  } = useReferenceStemPlayback(stems);

  const hasSolo = Object.values(stemStates).some(s => s.solo);

  if (stems.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Music2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Стемы не найдены</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Transport Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => seek(0)}
          disabled={isLoading}
          className="h-9 w-9"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          onClick={togglePlay}
          disabled={isLoading}
          className="h-10 w-10"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>
        
        {/* Time Display */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="tabular-nums">{formatTime(currentTime)}</span>
            <span>/</span>
            <span className="tabular-nums">{formatTime(duration)}</span>
          </div>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={([v]) => seek(v)}
            className="w-full"
          />
        </div>
      </div>

      {/* Master Volume */}
      <div className="p-2.5 rounded-lg border border-border/50 bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary flex-shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">Мастер</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[masterVolume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) => setMasterVolume(v)}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Stem Cards */}
      <div className="space-y-1.5">
        {stems.map((stem) => {
          const state = stemStates[stem.id] || { volume: 1, muted: false, solo: false };
          const isEffectivelyMuted = state.muted || (hasSolo && !state.solo);
          const label = getStemLabel(stem.type);
          const emoji = STEM_EMOJIS[stem.type] || '🔊';
          const colorClass = STEM_COLORS[stem.type] || 'bg-gray-500/10 border-gray-500/30 text-gray-500';
          
          return (
            <div 
              key={stem.id}
              className={cn(
                "p-2.5 rounded-lg border border-border/50 bg-card/50",
                "transition-all duration-200",
                isEffectivelyMuted && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                {/* Stem Icon & Label */}
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 text-sm",
                  colorClass
                )}>
                  {emoji}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{label}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {Math.round(state.volume * 100)}%
                    </span>
                  </div>
                  
                  <Slider
                    value={[state.volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([v]) => setStemVolume(stem.id, v)}
                    className="w-full"
                  />
                </div>
                
                {/* M/S Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant={state.muted ? "default" : "ghost"}
                    size="icon"
                    onClick={() => toggleMute(stem.id)}
                    className={cn(
                      "h-7 w-7 rounded-md text-[10px] font-bold",
                      state.muted && "bg-destructive hover:bg-destructive/90"
                    )}
                  >
                    {state.muted ? <VolumeX className="w-3.5 h-3.5" /> : 'M'}
                  </Button>
                  <Button
                    variant={state.solo ? "default" : "ghost"}
                    size="icon"
                    onClick={() => toggleSolo(stem.id)}
                    className={cn(
                      "h-7 w-7 rounded-md text-[10px] font-bold",
                      state.solo && "bg-primary hover:bg-primary/90"
                    )}
                  >
                    S
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
