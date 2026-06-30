/**
 * CoverPage — central page of the fullscreen player.
 *
 * Minimalist, symmetric: large square cover, title, style.
 * Fixed dimensions, no layout shifts.
 */

import { Music2 } from "@/lib/icons";
import { LazyImage } from "@/components/ui/lazy-image";
import { motion } from "@/lib/motion";
import { usePlayerTransition } from "@/components/player/PlayerTransitionProvider";
import type { Track } from "@/types/track";

interface CoverPageProps {
  track: Track;
}

export function CoverPage({ track }: CoverPageProps) {
  const { artworkLayoutId } = usePlayerTransition();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6">
      <motion.div
        layoutId={artworkLayoutId}
        className="relative aspect-square w-[min(72vw,22rem)] overflow-hidden rounded-3xl bg-muted/40 ring-1 ring-border/40 shadow-2xl shadow-black/25"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {track.cover_url ? (
          <LazyImage
            src={track.cover_url}
            alt={track.title || "Обложка"}
            coverSize="large"
            priority
            containerClassName="absolute inset-0"
            className="h-full w-full object-cover"
            fallback={
              <div className="flex h-full w-full items-center justify-center">
                <Music2 className="h-12 w-12 text-muted-foreground/60" aria-hidden />
              </div>
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music2 className="h-16 w-16 text-muted-foreground/50" aria-hidden />
          </div>
        )}
      </motion.div>

      <div className="mt-6 w-full max-w-[22rem] text-center">
        <h1 className="truncate font-display text-[20px] font-semibold leading-tight text-foreground">
          {track.title || "Без названия"}
        </h1>
        {track.style && (
          <p className="mt-1 truncate text-[13px] text-muted-foreground/80">{track.style}</p>
        )}
      </div>
    </div>
  );
}
