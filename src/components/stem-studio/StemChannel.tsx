import { memo, useState } from 'react';
import { 
  Mic2, Guitar, Drum, Music, Piano, Radio, Waves,
  Volume2, VolumeX, FileMusic, Loader2, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TrackStem } from '@/hooks/useTrackStems';
import { StemWaveform } from './StemWaveform';
import { StemEffectsPanel } from './effects/StemEffectsPanel';
import { useStemMidi } from '@/hooks/useStemMidi';
import { 
  StemEffects, 
  EQSettings, 
  CompressorSettings, 
  ReverbSettings,
  eqPresets,
  compressorPresets,
  reverbPresets,
  defaultStemEffects,
} from '@/hooks/studio';

interface StemChannelProps {
  stem: TrackStem;
  trackId: string;
  trackTitle: string;
  state: {
    muted: boolean;
    solo: boolean;
    volume: number;
  };
  effects?: StemEffects;
  onToggle: (type: 'mute' | 'solo') => void;
  onVolumeChange: (volume: number) => void;
  onEQChange?: (settings: Partial<EQSettings>) => void;
  onCompressorChange?: (settings: Partial<CompressorSettings>) => void;
  onReverbChange?: (settings: Partial<ReverbSettings>) => void;
  onEQPreset?: (preset: keyof typeof eqPresets) => void;
  onCompressorPreset?: (preset: keyof typeof compressorPresets) => void;
  onReverbPreset?: (preset: keyof typeof reverbPresets) => void;
  onResetEffects?: () => void;
  getCompressorReduction?: () => number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  isEngineReady?: boolean;
}

const stemConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string; waveColor: string }> = {
  vocals: { icon: Mic2, label: 'Вокал', color: 'text-blue-500 bg-blue-500/10', waveColor: 'blue' },
  vocal: { icon: Mic2, label: 'Вокал', color: 'text-blue-500 bg-blue-500/10', waveColor: 'blue' },
  backing_vocals: { icon: Mic2, label: 'Бэк-вокал', color: 'text-cyan-500 bg-cyan-500/10', waveColor: 'cyan' },
  drums: { icon: Drum, label: 'Ударные', color: 'text-orange-500 bg-orange-500/10', waveColor: 'orange' },
  bass: { icon: Waves, label: 'Бас', color: 'text-purple-500 bg-purple-500/10', waveColor: 'purple' },
  guitar: { icon: Guitar, label: 'Гитара', color: 'text-amber-500 bg-amber-500/10', waveColor: 'amber' },
  keyboard: { icon: Piano, label: 'Клавишные', color: 'text-pink-500 bg-pink-500/10', waveColor: 'pink' },
  piano: { icon: Piano, label: 'Пианино', color: 'text-pink-500 bg-pink-500/10', waveColor: 'pink' },
  strings: { icon: Music, label: 'Струнные', color: 'text-emerald-500 bg-emerald-500/10', waveColor: 'emerald' },
  brass: { icon: Radio, label: 'Духовые', color: 'text-yellow-500 bg-yellow-500/10', waveColor: 'yellow' },
  woodwinds: { icon: Radio, label: 'Дер. духовые', color: 'text-lime-500 bg-lime-500/10', waveColor: 'lime' },
  percussion: { icon: Drum, label: 'Перкуссия', color: 'text-red-500 bg-red-500/10', waveColor: 'red' },
  synth: { icon: Piano, label: 'Синтезатор', color: 'text-violet-500 bg-violet-500/10', waveColor: 'violet' },
  fx: { icon: Waves, label: 'Эффекты', color: 'text-teal-500 bg-teal-500/10', waveColor: 'teal' },
  atmosphere: { icon: Waves, label: 'Атмосфера', color: 'text-sky-500 bg-sky-500/10', waveColor: 'sky' },
  instrumental: { icon: Guitar, label: 'Инструментал', color: 'text-green-500 bg-green-500/10', waveColor: 'green' },
  other: { icon: Music, label: 'Другое', color: 'text-gray-500 bg-gray-500/10', waveColor: 'gray' },
};

export const StemChannel = memo(({ 
  stem, 
  trackId,
  trackTitle,
  state, 
  effects = defaultStemEffects,
  onToggle, 
  onVolumeChange,
  onEQChange,
  onCompressorChange,
  onReverbChange,
  onEQPreset,
  onCompressorPreset,
  onReverbPreset,
  onResetEffects,
  getCompressorReduction,
  isPlaying,
  currentTime,
  duration,
  onSeek,
  isEngineReady = false,
}: StemChannelProps) => {
  const config = stemConfig[stem.stem_type.toLowerCase()] || stemConfig.other;
  const Icon = config.icon;
  
  const hasSolo = state.solo;
  const isMuted = state.muted || (!state.solo && hasSolo);

  // Check if effects are available
  const hasEffectsSupport = onEQChange && onCompressorChange && onReverbChange;

  // MIDI transcription for this stem
  const {
    isTranscribing,
    transcribeToMidi,
    downloadMidi,
    hasMidi,
    latestMidi,
  } = useStemMidi(trackId, stem.id);

  const handleMidiTranscribe = async () => {
    await transcribeToMidi(stem.audio_url, 'mt3', stem.stem_type);
  };

  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 rounded-xl border transition-all",
      state.muted 
        ? "bg-muted/30 border-border/30 opacity-60" 
        : state.solo 
          ? "bg-primary/5 border-primary/30 shadow-sm" 
          : "bg-card border-border/50 hover:border-border"
    )}>
      {/* Header Row */}
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
          config.color
        )}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Label & Volume */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium truncate">{config.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {Math.round(state.volume * 100)}%
            </span>
          </div>
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

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* MIDI Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={hasMidi ? "secondary" : "ghost"}
                size="sm"
                onClick={hasMidi ? () => downloadMidi(latestMidi!.audio_url, `${trackTitle}_${stem.stem_type}`) : handleMidiTranscribe}
                disabled={isTranscribing}
                className={cn(
                  "h-8 w-8 p-0",
                  hasMidi && "text-primary"
                )}
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : hasMidi ? (
                  <Download className="w-4 h-4" />
                ) : (
                  <FileMusic className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isTranscribing 
                ? 'Создание MIDI...' 
                : hasMidi 
                  ? 'Скачать MIDI' 
                  : 'Создать MIDI'}
            </TooltipContent>
          </Tooltip>

          <Button
            variant={state.solo ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle('solo')}
            className={cn(
              "h-8 w-8 p-0 text-xs font-bold",
              state.solo && "bg-primary text-primary-foreground"
            )}
          >
            S
          </Button>
          <Button
            variant={state.muted ? "destructive" : "outline"}
            size="sm"
            onClick={() => onToggle('mute')}
            className="h-8 w-8 p-0"
          >
            {state.muted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Waveform */}
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

      {/* Effects Panel */}
      {hasEffectsSupport && (
        <StemEffectsPanel
          effects={effects}
          onEQChange={onEQChange}
          onCompressorChange={onCompressorChange}
          onReverbChange={onReverbChange}
          onEQPreset={onEQPreset!}
          onCompressorPreset={onCompressorPreset!}
          onReverbPreset={onReverbPreset!}
          onReset={onResetEffects!}
          getCompressorReduction={getCompressorReduction}
          disabled={!isEngineReady}
        />
      )}
    </div>
  );
});
