// FollowButton Component - Sprint 011 Task T033
// Follow/Unfollow button with loading and error states

import { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFollow } from '@/hooks/social/useFollow';
import { useTelegram } from '@/contexts/TelegramContext';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showIcon?: boolean;
}

export function FollowButton({
  userId,
  isFollowing,
  size = 'default',
  variant = 'default',
  className,
  showIcon = true,
}: FollowButtonProps) {
  const { hapticFeedback } = useTelegram();
  const { mutate: toggleFollow, isPending } = useFollow();

  const handleClick = () => {
    hapticFeedback('medium');
    toggleFollow({
      userId,
      action: isFollowing ? 'unfollow' : 'follow',
    });
  };

  return (
    <Button
      size={size}
      variant={isFollowing ? variant : 'default'}
      onClick={handleClick}
      disabled={isPending}
      className={cn(className)}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {showIcon &&
            (isFollowing ? (
              <UserMinus className="w-4 h-4 mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            ))}
          {isFollowing ? 'Following' : 'Follow'}
        </>
      )}
    </Button>
  );
}
