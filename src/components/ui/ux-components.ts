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
export { PageTransition, AnimatedSection, FadeIn, ScaleIn } from "./PageTransition";

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
// SHIMMER EFFECTS
// ============================================================================
export { Shimmer, ShimmerBlock, ShimmerText, ShimmerAvatar } from "./Shimmer";

// ============================================================================
// FEEDBACK & NOTIFICATIONS
// ============================================================================
export { toast } from "sonner";
export { notify as showToast } from "@/lib/toast";

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
export { RefinedCard, CardHeader, CardContent, CardFooter, FeatureCard, StatCard } from "./RefinedCard";

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
