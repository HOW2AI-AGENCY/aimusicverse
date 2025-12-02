import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VolumeControlProps {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onMutedChange: (muted: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const STORAGE_KEY = 'musicverse-volume';

export function VolumeControl({
  volume: externalVolume,
  muted: externalMuted,
  onVolumeChange,
  onMutedChange,
  className,
  size = 'md'
}: VolumeControlProps) {
  const [volume, setVolume] = useState(externalVolume);
  const [muted, setMuted] = useState(externalMuted);
  const [lastVolume, setLastVolume] = useState(externalVolume);

  // Load volume from localStorage on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem(STORAGE_KEY);
    if (savedVolume) {
      const parsedVolume = parseFloat(savedVolume);
      if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
        setVolume(parsedVolume);
        setLastVolume(parsedVolume);
        onVolumeChange(parsedVolume);
      }
    }
  }, []);

  // Sync with external props
  useEffect(() => {
    setVolume(externalVolume);
    setMuted(externalMuted);
  }, [externalVolume, externalMuted]);

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, newVolume.toString());
    
    // Unmute if volume is increased
    if (newVolume > 0 && muted) {
      setMuted(false);
      onMutedChange(false);
    }
    
    // Mute if volume is 0
    if (newVolume === 0 && !muted) {
      setMuted(true);
      onMutedChange(true);
    }
    
    onVolumeChange(newVolume);
  };

  const toggleMute = () => {
    if (muted) {
      // Unmute: restore last volume or set to 0.5 if it was 0
      const restoreVolume = lastVolume > 0 ? lastVolume : 0.5;
      setVolume(restoreVolume);
      setMuted(false);
      onVolumeChange(restoreVolume);
      onMutedChange(false);
    } else {
      // Mute: save current volume and set to 0
      setLastVolume(volume);
      setVolume(0);
      setMuted(true);
      onVolumeChange(0);
      onMutedChange(true);
    }
  };

  const getVolumeIcon = () => {
    if (muted || volume === 0) {
      return VolumeX;
    }
    if (volume < 0.5) {
      return Volume1;
    }
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-11 w-11',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('flex items-center gap-2 sm:gap-3', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMute}
        className={cn(
          buttonSizeClasses[size],
          'flex-shrink-0 touch-manipulation transition-colors',
          muted && 'text-muted-foreground'
        )}
        aria-label={muted ? 'Включить звук' : 'Выключить звук'}
      >
        <VolumeIcon className={iconSizeClasses[size]} />
      </Button>
      
      <div className="flex-1 relative">
        <Slider
          value={[muted ? 0 : volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className={cn(
            'w-full cursor-pointer',
            muted && 'opacity-50'
          )}
          aria-label="Громкость"
        />
        
        {/* Visual feedback indicator */}
        <div 
          className="absolute -top-8 left-0 right-0 pointer-events-none opacity-0 transition-opacity duration-200 peer-active:opacity-100"
          style={{
            left: `${(muted ? 0 : volume) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
            {Math.round((muted ? 0 : volume) * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
