/**
 * Integration Patch for Library.tsx
 * Adds Sprint 32 skeleton components and comment CTAs
 *
 * Инструкция по применению:
 * 1. Открыть src/pages/Library.tsx
 * 2. Добавить импорты
 * 3. Заменить существующие skeleton'ы на новые
 */

// ============ STEP 1: Add/Replace imports ============
// Заменить строки ~16-20:

// Старые:
import { TrackCardSkeleton, TrackCardSkeletonCompact } from "@/components/ui/skeleton-components";
import { GeneratingTrackSkeleton } from "@/components/library/GeneratingTrackSkeleton";
import { MobileListSkeleton, MobileGridSkeleton } from "@/components/mobile/MobileSkeletons";

// Новые:
import {
  TrackCardSkeleton,
  TrackGridSkeleton,
  TrackListSkeleton,
  TrackRowSkeleton,
  GeneratingTrackSkeleton as GeneratingTrackSkeletonNew,
} from "@/components/ui/skeletons/TrackListSkeleton";

// ============ STEP 2: Add FirstCommentCTA import ============
// После строки ~37:

import { FirstCommentCTA } from '@/components/comments/FirstCommentCTA';

// ============ STEP 3: Update Skeleton usage in render ============
// Найти место где рендерятся skeleton'ы и заменить:

// Для Grid View:
{isLoading && tracks.length === 0 ? (
  <TrackGridSkeleton count={8} columns={isMobile ? 2 : 4} />
) : (
  // ... existing grid content
)}

// Для List View:
{isLoading && tracks.length === 0 ? (
  <TrackListSkeleton count={10} />
) : (
  // ... existing list content
)}

// Для generating tracks (заменить существующий GeneratingTrackSkeleton):
{activeGenerations.length > 0 && (
  <div className="mb-4">
    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin text-primary" />
      Генерация...
    </h3>
    <div className="flex gap-3 overflow-x-auto pb-2">
      {activeGenerations.map((gen) => (
        <GeneratingTrackSkeletonNew key={gen.id} />
      ))}
    </div>
  </div>
)}

// ============ STEP 4: Add Continue Creating CTA after track actions ============
// Найти место где рендерятся треки (VirtualizedTrackList или grid) и добавить после:

{/* Continue Creating CTA - shown after playing first track */}
{!isFirstTrack && activeTrack && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-4"
  >
    <ContinueCreatingCTA
      track={activeTrack}
      variant="banner"
      onDismiss={() => {
        const dismissed = JSON.parse(
          localStorage.getItem('dismissed-continue-creating') || '{}'
        );
        dismissed[activeTrack.id] = Date.now();
        localStorage.setItem('dismissed-continue-creating', JSON.stringify(dismissed));
      }}
    />
  </motion.div>
)}

// ============ STEP 5: Add FirstCommentCTA to TrackCard (if shown) ============
// Это требует обновления TrackCard компонента отдельно.
// В src/components/library/TrackCard.tsx добавить:

import { FirstCommentCTA } from '@/components/comments/FirstCommentCTA';
import { useHasCommented } from '@/components/comments/FirstCommentCTA';

// Внутри TrackCard компонента:
const hasCommented = useHasCommented(track.id);

// После метаданных трека, перед actions:
{track.comment_count === 0 && !hasCommented && (
  <FirstCommentCTA
    trackId={track.id}
    trackTitle={track.title}
    variant="compact"
    onOpenComments={() => onOpenComments?.(track.id)}
    className="mt-2"
  />
)}

// ============ STEP 6: Use enhanced shimmer for search ============
// Заменить существующий search placeholder на:

{debouncedSearchQuery && isLoading && tracks.length === 0 ? (
  <div className="space-y-2 py-4">
    <TrackRowSkeleton showNumber={false} />
    <TrackRowSkeleton showNumber={false} />
    <TrackRowSkeleton showNumber={false} />
  </div>
) : (
  // ... existing search results
)}

// ============ USAGE NOTES ============
/**
 * Skeleton Components Available:
 *
 * - TrackCardSkeleton: Grid card with cover, title, meta
 * - TrackRowSkeleton: List row with cover, info, actions
 * - TrackListSkeleton: Multiple rows (count parameter)
 * - TrackGridSkeleton: Grid of cards (columns parameter)
 * - HeroSkeleton: Full hero section
 * - SectionHeaderSkeleton: Section header with title/action
 * - FeaturedSectionSkeleton: Horizontal scroll cards
 * - CommentsSectionSkeleton: Comment list with avatars
 * - PlaylistCardSkeleton: Playlist card
 * - ProfileHeaderSkeleton: Profile header with avatar/stats
 * - PageSkeleton: Full page loading state
 * - GeneratingTrackSkeleton: Individual generating track
 * - LoadingShimmer: Animated shimmer overlay
 *
 * Shimmer Animation:
 * Add className="shimmer" to any Skeleton component for shimmer effect.
 * Import shimmerClass and inject into global styles if needed.
 */
