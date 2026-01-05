/**
 * UnifiedTrackCard - Single track card component with multiple variants
 * 
 * Replaces:
 * - TrackCard (basic)
 * - MinimalTrackCard (grid/list)
 * - TrackCardEnhanced (public/enhanced)
 * 
 * Variants:
 * - 'default': Standard grid card with cover (alias for 'grid')
 * - 'grid': Standard grid card with cover
 * - 'list': Horizontal list row
 * - 'compact': Compact list row (minimal info)
 * - 'minimal': Ultra-compact for quick lists (alias for 'compact')
 * - 'professional': Modern glassmorphism design with enhanced visuals
 * - 'enhanced': Rich card with social features (for public tracks)
 */

import { memo, useCallback, useState } from 'react';
import { 
  MoreHorizontal, 
  Play, 
  Pause,
  Mic2,
  Guitar,
  Layers,
  Music2,
  FileText,
  Copy,
  ArrowRightFromLine,
  Disc3,
} from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/player-utils';
import { formatTime } from '@/lib/formatters';
import { hapticImpact } from '@/lib/haptic';
import { useTrackCardLogic } from './hooks/useTrackCardLogic';
import { TrackCover } from './TrackCover';
import { TrackInfo } from './TrackInfo';
import { InlineVersionToggle } from '@/components/library/InlineVersionToggle';
import { UnifiedTrackSheet } from '@/components/track-actions';
import { LazyImage } from '@/components/ui/lazy-image';
import type { Track } from '@/types/track';
import type { PublicTrackWithCreator } from '@/hooks/usePublicContent';

type TrackType = Track | PublicTrackWithCreator;

interface TrackMidiStatus {
  hasMidi: boolean;
  hasPdf: boolean;
  hasGp5: boolean;
}

interface UnifiedTrackCardProps {
  track: TrackType;
  variant?: 'default' | 'grid' | 'list' | 'compact' | 'minimal' | 'professional' | 'enhanced';
  onPlay?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onVersionSwitch?: (versionId: string) => void;
  versionCount?: number;
  stemCount?: number;
  midiStatus?: TrackMidiStatus;
  index?: number;
  className?: string;
  /** Show actions menu button */
  showActions?: boolean;
}

// Animated equalizer bars for playing state (professional variant)
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

// Version pills component (professional variant)
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

// Status icon with gradient background (professional variant)
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

