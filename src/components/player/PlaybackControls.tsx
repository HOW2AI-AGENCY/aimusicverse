/**
 * Playback Controls Component
 * 
 * Main player control buttons for playback management.
 * Provides play/pause, skip, shuffle, and repeat controls.
 * 
 * Features:
 * - Responsive sizing (compact/medium/large)
 * - Touch-optimized buttons with proper hit areas
 * - Visual feedback for active modes (shuffle, repeat)
 * - Accessibility support with ARIA labels
 * - Icon-based UI for universal understanding
 * 
 * @module PlaybackControls
 */

import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { usePlayerStore } from '@/hooks/audio';
import { cn } from '@/lib/utils';

/**
 * Playback controls component props
 */
interface PlaybackControlsProps {
  size?: 'compact' | 'medium' | 'large';  // Button size preset
  className?: string;                      // Additional CSS classes
}

/**
 * Playback Controls Component
 * 
 * @param props - Component props
 * @returns Player control buttons
 */
export function PlaybackControls({ size = 'medium', className }: PlaybackControlsProps) {
  // Get player state and actions from store
  const { 
    isPlaying,        // Current playback status
    shuffle,          // Shuffle mode enabled
    repeat,           // Repeat mode (off/all/one)
    playTrack,        // Play/resume function
    pauseTrack,       // Pause function
    nextTrack,        // Skip to next
    previousTrack,    // Skip to previous
    toggleShuffle,    // Toggle shuffle mode
    toggleRepeat      // Cycle repeat modes
  } = usePlayerStore();

  /**
   * Size presets for buttons and icons
   * Ensures consistent sizing across different player layouts
   */
  const buttonSizeClasses = {
    compact: 'h-8 w-8',    // Small player bar
    medium: 'h-11 w-11',   // Expanded player
    large: 'h-14 w-14'     // Fullscreen player
  };

  const iconSizeClasses = {
    compact: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6'
  };

  const buttonSize = buttonSizeClasses[size];
  const iconSize = iconSizeClasses[size];

  /**
   * Handle play/pause toggle
   * Centralizes play/pause logic with single button
   */
  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack(); // Resumes current track if exists
    }
  };

  return (
    <div className={cn('flex items-center justify-center gap-2 sm:gap-4', className)}>
      {/* Shuffle Button - Toggle random playback order */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleShuffle}
        className={cn(
          buttonSize,
          'touch-manipulation transition-all duration-200 rounded-xl',
          shuffle ? 'text-primary bg-primary/10' : 'hover:bg-muted/50'
        )}
        aria-label="Shuffle"
        aria-pressed={shuffle}
      >
        <Shuffle className={cn(iconSize, shuffle && 'drop-shadow-glow')} />
      </Button>

      {/* Previous Button - Skip to previous track */}
      <Button
        variant="ghost"
        size="icon"
        onClick={previousTrack}
        className={cn(buttonSize, 'touch-manipulation rounded-xl hover:bg-muted/50 active:scale-95 transition-all')}
        aria-label="Previous track"
      >
        <SkipBack className={iconSize} />
      </Button>

      {/* Play/Pause Button - Main playback control with glow */}
      <div className="relative">
        {isPlaying && (
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
        )}
        <Button
          variant="default"
          size="icon"
          onClick={handlePlayPause}
          className={cn(
            buttonSize,
            'touch-manipulation rounded-full bg-primary hover:bg-primary/90 relative z-10',
            'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30',
            'active:scale-95 transition-all duration-200'
          )}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className={iconSize} fill="currentColor" />
          ) : (
            <Play className={cn(iconSize, 'ml-0.5')} fill="currentColor" />
          )}
        </Button>
      </div>

      {/* Next Button - Skip to next track */}
      <Button
        variant="ghost"
        size="icon"
        onClick={nextTrack}
        className={cn(buttonSize, 'touch-manipulation rounded-xl hover:bg-muted/50 active:scale-95 transition-all')}
        aria-label="Next track"
      >
        <SkipForward className={iconSize} />
      </Button>

      {/* Repeat Button - Cycle through repeat modes (off → all → one) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleRepeat}
        className={cn(
          buttonSize,
          'touch-manipulation transition-all duration-200 relative rounded-xl',
          repeat !== 'off' ? 'text-primary bg-primary/10' : 'hover:bg-muted/50'
        )}
        aria-label={`Repeat: ${repeat}`}
        aria-pressed={repeat !== 'off'}
      >
        <Repeat className={cn(iconSize, repeat !== 'off' && 'drop-shadow-glow')} />
        {/* Visual indicator for repeat mode - shows small badge for repeat-one */}
        {repeat === 'one' && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
            1
          </span>
        )}
      </Button>
    </div>
  );
}
