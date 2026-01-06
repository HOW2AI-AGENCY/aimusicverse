import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLikeTrack } from '@/hooks/engagement/useLikeTrack';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from '@/lib/motion';

interface LikeButtonProps {
  trackId: string;
  likesCount?: number;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'ghost' | 'outline' | 'glass';
  showCount?: boolean;
  className?: string;
  initialLiked?: boolean;
}

export function LikeButton({ 
  trackId, 
  likesCount = 0, 
  size = 'icon', 
  variant = 'ghost',
  showCount = false,
  className,
  initialLiked
}: LikeButtonProps) {
  const { user } = useAuth();
  const { isLiked, isLoading, toggleLike } = useLikeTrack(trackId, initialLiked);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      toast.error('Войдите, чтобы ставить лайки');
      return;
    }
    
    toggleLike();
  };

  const displayCount = isLiked 
    ? (likesCount || 0) + (likesCount === 0 ? 1 : 0) 
    : likesCount || 0;

  const isGlass = variant === 'glass';
  const buttonVariant = isGlass ? 'ghost' : variant;

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "relative transition-all",
        isGlass && "bg-black/40 backdrop-blur-sm hover:bg-black/60 border-0",
        isLiked && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={cn(
            "w-4 h-4",
            size === 'sm' && "w-3.5 h-3.5",
            size === 'lg' && "w-5 h-5",
            isLiked && "fill-current"
          )} 
        />
      </motion.div>
      
      {showCount && displayCount > 0 && (
        <span className={cn(
          "ml-1 text-xs font-medium",
          size === 'sm' && "text-[10px]",
          size === 'lg' && "text-sm"
        )}>
          {displayCount}
        </span>
      )}
      
      {/* Animated hearts on like */}
      {isLiked && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-red-500/30" />
        </motion.div>
      )}
    </Button>
  );
}
