/**
 * Stem Studio Player Component
 * 
 * Playback controls footer
 * Extracted from StemStudioContent for better organization
 */

import { memo } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface StemStudioPlayerProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
}

export const StemStudioPlayer = memo(({
  isPlaying,
  onTogglePlay,
  onSkipBack,
  onSkipForward,
}: StemStudioPlayerProps) => {
  const isMobile = useIsMobile();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border/50 px-4 sm:px-6 py-3 sm:py-4 safe-area-pb z-50">
      <div className={cn(
        "flex items-center gap-3 sm:gap-4 max-w-screen-xl mx-auto",
        isMobile ? "justify-center" : "justify-between"
      )}>
        {/* Playback Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "rounded-full",
              isMobile ? "h-12 w-12" : "h-10 w-10"
            )}
            onClick={onSkipBack}
          >
            <SkipBack className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
          </Button>

          <Button
            onClick={onTogglePlay}
            size="icon"
            className={cn(
              "rounded-full shadow-lg hover:scale-105 transition-transform bg-primary text-primary-foreground",
              isMobile ? "w-16 h-16" : "w-14 h-14"
            )}
          >
            {isPlaying ? (
              <Pause className={cn(isMobile ? "w-7 h-7" : "w-6 h-6")} />
            ) : (
              <Play className={cn(isMobile ? "w-7 h-7 ml-0.5" : "w-6 h-6 ml-0.5")} />
            )}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "rounded-full",
              isMobile ? "h-12 w-12" : "h-10 w-10"
            )}
            onClick={onSkipForward}
          >
            <SkipForward className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
          </Button>
        </div>

        {/* Keyboard Shortcuts Hint (desktop only) */}
        {!isMobile && (
          <div className="text-xs text-muted-foreground hidden lg:flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted">Space</kbd> Play/Pause</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted">M</kbd> Mute</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted">←</kbd><kbd className="px-1.5 py-0.5 rounded bg-muted ml-1">→</kbd> Skip</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted">Esc</kbd> Cancel</span>
          </div>
        )}
      </div>
    </footer>
  );
}, (prevProps, nextProps) => {
  return prevProps.isPlaying === nextProps.isPlaying;
});

StemStudioPlayer.displayName = 'StemStudioPlayer';
