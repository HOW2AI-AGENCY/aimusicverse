/**
 * IntegratedStemTracks - Minimalist DAW-style stem tracks
 * 
 * Features:
 * - Clean, minimal design focused on waveform
 * - Mobile-first responsive layout
 * - Swipe-friendly stem controls
 * - Synchronized playhead with main timeline
 * - Inline MIDI notes preview with transcription support
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Mic2, Guitar, Drum, Music, Piano, Waves,
  Volume2, VolumeX, MoreHorizontal, Music2, Download,
  Sparkles, ChevronDown, ChevronUp, Headphones, Plus, Sliders,
  Wand2, FileMusic, Eye, Loader2, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TrackStem } from '@/hooks/useTrackStems';
import { OptimizedStemWaveform } from '@/components/stem-studio/OptimizedStemWaveform';
import { StemTrackSkeleton } from '@/components/studio/StemTrackSkeleton';
import { VirtualizedStemList } from '@/components/studio/VirtualizedStemList';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { StemNotesPreview } from '@/components/studio/StemNotesPreview';
import { StemTranscription } from '@/hooks/useStemTranscription';
import { preloadRouteComponents } from '@/components/lazy';

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface IntegratedStemTracksProps {
  stems: TrackStem[];
  stemStates: Record<string, StemState>;
  transcriptionsByStem?: Record<string, StemTranscription>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  masterMuted: boolean;
  stemsReady?: boolean;
  stemsLoadingProgress?: number;
  onStemToggle: (stemId: string, type: 'mute' | 'solo') => void;
  onStemVolumeChange: (stemId: string, volume: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onMasterMuteToggle: () => void;
  onSeek: (time: number) => void;
  onStemAction: (stem: TrackStem, action: 'midi' | 'reference' | 'download' | 'effects' | 'view-notes' | 'delete' | 'arrangement') => void;
  onAddTrack?: () => void;
  effectsEnabled?: boolean;
  className?: string;
}

const stemConfig: Record<string, { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  shortLabel: string;
  gradient: string;
  accent: string;
}> = {
  vocals: { 
    icon: Mic2, 
    label: 'Вокал', 
    shortLabel: 'VOX',
    gradient: 'from-blue-500/20 to-blue-600/5',
    accent: 'text-blue-400 bg-blue-500/20 border-blue-500/30'
  },
  vocal: { 
    icon: Mic2, 
    label: 'Вокал', 
    shortLabel: 'VOX',
    gradient: 'from-blue-500/20 to-blue-600/5',
    accent: 'text-blue-400 bg-blue-500/20 border-blue-500/30'
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
  guitar: { 
    icon: Guitar, 
    label: 'Гитара', 
    shortLabel: 'GTR',
    gradient: 'from-amber-500/20 to-amber-600/5',
    accent: 'text-amber-400 bg-amber-500/20 border-amber-500/30'
  },
  piano: { 
    icon: Piano, 
    label: 'Пианино', 
    shortLabel: 'PNO',
    gradient: 'from-pink-500/20 to-pink-600/5',
    accent: 'text-pink-400 bg-pink-500/20 border-pink-500/30'
  },
  strings: { 
    icon: Music, 
    label: 'Струнные', 
    shortLabel: 'STR',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    accent: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
  },
  synth: { 
    icon: Sliders, 
    label: 'Синтезатор', 
    shortLabel: 'SYN',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
    accent: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
  },
  instrumental: { 
    icon: Guitar, 
    label: 'Инструментал', 
    shortLabel: 'INS',
    gradient: 'from-green-500/20 to-green-600/5',
    accent: 'text-green-400 bg-green-500/20 border-green-500/30'
  },
  // Generated stem types
  generated_drums: { 
    icon: Drum, 
    label: 'Ударные AI', 
    shortLabel: 'DRM+',
    gradient: 'from-orange-500/20 to-yellow-600/5',
    accent: 'text-orange-400 bg-orange-500/20 border-orange-500/30'
  },
  generated_bass: { 
    icon: Waves, 
    label: 'Бас AI', 
    shortLabel: 'BAS+',
    gradient: 'from-purple-500/20 to-violet-600/5',
    accent: 'text-purple-400 bg-purple-500/20 border-purple-500/30'
  },
  generated_piano: { 
    icon: Piano, 
    label: 'Пианино AI', 
    shortLabel: 'PNO+',
    gradient: 'from-pink-500/20 to-rose-600/5',
    accent: 'text-pink-400 bg-pink-500/20 border-pink-500/30'
  },
  generated_strings: { 
    icon: Music, 
    label: 'Струнные AI', 
    shortLabel: 'STR+',
    gradient: 'from-emerald-500/20 to-teal-600/5',
    accent: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
  },
  generated_synth: { 
    icon: Sliders, 
    label: 'Синтезатор AI', 
    shortLabel: 'SYN+',
    gradient: 'from-cyan-500/20 to-blue-600/5',
    accent: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
  },
  generated_sfx: { 
    icon: Sparkles, 
    label: 'Эффекты AI', 
    shortLabel: 'SFX+',
    gradient: 'from-yellow-500/20 to-orange-600/5',
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

// Mobile-optimized stem row
const StemTrackRowMobile = memo(({ 
  stem, 
  state, 
  transcription,
  isPlaying, 
  currentTime, 
  duration,
  onToggle,
  onVolumeChange,
  onSeek,
  onAction,
}: {
  stem: TrackStem;
  state: StemState;
  transcription?: StemTranscription | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onToggle: (type: 'mute' | 'solo') => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onAction: (action: 'midi' | 'reference' | 'download' | 'effects' | 'view-notes' | 'delete' | 'arrangement') => void;
}) => {
  const [showVolume, setShowVolume] = useState(false);
  const haptic = useHapticFeedback();
  const config = stemConfig[stem.stem_type.toLowerCase()] || stemConfig.other;
  const Icon = config.icon;

  const handleToggle = (type: 'mute' | 'solo') => {
    haptic.select();
    onToggle(type);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        "relative group",
        state.muted && "opacity-40"
      )}
    >
      {/* Track lane */}
      <div className={cn(
        "flex flex-col rounded-xl overflow-hidden",
        "bg-gradient-to-r",
        config.gradient,
        "border border-border/30"
      )}>
        {/* Header row */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Stem icon + label */}
          <div className={cn(
            "flex items-center gap-2 min-w-0 flex-1"
          )}>
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
              config.accent
            )}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-mono font-semibold tracking-wider truncate">
              {config.shortLabel}
            </span>
            {/* Transcription indicators - show if ANY transcription file exists */}
            {transcription && (transcription.midi_url || transcription.pdf_url || transcription.gp5_url || transcription.mxml_url) && (
              <div className="flex items-center gap-0.5">
                {transcription.midi_url && (
                  <Badge variant="outline" className="h-4 px-1 text-[8px] bg-primary/10 border-primary/30 text-primary">
                    <Music2 className="w-2.5 h-2.5 mr-0.5" />
                    MIDI
                  </Badge>
                )}
                {transcription.gp5_url && (
                  <Badge variant="outline" className="h-4 px-1 text-[8px] bg-amber-500/10 border-amber-500/30 text-amber-500">
                    <Guitar className="w-2.5 h-2.5 mr-0.5" />
                    TAB
                  </Badge>
                )}
                {(transcription.pdf_url || transcription.mxml_url) && !transcription.gp5_url && !transcription.midi_url && (
                  <Badge variant="outline" className="h-4 px-1 text-[8px] bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
                    <FileMusic className="w-2.5 h-2.5 mr-0.5" />
                    NOTES
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Mute - M button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle('mute')}
              className={cn(
                "h-7 w-7 p-0 rounded-lg font-mono text-[10px] font-bold transition-all",
                state.muted 
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
                "h-7 w-7 p-0 rounded-lg font-mono text-[10px] font-bold transition-all",
                state.solo 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              S
            </Button>

            {/* Volume toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVolume(!showVolume)}
              className={cn(
                "h-7 px-2 rounded-lg text-[10px] font-mono",
                showVolume ? "bg-muted" : ""
              )}
            >
              {Math.round(state.volume * 100)}
            </Button>

            {/* Menu - preload components on open */}
            <DropdownMenu onOpenChange={(open) => open && preloadRouteComponents.studio()}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onAction('reference')}>
                  <Sparkles className="w-4 h-4 mr-2 text-primary" />
                  Как референс
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('midi')}>
                  <Music2 className="w-4 h-4 mr-2" />
                  MIDI
                </DropdownMenuItem>
                {(stem.stem_type === 'vocal' || stem.stem_type === 'vocals') && (
                  <DropdownMenuItem onClick={() => onAction('arrangement')}>
                    <Guitar className="w-4 h-4 mr-2 text-amber-500" />
                    Новая аранжировка
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onAction('effects')}>
                  <Sliders className="w-4 h-4 mr-2" />
                  Эффекты
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAction('download')}>
                  <Download className="w-4 h-4 mr-2" />
                  Скачать
                </DropdownMenuItem>
                {stem.source && stem.source !== 'separated' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onAction('delete')}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить стем
                    </DropdownMenuItem>
                  </>
                )}
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
              <Slider
                value={[state.volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => onVolumeChange(v[0])}
                className="w-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform - Optimized canvas-based renderer */}
        <div className="h-14 px-1 pb-1">
          <OptimizedStemWaveform
            audioUrl={stem.audio_url}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            isMuted={state.muted}
            color={stem.stem_type.toLowerCase()}
            height={56}
            onSeek={onSeek}
          />
        </div>

        {/* Notes Preview (if transcription exists with notes or PDF) */}
        {transcription && (transcription.notes || transcription.pdf_url || transcription.midi_url) && (
          <div className="px-3 pb-2">
            <StemNotesPreview
              transcription={transcription}
              currentTime={currentTime}
              duration={duration}
              onViewFull={() => onAction('view-notes')}
              onDownloadPdf={() => transcription.pdf_url && window.open(transcription.pdf_url, '_blank')}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
});

StemTrackRowMobile.displayName = 'StemTrackRowMobile';

// Desktop stem row - more compact horizontal layout
const StemTrackRowDesktop = memo(({ 
  stem, 
  state,
  transcription,
  isPlaying, 
  currentTime, 
  duration,
  onToggle,
  onVolumeChange,
  onSeek,
  onAction,
}: {
  stem: TrackStem;
  state: StemState;
  transcription?: StemTranscription | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onToggle: (type: 'mute' | 'solo') => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onAction: (action: 'midi' | 'reference' | 'download' | 'effects' | 'view-notes' | 'delete' | 'arrangement') => void;
}) => {
  const config = stemConfig[stem.stem_type.toLowerCase()] || stemConfig.other;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 group",
        "border-b border-border/20 last:border-0",
        "hover:bg-muted/20 transition-colors",
        state.muted && "opacity-40"
      )}
    >
      {/* Track label */}
      <div className="flex items-center gap-2 w-32 shrink-0">
        <div className={cn(
          "w-6 h-6 rounded-md flex items-center justify-center",
          config.accent
        )}>
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-[11px] font-mono font-semibold tracking-wider">
          {config.shortLabel}
        </span>
        {/* Transcription indicators - show if ANY file exists */}
        {transcription && (transcription.midi_url || transcription.pdf_url || transcription.gp5_url || transcription.mxml_url) && (
          <div className="flex items-center gap-0.5">
            {transcription.midi_url && (
              <Badge 
                variant="outline" 
                className="h-4 px-1 text-[8px] bg-primary/10 border-primary/30 text-primary cursor-pointer hover:bg-primary/20"
                onClick={() => onAction('view-notes')}
              >
                <Music2 className="w-2.5 h-2.5" />
              </Badge>
            )}
            {transcription.gp5_url && (
              <Badge 
                variant="outline" 
                className="h-4 px-1 text-[8px] bg-amber-500/10 border-amber-500/30 text-amber-500 cursor-pointer hover:bg-amber-500/20"
                onClick={() => onAction('view-notes')}
                title="Табулатура (Guitar Pro)"
              >
                <Guitar className="w-2.5 h-2.5" />
              </Badge>
            )}
            {(transcription.pdf_url || transcription.mxml_url) && !transcription.gp5_url && !transcription.midi_url && (
              <Badge 
                variant="outline" 
                className="h-4 px-1 text-[8px] bg-emerald-500/10 border-emerald-500/30 text-emerald-500 cursor-pointer hover:bg-emerald-500/20"
                onClick={() => onAction('view-notes')}
                title="Ноты (PDF/MusicXML)"
              >
                <FileMusic className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* M/S buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle('mute')}
          className={cn(
            "h-5 w-5 p-0 rounded text-[9px] font-bold transition-all",
            state.muted 
              ? "bg-destructive text-destructive-foreground" 
              : "hover:bg-muted"
          )}
        >
          M
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle('solo')}
          className={cn(
            "h-5 w-5 p-0 rounded text-[9px] font-bold transition-all",
            state.solo 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-muted"
          )}
        >
          S
        </Button>
      </div>

      {/* Volume */}
      <div className="w-16 shrink-0">
        <Slider
          value={[state.volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => onVolumeChange(v[0])}
          className="w-full"
        />
      </div>

      {/* Waveform - Optimized canvas-based renderer */}
      <div className="flex-1 h-8 min-w-0 rounded overflow-hidden bg-background/30">
        <OptimizedStemWaveform
          audioUrl={stem.audio_url}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          isMuted={state.muted}
          color={stem.stem_type.toLowerCase()}
          height={32}
          onSeek={onSeek}
        />
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('reference')}
          className="h-6 w-6 p-0"
          title="Использовать как референс"
        >
          <Sparkles className="w-3 h-3" />
        </Button>
        {(stem.stem_type === 'vocal' || stem.stem_type === 'vocals') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction('arrangement')}
            className="h-6 w-6 p-0 text-amber-500 hover:text-amber-400"
            title="Новая аранжировка"
          >
            <Guitar className="w-3 h-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('download')}
          className="h-6 w-6 p-0"
          title="Скачать"
        >
          <Download className="w-3 h-3" />
        </Button>
        {stem.source && stem.source !== 'separated' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction('delete')}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            title="Удалить стем"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
});

StemTrackRowDesktop.displayName = 'StemTrackRowDesktop';

export function IntegratedStemTracks({
  stems,
  stemStates,
  transcriptionsByStem,
  isPlaying,
  currentTime,
  duration,
  masterVolume,
  masterMuted,
  stemsReady = true,
  stemsLoadingProgress = 100,
  onStemToggle,
  onStemVolumeChange,
  onMasterVolumeChange,
  onMasterMuteToggle,
  onSeek,
  onStemAction,
  onAddTrack,
  effectsEnabled,
  className,
}: IntegratedStemTracksProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(true);
  const haptic = useHapticFeedback();

  const toggleExpand = useCallback(() => {
    haptic.select();
    setIsExpanded(prev => !prev);
  }, [haptic]);

  if (!stems || stems.length === 0) return null;

  // Count active stems
  const soloedCount = Object.values(stemStates).filter(s => s.solo).length;
  const mutedCount = Object.values(stemStates).filter(s => s.muted).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("flex flex-col", className)}
    >
      {/* Minimal header */}
      <div className={cn(
        "flex items-center justify-between px-3 py-2",
        "bg-muted/30 border-y border-border/30"
      )}>
        <button
          onClick={toggleExpand}
          className="flex items-center gap-2 text-xs font-medium"
        >
          <Headphones className="w-4 h-4 text-primary" />
          <span>Стемы</span>
          {!stemsReady && stemsLoadingProgress < 100 ? (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {stemsLoadingProgress}%
            </Badge>
          ) : (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono">
              {stems.length}
            </Badge>
          )}
          {soloedCount > 0 && (
            <Badge className="h-5 px-1.5 text-[10px] bg-primary">
              {soloedCount}S
            </Badge>
          )}
          {mutedCount > 0 && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-destructive">
              {mutedCount}M
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Add Track + Master volume */}
        <div className="flex items-center gap-2">
          {onAddTrack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddTrack}
              className="h-7 gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Добавить</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onMasterMuteToggle}
            className={cn(
              "h-7 w-7 p-0 rounded-lg",
              masterMuted && "text-destructive"
            )}
          >
            {masterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          {!isMobile && (
            <>
              <Slider
                value={[masterVolume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => onMasterVolumeChange(v[0])}
                disabled={masterMuted}
                className="w-20"
              />
              <span className="text-[10px] font-mono text-muted-foreground w-7">
                {Math.round(masterVolume * 100)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stem tracks - using virtualized list for performance */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Show skeleton while loading */}
            {!stemsReady && stemsLoadingProgress < 100 ? (
              <div className="p-2">
                <StemTrackSkeleton count={stems.length} isMobile={isMobile} />
              </div>
            ) : (
              <VirtualizedStemList
                stems={stems}
                stemStates={stemStates}
                transcriptionsByStem={transcriptionsByStem}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                isMobile={isMobile}
                onStemToggle={onStemToggle}
                onStemVolumeChange={onStemVolumeChange}
                onSeek={onSeek}
                onStemAction={onStemAction}
                renderMobileRow={(props) => (
                  <StemTrackRowMobile {...props} />
                )}
                renderDesktopRow={(props) => (
                  <StemTrackRowDesktop {...props} />
                )}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
