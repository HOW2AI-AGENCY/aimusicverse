import { memo } from "react";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface GenerationProgressBadgeProps {
  progress?: number; // 0-1
  active: boolean;
  count?: number;
  className?: string;
}

export const GenerationProgressBadge = memo(function GenerationProgressBadge({
  progress,
  active,
  count = 0,
  className,
}: GenerationProgressBadgeProps) {
  if (!active && count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full",
        "bg-primary/10 border border-primary/20",
        "text-[0.625rem] font-semibold text-primary",
        className,
      )}
    >
      {active && (
        <span className="relative w-2.5 h-2.5" aria-hidden="true">
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          <span className="absolute inset-0.5 rounded-full bg-primary" />
        </span>
      )}
      {count > 0 && (
        <span aria-live="polite" aria-atomic="true" role="status" aria-label={`Активных генераций: ${count}`}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </motion.div>
  );
});
