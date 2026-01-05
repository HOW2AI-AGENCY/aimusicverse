/**
 * Image Skeleton Variant
 *
 * Placeholder for images
 */

import { cn } from '@/lib/utils';
import { Shimmer } from '../unified-skeleton';
import type { ImageSkeletonProps } from '../unified-skeleton.types';

export function ImageSkeleton({
  width,
  height,
  shape = 'square',
  className,
}: Omit<ImageSkeletonProps, 'variant' | 'animated' | 'speed'>) {
  const shapeClass = {
    square: 'rounded-md',
    circle: 'rounded-full',
    rounded: 'rounded-lg',
  }[shape];

  const widthStyle = typeof width === 'number' ? `${width}px` : width;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <Shimmer
      className={cn(
        'shrink-0',
        shapeClass,
        className
      )}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    />
  );
}
