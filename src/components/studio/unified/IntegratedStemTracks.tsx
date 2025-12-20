/**
 * IntegratedStemTracks - Stem tracks displayed under main timeline
 * 
 * Features:
 * - Synchronized playhead with main timeline
 * - Mute/Solo/Volume controls for each stem
 * - Effects panel integration
 * - Action menu (MIDI, Reference, Download)
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Mic2, Guitar, Drum, Music, Piano, Radio, Waves,
  Volume2, VolumeX, MoreVertical, Music2, Download,
  ArrowRight, Sliders, ChevronDown, ChevronUp
} from 'lucide-react';
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
import { TrackStem } from '@/hooks/useTrackStems';
import { StemWaveform } from '@/components/stem-studio/StemWaveform';

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

const stemConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string; waveColor: string }> = {
  vocals: { icon: Mic2, label: 'Вокал', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30', waveColor: 'blue' },
  vocal: { icon: Mic2, label: 'Вокал', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30', waveColor: 'blue' },
  drums: { icon: Drum, label: 'Ударные', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30', waveColor: 'orange' },
  bass: { icon: Waves, label: 'Бас', color: 'text-purple-500 bg-purple-500/10 border-purple-500/30', waveColor: 'purple' },
  guitar: { icon: Guitar, label: 'Гитара', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', waveColor: 'amber' },
  piano: { icon: Piano, label: 'Пианино', color: 'text-pink-500 bg-pink-500/10 border-pink-500/30', waveColor: 'pink' },
  strings: { icon: Music, label: 'Струнные', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', waveColor: 'emerald' },
  instrumental: { icon: Guitar, label: 'Инструментал', color: 'text-green-500 bg-green-500/10 border-green-500/30', waveColor: 'green' },
  other: { icon: Music, label: 'Другое', color: 'text-gray-500 bg-gray-500/10 border-gray-500/30', waveColor: 'gray' },
};

const StemTrackRow = memo(({ 
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
  const isMuted = state.muted;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 border-b border-border/30",
        "hover:bg-muted/30 transition-colors",
        state.muted && "opacity-50"
      )}
    >
      {/* Stem info + controls */}
      <div className="flex items-center gap-2 w-40 shrink-0">
        {/* Icon */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
          config.color
        )}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Label */}
        <span className="text-xs font-medium truncate flex-1">{config.label}</span>

        {/* Solo/Mute */}
        <div className="flex items-center gap-0.5">
          <Button
            variant={state.solo ? "default" : "ghost"}
            size="sm"
            onClick={() => onToggle('solo')}
            className={cn(
              "h-6 w-6 p-0 text-[10px] font-bold",
              state.solo && "bg-primary text-primary-foreground"
            )}
          >
            S
          </Button>
          <Button
            variant={state.muted ? "destructive" : "ghost"}
            size="sm"
            onClick={() => onToggle('mute')}
            className="h-6 w-6 p-0"
          >
            {state.muted ? (
              <VolumeX className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Volume slider */}
      <div className="w-20 shrink-0">
        <Slider
          value={[state.volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => onVolumeChange(v[0])}
          disabled={state.muted}
          className="w-full"
        />
      </div>

      {/* Waveform */}
      <div className="flex-1 h-10 min-w-0">
        <StemWaveform
          audioUrl={stem.audio_url}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          isMuted={isMuted}
          color={config.waveColor}
          height={40}
          onSeek={onSeek}
        />
      </div>

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onAction('reference')}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Использовать как референс
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('midi')}>
            <Music2 className="w-4 h-4 mr-2" />
            MIDI транскрипция
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction('effects')}>
            <Sliders className="w-4 h-4 mr-2" />
            Эффекты
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction('download')}>
            <Download className="w-4 h-4 mr-2" />
            Скачать
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
});

StemTrackRow.displayName = 'StemTrackRow';

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
  const [isExpanded, setIsExpanded] = useState(true);

  if (!stems || stems.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border-t border-border/50 bg-card/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          <span>Стемы ({stems.length})</span>
          {effectsEnabled && (
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">
              FX
            </span>
          )}
        </button>

        {/* Master controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMasterMuteToggle}
            className={cn("h-7 w-7 p-0", masterMuted && "text-destructive")}
          >
            {masterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <div className="w-24 flex items-center gap-2">
            <Slider
              value={[masterVolume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => onMasterVolumeChange(v[0])}
              disabled={masterMuted}
              className="w-full"
            />
            <span className="text-xs text-muted-foreground w-8">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Stem tracks */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {stems.map((stem) => (
              <StemTrackRow
                key={stem.id}
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
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
