/**
 * Volume Control Component
 * 
 * Audio volume control with mute toggle and visual slider.
 * Persists volume preference to localStorage.
 * 
 * Features:
 * - Volume slider (0-100%)
 * - Mute/unmute toggle button
 * - Dynamic volume icons (muted/low/high)
 * - localStorage persistence
 * - Remembers last volume when unmuting
 * - Responsive sizing options
 * - Visual feedback on interaction
 * 
 * @module VolumeControl
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Volume control component props
 */
interface VolumeControlProps {
  volume: number;                          // Current volume (0-1)
  muted: boolean;                          // Mute state
  onVolumeChange: (volume: number) => void; // Volume change callback
  onMutedChange: (muted: boolean) => void;  // Mute state change callback
  className?: string;                       // Additional CSS classes
  size?: 'sm' | 'md' | 'lg';               // Size preset
}

/**
 * localStorage key for volume persistence
 * Allows volume to persist across sessions
 */
const STORAGE_KEY = 'musicverse-volume';

/**
 * Volume Control Component
 * 
 * @param props - Component props
 * @returns Volume control with slider and mute button
 */
export function VolumeControl({
  volume: externalVolume,
  muted: externalMuted,
  onVolumeChange,
  onMutedChange,
  className,
  size = 'md'
}: VolumeControlProps) {
  // Local state - allows controlled component behavior
  const [volume, setVolume] = useState(externalVolume);
  const [muted, setMuted] = useState(externalMuted);
  
  // Remember last non-zero volume for unmute restoration
  const [lastVolume, setLastVolume] = useState(externalVolume);

  /**
   * Load saved volume from localStorage on component mount
   * Restores user's preferred volume setting
   * 
   * Validation: Ensures saved value is a valid number between 0 and 1
   */
  useEffect(() => {
    const savedVolume = localStorage.getItem(STORAGE_KEY);
    if (savedVolume) {
      const parsedVolume = parseFloat(savedVolume);
      // Validate saved volume is within acceptable range
      if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
        setVolume(parsedVolume);
        setLastVolume(parsedVolume);
        onVolumeChange(parsedVolume); // Apply to audio element
      }
    }
  }, []); // Run once on mount

  /**
   * Sync internal state with external props
   * Allows parent component to control volume programmatically
   */
  useEffect(() => {
    setVolume(externalVolume);
    setMuted(externalMuted);
  }, [externalVolume, externalMuted]);

  /**
   * Handle volume slider changes
   * 
   * @param values - Array with single volume value (Slider component format)
   * 
   * Behavior:
   * - Saves to localStorage for persistence
   * - Auto-unmutes when volume increased from 0
   * - Auto-mutes when volume set to 0
   * - Updates parent component via callback
   */
  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    
    // Persist volume preference
    localStorage.setItem(STORAGE_KEY, newVolume.toString());
    
    // Auto-unmute if user increases volume from muted state
    if (newVolume > 0 && muted) {
      setMuted(false);
      onMutedChange(false);
    }
    
    // Auto-mute if user drags volume to 0
    if (newVolume === 0 && !muted) {
      setMuted(true);
      onMutedChange(true);
    }
    
    // Apply volume change to audio element
    onVolumeChange(newVolume);
  };

  /**
   * Toggle mute/unmute
   * 
   * Unmute behavior:
   * - Restores last non-zero volume
   * - Falls back to 50% if last volume was 0
   * 
   * Mute behavior:
   * - Saves current volume for restoration
   * - Sets volume to 0
   */
  const toggleMute = () => {
    if (muted) {
      // Unmute: restore previous volume level
      const restoreVolume = lastVolume > 0 ? lastVolume : 0.5;
      setVolume(restoreVolume);
      setMuted(false);
      onVolumeChange(restoreVolume);
      onMutedChange(false);
    } else {
      // Mute: remember current volume for restoration
      setLastVolume(volume);
      setVolume(0);
      setMuted(true);
      onVolumeChange(0);
      onMutedChange(true);
    }
  };

  /**
   * Get appropriate volume icon based on current state
   * 
   * @returns Icon component matching volume level
   * - VolumeX: Muted or 0%
   * - Volume1: Low (< 50%)
   * - Volume2: High (≥ 50%)
   */
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
    <div className={cn('flex items-center gap-2 sm:gap-3 group', className)}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={muted ? { rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className={cn(
            buttonSizeClasses[size],
            'flex-shrink-0 touch-manipulation transition-all duration-300 relative',
            muted && 'text-muted-foreground'
          )}
          aria-label={muted ? 'Включить звук' : 'Выключить звук'}
        >
          {/* Glow effect when not muted */}
          <AnimatePresence>
            {!muted && volume > 0.5 && (
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full blur-md"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.3, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              />
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div
              key={muted ? 'muted' : volume < 0.5 ? 'low' : 'high'}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <VolumeIcon className={cn(iconSizeClasses[size], 'relative z-10')} />
            </motion.div>
          </AnimatePresence>
        </Button>
      </motion.div>
      
      <div className="flex-1 relative">
        <Slider
          value={[muted ? 0 : volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className={cn(
            'w-full cursor-pointer transition-opacity duration-300',
            muted && 'opacity-50'
          )}
          aria-label="Громкость"
        />
        
        {/* Volume level glow indicator */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary/50 to-primary rounded-full pointer-events-none"
          style={{ width: `${(muted ? 0 : volume) * 100}%` }}
          animate={{
            boxShadow: volume > 0.7 
              ? '0 0 10px hsl(var(--primary) / 0.5)' 
              : '0 0 0px transparent'
          }}
        />
      </div>
    </div>
  );
}
