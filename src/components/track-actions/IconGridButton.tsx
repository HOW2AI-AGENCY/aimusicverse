/**
 * IconGridButton - Ultra compact icon button for action grids
 * 56px height, no sublabel, minimalist design
 * Includes haptic feedback support
 */

import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, Loader2 } from "@/lib/icons";
import { hapticImpact } from "@/lib/haptic";
import { motion, AnimatePresence } from "@/lib/motion";
import { EASE_SPRING } from "@/lib/motion-presets";

interface IconGridButtonProps {
  icon: LucideIcon;
  label: string;
  color?: "pink" | "purple" | "green" | "amber" | "blue" | "cyan" | "orange" | "red" | "emerald" | "sky" | "muted";
  badge?: string | number;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  className?: string;
  /** Enable haptic feedback on click (default: true) */
  haptic?: boolean;
}

const colorStyles = {
  pink: { bg: "bg-pink-500/10", text: "text-pink-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
  green: { bg: "bg-green-500/10", text: "text-green-500" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-500" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
  red: { bg: "bg-red-500/10", text: "text-red-500" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  sky: { bg: "bg-sky-500/10", text: "text-sky-500" },
  muted: { bg: "bg-muted", text: "text-foreground" },
};

export const IconGridButton = forwardRef<HTMLButtonElement, IconGridButtonProps>(
  ({ icon: Icon, label, color = "muted", badge, disabled, loading, onClick, className, haptic = true }, ref) => {
    const styles = colorStyles[color];

    const handleClick = useCallback(() => {
      if (haptic) {
        hapticImpact("light");
      }
      onClick();
    }, [haptic, onClick]);

    return (
      <motion.button
        ref={ref}
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        whileTap={disabled || loading ? undefined : { scale: 0.92 }}
        transition={EASE_SPRING}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 group",
          "p-1.5 min-h-[56px] rounded-xl",
          "touch-manipulation",
          // Pure CSS hover (desktop-only by nature) instead of a JS whileHover
          // gesture recognizer — the latter can compete with native touch scroll.
          "hover:bg-muted/50 hover:-translate-y-px transition-[background-color,transform] duration-200",
          disabled && "opacity-40 pointer-events-none",
          className,
        )}
      >
        {/* Icon container - 36x36 */}
        <div className={cn("relative w-9 h-9 rounded-lg flex items-center justify-center", styles.bg)}>
          {loading ? (
            <Loader2 className={cn("w-4 h-4 animate-spin", styles.text)} />
          ) : (
            <Icon className={cn("w-4 h-4 transition-transform duration-200 group-hover:scale-110", styles.text)} />
          )}

          {/* Badge overlay */}
          <AnimatePresence>
            {badge !== undefined && !loading && (
              <motion.span
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={EASE_SPRING}
                className="absolute -top-1 -right-1 h-3.5 min-w-3.5 px-0.5 text-[0.5625rem] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center leading-none"
              >
                {badge}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Label */}
        <span className="text-[0.625rem] font-medium text-foreground/70 text-center leading-tight truncate max-w-full px-0.5">
          {label}
        </span>
      </motion.button>
    );
  },
);

IconGridButton.displayName = "IconGridButton";
