/**
 * UX Components Index
 * Feature: UX Improvements
 * 
 * Central export for all UX enhancement components
 */

// Touch and interaction
export { TouchFeedback, PressableCard, IconTouchButton } from './TouchFeedback';

// Animations
export { AnimatedList, AnimatedGrid } from './AnimatedList';
export { PageTransition, AnimatedSection, FadeIn, ScaleIn } from './PageTransition';

// Loading states
export { 
  LoadingSpinner, 
  FullPageLoading, 
  InlineLoading, 
  LoadingDots,
  ButtonLoading,
  SectionLoading,
} from './LoadingSpinner';

// Images
export { ProgressiveImage, AvatarImage } from './ProgressiveImage';

// Empty states
export { EmptyState, InlineEmpty } from './EmptyState';

// Skeletons (re-export from skeleton-components)
export {
  TrackCardSkeleton,
  TrackCardSkeletonCompact,
  PlayerSkeleton,
  ListItemSkeleton,
  GridSkeleton,
  CarouselSkeleton,
  HorizontalScrollSkeleton,
  SectionSkeleton,
  SectionHeaderSkeleton,
  FormSkeleton,
  StatsWidgetSkeleton,
  ProfileHeaderSkeleton,
  WaveformSkeleton,
  PlaylistCoverSkeleton,
  ArtistCardSkeleton,
  TextSkeleton,
} from './skeleton-components';

// Skeleton base
export { Skeleton } from './skeleton';
