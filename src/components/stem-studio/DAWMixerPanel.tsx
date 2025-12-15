import { memo, useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Shuffle, Maximize2, Settings2, Download, Share2,
  ZoomIn, ZoomOut, Grid3X3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
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

const formatTimeShort = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
  const [isLoop, setIsLoop] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  
  // Calculate active/soloed/muted counts
  const activeCount = stems.filter(s => !stemStates[s.id]?.muted).length;
  const soloedCount = stems.filter(s => stemStates[s.id]?.solo).length;
  const mutedCount = stems.filter(s => stemStates[s.id]?.muted).length;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-gradient-to-b from-background to-background/95 border border-border/30 rounded-lg overflow-hidden shadow-xl">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-card/80 border-b border-border/50 backdrop-blur-sm">
          {/* Left - Time Display */}
          <div className="flex items-center gap-3">
            <div className="bg-background/90 rounded-md px-3 py-1.5 font-mono text-sm tabular-nums border border-border/50 shadow-inner">
              <span className="text-primary font-semibold">{formatTime(currentTime)}</span>
              <span className="text-muted-foreground/40 mx-1.5">/</span>
              <span className="text-muted-foreground/70">{formatTime(duration)}</span>
            </div>
            
            {/* BPM Placeholder */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              <span className="font-medium">BPM</span>
              <span className="font-mono">—</span>
            </div>
          </div>

          {/* Center - Transport Controls */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSeek(0)}
                  className="h-8 w-8 rounded-full hover:bg-accent"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>В начало</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isPlaying ? "default" : "secondary"}
                  size="icon"
                  onClick={onPlayToggle}
                  className={cn(
                    "h-11 w-11 rounded-full shadow-lg transition-all",
                    isPlaying && "bg-primary text-primary-foreground scale-105 shadow-primary/30"
                  )}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPlaying ? 'Пауза (Space)' : 'Воспроизвести (Space)'}</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSkip('forward')}
                  className="h-8 w-8 rounded-full hover:bg-accent"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Вперёд</TooltipContent>
            </Tooltip>
            
            <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={isLoop}
                  onPressedChange={setIsLoop}
                  size="sm"
                  className="h-8 w-8 rounded-full hidden sm:flex"
                >
                  <Repeat className={cn("w-4 h-4", isLoop && "text-primary")} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Повтор</TooltipContent>
            </Tooltip>
          </div>

          {/* Right - Master Volume & Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={showGrid}
                    onPressedChange={setShowGrid}
                    size="sm"
                    className="h-8 w-8"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Сетка</TooltipContent>
              </Tooltip>
            </div>
            
            <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block" />
            
            {/* Master Volume */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMasterMuteToggle}
                    className={cn(
                      "h-8 w-8 rounded-full flex-shrink-0",
                      masterMuted && "text-destructive bg-destructive/10"
                    )}
                  >
                    {masterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Мастер {masterMuted ? '(выкл)' : `${Math.round(masterVolume * 100)}%`}</TooltipContent>
              </Tooltip>
              
              <div className="hidden sm:flex flex-col gap-0.5 w-24">
                <div className="flex items-center justify-between">
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
        </div>

        {/* Timeline Header with Track Info */}
        <div className="flex border-b border-border/30 bg-card/30">
          <div className="w-[180px] flex-shrink-0 px-3 py-1.5 bg-card/50 border-r border-border/30 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {stems.length} Дорожек
            </span>
            <div className="flex items-center gap-1">
              {soloedCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 font-medium">
                  S:{soloedCount}
                </span>
              )}
              {mutedCount > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium">
                  M:{mutedCount}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <DAWTimeline
              duration={duration}
              currentTime={currentTime}
              onSeek={onSeek}
              showGrid={showGrid}
            />
          </div>
        </div>

        {/* Track Lanes */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
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

        {/* Footer Stats Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-card/60 border-t border-border/30 text-[10px] text-muted-foreground backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {activeCount} активных
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline font-mono">{formatTimeShort(duration)} общая длительность</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/60">Горячие клавиши: Space, M, S</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
});

DAWMixerPanel.displayName = 'DAWMixerPanel';
