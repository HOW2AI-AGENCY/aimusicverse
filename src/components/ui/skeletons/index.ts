/**
 * Unified Skeleton Components
 * 
 * Central barrel export for all skeleton loading states.
 * Use these for consistent loading UX across the application.
 * 
 * @module components/ui/skeletons
 */

// Core skeleton components
export {
  TrackCardSkeleton,
  TrackRowSkeleton,
  TrackListSkeleton,
  TrackGridSkeleton,
  HeroSkeleton,
  SectionHeaderSkeleton,
  FeaturedSectionSkeleton,
  CommentsSectionSkeleton,
  PlaylistCardSkeleton,
  ProfileHeaderSkeleton,
  PageSkeleton,
  LoadingShimmer,
  shimmer,
  shimmerClass,
} from './TrackListSkeleton';

// Mobile-optimized skeletons
export {
  MobileTrackCardSkeleton,
  MobileTrackListSkeleton,
  MobileSectionSkeleton,
  MobileHeroSkeleton,
  MobileListSkeleton,
  MobileGridSkeleton,
  MobileStudioTrackSkeleton,
  MobilePlayerSkeleton,
  MobileFormFieldSkeleton,
  MobileFormSkeleton,
  MobileStatsSkeleton,
} from '@/components/mobile/MobileSkeletons';

// Re-export base Skeleton for custom use
export { Skeleton } from '@/components/ui/skeleton';
