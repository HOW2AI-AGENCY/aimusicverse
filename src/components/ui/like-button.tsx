import { Heart } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { useLikeTrack } from "@/hooks/engagement/useLikeTrack";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "@/lib/motion";
import { glassButton } from "@/lib/glass";

interface LikeButtonProps {
  trackId: string;
  likesCount?: number;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "ghost" | "outline" | "glass";
  showCount?: boolean;
  className?: string;
  initialLiked?: boolean;
}

export function LikeButton({
  trackId,
  likesCount = 0,
  size = "icon",
  variant = "ghost",
  showCount = false,
  className,
  initialLiked,
}: LikeButtonProps) {
  const { user } = useAuth();
  // Pass initialLiked to enable optimistic updates with proper initial state
  const { isLiked, isLoading, toggleLike } = useLikeTrack(trackId, initialLiked);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      toast.error("Войдите, чтобы ставить лайки");
      return;
    }

    toggleLike();
  };

  const displayCount = isLiked ? (likesCount || 0) + (likesCount === 0 ? 1 : 0) : likesCount || 0;

  const isGlass = variant === "glass";
  const buttonVariant = isGlass ? "ghost" : variant;

  return (
    <Button
      variant={buttonVariant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      aria-label={isLiked ? "Убрать лайк" : "Поставить лайк"}
      aria-pressed={isLiked}
      className={cn(
        "relative transition-all",
        isGlass && cn(glassButton.default, "border-0"),
        isLiked && "text-destructive hover:text-destructive",
        className,
      )}
    >
      <motion.div animate={isLiked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
        <Heart
          className={cn(
            "w-4 h-4",
            size === "sm" && "w-3.5 h-3.5",
            size === "lg" && "w-5 h-5",
            isLiked && "fill-current",
          )}
        />
      </motion.div>

      {showCount && displayCount > 0 && (
        <span className={cn("ml-1 text-xs font-medium", size === "sm" && "text-[10px]", size === "lg" && "text-sm")}>
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
          <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-destructive/30" />
        </motion.div>
      )}
    </Button>
  );
}
