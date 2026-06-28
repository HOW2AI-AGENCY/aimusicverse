import { memo } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface SwipeChevronIndicatorProps {
  direction: "left" | "right";
  visible: boolean;
}

export const SwipeChevronIndicator = memo(function SwipeChevronIndicator({
  direction,
  visible,
}: SwipeChevronIndicatorProps) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, x: direction === "left" ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.5, x: direction === "left" ? -10 : 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none",
            direction === "left" ? "left-4" : "right-4",
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground/15 backdrop-blur-md border border-white/10">
            <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
