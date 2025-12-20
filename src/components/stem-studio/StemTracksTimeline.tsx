/**
 * StemTracksTimeline
 * 
 * Compact visual representation of stem tracks below the section timeline.
 * Shows waveforms for each stem with mute/solo controls.
 * Clicking on stems works with stems, not sections.
 */

import { memo } from 'react';
import { Mic2, Guitar, Drum, Music, Piano, Waves, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrackStem } from '@/hooks/useTrackStems';
import { StemWaveform } from './StemWaveform';

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface StemTracksTimelineProps {
  stems: TrackStem[];
  stemStates: Record<string, StemState>;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onStemToggle: (stemId: string, type: 'mute' | 'solo') => void;
  onSeek?: (time: number) => void;
}

const stemConfig: Record<string, { icon: React.ComponentType<any>; label: string; color: string; waveColor: string }> = {
  vocals: { icon: Mic2, label: 'Вокал', color: 'text-blue-500 bg-blue-500/10', waveColor: '#3b82f6' },
  vocal: { icon: Mic2, label: 'Вокал', color: 'text-blue-500 bg-blue-500/10', waveColor: '#3b82f6' },
  backing_vocals: { icon: Mic2, label: 'Бэк-вокал', color: 'text-cyan-500 bg-cyan-500/10', waveColor: '#06b6d4' },
  drums: { icon: Drum, label: 'Ударные', color: 'text-orange-500 bg-orange-500/10', waveColor: '#f97316' },
  bass: { icon: Waves, label: 'Бас', color: 'text-purple-500 bg-purple-500/10', waveColor: '#a855f7' },
  guitar: { icon: Guitar, label: 'Гитара', color: 'text-amber-500 bg-amber-500/10', waveColor: '#f59e0b' },
  keyboard: { icon: Piano, label: 'Клавишные', color: 'text-pink-500 bg-pink-500/10', waveColor: '#ec4899' },
  piano: { icon: Piano, label: 'Пианино', color: 'text-pink-500 bg-pink-500/10', waveColor: '#ec4899' },
  strings: { icon: Music, label: 'Струнные', color: 'text-emerald-500 bg-emerald-500/10', waveColor: '#10b981' },
  instrumental: { icon: Guitar, label: 'Инструментал', color: 'text-green-500 bg-green-500/10', waveColor: '#22c55e' },
  other: { icon: Music, label: 'Другое', color: 'text-gray-500 bg-gray-500/10', waveColor: '#6b7280' },
};

export const StemTracksTimeline = memo(({
  stems,
  stemStates,
  duration,
  currentTime,
  isPlaying,
  onStemToggle,
  onSeek,
}: StemTracksTimelineProps) => {
  if (!stems || stems.length === 0) return null;

  return (
    <div className="space-y-1">
      {stems.map((stem) => {
        const config = stemConfig[stem.stem_type.toLowerCase()] || stemConfig.other;
        const Icon = config.icon;
        const state = stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 };
        const hasSolo = Object.values(stemStates).some(s => s.solo);
        const isMuted = state.muted || (hasSolo && !state.solo);

        return (
          <div
            key={stem.id}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all",
              isMuted ? "opacity-40" : "opacity-100",
              state.solo && "bg-primary/5 ring-1 ring-primary/20"
            )}
          >
            {/* Stem Label + Controls */}
            <div className="flex items-center gap-1.5 min-w-[120px] flex-shrink-0">
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0",
                config.color
              )}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium truncate w-14">{config.label}</span>
              <div className="flex items-center gap-0.5">
                <Button
                  variant={state.solo ? "default" : "ghost"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStemToggle(stem.id, 'solo');
                  }}
                  className={cn(
                    "h-5 w-5 p-0 text-[10px] font-bold",
                    state.solo && "bg-primary text-primary-foreground"
                  )}
                >
                  S
                </Button>
                <Button
                  variant={state.muted ? "destructive" : "ghost"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStemToggle(stem.id, 'mute');
                  }}
                  className="h-5 w-5 p-0"
                >
                  {state.muted ? (
                    <VolumeX className="w-3 h-3" />
                  ) : (
                    <Volume2 className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Compact Waveform */}
            <div className="flex-1 min-w-0">
              <StemWaveform
                audioUrl={stem.audio_url}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                isMuted={isMuted}
                color={config.waveColor}
                height={28}
                onSeek={onSeek}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

StemTracksTimeline.displayName = 'StemTracksTimeline';
