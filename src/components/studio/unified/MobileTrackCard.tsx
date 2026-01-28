/**
 * MobileTrackCard - Optimized track card for mobile studio
 * Touch-friendly controls with swipe actions
 */

import { memo, useCallback, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from '@/lib/motion';
import {
  Volume2,
  VolumeX,
  Headphones,
  MoreVertical,
  Trash2,
  Edit3,
  Copy,
  Music,
  Mic2,
  Drum,
  Guitar,
  Piano,
  Waves,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MobileTrackCardProps {
  id: string;
  name: string;
  type: string;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
  isSelected?: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  className?: string;
}

const TRACK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  main: Music,
  vocal: Mic2,
  vocals: Mic2,
  instrumental: Guitar,
  drums: Drum,
  bass: Waves,
  guitar: Guitar,
  piano: Piano,
  keyboard: Piano,
  other: Music,
};

const TRACK_COLORS: Record<string, string> = {
  main: 'bg-primary/20 border-primary',
  vocal: 'bg-pink-500/20 border-pink-500',
  vocals: 'bg-pink-500/20 border-pink-500',
  instrumental: 'bg-violet-500/20 border-violet-500',
  drums: 'bg-orange-500/20 border-orange-500',
  bass: 'bg-emerald-500/20 border-emerald-500',
  guitar: 'bg-amber-500/20 border-amber-500',
  piano: 'bg-purple-500/20 border-purple-500',
  keyboard: 'bg-purple-500/20 border-purple-500',
  other: 'bg-muted border-muted-foreground',
};

const SWIPE_THRESHOLD = 80;
const DELETE_THRESHOLD = 120;

export const MobileTrackCard = memo(function MobileTrackCard({
  id,
  name,
  type,
  volume,
  isMuted,
  isSolo,
  isSelected = false,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onSelect,
  onDelete,
  onDuplicate,
  onRename,
  className,
}: MobileTrackCardProps) {
  const haptic = useHapticFeedback();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-DELETE_THRESHOLD, -SWIPE_THRESHOLD, 0], [1, 0.5, 0]);
  const cardScale = useTransform(x, [-DELETE_THRESHOLD, 0], [0.95, 1]);

  const Icon = TRACK_ICONS[type.toLowerCase()] || TRACK_ICONS.other;
  const colorClass = TRACK_COLORS[type.toLowerCase()] || TRACK_COLORS.other;

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -DELETE_THRESHOLD && onDelete) {
      haptic.impact('heavy');
      onDelete();
    }
    x.set(0);
  }, [haptic, onDelete, x]);

  const handleMuteClick = useCallback(() => {
    haptic.impact('light');
    onToggleMute();
  }, [haptic, onToggleMute]);

  const handleSoloClick = useCallback(() => {
    haptic.impact('light');
    onToggleSolo();
  }, [haptic, onToggleSolo]);

  const handleVolumeClick = useCallback(() => {
    haptic.impact('light');
    setShowVolumeSlider(prev => !prev);
  }, [haptic]);

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      {/* Delete background */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-0 bg-destructive flex items-center justify-end pr-6 rounded-xl"
      >
        <Trash2 className="h-6 w-6 text-destructive-foreground" />
      </motion.div>

      {/* Main card */}
      <motion.div
        style={{ x, scale: cardScale }}
        drag="x"
        dragConstraints={{ left: -DELETE_THRESHOLD, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onClick={onSelect}
        className={cn(
          'relative p-3 border-l-4 rounded-xl',
          'bg-card/80 backdrop-blur-sm',
          colorClass,
          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          'touch-pan-y'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center',
            'bg-background/50'
          )}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{name}</h4>
            <p className="text-xs text-muted-foreground capitalize">{type}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Mute */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleMuteClick(); }}
              className={cn(
                'h-10 w-10 rounded-lg min-w-10 min-h-10',
                isMuted && 'bg-destructive/20 text-destructive'
              )}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            {/* Solo */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleSoloClick(); }}
              className={cn(
                'h-10 w-10 rounded-lg min-w-10 min-h-10',
                isSolo && 'bg-amber-500/20 text-amber-500'
              )}
            >
              <Headphones className="h-4 w-4" />
            </Button>

            {/* More */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="h-10 w-10 rounded-lg min-w-10 min-h-10"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleVolumeClick(); }}>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Громкость
                </DropdownMenuItem>
                {onRename && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Переименовать
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                    <Copy className="h-4 w-4 mr-2" />
                    Дублировать
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Volume slider */}
        {showVolumeSlider && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-border/50"
          >
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={(val) => onVolumeChange(val[0])}
                className="flex-1"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
});
