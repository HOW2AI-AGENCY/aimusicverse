import { memo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { TrackStem } from '@/hooks/useTrackStems';
import { DAWTrackLane } from './DAWTrackLane';
import { DAWTimeline } from './DAWTimeline';

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface DAWMixerPanelProps {
  stems: TrackStem[];
  stemStates: Record<string, StemState>;
  masterVolume: number;
  masterMuted: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onStemToggle: (stemId: string, type: 'mute' | 'solo') => void;
  onStemVolumeChange: (stemId: string, volume: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onMasterMuteToggle: () => void;
  onPlayToggle: () => void;
  onSeek: (time: number) => void;
  onSkip: (direction: 'back' | 'forward') => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const DAWMixerPanel = memo(({
  stems,
  stemStates,
  masterVolume,
  masterMuted,
  isPlaying,
  currentTime,
  duration,
  onStemToggle,
  onStemVolumeChange,
  onMasterVolumeChange,
  onMasterMuteToggle,
  onPlayToggle,
  onSeek,
  onSkip,
}: DAWMixerPanelProps) => {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Transport Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card/80 border-b border-border/50">
        {/* Time Display */}
        <div className="flex items-center gap-4">
          <div className="bg-background/80 rounded px-3 py-1.5 font-mono text-sm tabular-nums">
            <span className="text-primary">{formatTime(currentTime)}</span>
            <span className="text-muted-foreground/50 mx-1">/</span>
            <span className="text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip('back')}
            className="h-9 w-9 rounded-full"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant={isPlaying ? "default" : "outline"}
            size="icon"
            onClick={onPlayToggle}
            className={cn(
              "h-12 w-12 rounded-full",
              isPlaying && "bg-primary text-primary-foreground"
            )}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip('forward')}
            className="h-9 w-9 rounded-full"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Master Volume */}
        <div className="flex items-center gap-2 w-48">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMasterMuteToggle}
            className={cn(
              "h-8 w-8 rounded-full flex-shrink-0",
              masterMuted && "text-destructive"
            )}
          >
            {masterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Master
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[masterVolume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => onMasterVolumeChange(v[0])}
              disabled={masterMuted}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="flex border-b border-border/30">
        <div className="w-[180px] flex-shrink-0 px-3 py-1 bg-card/50 border-r border-border/30">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {stems.length} Tracks
          </span>
        </div>
        <div className="flex-1">
          <DAWTimeline
            duration={duration}
            currentTime={currentTime}
            onSeek={onSeek}
          />
        </div>
      </div>

      {/* Track Lanes */}
      <div className="flex-1 overflow-y-auto">
        {stems.map((stem, index) => (
          <DAWTrackLane
            key={stem.id}
            stem={stem}
            index={index}
            state={stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 }}
            onToggle={(type) => onStemToggle(stem.id, type)}
            onVolumeChange={(volume) => onStemVolumeChange(stem.id, volume)}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
          />
        ))}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-card/50 border-t border-border/30 text-[10px] text-muted-foreground">
        <span>{stems.length} stems loaded</span>
        <span className="font-mono">{Math.round(duration)}s total</span>
      </div>
    </div>
  );
});

DAWMixerPanel.displayName = 'DAWMixerPanel';
