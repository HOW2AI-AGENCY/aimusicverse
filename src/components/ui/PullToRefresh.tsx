/**
 * Pull to Refresh Component
 * Feature: 032-professional-ui
 *
 * Visual indicator for pull-to-refresh gesture
 */

import React, { forwardRef, ReactNode } from "react";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { RefreshCw, ArrowDown } from "@/lib/icons";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
  className?: string;
}

export const PullToRefresh = forwardRef<HTMLDivElement, PullToRefreshProps>(
  ({ children, onRefresh, threshold = 80, enabled = true, className }, ref) => {
    const { containerRef, isPulling, isRefreshing, pullDistance, progress } = usePullToRefresh({
      onRefresh,
      threshold,
      enabled,
    });

    return (
      <div
        ref={(el) => {
          containerRef(el);
          if (typeof ref === "function") ref(el);
          else if (ref) ref.current = el;
        }}
        className={cn("relative overflow-auto", className)}
      >
        {/* Pull indicator */}
        <motion.div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 z-10",
            "flex items-center justify-center",
            "w-10 h-10 rounded-full",
            "bg-background/90 backdrop-blur-sm",
            "border border-border shadow-lg",
            !isPulling && !isRefreshing && "opacity-0",
          )}
          style={{
            top: Math.max(pullDistance - 48, -48),
          }}
          animate={{
            scale: isRefreshing ? 1 : 0.8 + progress * 0.2,
            opacity: isRefreshing ? 1 : Math.min(progress * 2, 1),
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {isRefreshing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <RefreshCw className="w-5 h-5 text-primary" />
            </motion.div>
          ) : (
            <motion.div animate={{ rotate: progress >= 1 ? 180 : 0 }} transition={{ type: "spring", stiffness: 300 }}>
              <ArrowDown
                className={cn("w-5 h-5 transition-colors", progress >= 1 ? "text-primary" : "text-muted-foreground")}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Content with pull offset */}
        <motion.div
          style={{
            transform: `translateY(${isRefreshing ? threshold / 2 : pullDistance / 2}px)`,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {children}
        </motion.div>
      </div>
    );
  },
);

PullToRefresh.displayName = "PullToRefresh";

export default PullToRefresh;
