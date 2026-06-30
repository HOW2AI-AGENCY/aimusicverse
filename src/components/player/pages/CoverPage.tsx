/**
 * CoverPage — central page of the fullscreen player.
 *
 * Minimalist, symmetric: large square cover, title, style.
 * Fixed dimensions, no layout shifts.
 */

import { Music2 } from "@/lib/icons";
import { LazyImage } from "@/components/ui/lazy-image";
import type { Track } from "@/types/track";

interface CoverPageProps {
  track: Track;
}

export function CoverPage({ track }: CoverPageProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6">
      <div className="aspect-square w-[min(72vw,22rem)] overflow-hidden rounded-3xl bg-muted/40 ring-1 ring-border/40 shadow-2xl shadow-black/25">
        {track.cover_url ? (
          <LazyImage
            src={track.cover_url}
            alt={track.title || "Обложка"}
            coverSize="large"
            priority
            aspectRatio="1/1"
            containerClassName="h-full w-full"
            className="h-full w-full object-cover"
            width={352}
            height={352}
            fallback={<Music2 className="h-12 w-12 text-muted-foreground/60" aria-hidden />}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music2 className="h-16 w-16 text-muted-foreground/50" aria-hidden />
          </div>
        )}
      </div>

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
