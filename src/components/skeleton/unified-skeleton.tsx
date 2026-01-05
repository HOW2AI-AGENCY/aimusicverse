/**
 * UnifiedSkeleton Component
 *
 * Consistent loading states with shimmer animations
 *
 * @example
 * ```tsx
 * // Text skeleton
 * <UnifiedSkeleton variant="text" lines={3} />
 *
 * // Card skeleton
 * <UnifiedSkeleton variant="card" showCover lines={3} />
 *
 * // List skeleton
 * <UnifiedSkeleton variant="list" count={5} />
 *
 * // Image skeleton
 * <UnifiedSkeleton variant="image" width={200} height={200} />
 * ```
 */

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { UnifiedSkeletonProps } from './unified-skeleton.types';
import { SKELETON_CONFIG } from './unified-skeleton.config';
import { isTextSkeletonProps, isCardSkeletonProps, isListSkeletonProps, isImageSkeletonProps } from '@/lib/type-guards';

// Lazy load variants
const TextVariant = React.lazy(() => import('./variants/text'));
const CardVariant = React.lazy(() => import('./variants/card'));
const ListVariant = React.lazy(() => import('./variants/list'));
const ImageVariant = React.lazy(() => import('./variants/image'));

/**
 * Unified Skeleton Component
 *
 * Routes to appropriate variant based on discriminant
 */
export function UnifiedSkeleton(props: UnifiedSkeletonProps) {
  const { animated = true, speed = 'normal', className } = props;

  // Animation classes
  const animationClass = animated ? 'animate-shimmer' : '';
  const speedStyle = animated ? {
    animationDuration: SKELETON_CONFIG.speeds[speed],
  } : {};

  if (isTextSkeletonProps(props)) {
    return (
      <TextVariant
        {...props}
        animated={animated}
        speed={speed}
        className={cn(animationClass, className)}
        style={speedStyle}
      />
    );
  }

  if (isCardSkeletonProps(props)) {
    return (
      <CardVariant
        {...props}
        animated={animated}
        speed={speed}
        className={cn(animationClass, className)}
        style={speedStyle}
      />
    );
  }

  if (isListSkeletonProps(props)) {
    return (
      <ListVariant
        {...props}
        animated={animated}
        speed={speed}
        className={cn(animationClass, className)}
        style={speedStyle}
      />
    );
  }

  if (isImageSkeletonProps(props)) {
    return (
      <ImageVariant
        {...props}
        animated={animated}
        speed={speed}
        className={cn(animationClass, className)}
        style={speedStyle}
      />
    );
  }

  return null;
}

/**
 * Base shimmer animation component
 */
export function Shimmer({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('bg-muted rounded', className)}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        repeat: Infinity,
        repeatType: 'reverse',
        duration: 1.5,
      }}
    />
  );
}
