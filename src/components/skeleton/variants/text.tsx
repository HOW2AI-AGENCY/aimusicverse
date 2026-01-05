/**
 * Text Skeleton Variant
 *
 * Placeholder for text content with shimmer lines
 */

import { cn } from '@/lib/utils';
import { Shimmer } from '../unified-skeleton';
import type { TextSkeletonProps } from '../unified-skeleton.types';
import { SKELETON_CONFIG } from '../unified-skeleton.config';

export function TextSkeleton({
  lines = SKELETON_CONFIG.defaults.lines,
  lineHeight = 'md',
  lastLineWidth = SKELETON_CONFIG.defaults.lastLineWidth,
  className,
  animated,
  speed,
}: Omit<TextSkeletonProps, 'variant'>) {
  const lineHeightClass = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
  }[lineHeight];

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Shimmer
          key={index}
          className={cn(
            lineHeightClass,
            // Last line has natural width variation
            index === lines - 1 && `w-[${lastLineWidth}%]`,
            // All other lines are full width
            index !== lines - 1 && 'w-full'
          )}
        />
      ))}
    </div>
  );
}
