// FollowButton component - Sprint 011
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFollow } from '@/hooks/social/useFollow';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  initialFollowing?: boolean;
}

export function FollowButton({ userId, size = 'default', className, initialFollowing }: FollowButtonProps) {
  const { user } = useAuth();
  const { isFollowing, isLoading, toggleFollow } = useFollow(userId, initialFollowing);

  // Don't show button for own profile
  if (user?.id === userId) return null;

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size={size}
      className={cn('gap-1.5', className)}
      onClick={(e) => {
        e.stopPropagation();
        toggleFollow();
      }}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span className="hidden sm:inline">Отписаться</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Подписаться</span>
        </>
      )}
    </Button>
  );
}
