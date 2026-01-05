/**
 * List Skeleton Variant
 *
 * Placeholder for list items (horizontal or vertical)
 */

import { cn } from '@/lib/utils';
import { Shimmer } from '../unified-skeleton';
import type { ListSkeletonProps } from '../unified-skeleton.types';
import { SKELETON_CONFIG } from '../unified-skeleton.config';

export function ListSkeleton({
  count = SKELETON_CONFIG.defaults.count,
  layout = 'vertical',
  showAvatar = false,
  linesPerItem = 2,
  className,
}: Omit<ListSkeletonProps, 'variant' | 'animated' | 'speed'>) {
  const isHorizontal = layout === 'horizontal';

  return (
    <div className={cn(
      'flex gap-3',
      isHorizontal ? 'flex-row' : 'flex-col',
      className
    )}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'flex gap-3',
            isHorizontal ? 'flex-shrink-0 w-48' : 'w-full'
          )}
        >
          {/* Avatar/Icon */}
          {showAvatar && (
            <Shimmer className={cn(
              'w-12 h-12 min-w-[48px] min-h-[48px]',
              'rounded-full flex-shrink-0'
            )} />
          )}

          {/* Content */}
          <div className="flex flex-col gap-2 flex-1">
            {Array.from({ length: linesPerItem }).map((_, lineIndex) => (
              <Shimmer
                key={lineIndex}
                className={cn(
                  'h-4',
                  // Last line shorter
                  lineIndex === linesPerItem - 1 ? 'w-[60%]' : 'w-full'
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
