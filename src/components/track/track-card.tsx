/**
 * UnifiedTrackCard Component
 *
 * Per contracts/UnifiedTrackCard.contract.ts:
 * - Consolidated track card with 7 variants
 * - Discriminated union pattern for variant props
 * - Swipe gestures, haptic feedback, touch targets
 *
 * @example
 * ```tsx
 * // Grid variant
 * <UnifiedTrackCard variant="grid" track={track} onPlay={handlePlay} />
 *
 * // Enhanced variant with social features
 * <UnifiedTrackCard
 *   variant="enhanced"
 *   track={track}
 *   onFollow={handleFollow}
 *   onShare={handleShare}
 * />
 *
 * // Professional variant with MIDI status
 * <UnifiedTrackCard
 *   variant="professional"
 *   track={track}
 *   midiStatus={{ hasMidi: true, hasPdf: false }}
 * />
 * ```
 */

import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from '@/lib/motion';
import { useGesture } from '@use-gesture/react';
import { HapticFeedback } from '@twa-dev/sdk';
import { cn } from '@/lib/utils';
import { LazyImage } from '@/components/ui/lazy-image';
import { Button } from '@/components/ui/button';
import { getVariantConfig, GESTURE_THRESHOLDS, HAPTIC_PATTERNS } from './track-card.config';
import type { UnifiedTrackCardProps } from './track-card.types';
import { useTrackActions } from '@/hooks/track/use-track-actions';
import { useTrackVersionSwitcher } from '@/hooks/track/use-track-version-switcher';
import { useRealtimeTrackUpdates } from '@/hooks/track/use-realtime-track-updates';
import { Play, Heart, MoreHorizontal, Download, Music } from 'lucide-react';

