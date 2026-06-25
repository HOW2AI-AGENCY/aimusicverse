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
export { TouchFeedback, PressableCard, IconTouchButton } from "./TouchFeedback";
export { SwipeableListItem } from "./SwipeableListItem";
export { PullToRefresh } from "./PullToRefresh";

// ============================================================================
// ANIMATIONS
// ============================================================================
export { AnimatedList, AnimatedGrid } from "./AnimatedList";
export { PageTransition, AnimatedSection, FadeIn, ScaleIn } from "./PageTransition";
export { AnimatedCounter } from "./AnimatedCounter";

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
} from "./LoadingSpinner";

// ============================================================================
// IMAGES
// ============================================================================
export { ProgressiveImage, AvatarImage } from "./ProgressiveImage";

// ============================================================================
// EMPTY STATES
// ============================================================================
export { EmptyState } from "./EmptyState";

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
} from "./skeleton-components";

// Base skeleton (for custom compositions)
export { Skeleton } from "./skeleton";

// ============================================================================
// INTERACTIVE COMPONENTS
// ============================================================================
export { InteractiveCard, InteractiveListItem, InteractiveButton } from "./InteractiveCard";

// ============================================================================
// SHIMMER EFFECTS
// ============================================================================
export { Shimmer, ShimmerBlock, ShimmerText, ShimmerAvatar } from "./Shimmer";

// ============================================================================
// FEEDBACK & NOTIFICATIONS
// ============================================================================
export { showToast, toast } from "./FeedbackToast";

// ============================================================================
// BADGES & INDICATORS
// ============================================================================
export { NotificationBadge, StatusIndicator, LabelBadge } from "./NotificationBadge";

// ============================================================================
// FORM COMPONENTS
// ============================================================================
export { FloatingInput, FloatingTextarea } from "./FloatingInput";

// ============================================================================
// SHEETS & OVERLAYS
// ============================================================================
export { ActionSheet } from "./ActionSheet";

// ============================================================================
// PROGRESS & STEPS
// ============================================================================
export { ProgressSteps, ProgressBarSteps } from "./ProgressSteps";

// ============================================================================
// COLLAPSIBLE SECTIONS
// ============================================================================
export { Collapsible as CollapsibleSection, Accordion, ExpandableText } from "./CollapsibleSection";

// ============================================================================
// CHIPS & TAGS
// ============================================================================
export { ChipInput, ChipSelector } from "./ChipInput";

// ============================================================================
// REFINED COMPONENTS
// ============================================================================
export { RefinedButton, IconButton, ButtonGroup } from "./RefinedButton";
export { RefinedCard, CardHeader, CardContent, CardFooter, FeatureCard, StatCard } from "./RefinedCard";
export { RefinedTrackCard } from "./RefinedTrackCard";
export { EnhancedTooltip, Shortcut, TooltipWithShortcut } from "./EnhancedTooltip";
export { LoadingOverlay, ProgressOverlay, SkeletonOverlay } from "./LoadingOverlay";
export { StatusBadge, StatusDot } from "./StatusBadge";

// ============================================================================
// HOOKS RE-EXPORTS
// ============================================================================
export { useScrollReveal, useStaggeredReveal } from "@/hooks/useScrollReveal";
export { useSmoothCounter } from "@/hooks/useSmoothCounter";
export { useOptimistic, useOptimisticList } from "@/hooks/useOptimistic";
export { usePullToRefresh } from "@/hooks/usePullToRefresh";
export { useSwipeActions } from "@/hooks/useSwipeActions";
export { useKeyboardShortcuts, usePlayerShortcuts, commonShortcuts } from "@/hooks/useKeyboardShortcuts";
