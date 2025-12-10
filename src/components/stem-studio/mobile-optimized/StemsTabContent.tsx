/**
 * Stems Tab Content - Optimized for mobile
 * Displays stem channels in a clean, scrollable list
 */

import { StemChannel } from '../StemChannel';
import { defaultStemEffects, StemEffects } from '@/hooks/studio';

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface StemsTabContentProps {
  stems: any[];
  trackId: string;
  trackTitle: string;
  stemStates: Record<string, StemState>;
  stemEffects: Record<string, { effects: StemEffects; ready: boolean }>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  effectsEnabled: boolean;
  engineReady: boolean;
  onToggle: (stemId: string, type: 'mute' | 'solo') => void;
  onVolumeChange: (stemId: string, volume: number) => void;
  onSeek: (time: number[]) => void;
  onEQChange?: (stemId: string, settings: any) => void;
  onCompressorChange?: (stemId: string, settings: any) => void;
  onReverbChange?: (stemId: string, settings: any) => void;
  onEQPreset?: (stemId: string, preset: string) => void;
  onCompressorPreset?: (stemId: string, preset: string) => void;
  onReverbPreset?: (stemId: string, preset: string) => void;
  onResetEffects?: (stemId: string) => void;
  getCompressorReduction?: (stemId: string) => number;
}

export function StemsTabContent({
  stems,
  trackId,
  trackTitle,
  stemStates,
  stemEffects,
  isPlaying,
  currentTime,
  duration,
  effectsEnabled,
  engineReady,
  onToggle,
  onVolumeChange,
  onSeek,
  onEQChange,
  onCompressorChange,
  onReverbChange,
  onEQPreset,
  onCompressorPreset,
  onReverbPreset,
  onResetEffects,
  getCompressorReduction,
}: StemsTabContentProps) {
  return (
    <div className="p-3 space-y-2 pb-4">
      {stems.map((stem) => (
        <StemChannel
          key={stem.id}
          stem={stem}
          trackId={trackId}
          trackTitle={trackTitle}
          state={stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 }}
          effects={stemEffects[stem.id]?.effects || defaultStemEffects}
          onToggle={(type) => onToggle(stem.id, type)}
          onVolumeChange={(vol) => onVolumeChange(stem.id, vol)}
          onEQChange={effectsEnabled && onEQChange ? (s) => onEQChange(stem.id, s) : undefined}
          onCompressorChange={effectsEnabled && onCompressorChange ? (s) => onCompressorChange(stem.id, s) : undefined}
          onReverbChange={effectsEnabled && onReverbChange ? (s) => onReverbChange(stem.id, s) : undefined}
          onEQPreset={effectsEnabled && onEQPreset ? (p) => onEQPreset(stem.id, p) : undefined}
          onCompressorPreset={effectsEnabled && onCompressorPreset ? (p) => onCompressorPreset(stem.id, p) : undefined}
          onReverbPreset={effectsEnabled && onReverbPreset ? (p) => onReverbPreset(stem.id, p) : undefined}
          onResetEffects={effectsEnabled && onResetEffects ? () => onResetEffects(stem.id) : undefined}
          getCompressorReduction={effectsEnabled && getCompressorReduction ? () => getCompressorReduction(stem.id) : undefined}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          isEngineReady={effectsEnabled && engineReady}
        />
      ))}
    </div>
  );
}
