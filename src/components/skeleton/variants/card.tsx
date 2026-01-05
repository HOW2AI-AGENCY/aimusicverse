/**
 * Card Skeleton Variant
 *
 * Placeholder for card content with cover + text
 */

import { cn } from '@/lib/utils';
import { Shimmer } from '../unified-skeleton';
import type { CardSkeletonProps } from '../unified-skeleton.types';
import { SKELETON_CONFIG } from '../unified-skeleton.config';

export function CardSkeleton({
  showCover = true,
  coverShape = 'square',
  lines = SKELETON_CONFIG.defaults.lines,
  aspectRatio = '1:1',
  className,
}: Omit<CardSkeletonProps, 'variant' | 'animated' | 'speed'>) {
  const shapeClass = {
    square: 'rounded-md',
    circle: 'rounded-full',
  }[coverShape];

  const aspectRatioClass = {
    '1:1': 'aspect-square',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
  }[aspectRatio];

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Cover Image */}
      {showCover && (
        <Shimmer
          className={cn(
            'w-full',
            aspectRatioClass,
            shapeClass
          )}
        />
      )}

      {/* Text Lines */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, index) => (
          <Shimmer
            key={index}
            className={cn(
              'h-4',
              // Last line shorter for natural look
              index === lines - 1 ? 'w-[60%]' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
}
