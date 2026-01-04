/**
 * MixerChannel - Individual channel strip for the mixer
 * Includes volume fader, pan knob, mute/solo, and level meter
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Volume2, VolumeX, Headphones, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { SimpleMeter } from './AudioMeter';

export interface MixerChannelProps {
  id: string;
  name: string;
  shortName?: string;
  icon?: string;
  color?: string;
  volume: number;
  pan?: number;
  muted: boolean;
  solo: boolean;
  isPlaying?: boolean;
  hasEffects?: boolean;
  onVolumeChange: (volume: number) => void;
  onPanChange?: (pan: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onOpenEffects?: () => void;
  compact?: boolean;
  delay?: number;
}

export const MixerChannel = memo(function MixerChannel({
  id,
  name,
  shortName,
  icon = '🎵',
  color = 'hsl(var(--primary))',
  volume,
  pan = 0,
  muted,
  solo,
  isPlaying = false,
  hasEffects = false,
  onVolumeChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
  onOpenEffects,
  compact = false,
  delay = 0,
}: MixerChannelProps) {
  const haptic = useHapticFeedback();

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

  if (compact) {
    return (
      <CompactMixerChannel
        name={shortName || name}
        icon={icon}
        color={color}
        volume={volume}
        muted={muted}
        solo={solo}
        isPlaying={isPlaying}
        onVolumeChange={onVolumeChange}
        onToggleMute={handleMute}
        onToggleSolo={handleSolo}
        delay={delay}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "flex flex-col items-center p-3 rounded-xl border min-w-[90px]",
        "bg-card/50",
        muted ? "opacity-60 border-border/30" : "border-border/50"
      )}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl mb-2"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>

      {/* Name */}
      <p className="text-xs font-medium text-center truncate w-full mb-2">
        {shortName || name}
      </p>

      {/* Level Meter + Fader */}
      <div className="flex items-end gap-1 h-32 mb-3">
        {/* Meter */}
        <SimpleMeter
          volume={volume}
          isMuted={muted}
          isPlaying={isPlaying}
          height={120}
          width={6}
        />

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

      {/* Mute/Solo Buttons - 44px minimum touch targets */}
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
      {onOpenEffects && (
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
});

// Compact version for horizontal scrolling
interface CompactMixerChannelProps {
  name: string;
  icon: string;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  isPlaying: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  delay?: number;
}

const CompactMixerChannel = memo(function CompactMixerChannel({
  name,
  icon,
  color,
  volume,
  muted,
  solo,
  isPlaying,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  delay = 0,
}: CompactMixerChannelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={cn(
        "flex flex-col items-center p-2 rounded-lg border min-w-[70px]",
        "bg-card/50",
        muted ? "opacity-50 border-border/30" : "border-border/50"
      )}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center text-sm mb-1"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>

      {/* Name */}
      <p className="text-[10px] font-medium text-center truncate w-full mb-1">
        {name}
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
          onClick={onToggleMute}
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
          onClick={onToggleSolo}
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
});
