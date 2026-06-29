/**
 * OfflineBanner - Persistent visual indicator for network connectivity
 *
 * When offline: amber banner with "No internet connection"
 * When back online: green banner with "Back online" that auto-hides after 3s
 * Uses framer-motion for smooth enter/exit animations.
 */

import { useState, useEffect, useRef } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { AnimatePresence, motion } from "@/lib/motion";
import { WifiOff, Wifi } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      // User went offline
      wasOfflineRef.current = true;
      setShowReconnected(false);
      logger.info("Network connectivity lost");
    } else if (wasOfflineRef.current) {
      // User came back online after being offline
      wasOfflineRef.current = false;
      setShowReconnected(true);
      logger.info("Network connectivity restored");

      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const showBanner = !isOnline || showReconnected;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          role="alert"
          aria-live="assertive"
          className={cn(
            "fixed top-0 left-0 right-0 z-toast",
            "px-4 py-2 sm:py-3",
            "flex items-center justify-center gap-2",
            "shadow-lg backdrop-blur-md",
            "border-b",
            // Safe area padding for notched devices
            "pt-[max(var(--tg-content-safe-area-inset-top,0px),env(safe-area-inset-top,0px))]",
            isOnline ? "bg-emerald-500/95 border-emerald-600/50" : "bg-amber-500/95 border-amber-600/50",
          )}
        >
          {isOnline ? (
            <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
          )}
          <span className="text-sm sm:text-base font-medium text-white">
            {isOnline ? "Back online" : "No internet connection"}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineBanner;
