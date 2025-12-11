import { motion } from 'framer-motion';
import { 
  Volume2, VolumeX, Music, Play, Pause,
  SkipBack, SkipForward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useStudioStore, selectAudio, selectTrack } from '@/stores/useStudioStore';
import { useStudio } from '../StudioProvider';

/**
 * PlayerTabContent - Main player view with waveform and controls
 * Part of Sprint 015-A: Unified Studio Architecture
 */

interface PlayerTabContentProps {
  className?: string;
}

export function PlayerTabContent({ className }: PlayerTabContentProps) {
  const audio = useStudioStore(selectAudio);
  const track = useStudioStore(selectTrack);
  const { play, pause, seek, skip } = useStudio();
  const setVolume = useStudioStore((state) => state.setVolume);
  const toggleMute = useStudioStore((state) => state.toggleMute);

  const handlePlayPause = async () => {
    if (audio.isPlaying) {
      pause();
    } else {
      await play();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex flex-col h-full p-4", className)}>
      {/* Track Info */}
      <div className="flex items-center gap-4 mb-6">
        {track?.coverUrl ? (
          <img 
            src={track.coverUrl} 
            alt={track.title || ''} 
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shadow-lg"
          />
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted flex items-center justify-center">
            <Music className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold truncate">
            {track?.title || 'Без названия'}
          </h2>
          {track?.style && (
            <p className="text-sm text-muted-foreground truncate mt-1">
              {track.style}
            </p>
          )}
        </div>
      </div>

      {/* Waveform Placeholder */}
      <div className="flex-1 flex items-center justify-center min-h-[120px] bg-muted/30 rounded-xl mb-6">
        <div className="flex items-end gap-0.5 h-16">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1 sm:w-1.5 bg-primary/60 rounded-full"
              initial={{ height: 8 }}
              animate={{ 
                height: audio.isPlaying 
                  ? Math.random() * 48 + 8 
                  : 8 + Math.sin(i * 0.3) * 20 
              }}
              transition={{ 
                duration: audio.isPlaying ? 0.15 : 0.5,
                repeat: audio.isPlaying ? Infinity : 0,
                repeatType: "reverse"
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2 mb-6">
        <Slider
          value={[audio.currentTime]}
          min={0}
          max={audio.duration || 100}
          step={0.1}
          onValueChange={(v) => seek(v[0])}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{formatTime(audio.currentTime)}</span>
          <span>{formatTime(audio.duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => skip('back')}
          className="h-12 w-12 rounded-full"
        >
          <SkipBack className="w-6 h-6" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          onClick={handlePlayPause}
          className="h-16 w-16 rounded-full shadow-lg"
        >
          {audio.isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => skip('forward')}
          className="h-12 w-12 rounded-full"
        >
          <SkipForward className="w-6 h-6" />
        </Button>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-9 w-9 rounded-full"
        >
          {audio.muted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </Button>
        <Slider
          value={[audio.muted ? 0 : audio.volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => setVolume(v[0])}
          className="w-32"
        />
      </div>
    </div>
  );
}