export function UnifiedTrackCard(props: UnifiedTrackCardProps) {
  const { track, variant, onPlay, onDelete, onDownload, onVersionSwitch, className, testDataId } = props;
  const config = getVariantConfig(variant);

  // State for gestures
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showSwipeAction, setShowSwipeAction] = useState<'like' | 'delete' | null>(null);

  // Track actions hook
  const { likeTrack, shareTrack, deleteTrack, isPending: actionsPending } = useTrackActions({
    trackId: track.id,
    enableOptimistic: true,
  });

  // Version switcher hook
  const { activeVersion, allVersions, switchVersion, isPending: versionPending } =
    useTrackVersionSwitcher({
      trackId: track.id,
      enableRefetch: true,
    });

  // Real-time updates hook
  const { data: realtimeUpdate } = useRealtimeTrackUpdates({
    trackId: track.id,
    enabled: true,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  // Gesture handlers
  const bind = useGesture(
    {
      onDrag: ({ offset: [x], direction: [xDir], down, first }) => {
        if (first) {
          setIsSwiping(true);
        }

        setSwipeOffset(x);

        // Show action based on swipe direction
        if (x > GESTURE_THRESHOLDS.swipe) {
          setShowSwipeAction('like');
        } else if (x < -GESTURE_THRESHOLDS.swipe) {
          setShowSwipeAction('delete');
        } else {
          setShowSwipeAction(null);
        }
      },

      onDragEnd: ({ offset: [x], velocity: [vx] }) => {
        setIsSwiping(false);

        // Determine if swipe exceeded threshold
        if (x > GESTURE_THRESHOLDS.swipe && vx > 0.5) {
          // Swipe right - like
          handleLike();
          resetCard();
        } else if (x < -GESTURE_THRESHOLDS.swipe && vx < -0.5) {
          // Swipe left - delete
          handleDelete();
          resetCard();
        } else {
          // Reset if threshold not met
          resetCard();
        }
      },

      onDoubleTap: () => {
        handleLike();
      },

      onLongPress: () => {
        handleLongPress();
      },
    },
    {
      drag: {
        threshold: 10,
      },
    }
  );

  // Handlers
  const handleLike = async () => {
    try {
      HapticFeedback.impactOccurred(HAPTIC_PATTERNS.like);
      await likeTrack();
      setShowSwipeAction('like');
      setTimeout(() => setShowSwipeAction(null), 1000);
    } catch (error) {
      console.error('Failed to like track:', error);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        HapticFeedback.notificationOccurred(HAPTIC_PATTERNS.tap);
        await deleteTrack();
        onDelete(track.id);
      } catch (error) {
        console.error('Failed to delete track:', error);
      }
    }
  };

  const handleLongPress = () => {
    try {
      HapticFeedback.notificationOccurred(HAPTIC_PATTERNS.tap);
      // Show context menu
      console.log('Long press - show context menu');
    } catch (error) {
      // Haptic not available on desktop
    }
  };

  const resetCard = () => {
    setSwipeOffset(0);
    setShowSwipeAction(null);
  };

  // Render based on variant
  const renderContent = () => {
    const baseContent = (
      <motion.div
        ref={cardRef}
        {...bind()}
        data-testid={testDataId || 'track-card'}
        data-variant={variant}
        className={cn(
          'relative bg-card rounded-lg overflow-hidden',
          config.layout === 'grid' ? 'aspect-square' : 'h-20',
          config.compact ? 'p-2' : 'p-4',
          className
        )}
        style={{
          x: swipeOffset,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {/* Swipe feedback overlay */}
        {showSwipeAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'absolute inset-0 flex items-center justify-center z-10',
              showSwipeAction === 'like' ? 'bg-green-500/20' : 'bg-red-500/20'
            )}
          >
            {showSwipeAction === 'like' ? (
              <Heart className="w-12 h-12 text-green-500 fill-current" />
            ) : (
              <MoreHorizontal className="w-12 h-12 text-red-500" />
            )}
          </motion.div>
        )}

        {/* Cover image */}
        {config.showCover && (
          <div className={cn(
            'relative overflow-hidden rounded-md',
            config.layout === 'list' ? 'w-20 h-20 float-left mr-3' : 'w-full h-1/2'
          )}>
            <LazyImage
              src={track.image_url || '/placeholder-cover.png'}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title and metadata */}
        {config.showTitle && (
          <div className={cn(
            'flex flex-col',
            config.layout === 'list' ? 'overflow-hidden' : 'mt-2'
          )}>
            <h3 className="font-semibold text-sm truncate">{track.title}</h3>
            {track.user_id && (
              <p className="text-xs text-muted-foreground truncate">
                {/* Creator name would go here */}
              </p>
            )}
          </div>
        )}

        {/* Version switcher */}
        {config.showVersionToggle && allVersions.length > 1 && (
          <div className="absolute top-2 right-2 flex gap-1">
            {allVersions.map((version) => (
              <button
                key={version.id}
                onClick={(e) => {
                  e.stopPropagation();
                  switchVersion(version.id);
                  onVersionSwitch?.(version.id);
                }}
                disabled={versionPending}
                className={cn(
                  'px-2 py-1 text-xs rounded-full',
                  version.is_primary
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {version.version_label}
              </button>
            ))}
          </div>
        )}

        {/* Stem count indicator */}
        {config.showStemCount && (track as any).stem_count > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs">
            <Music className="w-3 h-3" />
            <span>{(track as any).stem_count} stems</span>
          </div>
        )}

        {/* Action buttons */}
        {config.showActions && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            {/* Play button - always 44x44 minimum */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.(track);
              }}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:scale-105 active:scale-95 transition-transform"
            >
              <Play className="w-5 h-5" />
            </button>

            {/* Enhanced variant specific actions */}
            {variant === 'enhanced' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike();
                  }}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-secondary hover:bg-secondary/80 rounded-full"
                >
                  <Heart className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    shareTrack('telegram');
                  }}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center bg-secondary hover:bg-secondary/80 rounded-full"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Professional variant MIDI status */}
        {variant === 'professional' && (props as any).midiStatus && (
          <div className="absolute top-2 left-2 flex gap-1">
            {(props as any).midiStatus.hasMidi && (
              <span className="px-2 py-1 text-xs bg-purple-500 text-white rounded-full">
                MIDI
              </span>
            )}
            {(props as any).midiStatus.hasPdf && (
              <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                PDF
              </span>
            )}
          </div>
        )}
      </motion.div>
    );

    return baseContent;
  };

  return renderContent();
}

export default UnifiedTrackCard;
