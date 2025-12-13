// FollowButton component - Sprint 011 Phase 4
// Follow/unfollow button with loading states

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFollow } from '@/hooks/social/useFollow';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

export function FollowButton({
  userId,
  variant = 'default',
  size = 'default',
  showIcon = true,
  className,
}: FollowButtonProps) {
  const { user } = useAuth();
  const { follow, unfollow, isLoading } = useFollow();
  const [isHovered, setIsHovered] = useState(false);

  // Check if already following
  const { data: isFollowing, isLoading: isCheckingFollow } = useQuery({
    queryKey: ['is-following', user?.id, userId],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error checking follow status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id && user?.id !== userId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Don't show button for self or not logged in
  if (!user || user.id === userId) {
    return null;
  }

  const handleClick = () => {
    if (isFollowing) {
      unfollow({ followingId: userId });
    } else {
      follow({ followingId: userId });
    }
  };

  const buttonText = isFollowing
    ? isHovered
      ? 'Отписаться'
      : 'Подписан'
    : 'Подписаться';

  const buttonVariant = isFollowing && isHovered ? 'destructive' : variant;

  const Icon = isLoading || isCheckingFollow
    ? Loader2
    : isFollowing
    ? UserCheck
    : UserPlus;

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={isLoading || isCheckingFollow}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn('transition-all', className)}
    >
      {showIcon && (
        <Icon
          className={cn(
            'h-4 w-4',
            size === 'sm' && 'h-3 w-3',
            size === 'lg' && 'h-5 w-5',
            (isLoading || isCheckingFollow) && 'animate-spin'
          )}
        />
      )}
      <span className="ml-2">{buttonText}</span>
    </Button>
  );
}
