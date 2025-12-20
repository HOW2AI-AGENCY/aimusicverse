/**
 * IntegratedStemTracks - Minimalist DAW-style stem tracks
 * 
 * Features:
 * - Clean, minimal design focused on waveform
 * - Mobile-first responsive layout
 * - Swipe-friendly stem controls
 * - Synchronized playhead with main timeline
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Mic2, Guitar, Drum, Music, Piano, Waves,
  Volume2, VolumeX, MoreHorizontal, Music2, Download,
  Sparkles, ChevronDown, ChevronUp, Headphones
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
import { StemWaveform } from '@/components/stem-studio/StemWaveform';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface IntegratedStemTracksProps {
  stems: TrackStem[];
  stemStates: Record<string, StemState>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  masterMuted: boolean;
  onStemToggle: (stemId: string, type: 'mute' | 'solo') => void;
  onStemVolumeChange: (stemId: string, volume: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onMasterMuteToggle: () => void;
  onSeek: (time: number) => void;
  onStemAction: (stem: TrackStem, action: 'midi' | 'reference' | 'download' | 'effects') => void;
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
  instrumental: { 
    icon: Guitar, 
    label: 'Инструментал', 
    shortLabel: 'INS',
    gradient: 'from-green-500/20 to-green-600/5',
    accent: 'text-green-400 bg-green-500/20 border-green-500/30'
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
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onToggle: (type: 'mute' | 'solo') => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onAction: (action: 'midi' | 'reference' | 'download' | 'effects') => void;
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
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Solo */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle('solo')}
              className={cn(
                "h-7 w-7 p-0 rounded-lg font-mono text-[10px] font-bold",
                state.solo 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              S
            </Button>
            
            {/* Mute */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle('mute')}
              className={cn(
                "h-7 w-7 p-0 rounded-lg",
                state.muted 
                  ? "bg-destructive/20 text-destructive" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {state.muted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
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

            {/* Menu */}
            <DropdownMenu>
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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAction('download')}>
                  <Download className="w-4 h-4 mr-2" />
                  Скачать
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

        {/* Waveform */}
        <div className="h-14 px-1 pb-1">
          <StemWaveform
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
      </div>
    </motion.div>
  );
});

StemTrackRowMobile.displayName = 'StemTrackRowMobile';

// Desktop stem row - more compact horizontal layout
const StemTrackRowDesktop = memo(({ 
  stem, 
  state, 
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
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onToggle: (type: 'mute' | 'solo') => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onAction: (action: 'midi' | 'reference' | 'download' | 'effects') => void;
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
      <div className="flex items-center gap-2 w-28 shrink-0">
        <div className={cn(
          "w-6 h-6 rounded-md flex items-center justify-center",
          config.accent
        )}>
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-[11px] font-mono font-semibold tracking-wider">
          {config.shortLabel}
        </span>
      </div>

      {/* S/M buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle('solo')}
          className={cn(
            "h-5 w-5 p-0 rounded text-[9px] font-bold",
            state.solo && "bg-primary text-primary-foreground"
          )}
        >
          S
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle('mute')}
          className={cn(
            "h-5 w-5 p-0 rounded",
            state.muted && "bg-destructive/20 text-destructive"
          )}
        >
          {state.muted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
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

      {/* Waveform - main focus */}
      <div className="flex-1 h-8 min-w-0 rounded overflow-hidden bg-background/30">
        <StemWaveform
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction('download')}
          className="h-6 w-6 p-0"
          title="Скачать"
        >
          <Download className="w-3 h-3" />
        </Button>
      </div>
    </motion.div>
  );
});

StemTrackRowDesktop.displayName = 'StemTrackRowDesktop';

export function IntegratedStemTracks({
  stems,
  stemStates,
  isPlaying,
  currentTime,
  duration,
  masterVolume,
  masterMuted,
  onStemToggle,
  onStemVolumeChange,
  onMasterVolumeChange,
  onMasterMuteToggle,
  onSeek,
  onStemAction,
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
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono">
            {stems.length}
          </Badge>
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

        {/* Master volume - compact */}
        <div className="flex items-center gap-2">
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

      {/* Stem tracks */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {isMobile ? (
              // Mobile: Card-style stacked layout
              <div className="p-2 space-y-2">
                {stems.map((stem, index) => (
                  <motion.div
                    key={stem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <StemTrackRowMobile
                      stem={stem}
                      state={stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 }}
                      isPlaying={isPlaying}
                      currentTime={currentTime}
                      duration={duration}
                      onToggle={(type) => onStemToggle(stem.id, type)}
                      onVolumeChange={(vol) => onStemVolumeChange(stem.id, vol)}
                      onSeek={onSeek}
                      onAction={(action) => onStemAction(stem, action)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              // Desktop: Compact DAW-style rows
              <div className="bg-card/20">
                {stems.map((stem, index) => (
                  <motion.div
                    key={stem.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <StemTrackRowDesktop
                      stem={stem}
                      state={stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 }}
                      isPlaying={isPlaying}
                      currentTime={currentTime}
                      duration={duration}
                      onToggle={(type) => onStemToggle(stem.id, type)}
                      onVolumeChange={(vol) => onStemVolumeChange(stem.id, vol)}
                      onSeek={onSeek}
                      onAction={(action) => onStemAction(stem, action)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