export const UnifiedTrackCard = memo(function UnifiedTrackCard({
  track,
  variant = 'grid',
  onPlay,
  onDelete,
  onDownload,
  onVersionSwitch,
  versionCount = 0,
  stemCount = 0,
  midiStatus,
  index = 0,
  className,
  showActions = true,
}: UnifiedTrackCardProps) {
  const [isHoveredLocal, setIsHoveredLocal] = useState(false);
  const {
    sheetOpen,
    setSheetOpen,
    isHovered,
    isCurrentlyPlaying,
    handleCardClick,
    handlePlay,
    handleMouseEnter,
    handleMouseLeave,
    handleKeyDown,
    openSheet,
  } = useTrackCardLogic({ track, onPlay, onDelete });
  
  // Merge hover states
  const finalHovered = isHovered || isHoveredLocal;
  
  // Handlers for professional variant
  const handlePlayProfessional = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('medium');
    onPlay?.();
  }, [onPlay]);

  const handleMenuProfessional = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hapticImpact('light');
    openSheet();
  }, [openSheet]);

  // Professional variant - modern glassmorphism design
  if (variant === 'professional') {
    const hasVocals = track.has_vocals === true;
    const isInstrumental = track.is_instrumental === true || 
      (track.is_instrumental == null && track.has_vocals === false);
    const hasStems = track.has_stems === true || stemCount > 0;
    
    const isCover = ['remix', 'cover', 'upload_cover'].includes((track as any).generation_mode || '');
    const isExtend = ['extend', 'upload_extend'].includes((track as any).generation_mode || '');

    return (
      <>
        <motion.div
          className={cn(
            "group relative flex items-center gap-3 p-2.5 rounded-xl transition-all",
            "bg-card/50 backdrop-blur-sm border border-transparent",
            "hover:bg-card hover:border-border/50 hover:shadow-lg hover:shadow-primary/5",
            isCurrentlyPlaying && "bg-primary/5 border-primary/20 shadow-lg shadow-primary/10",
            className
          )}
          onHoverStart={() => setIsHoveredLocal(true)}
          onHoverEnd={() => setIsHoveredLocal(false)}
          whileTap={{ scale: 0.995 }}
          onClick={handleCardClick}
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
                !isCurrentlyPlaying && !finalHovered && "opacity-0"
              )}
              animate={{ opacity: isCurrentlyPlaying || finalHovered ? 1 : 0 }}
              transition={{ duration: 0.15 }}
              onClick={handlePlayProfessional}
            >
              <AnimatePresence mode="wait">
                {isCurrentlyPlaying ? (
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
            {isCurrentlyPlaying && (
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
              variant={isCurrentlyPlaying ? "default" : "ghost"}
              className={cn(
                "w-11 h-11 min-w-[44px] min-h-[44px] rounded-full transition-all touch-manipulation",
                isCurrentlyPlaying && "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              )}
              onClick={handlePlayProfessional}
              aria-label={isCurrentlyPlaying ? "Пауза" : "Воспроизвести"}
            >
              {isCurrentlyPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            
            {showActions && (
              <Button
                size="icon"
                variant="ghost"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full touch-manipulation"
                onClick={handleMenuProfessional}
                aria-label="Меню"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            )}
          </div>
        </motion.div>

        <UnifiedTrackSheet
          track={track as Track}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      </>
    );
  }

  // Compact/Minimal variant - alias for list with minimal info
  if (variant === 'compact' || variant === 'minimal') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02, duration: 0.2 }}
        >
          <Card
            className={cn(
              'group flex items-center gap-2.5 p-2 transition-all cursor-pointer touch-manipulation',
              'hover:bg-muted/50 active:bg-muted rounded-xl border-0 bg-transparent',
              isCurrentlyPlaying && 'bg-primary/5 border-primary/20',
              className
            )}
            onClick={handleCardClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={`Трек ${track.title || 'Без названия'}`}
          >
            <TrackCover
              coverUrl={track.cover_url}
              title={track.title}
              isPlaying={isCurrentlyPlaying}
              isHovered={finalHovered}
              onPlay={handlePlay}
              size="xs"
              showDuration={false}
              showPlayingIndicator={false}
            />

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">
                {track.title || 'Без названия'}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {track.style || track.tags?.split(',')[0] || '--'}
              </p>
            </div>

            {/* Duration */}
            <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
              {track.duration_seconds ? formatDuration(track.duration_seconds) : '--:--'}
            </span>

            {/* Menu button */}
            {showActions && (
              <Button
                size="icon"
                variant="ghost"
                className="w-11 h-11 min-h-[44px] min-w-[44px] opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  openSheet();
                }}
                aria-label="Открыть меню трека"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            )}
          </Card>
        </motion.div>

        <UnifiedTrackSheet
          track={track as Track}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      </>
    );
  }

  // List layout
  if (variant === 'list') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02, duration: 0.2 }}
        >
          <Card
            className={cn(
              'group flex items-center gap-3 p-2 transition-all cursor-pointer touch-manipulation',
              'hover:bg-muted/50 active:bg-muted rounded-xl border-0 bg-transparent',
              isCurrentlyPlaying && 'bg-primary/5 border-primary/20',
              className
            )}
            onClick={handleCardClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="button"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-label={`Трек ${track.title || 'Без названия'}`}
          >
            <TrackCover
              coverUrl={track.cover_url}
              title={track.title}
              isPlaying={isCurrentlyPlaying}
              isHovered={finalHovered}
              onPlay={handlePlay}
              size="xs"
              showDuration={false}
              showPlayingIndicator={false}
            />

            <TrackInfo
              track={track}
              variant="default"
              stemCount={stemCount}
              className="flex-1"
            />

            {/* Duration */}
            <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
              {track.duration_seconds ? formatDuration(track.duration_seconds) : '--:--'}
            </span>

            {/* Version Toggle */}
            {versionCount > 1 && (
              <InlineVersionToggle
                trackId={track.id}
                activeVersionId={(track as any).active_version_id}
                versionCount={versionCount}
                className="flex-shrink-0"
              />
            )}

            {/* Menu button */}
            {showActions && (
              <Button
                size="icon"
                variant="ghost"
                className="w-11 h-11 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  openSheet();
                }}
                aria-label="Открыть меню трека"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            )}
          </Card>
        </motion.div>

        <UnifiedTrackSheet
          track={track as Track}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      </>
    );
  }

  // Grid layout (default/grid variant)
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
      >
        <Card
          className={cn(
            'group overflow-hidden cursor-pointer touch-manipulation transition-all duration-200',
            'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-0',
            isCurrentlyPlaying && 'ring-2 ring-primary shadow-lg shadow-primary/20',
            className
          )}
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Cover */}
          <div className="relative aspect-square">
            <TrackCover
              coverUrl={track.cover_url}
              title={track.title}
              duration={track.duration_seconds}
              isPlaying={isCurrentlyPlaying}
              isHovered={finalHovered}
              onPlay={handlePlay}
              size="md"
              className="rounded-none"
            />

            {/* Top badges */}
            <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start pointer-events-none">
              <div className="flex gap-0.5 pointer-events-auto">
                {track.is_instrumental && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-background/80 backdrop-blur-sm">
                    Инстр
                  </Badge>
                )}
                {stemCount > 0 && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-background/80 backdrop-blur-sm border-primary/50">
                    {stemCount} стемов
                  </Badge>
                )}
              </div>
              
              {versionCount > 1 && (
                <div className="pointer-events-auto">
                  <InlineVersionToggle
                    trackId={track.id}
                    activeVersionId={(track as any).active_version_id}
                    versionCount={versionCount}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-2">
            <TrackInfo
              track={track}
              variant="compact"
              showIcons={false}
              isHovered={finalHovered}
            />
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {track.style || track.tags?.split(',')[0] || '--'}
            </p>
          </div>
        </Card>
      </motion.div>

      <UnifiedTrackSheet
        track={track as Track}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={onDelete}
        onDownload={onDownload}
      />
    </>
  );
});
