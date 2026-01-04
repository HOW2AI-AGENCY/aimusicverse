/**
 * MobileMixerContent - Mixer panel for mobile studio
 * Channel strips with volume, mute, solo for each track
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { Volume2, VolumeX, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { StudioProject } from '@/stores/useUnifiedStudioStore';

interface MobileMixerContentProps {
  project: StudioProject;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onVolumeChange: (trackId: string, volume: number) => void;
}

export const MobileMixerContent = memo(function MobileMixerContent({
  project,
  masterVolume,
  onMasterVolumeChange,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
}: MobileMixerContentProps) {
  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'vocal': return '🎤';
      case 'instrumental': return '🎸';
      case 'drums': return '🥁';
      case 'bass': return '🎸';
      case 'sfx': return '✨';
      default: return '🎵';
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Микшер</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Управление громкостью дорожек
        </p>
      </div>

      {/* Master Volume */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Мастер</span>
          <span className="text-sm font-mono">{Math.round(masterVolume * 100)}%</span>
        </div>
        <Slider
          value={[masterVolume]}
          max={1}
          step={0.01}
          onValueChange={(v) => onMasterVolumeChange(v[0])}
          className="w-full"
        />
      </div>

      {/* Channel Strips - Horizontal scroll on mobile */}
      {project.tracks.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Каналы</h4>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {project.tracks.map((track, index) => (
              <ChannelStrip
                key={track.id}
                name={track.name}
                type={track.type}
                icon={getTrackIcon(track.type)}
                color={track.color}
                volume={track.volume}
                muted={track.muted}
                solo={track.solo}
                onVolumeChange={(v) => onVolumeChange(track.id, v)}
                onToggleMute={() => onToggleMute(track.id)}
                onToggleSolo={() => onToggleSolo(track.id)}
                delay={index * 0.05}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Добавьте дорожки для микширования
        </div>
      )}

      {/* Tips */}
      <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border/30">
        Прокрутите вправо для просмотра всех каналов
      </div>
    </div>
  );
});

// Individual channel strip
interface ChannelStripProps {
  name: string;
  type: string;
  icon: string;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  delay?: number;
}

const ChannelStrip = memo(function ChannelStrip({
  name,
  type,
  icon,
  color,
  volume,
  muted,
  solo,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  delay = 0,
}: ChannelStripProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "flex flex-col items-center p-3 rounded-xl border min-w-[80px]",
        "bg-card/50",
        muted ? "opacity-50 border-border/30" : "border-border/50"
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
        {name}
      </p>

      {/* Vertical Fader */}
      <div className="h-32 w-8 relative mb-3">
        <div className="absolute inset-0 bg-muted rounded-lg overflow-hidden">
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-primary/50"
            style={{ height: `${volume * 100}%` }}
            animate={{ height: `${volume * 100}%` }}
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

      {/* Volume Value */}
      <span className="text-[10px] font-mono text-muted-foreground mb-2">
        {Math.round(volume * 100)}
      </span>

      {/* Mute/Solo - 44px minimum touch targets */}
      <div className="flex gap-1.5">
        <Button
          variant={muted ? "destructive" : "outline"}
          size="icon"
          className="h-11 w-11 min-w-11 min-h-11"
          onClick={onToggleMute}
          haptic
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        <Button
          variant={solo ? "default" : "outline"}
          size="icon"
          className="h-11 w-11 min-w-11 min-h-11"
          onClick={onToggleSolo}
          haptic
        >
          <Headphones className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
});
