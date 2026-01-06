// LikeButton component - Sprint 011
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLikeTrack } from '@/hooks/engagement/useLikeTrack';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  trackId: string;
  size?: 'sm' | 'default' | 'lg';
  showCount?: boolean;
  likesCount?: number;
  className?: string;
  initialLiked?: boolean;
}

export function LikeButton({ 
  trackId, 
  size = 'default', 
  showCount = false,
  likesCount = 0,
  className,
  initialLiked
}: LikeButtonProps) {
  const { isLiked, isLoading, toggleLike } = useLikeTrack(trackId, initialLiked);

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
      className={cn(
        'gap-1.5 transition-all',
        isLiked && 'text-red-500 hover:text-red-600',
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        toggleLike();
      }}
      disabled={isLoading}
    >
      <Heart 
        className={cn(
          iconSize,
          'transition-all',
          isLiked && 'fill-current'
        )} 
      />
      {showCount && (
        <span className="text-sm font-medium">
          {likesCount + (isLiked ? 1 : 0)}
        </span>
      )}
    </Button>
  );
}
