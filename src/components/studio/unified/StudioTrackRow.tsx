/**
 * Studio Track Row
 * Individual track lane with waveform, controls, and stem-style UI
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Volume2, VolumeX, MoreHorizontal, Download,
  Mic2, Guitar, Drum, Music, Piano, Waves, Sliders,
  Trash2, Sparkles, GripVertical, Scissors, ArrowRight, FileMusic, Music2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { StudioTrack, TrackType } from '@/stores/useUnifiedStudioStore';
import { OptimizedStemWaveform } from '@/components/stem-studio/OptimizedStemWaveform';
import { StudioVersionSelector } from './StudioVersionSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

// Track type configuration
const trackConfig: Record<string, { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  shortLabel: string;
  gradient: string;
  accent: string;
}> = {
  main: { 
    icon: Music, 
    label: 'Основной', 
    shortLabel: 'MAIN',
    gradient: 'from-primary/20 to-primary/5',
    accent: 'text-primary bg-primary/20 border-primary/30'
  },
  vocal: { 
    icon: Mic2, 
    label: 'Вокал', 
    shortLabel: 'VOX',
    gradient: 'from-blue-500/20 to-blue-600/5',
    accent: 'text-blue-400 bg-blue-500/20 border-blue-500/30'
  },
  instrumental: { 
    icon: Guitar, 
    label: 'Инструментал', 
    shortLabel: 'INS',
    gradient: 'from-green-500/20 to-green-600/5',
    accent: 'text-green-400 bg-green-500/20 border-green-500/30'
  },
  drums: { 
    icon: Drum, 
    label: 'Ударные', 
    shortLabel: 'DRM',
    gradient: 'from-orange-500/20 to-orange-600/5',
    accent: 'text-orange-400 bg-orange-500/20 border-orange-500/30'
  },
  bass: { 
    icon: Waves, 
    label: 'Бас', 
    shortLabel: 'BAS',
    gradient: 'from-purple-500/20 to-purple-600/5',
    accent: 'text-purple-400 bg-purple-500/20 border-purple-500/30'
  },
  stem: { 
    icon: Sliders, 
    label: 'Стем', 
    shortLabel: 'STM',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    accent: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
  },
  sfx: { 
    icon: Sparkles, 
    label: 'SFX', 
    shortLabel: 'SFX',
    gradient: 'from-yellow-500/20 to-yellow-600/5',
    accent: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
  },
  other: { 
    icon: Music, 
    label: 'Другое', 
    shortLabel: 'OTH',
    gradient: 'from-gray-500/20 to-gray-600/5',
    accent: 'text-gray-400 bg-gray-500/20 border-gray-500/30'
  },
};

interface StudioTrackRowProps {
  track: StudioTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasSoloTracks?: boolean;
  isSourceTrack?: boolean; // True if this is the main source track (can extend/replace)
  stemsExist?: boolean; // If stems exist, disable extend/replace
  hasTranscription?: boolean; // If track has MIDI/notation transcription
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onRemove: () => void;
  onVersionChange?: (versionLabel: string) => void;
  onAction?: (action: 'download' | 'effects' | 'reference' | 'add_vocals' | 'replace_instrumental' | 'extend' | 'replace_section' | 'transcribe' | 'view_notation') => void;
}

export const StudioTrackRow = memo(function StudioTrackRow({
  track,
  isPlaying,
  currentTime,
  duration,
  hasSoloTracks = false,
  isSourceTrack = false,
  stemsExist = false,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
  onSeek,
  onRemove,
  onVersionChange,
  onAction,
}: StudioTrackRowProps) {
  const isMobile = useIsMobile();
  const [showVolume, setShowVolume] = useState(false);
  const haptic = useHapticFeedback();
  
  const config = trackConfig[track.type] || trackConfig.other;
  const Icon = config.icon;

  // Get audio URL from track or first clip
  const audioUrl = track.audioUrl || track.clips[0]?.audioUrl;

  // Calculate effective mute: muted if explicitly muted OR if another track is solo and this isn't
  const effectiveMuted = track.muted || (hasSoloTracks && !track.solo);

  const handleToggle = useCallback((type: 'mute' | 'solo') => {
    haptic.select();
    if (type === 'mute') {
      onToggleMute();
    } else {
      onToggleSolo();
    }
  }, [haptic, onToggleMute, onToggleSolo]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        "relative group",
        effectiveMuted && "opacity-50"
      )}
    >
      <div className={cn(
        "flex flex-col rounded-xl overflow-hidden",
        "bg-gradient-to-r",
        config.gradient,
        "border border-border/30"
      )}>
        {/* Header row */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Drag handle (desktop) */}
          {!isMobile && (
            <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab hover:text-muted-foreground" />
          )}
          
          {/* Track icon + label */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
              config.accent
            )}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-mono font-semibold tracking-wider truncate block">
                {track.name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {config.shortLabel}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Mute - M button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle('mute')}
              className={cn(
                "h-9 w-9 md:h-7 md:w-7 p-0 rounded-lg font-mono text-xs md:text-[10px] font-bold transition-all touch-manipulation",
                track.muted 
                  ? "bg-destructive text-destructive-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              M
            </Button>
            
            {/* Solo - S button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle('solo')}
              className={cn(
                "h-9 w-9 md:h-7 md:w-7 p-0 rounded-lg font-mono text-xs md:text-[10px] font-bold transition-all touch-manipulation",
                track.solo 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              S
            </Button>

            {/* Version Selector */}
            {track.versions && track.versions.length > 1 && onVersionChange && (
              <StudioVersionSelector
                versions={track.versions}
                activeLabel={track.activeVersionLabel || 'A'}
                onSelect={onVersionChange}
                compact
              />
            )}

            {/* Volume toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVolume(!showVolume)}
              className={cn(
                "h-9 md:h-7 px-2 rounded-lg text-xs md:text-[10px] font-mono touch-manipulation",
                showVolume ? "bg-muted" : ""
              )}
            >
              {Math.round(track.volume * 100)}
            </Button>

            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 md:h-7 md:w-7 p-0 rounded-lg touch-manipulation">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onAction && (
                  <>
                    {/* Add Vocals for instrumental tracks */}
                    {track.type === 'instrumental' && (
                      <DropdownMenuItem onClick={() => onAction('add_vocals')}>
                        <Mic2 className="w-4 h-4 mr-2 text-blue-400" />
                        Добавить вокал
                      </DropdownMenuItem>
                    )}
                    {/* Replace Instrumental for vocal tracks (when stems exist) */}
                    {track.type === 'vocal' && stemsExist && (
                      <DropdownMenuItem onClick={() => onAction('replace_instrumental')}>
                        <Guitar className="w-4 h-4 mr-2 text-green-400" />
                        Заменить инструментал
                      </DropdownMenuItem>
                    )}
                    {/* Extend and Replace Section - ONLY for source track, disabled when stems exist */}
                    {isSourceTrack && !stemsExist && (
                      <>
                        <DropdownMenuItem onClick={() => onAction('extend')}>
                          <ArrowRight className="w-4 h-4 mr-2 text-green-400" />
                          Расширить трек
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction('replace_section')}>
                          <Scissors className="w-4 h-4 mr-2 text-amber-400" />
                          Заменить секцию
                        </DropdownMenuItem>
                      </>
                    )}
                    {/* Show disabled state when stems exist for main track */}
                    {isSourceTrack && stemsExist && (
                      <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                        <Scissors className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-xs">Стемы блокируют изменения</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onAction('reference')}>
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      Как референс
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAction('effects')}>
                      <Sliders className="w-4 h-4 mr-2" />
                      Эффекты
                    </DropdownMenuItem>
                    {/* MIDI transcription for all tracks with audio */}
                    {audioUrl && (
                      <DropdownMenuItem onClick={() => onAction('transcribe')}>
                        <FileMusic className="w-4 h-4 mr-2 text-cyan-400" />
                        MIDI / Ноты
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {audioUrl && (
                      <DropdownMenuItem onClick={() => onAction('download')}>
                        <Download className="w-4 h-4 mr-2" />
                        Скачать
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onRemove}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Volume slider (expandable) */}
        <AnimatePresence>
          {showVolume && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 pb-2 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onToggleMute}
                >
                  {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                </Button>
                <Slider
                  value={[track.volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => onVolumeChange(v[0])}
                  className="flex-1"
                  disabled={track.muted}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform with progress overlay */}
        <div className="h-16 px-1 pb-1 relative">
          {audioUrl ? (
            <>
              <OptimizedStemWaveform
                audioUrl={audioUrl}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                isMuted={track.muted}
                color={track.type}
                height={64}
                onSeek={onSeek}
              />
              {/* Playhead line only - progress is rendered by OptimizedStemWaveform */}
              {duration > 0 && (
                <div 
                  className="absolute top-0 bottom-1 w-0.5 bg-primary pointer-events-none z-10"
                  style={{ 
                    left: `${(currentTime / duration) * 100}%`,
                    boxShadow: '0 0 6px var(--primary)',
                  }}
                />
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground bg-muted/20 rounded">
              Нет аудио
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
