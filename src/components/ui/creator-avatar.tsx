/**
 * Creator Avatar - Clickable avatar that navigates to creator's profile
 */

import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTelegram } from '@/contexts/TelegramContext';
import { cn } from '@/lib/utils';

interface CreatorAvatarProps {
  userId: string;
  photoUrl?: string | null;
  name?: string | null;
  username?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function CreatorAvatar({ 
  userId, 
  photoUrl, 
  name, 
  username,
  size = 'sm',
  showTooltip = true,
  className 
}: CreatorAvatarProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const displayName = name || username || 'Пользователь';
  const initial = displayName[0]?.toUpperCase() || 'U';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    hapticFeedback?.('light');
    navigate(`/profile/${userId}`);
  };

  const avatar = (
    <Avatar 
      className={cn(
        sizeClasses[size],
        'cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all',
        className
      )}
      onClick={handleClick}
    >
      {photoUrl && <AvatarImage src={photoUrl} alt={displayName} />}
      <AvatarFallback className="bg-primary/10 font-medium">
        {initial}
      </AvatarFallback>
    </Avatar>
  );

  if (!showTooltip) return avatar;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {avatar}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{displayName}</p>
          <p className="text-muted-foreground text-[10px]">Нажмите, чтобы открыть профиль</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Clickable creator name link
interface CreatorLinkProps {
  userId: string;
  name?: string | null;
  username?: string | null;
  className?: string;
}

export function CreatorLink({ userId, name, username, className }: CreatorLinkProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const displayName = name || username || 'Пользователь';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    hapticFeedback?.('light');
    navigate(`/profile/${userId}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'text-muted-foreground hover:text-primary transition-colors truncate text-left',
        className
      )}
    >
      {displayName}
    </button>
  );
}
