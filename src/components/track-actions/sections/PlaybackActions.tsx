/**
 * PlaybackActions - Special playback modes
 * Karaoke mode, loop section, speed control
 */

import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Mic2, Repeat, Gauge } from 'lucide-react';
import { Track } from '@/types/track';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';
import { useState } from 'react';

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
  
  // Check if track has stems for karaoke
  const hasVocalStem = false; // TODO: Check from track.stems
  
  const handleKaraoke = () => {
    hapticImpact('medium');
    if (!hasVocalStem) {
      toast.info('Для караоке нужно сначала разделить трек на стемы');
      return;
    }
    toast.success('Караоке режим включён');
    onClose?.();
  };

  const handleToggleLoop = () => {
    hapticImpact('light');
    toggleRepeat();
    toast.success(repeat === 'one' ? 'Повтор выключен' : 'Повтор трека включён');
  };

  const handleSpeedChange = (speed: number) => {
    hapticImpact('light');
    setPlaybackSpeed(speed);
    // Note: actual speed change would need AudioElement access
    toast.success(`Скорость: ${speed}x`);
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  if (variant === 'dropdown') {
    return (
      <>
        <DropdownMenuItem onClick={handleKaraoke} disabled={!hasVocalStem}>
          <Mic2 className="w-4 h-4 mr-2" />
          Караоке режим
        </DropdownMenuItem>
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

  // Sheet variant
  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 h-12"
        onClick={handleKaraoke}
        disabled={!hasVocalStem}
      >
        <Mic2 className="w-5 h-5 text-pink-500" />
        <span>Караоке режим</span>
        {!hasVocalStem && (
          <span className="ml-auto text-xs text-muted-foreground">Нужны стемы</span>
        )}
      </Button>
      
      <Button
        variant="ghost"
        className={`w-full justify-start gap-3 h-12 ${isLooping ? 'text-primary' : ''}`}
        onClick={handleToggleLoop}
      >
        <Repeat className={`w-5 h-5 ${isLooping ? 'text-primary' : ''}`} />
        <span>{isLooping ? 'Выключить повтор' : 'Повтор трека'}</span>
      </Button>
      
      <div className="px-3 py-3 space-y-2">
        <div className="flex items-center gap-3">
          <Gauge className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm">Скорость: {playbackSpeed}x</span>
        </div>
        <div className="flex items-center gap-2 pl-8 flex-wrap">
          {speedOptions.map(speed => (
            <Button
              key={speed}
              variant={playbackSpeed === speed ? 'default' : 'outline'}
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={() => handleSpeedChange(speed)}
            >
              {speed}x
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
