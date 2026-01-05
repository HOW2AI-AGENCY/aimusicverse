/**
 * PlaybackActions - Compact playback controls
 * Loop, speed control (simplified)
 */

import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Repeat, Gauge } from 'lucide-react';
import { Track } from '@/types/track';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PlaybackActionsProps {
  track: Track;
  variant: 'dropdown' | 'sheet';
  onClose?: () => void;
}

export function PlaybackActions({ track, variant, onClose }: PlaybackActionsProps) {
  const { 
    activeTrack, 
    repeat,
    toggleRepeat
  } = usePlayerStore();
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  const isCurrentTrack = activeTrack?.id === track.id;
  const isLooping = repeat === 'one';

  const handleToggleLoop = () => {
    hapticImpact('light');
    toggleRepeat();
    toast.success(repeat === 'one' ? 'Повтор выключен' : 'Повтор трека включён');
  };

  const handleSpeedChange = (speed: number) => {
    hapticImpact('light');
    setPlaybackSpeed(speed);
    toast.success(`Скорость: ${speed}x`);
  };

  const speedOptions = [0.75, 1, 1.25, 1.5];

  if (variant === 'dropdown') {
    return (
      <>
        <DropdownMenuItem onClick={handleToggleLoop}>
          <Repeat className={`w-4 h-4 mr-2 ${isLooping ? 'text-primary' : ''}`} />
          {isLooping ? 'Выключить повтор' : 'Повтор трека'}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Gauge className="w-4 h-4 mr-2" />
            Скорость ({playbackSpeed}x)
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {speedOptions.map(speed => (
              <DropdownMenuItem 
                key={speed} 
                onClick={() => handleSpeedChange(speed)}
                className={playbackSpeed === speed ? 'bg-primary/10' : ''}
              >
                {speed}x {speed === 1 && '(нормальная)'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </>
    );
  }

  // Sheet variant - compact
  return (
    <div className="space-y-0.5">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 h-10 rounded-lg",
          isLooping ? "text-primary hover:bg-primary/10" : "hover:bg-muted"
        )}
        onClick={handleToggleLoop}
      >
        <div className={cn(
          "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
          isLooping ? "bg-primary/20" : "bg-muted"
        )}>
          <Repeat className={cn("w-3.5 h-3.5", isLooping && "text-primary")} />
        </div>
        <span className="text-sm">{isLooping ? 'Выключить повтор' : 'Повтор трека'}</span>
      </Button>
      
      {/* Speed options - inline compact */}
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
          <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">Скорость:</span>
        <div className="flex items-center gap-1 ml-auto">
          {speedOptions.map(speed => (
            <Button
              key={speed}
              variant={playbackSpeed === speed ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "h-7 px-2 text-xs rounded-md",
                playbackSpeed === speed && "bg-primary text-primary-foreground"
              )}
              onClick={() => handleSpeedChange(speed)}
            >
              {speed}x
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
