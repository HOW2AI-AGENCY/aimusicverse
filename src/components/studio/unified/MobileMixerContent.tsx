/**
 * MobileMixerContent - Mixer panel for mobile studio
 * Channel strips with volume, mute, solo for each track
 */

import { memo, useState } from 'react';
import { motion } from '@/lib/motion';
import { Volume2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { MixerChannel } from './MixerChannel';
import { MIX_PRESETS } from '@/hooks/studio/mixPresetsConfig';
import type { StudioProject } from '@/stores/useUnifiedStudioStore';

interface MobileMixerContentProps {
  project: StudioProject;
  masterVolume: number;
  isPlaying?: boolean;
  onMasterVolumeChange: (volume: number) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onVolumeChange: (trackId: string, volume: number) => void;
  onPanChange?: (trackId: string, pan: number) => void;
  onOpenEffects?: (trackId: string) => void;
  onApplyPreset?: (presetId: string) => void;
}

export const MobileMixerContent = memo(function MobileMixerContent({
  project,
  masterVolume,
  isPlaying = false,
  onMasterVolumeChange,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
  onPanChange,
  onOpenEffects,
  onApplyPreset,
}: MobileMixerContentProps) {
  const [showPresets, setShowPresets] = useState(false);

  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'vocal': return '🎤';
      case 'instrumental': return '🎸';
      case 'drums': return '🥁';
      case 'bass': return '🎸';
      case 'guitar': return '🎸';
      case 'piano': return '🎹';
      case 'sfx': return '✨';
      default: return '🎵';
    }
  };

  const getShortName = (type: string) => {
    const nameMap: Record<string, string> = {
      vocal: 'VOX',
      instrumental: 'INS',
      drums: 'DRM',
      bass: 'BAS',
      guitar: 'GTR',
      piano: 'KEY',
      main: 'MST',
      sfx: 'SFX',
      other: 'OTH',
    };
    return nameMap[type] || type.slice(0, 3).toUpperCase();
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header with Presets */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Микшер</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Управление громкостью дорожек
          </p>
        </div>
        {onApplyPreset && (
          <Button
            variant={showPresets ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
            className="h-9"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Пресеты
          </Button>
        )}
      </div>

      {/* Presets Row */}
      {showPresets && onApplyPreset && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4"
        >
          {MIX_PRESETS.map((preset, index) => (
            <motion.button
              key={preset.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => {
                onApplyPreset(preset.id);
                setShowPresets(false);
              }}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border min-w-[80px]",
                "bg-card/50 hover:bg-muted active:bg-muted/80 transition-colors",
                "touch-manipulation"
              )}
            >
              <span className="text-xl">{preset.icon}</span>
              <span className="text-xs font-medium text-center">{preset.name}</span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Master Volume */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Мастер</span>
          </div>
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
              <MixerChannel
                key={track.id}
                id={track.id}
                name={track.name}
                shortName={getShortName(track.type)}
                icon={getTrackIcon(track.type)}
                color={track.color}
                volume={track.volume}
                pan={0}
                muted={track.muted}
                solo={track.solo}
                isPlaying={isPlaying}
                hasEffects={false}
                onVolumeChange={(v) => onVolumeChange(track.id, v)}
                onPanChange={onPanChange ? (p) => onPanChange(track.id, p) : undefined}
                onToggleMute={() => onToggleMute(track.id)}
                onToggleSolo={() => onToggleSolo(track.id)}
                onOpenEffects={onOpenEffects ? () => onOpenEffects(track.id) : undefined}
                compact={false}
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
