/**
 * PlayerTrackInfo - Header section of the fullscreen player.
 * Shows track title, style, version switcher, and action buttons
 * (close, visualizer toggle, karaoke, queue).
 */

import { Button } from "@/components/ui/button";
import { X, ListMusic, BarChart3, Mic2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { glassButton } from "@/lib/glass";
import { motion } from "@/lib/motion";
import { hapticImpact } from "@/lib/haptic";
import { VersionSwitcher } from "./VersionSwitcher";
import { Track } from "@/types/track";

interface PlayerTrackInfoProps {
  track: Track;
  showVisualizer: boolean;
  onToggleVisualizer: () => void;
  hasLyrics: boolean;
  onKaraokeMode: () => void;
  onQueueOpen: () => void;
  onClose: () => void;
}

export function PlayerTrackInfo({
  track,
  showVisualizer,
  onToggleVisualizer,
  hasLyrics,
  onKaraokeMode,
  onQueueOpen,
  onClose,
}: PlayerTrackInfoProps) {
  return (
    <motion.header
      className="flex items-center justify-between p-4"
      style={{
        paddingTop:
          "calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.75rem, env(safe-area-inset-top, 0px) + 0.75rem))",
      }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            hapticImpact("light");
            onClose();
          }}
          className={cn("h-11 w-11 rounded-full touch-manipulation transition-colors", glassButton.default)}
          aria-label="Закрыть плеер"
        >
          <X className="h-5 w-5" />
        </Button>
      </motion.div>

      <motion.div
        className="text-center flex-1 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <h2 className="font-display font-semibold text-[17px] leading-tight truncate tracking-tight text-foreground">
            {track.title || "Без названия"}
          </h2>
        </div>
        <p className="text-[12px] text-muted-foreground/80 truncate tracking-tight">{track.style || ""}</p>
        {/* Version Switcher */}
        <div className="flex justify-center mt-2">
          <VersionSwitcher track={track} size="compact" />
        </div>
      </motion.div>

      <div className="flex items-center gap-2">
        {/* Visualizer toggle */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              hapticImpact("light");
              onToggleVisualizer();
            }}
            className={cn(
              "h-11 w-11 rounded-full touch-manipulation transition-colors",
              glassButton.default,
              showVisualizer && "bg-primary/20 border-primary/30",
            )}
            aria-label={showVisualizer ? "Скрыть визуализацию" : "Показать визуализацию"}
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Karaoke mode button */}
        {hasLyrics && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticImpact("light");
                onKaraokeMode();
              }}
              className={cn("h-11 w-11 rounded-full touch-manipulation transition-colors", glassButton.default)}
              aria-label="Режим караоке"
            >
              <Mic2 className="h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {/* Queue button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              hapticImpact("light");
              onQueueOpen();
            }}
            className={cn("h-11 w-11 rounded-full touch-manipulation transition-colors", glassButton.default)}
            aria-label="Открыть очередь"
          >
            <ListMusic className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
}
