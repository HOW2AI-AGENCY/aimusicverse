/**
 * Unified Skeleton Component Family - Exports
 */

// Main component
export { UnifiedSkeleton, Shimmer } from './unified-skeleton';

// Types
export type {
  UnifiedSkeletonProps,
  TextSkeletonProps,
  CardSkeletonProps,
  ListSkeletonProps,
  ImageSkeletonProps,
  BaseSkeletonProps,
} from './unified-skeleton.types';

// Type guards
export {
  isTextSkeletonProps,
  isCardSkeletonProps,
  isListSkeletonProps,
  isImageSkeletonProps,
} from './unified-skeleton.types';

// Config
export { SKELETON_CONFIG, SKELETON_PRESETS } from './unified-skeleton.config';
