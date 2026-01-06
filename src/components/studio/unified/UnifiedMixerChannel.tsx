/**
 * UnifiedMixerChannel - Single channel component for all mixer needs
 * 
 * Replaces: StemChannel, MixerChannel
 * Supports: vertical (mixer), horizontal (track), and compact variants
 */

import { memo, useCallback, useMemo } from 'react';
import { motion } from '@/lib/motion';
import {
  Mic2, Guitar, Drum, Music, Piano, Radio, Waves,
  Volume2, VolumeX, Headphones, Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { SimpleMeter } from './AudioMeter';
import { UnifiedWaveform, type StemType } from '@/components/waveform/UnifiedWaveform';

export type ChannelVariant = 'vertical' | 'horizontal' | 'compact';

// Stem type configuration with icons and colors
const STEM_CONFIG: Record<string, { 
  icon: React.ComponentType<any>; 
  label: string; 
  color: string;
  shortLabel: string;
}> = {
  vocals: { icon: Mic2, label: 'Вокал', shortLabel: 'VOX', color: 'text-blue-500 bg-blue-500/10' },
  vocal: { icon: Mic2, label: 'Вокал', shortLabel: 'VOX', color: 'text-blue-500 bg-blue-500/10' },
  backing_vocals: { icon: Mic2, label: 'Бэк-вокал', shortLabel: 'BV', color: 'text-cyan-500 bg-cyan-500/10' },
  drums: { icon: Drum, label: 'Ударные', shortLabel: 'DRM', color: 'text-orange-500 bg-orange-500/10' },
  bass: { icon: Waves, label: 'Бас', shortLabel: 'BAS', color: 'text-purple-500 bg-purple-500/10' },
  guitar: { icon: Guitar, label: 'Гитара', shortLabel: 'GTR', color: 'text-amber-500 bg-amber-500/10' },
  keyboard: { icon: Piano, label: 'Клавишные', shortLabel: 'KEY', color: 'text-pink-500 bg-pink-500/10' },
  piano: { icon: Piano, label: 'Пианино', shortLabel: 'PNO', color: 'text-pink-500 bg-pink-500/10' },
  strings: { icon: Music, label: 'Струнные', shortLabel: 'STR', color: 'text-emerald-500 bg-emerald-500/10' },
  brass: { icon: Radio, label: 'Духовые', shortLabel: 'BRS', color: 'text-yellow-500 bg-yellow-500/10' },
  woodwinds: { icon: Radio, label: 'Дер. духовые', shortLabel: 'WW', color: 'text-lime-500 bg-lime-500/10' },
  percussion: { icon: Drum, label: 'Перкуссия', shortLabel: 'PRC', color: 'text-red-500 bg-red-500/10' },
  synth: { icon: Piano, label: 'Синтезатор', shortLabel: 'SYN', color: 'text-violet-500 bg-violet-500/10' },
  fx: { icon: Waves, label: 'Эффекты', shortLabel: 'FX', color: 'text-teal-500 bg-teal-500/10' },
  atmosphere: { icon: Waves, label: 'Атмосфера', shortLabel: 'ATM', color: 'text-sky-500 bg-sky-500/10' },
  instrumental: { icon: Guitar, label: 'Инструментал', shortLabel: 'INS', color: 'text-green-500 bg-green-500/10' },
  other: { icon: Music, label: 'Другое', shortLabel: 'OTH', color: 'text-gray-500 bg-gray-500/10' },
};

export interface UnifiedMixerChannelProps {
  // Identification
  id: string;
  name?: string;
  type: string;
  
  // State
  volume: number;
  pan?: number;
  muted: boolean;
  solo: boolean;
  
  // Display variant
  variant?: ChannelVariant;
  
  // Audio data (for waveform)
  audioUrl?: string;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  
  // Options
  showWaveform?: boolean;
  showMeter?: boolean;
  showEffectsButton?: boolean;
  hasEffects?: boolean;
  
  // Callbacks
  onVolumeChange: (volume: number) => void;
  onPanChange?: (pan: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onSeek?: (time: number) => void;
  onOpenEffects?: () => void;
  
  // Animation
  delay?: number;
  className?: string;
}

export const UnifiedMixerChannel = memo(function UnifiedMixerChannel({
  id,
  name,
  type,
  volume,
  pan = 0,
  muted,
  solo,
  variant = 'horizontal',
  audioUrl,
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  showWaveform = true,
  showMeter = false,
  showEffectsButton = false,
  hasEffects = false,
  onVolumeChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
  onSeek,
  onOpenEffects,
  delay = 0,
  className,
}: UnifiedMixerChannelProps) {
  const haptic = useHapticFeedback();
  
  const config = useMemo(() => {
    return STEM_CONFIG[type.toLowerCase()] || STEM_CONFIG.other;
  }, [type]);
  
  const Icon = config.icon;
  const isMuted = muted;

  const handleMute = useCallback(() => {
    haptic.select();
    onToggleMute();
  }, [haptic, onToggleMute]);

  const handleSolo = useCallback(() => {
    haptic.select();
    onToggleSolo();
  }, [haptic, onToggleSolo]);

  const handleEffects = useCallback(() => {
    haptic.select();
    onOpenEffects?.();
  }, [haptic, onOpenEffects]);

  // Vertical (mixer) layout
  if (variant === 'vertical') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={cn(
          "flex flex-col items-center p-3 rounded-xl border min-w-[90px]",
          "bg-card/50",
          muted ? "opacity-60 border-border/30" : "border-border/50",
          className
        )}
      >
        {/* Icon */}
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-2", config.color)}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Name */}
        <p className="text-xs font-medium text-center truncate w-full mb-2">
          {name || config.shortLabel}
        </p>

        {/* Level Meter + Fader */}
        <div className="flex items-end gap-1 h-32 mb-3">
          {showMeter && (
            <SimpleMeter
              volume={volume}
              isMuted={muted}
              isPlaying={isPlaying}
              height={120}
              width={6}
            />
          )}

          {/* Vertical Fader */}
          <div className="h-full w-10 relative">
            <div className="absolute inset-0 bg-muted rounded-lg overflow-hidden">
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-primary/50"
                animate={{ height: `${volume * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            />
          </div>
        </div>

        {/* Volume Value */}
        <span className="text-[10px] font-mono text-muted-foreground mb-2">
          {muted ? 'M' : `${Math.round(volume * 100)}`}
        </span>

        {/* Pan Control */}
        {onPanChange && (
          <div className="w-full mb-2">
            <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
              <span>L</span>
              <span>R</span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.1}
              value={pan}
              onChange={(e) => onPanChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center text-[9px] text-muted-foreground mt-0.5">
              {pan === 0 ? 'C' : pan < 0 ? `L${Math.abs(Math.round(pan * 100))}` : `R${Math.round(pan * 100)}`}
            </div>
          </div>
        )}

        {/* Mute/Solo Buttons - 44px touch targets */}
        <div className="flex gap-1.5">
          <Button
            variant={muted ? "destructive" : "outline"}
            size="icon"
            className="h-11 w-11 min-w-11 min-h-11"
            onClick={handleMute}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant={solo ? "default" : "outline"}
            size="icon"
            className="h-11 w-11 min-w-11 min-h-11"
            onClick={handleSolo}
          >
            <Headphones className="w-4 h-4" />
          </Button>
        </div>

        {/* Effects Button */}
        {showEffectsButton && onOpenEffects && (
          <Button
            variant={hasEffects ? "secondary" : "ghost"}
            size="sm"
            className="w-full mt-2 h-8 text-xs"
            onClick={handleEffects}
          >
            <Sliders className="w-3 h-3 mr-1" />
            FX
          </Button>
        )}
      </motion.div>
    );
  }

  // Compact layout
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className={cn(
          "flex flex-col items-center p-2 rounded-lg border min-w-[70px]",
          "bg-card/50",
          muted ? "opacity-50 border-border/30" : "border-border/50",
          className
        )}
      >
        {/* Icon */}
        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center mb-1", config.color)}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Name */}
        <p className="text-[10px] font-medium text-center truncate w-full mb-1">
          {config.shortLabel}
        </p>

        {/* Mini Fader */}
        <div className="h-16 w-6 relative mb-1">
          <div className="absolute inset-0 bg-muted rounded overflow-hidden">
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-primary"
              animate={{ height: `${volume * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
          />
        </div>

        {/* M/S Buttons */}
        <div className="flex gap-0.5">
          <button
            onClick={handleMute}
            className={cn(
              "w-7 h-7 rounded text-[10px] font-bold transition-colors",
              muted
                ? "bg-destructive text-destructive-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            M
          </button>
          <button
            onClick={handleSolo}
            className={cn(
              "w-7 h-7 rounded text-[10px] font-bold transition-colors",
              solo
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            S
          </button>
        </div>
      </motion.div>
    );
  }

  // Horizontal (track) layout - default
  return (
    <div className={cn(
      "flex flex-col gap-2 p-3 rounded-xl border transition-all",
      muted 
        ? "bg-muted/30 border-border/30 opacity-60" 
        : solo 
          ? "bg-primary/5 border-primary/30 shadow-sm" 
          : "bg-card border-border/50 hover:border-border",
      className
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
            <span className="text-sm font-medium truncate">{name || config.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => onVolumeChange(v[0])}
            disabled={muted}
            className="w-full"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant={solo ? "default" : "outline"}
            size="sm"
            onClick={handleSolo}
            className={cn(
              "h-8 w-8 p-0 text-xs font-bold",
              solo && "bg-primary text-primary-foreground"
            )}
          >
            S
          </Button>
          <Button
            variant={muted ? "destructive" : "outline"}
            size="sm"
            onClick={handleMute}
            className="h-8 w-8 p-0"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Waveform */}
      {showWaveform && audioUrl && (
        <UnifiedWaveform
          audioUrl={audioUrl}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          isMuted={isMuted}
          stemType={type.toLowerCase() as StemType}
          mode="stem"
          height={40}
          onSeek={onSeek}
        />
      )}
    </div>
  );
});

export default UnifiedMixerChannel;
