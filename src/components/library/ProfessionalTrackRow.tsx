/**
 * ProfessionalTrackRow - Modern, stylish track list item
 * 
 * Features:
 * - Sleek glassmorphism design
 * - Animated waveform visualization for playing tracks
 * - Inline version switcher with smooth transitions
 * - Status icons with gradient backgrounds
 * - Optimized touch interactions
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Play, 
  Pause, 
  MoreHorizontal,
  Mic2,
  Guitar,
  Layers,
  Music2,
  FileText,
  Copy,
  ArrowRightFromLine,
  Disc3,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/lazy-image';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { hapticImpact } from '@/lib/haptic';
import type { Track } from '@/types/track';

interface TrackMidiStatus {
  hasMidi: boolean;
  hasPdf: boolean;
  hasGp5: boolean;
}

interface ProfessionalTrackRowProps {
  track: Track;
  isPlaying?: boolean;
  versionCount?: number;
  midiStatus?: TrackMidiStatus;
  onPlay?: () => void;
  onOpenMenu?: () => void;
  onVersionSwitch?: (versionId: string) => void;
  className?: string;
}

// Animated equalizer bars for playing state
const PlayingIndicator = memo(function PlayingIndicator() {
  return (
    <div className="flex items-end justify-center gap-0.5 h-4 w-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary rounded-full"
          animate={{
            height: ['40%', '100%', '60%', '100%', '40%'],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

// Version pills component
const VersionPills = memo(function VersionPills({
  count,
  activeIndex = 0,
  onSwitch,
}: {
  count: number;
  activeIndex?: number;
  onSwitch?: (index: number) => void;
}) {
  if (count <= 1) return null;

  return (
    <div 
      className="flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 border border-border/50"
      onClick={(e) => e.stopPropagation()}
    >
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => {
        const isActive = i === activeIndex;
        const label = String.fromCharCode(65 + i);
        
        return (
          <motion.button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              hapticImpact('light');
              onSwitch?.(i);
            }}
            className={cn(
              "w-7 h-7 min-w-[28px] min-h-[28px] rounded-full text-xs font-bold transition-all touch-manipulation",
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            whileTap={{ scale: 0.95 }}
          >
            {label}
          </motion.button>
        );
      })}
      {count > 4 && (
        <span className="text-[10px] text-muted-foreground font-medium px-0.5">
          +{count - 4}
        </span>
      )}
    </div>
  );
});

// Status icon with gradient background
const StatusIcon = memo(function StatusIcon({
  icon: Icon,
  color,
  label,
}: {
  icon: typeof Mic2;
  color: 'blue' | 'green' | 'purple' | 'cyan' | 'amber' | 'orange' | 'primary';
  label: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-500 ring-blue-500/20',
    green: 'from-green-500/20 to-green-500/5 text-green-500 ring-green-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-500 ring-purple-500/20',
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-500 ring-cyan-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-500 ring-amber-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 text-orange-500 ring-orange-500/20',
    primary: 'from-primary/20 to-primary/5 text-primary ring-primary/20',
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "w-5 h-5 rounded-md bg-gradient-to-br flex items-center justify-center ring-1",
        colorClasses[color]
      )}
      title={label}
    >
      <Icon className="w-3 h-3" />
    </motion.div>
  );
});

export const ProfessionalTrackRow = memo(function ProfessionalTrackRow({
  track,
  isPlaying,
  versionCount = 0,
  midiStatus,
  onPlay,
  onOpenMenu,
  onVersionSwitch,
  className,
}: ProfessionalTrackRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const hasVocals = track.has_vocals === true;
  const isInstrumental = track.is_instrumental === true || 
    (track.is_instrumental == null && track.has_vocals === false);
  const hasStems = track.has_stems === true;
  
  const isCover = ['remix', 'cover', 'upload_cover'].includes(track.generation_mode || '');
  const isExtend = ['extend', 'upload_extend'].includes(track.generation_mode || '');

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('medium');
    onPlay?.();
  }, [onPlay]);

  const handleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    onOpenMenu?.();
  }, [onOpenMenu]);

  return (
    <motion.div
      className={cn(
        "group relative flex items-center gap-3 p-2.5 rounded-xl transition-all",
        "bg-card/50 backdrop-blur-sm border border-transparent",
        "hover:bg-card hover:border-border/50 hover:shadow-lg hover:shadow-primary/5",
        isPlaying && "bg-primary/5 border-primary/20 shadow-lg shadow-primary/10",
        className
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: 0.995 }}
    >
      {/* Cover Image with Play Overlay */}
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
        <LazyImage
          src={track.cover_url || ''}
          alt={track.title || 'Track cover'}
          className="w-full h-full object-cover"
          containerClassName="w-full h-full"
          fallback={
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center">
              <Disc3 className="w-5 h-5 text-primary/50" />
            </div>
          }
        />
        
        {/* Play/Pause Overlay */}
        <motion.div
          className={cn(
            "absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer",
            !isPlaying && !isHovered && "opacity-0"
          )}
          animate={{ opacity: isPlaying || isHovered ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          onClick={handlePlay}
        >
          <AnimatePresence mode="wait">
            {isPlaying ? (
              <motion.div
                key="playing"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <PlayingIndicator />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Play className="w-5 h-5 text-white fill-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Active playing glow */}
        {isPlaying && (
          <motion.div
            className="absolute inset-0 rounded-lg ring-2 ring-primary"
            animate={{ 
              boxShadow: [
                '0 0 0 0 hsl(var(--primary) / 0.4)',
                '0 0 0 4px hsl(var(--primary) / 0)',
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate leading-tight">
            {track.title || 'Без названия'}
          </h3>
          
          {/* Version Switcher */}
          {versionCount > 1 && (
            <VersionPills 
              count={versionCount} 
              onSwitch={(i) => onVersionSwitch?.(String(i))}
            />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
            {track.style || 'Нет стиля'}
          </span>
          
          {track.duration_seconds && (
            <span className="text-xs text-muted-foreground/70 font-mono">
              {formatTime(track.duration_seconds)}
            </span>
          )}
        </div>
      </div>

      {/* Status Icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <AnimatePresence>
          {isCover && (
            <StatusIcon icon={Copy} color="purple" label="Кавер" />
          )}
          {isExtend && (
            <StatusIcon icon={ArrowRightFromLine} color="cyan" label="Расширение" />
          )}
          {hasVocals && (
            <StatusIcon icon={Mic2} color="blue" label="Вокал" />
          )}
          {isInstrumental && (
            <StatusIcon icon={Guitar} color="green" label="Инструментал" />
          )}
          {hasStems && (
            <StatusIcon icon={Layers} color="purple" label="Стемы" />
          )}
          {midiStatus?.hasMidi && (
            <StatusIcon icon={Music2} color="primary" label="MIDI" />
          )}
          {midiStatus?.hasPdf && (
            <StatusIcon icon={FileText} color="amber" label="Ноты" />
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="icon"
          variant={isPlaying ? "default" : "ghost"}
          className={cn(
            "w-11 h-11 min-w-[44px] min-h-[44px] rounded-full transition-all touch-manipulation",
            isPlaying && "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          )}
          onClick={handlePlay}
          aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full touch-manipulation"
          onClick={handleMenu}
          aria-label="Меню"
        >
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
});

export default ProfessionalTrackRow;
