/**
 * Unified Skeleton Component Family - Type Definitions
 *
 * Component: UnifiedSkeleton
 * Variants: text, card, list, image
 * Purpose: Consistent loading states with shimmer animations
 *
 * These are the TypeScript type definitions for the unified skeleton component.
 * Implementation files will import these types from src/components/skeleton/unified-skeleton.types.ts
 */

import type { ReactNode } from 'react';

/**
 * Base skeleton properties shared across all variants
 */
export interface BaseSkeletonProps {
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Enable shimmer animation (default: true) */
  animated?: boolean;
  /** Animation speed */
  speed?: 'slow' | 'normal' | 'fast';
}

/**
 * Text skeleton variant - Placeholder for text content
 *
 * Usage: Loading state for text blocks, descriptions, paragraphs,
 * and any text-based content.
 */
export interface TextSkeletonProps extends BaseSkeletonProps {
  /** Discriminant: 'text' variant */
  variant: 'text';
  /** Number of lines to render (default: 3) */
  lines?: number;
  /** Line height style */
  lineHeight?: 'sm' | 'md' | 'lg';
  /** Last line width as percentage (default: 60 for natural look) */
  lastLineWidth?: number;
}

/**
 * Card skeleton variant - Placeholder for card content with cover + text
 *
 * Usage: Loading state for track cards, playlist cards, user cards,
 * and any card-based content with image + text.
 */
export interface CardSkeletonProps extends BaseSkeletonProps {
  /** Discriminant: 'card' variant */
  variant: 'card';
  /** Show cover image placeholder (default: true) */
  showCover?: boolean;
  /** Cover image shape */
  coverShape?: 'square' | 'circle';
  /** Number of text lines below cover (default: 3) */
  lines?: number;
  /** Cover aspect ratio */
  aspectRatio?: '1:1' | '16:9' | '4:3';
}

/**
 * List skeleton variant - Placeholder for list items
 *
 * Usage: Loading state for track lists, playlist tracks, search results,
 * and any list-based content.
 */
export interface ListSkeletonProps extends BaseSkeletonProps {
  /** Discriminant: 'list' variant */
  variant: 'list';
  /** Number of list items to render (default: 5) */
  count?: number;
  /** List layout direction */
  layout?: 'horizontal' | 'vertical';
  /** Show avatar/icon placeholder */
  showAvatar?: boolean;
  /** Number of text lines per item (default: 2) */
  linesPerItem?: number;
}

/**
 * Image skeleton variant - Placeholder for images
 *
 * Usage: Loading state for cover art, avatars, thumbnails,
 * and any image-based content.
 */
export interface ImageSkeletonProps extends BaseSkeletonProps {
  /** Discriminant: 'image' variant */
  variant: 'image';
  /** Image width (CSS value: number with unit or string) */
  width: number | string;
  /** Image height (CSS value: number with unit or string) */
  height: number | string;
  /** Image shape */
  shape?: 'square' | 'circle' | 'rounded';
}

/**
 * Unified Skeleton Props - Discriminated Union
 *
 * The 'variant' property acts as the discriminant, allowing TypeScript
 * to narrow the type and provide accurate intellisense for each variant.
 */
export type UnifiedSkeletonProps =
  | TextSkeletonProps
  | CardSkeletonProps
  | ListSkeletonProps
  | ImageSkeletonProps;

/**
 * Skeleton animation configuration
 */
export interface SkeletonAnimationConfig {
  /** Shimmer gradient start color */
  shimmerStart?: string;
  /** Shimmer gradient end color */
  shimmerEnd?: string;
  /** Background size percentage */
  backgroundSize?: string;
  /** Animation duration in milliseconds */
  duration?: {
    slow?: number;
    normal?: number;
    fast?: number;
  };
}

/**
 * Skeleton variant presets
 */
export interface SkeletonPresets {
  /** Track card skeleton preset */
  trackCard: CardSkeletonProps;
  /** Playlist card skeleton preset */
  playlistCard: CardSkeletonProps;
  /** User profile skeleton preset */
  userProfile: CardSkeletonProps;
  /** Track list skeleton preset */
  trackList: ListSkeletonProps;
  /** Search result skeleton preset */
  searchResult: ListSkeletonProps;
}

/**
 * Type guard for text variant
 */
export function isTextSkeletonProps(
  props: UnifiedSkeletonProps
): props is TextSkeletonProps {
  return props.variant === 'text';
}

/**
 * Type guard for card variant
 */
export function isCardSkeletonProps(
  props: UnifiedSkeletonProps
): props is CardSkeletonProps {
  return props.variant === 'card';
}

/**
 * Type guard for list variant
 */
export function isListSkeletonProps(
  props: UnifiedSkeletonProps
): props is ListSkeletonProps {
  return props.variant === 'list';
}

/**
 * Type guard for image variant
 */
export function isImageSkeletonProps(
  props: UnifiedSkeletonProps
): props is ImageSkeletonProps {
  return props.variant === 'image';
}
