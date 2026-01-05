/**
 * ListVariant - Horizontal list row with full features
 * 
 * Features:
 * - Cover + play
 * - Title with marquee
 * - Type icons
 * - Tags row
 * - Version toggle
 * - Menu button
 * - Swipeable on mobile
 */

import { memo, useCallback } from 'react';
import { MoreHorizontal, Play, Pause } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/lib/mobile-utils';
import { LazyImage } from '@/components/ui/lazy-image';
import { DurationBadge, PlayOverlay } from '@/components/library/shared';
import { InlineVersionToggle } from '@/components/library/InlineVersionToggle';
import { TrackTypeIcons } from '@/components/library/TrackTypeIcons';
import { ScrollableTagsRow } from '@/components/library/ScrollableTagsRow';
import { MarqueeTitle } from '@/components/library/MarqueeTitle';
import { SwipeableTrackItem } from '@/components/library/SwipeableTrackItem';
import { SwipeOnboardingTooltip } from '@/components/library/SwipeOnboardingTooltip';
import { UnifiedTrackMenu, UnifiedTrackSheet } from '@/components/track-actions';
import { useTrackCardState } from '../hooks/useTrackCardState';
import type { StandardTrackCardProps } from '../types';

export const ListVariant = memo(function ListVariant({
  track,
  onPlay,
  onDelete,
  onDownload,
  onTagClick,
  onVersionSwitch,
  versionCount = 0,
  stemCount = 0,
  midiStatus,
  isPlaying: isPlayingProp,
  className,
  showActions = true,
  isFirstSwipeableItem = false,
}: StandardTrackCardProps) {
  const {
    sheetOpen,
    setSheetOpen,
    isMobile,
    isCurrentlyPlaying,
    handlePlay,
    handleCardClick,
    openSheet,
  } = useTrackCardState({ track, onPlay, isPlaying: isPlayingProp });

  // Swipe action handlers
  const handleSwipeAddToQueue = useCallback(() => {
    // Import addToQueue from store if needed
  }, []);

  const handleSwipeSwitchVersion = useCallback(() => {
    if (versionCount <= 1 || !onVersionSwitch) return;
    // Cycle to next version
    onVersionSwitch('next');
  }, [versionCount, onVersionSwitch]);

  const listContent = (
    <Card
      className={cn(
        'group grid grid-cols-[64px_1fr_44px] items-center gap-3 p-2.5 sm:p-3 transition-all touch-manipulation rounded-xl min-h-[80px]',
        !isMobile && 'hover:bg-muted/50',
        isMobile && 'active:bg-muted/70 active:scale-[0.99]',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Cover Image & Play Button */}
      <div className="relative w-[64px] h-[64px] flex-shrink-0 rounded-lg overflow-hidden shadow-sm" data-play-button>
        <LazyImage
          src={track.cover_url || ''}
          alt={track.title || 'Track cover'}
          className="w-full h-full object-cover"
          containerClassName="w-full h-full"
          coverSize="small"
          fallback={
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary/30">
              🎵
            </div>
          }
        />

        <DurationBadge seconds={track.duration_seconds} />
        <PlayOverlay
          isPlaying={isCurrentlyPlaying}
          isMobile={isMobile}
          onPlay={handlePlay}
          size="lg"
        />
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0 py-0.5">
        {/* Row 1: Title */}
        <div className="flex items-center gap-2">
          <MarqueeTitle title={track.title || 'Без названия'} />
        </div>

        {/* Row 2: Type Icons */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <TrackTypeIcons
            track={track as any}
            compact
            showModel
            hasMidi={midiStatus?.hasMidi}
            hasPdf={midiStatus?.hasPdf}
            hasGp5={midiStatus?.hasGp5}
          />
        </div>

        {/* Row 3: Scrollable Tags */}
        <ScrollableTagsRow
          style={track.style}
          tags={track.tags}
          onClick={onTagClick}
          className="mt-0.5"
        />
      </div>

      {/* Actions Column */}
      <div className="flex flex-col items-center justify-center gap-1">
        {/* Version Toggle */}
        {versionCount > 1 && (
          <InlineVersionToggle
            trackId={track.id}
            activeVersionId={(track as any).active_version_id}
            versionCount={versionCount}
            trackOwnerId={track.user_id}
            className="flex-shrink-0"
            compact={isMobile}
          />
        )}

        {/* Menu Button */}
        {isMobile ? (
          <Button
            size="icon"
            variant="ghost"
            className="touch-target-44 w-11 h-11 min-h-[44px] min-w-[44px] rounded-full touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              triggerHapticFeedback('light');
              openSheet();
            }}
            aria-label={`Дополнительные действия для ${track.title}`}
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant={isCurrentlyPlaying ? 'default' : 'ghost'}
              className={cn(
                'touch-target-44 w-10 h-10 rounded-full touch-manipulation transition-colors',
                isCurrentlyPlaying && 'bg-primary text-primary-foreground'
              )}
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              aria-label={isCurrentlyPlaying ? `Пауза: ${track.title}` : `Воспроизвести: ${track.title}`}
            >
              {isCurrentlyPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            {showActions && (
              <UnifiedTrackMenu track={track as any} onDelete={onDelete} onDownload={onDownload} />
            )}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <>
      {isMobile ? (
        <SwipeOnboardingTooltip isFirstSwipeableItem={isFirstSwipeableItem}>
          <SwipeableTrackItem
            onAddToQueue={handleSwipeAddToQueue}
            onSwitchVersion={handleSwipeSwitchVersion}
            hasMultipleVersions={versionCount > 1}
          >
            {listContent}
          </SwipeableTrackItem>
        </SwipeOnboardingTooltip>
      ) : (
        listContent
      )}
      <UnifiedTrackSheet
        track={track as any}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={onDelete}
        onDownload={onDownload}
      />
    </>
  );
});
