/**
 * UX Components Index
 * Feature: 032-professional-ui
 * 
 * Central export for all UX enhancement components.
 * Import from this file for consistent UX patterns across the app.
 * 
 * @example
 * import { TouchFeedback, AnimatedList, EmptyState } from '@/components/ui/ux-components';
 */

// ============================================================================
// TOUCH & INTERACTION
// ============================================================================
export { TouchFeedback, PressableCard, IconTouchButton } from './TouchFeedback';

// ============================================================================
// ANIMATIONS
// ============================================================================
export { AnimatedList, AnimatedGrid } from './AnimatedList';
export { PageTransition, AnimatedSection, FadeIn, ScaleIn } from './PageTransition';

// ============================================================================
// LOADING STATES
// ============================================================================
export { 
  LoadingSpinner, 
  FullPageLoading, 
  InlineLoading, 
  LoadingDots,
  ButtonLoading,
  SectionLoading,
} from './LoadingSpinner';

// ============================================================================
// IMAGES
// ============================================================================
export { ProgressiveImage, AvatarImage } from './ProgressiveImage';

// ============================================================================
// EMPTY STATES
// ============================================================================
export { EmptyState, InlineEmpty } from './EmptyState';

// ============================================================================
// SKELETONS - Complete skeleton library for loading states
// ============================================================================
export {
  // Track components
  TrackCardSkeleton,
  TrackCardSkeletonCompact,
  TrackRowSkeleton,
  
  // Player
  PlayerSkeleton,
  
  // Lists & Grids
  ListItemSkeleton,
  GridSkeleton,
  
  // Horizontal scroll
  CarouselSkeleton,
  HorizontalScrollSkeleton,
  
  // Sections
  SectionSkeleton,
  SectionHeaderSkeleton,
  
  // Forms
  FormSkeleton,
  
  // Stats & Widgets
  StatsWidgetSkeleton,
  
  // Profile
  ProfileHeaderSkeleton,
  
  // Specialized
  WaveformSkeleton,
  PlaylistCoverSkeleton,
  ArtistCardSkeleton,
  TextSkeleton,
} from './skeleton-components';

// Base skeleton (for custom compositions)
export { Skeleton } from './skeleton';

// ============================================================================
// INTERACTIVE COMPONENTS
// ============================================================================
export { InteractiveCard, InteractiveListItem, InteractiveButton } from './InteractiveCard';

// ============================================================================
// SHIMMER EFFECTS
// ============================================================================
export { Shimmer, ShimmerBlock, ShimmerText, ShimmerAvatar } from './Shimmer';

// ============================================================================
// FEEDBACK & NOTIFICATIONS
// ============================================================================
export { showToast, toast } from './FeedbackToast';

// ============================================================================
// ANIMATED COUNTER
// ============================================================================
export { AnimatedCounter } from './AnimatedCounter';
