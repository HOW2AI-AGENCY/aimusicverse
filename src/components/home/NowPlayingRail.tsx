/**
 * NowPlayingRail — right-rail widget that shows current track context.
 *
 * When a track is active, shows compact cover + meta + style tags so the
 * desktop user always has "what am I listening to" in view without opening
 * the fullscreen player. When idle, renders nothing (parent decides the
 * fallback content).
 */

import { memo } from "react";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { LazyImage } from "@/components/ui/lazy-image";
import { glass } from "@/lib/glass";
import { cn } from "@/lib/utils";
import { Play, Pause, Music2 } from "@/lib/icons";

interface NowPlayingRailProps {
  className?: string;
}

export const NowPlayingRail = memo(function NowPlayingRail({ className }: NowPlayingRailProps) {
  const activeTrack = usePlayerStore((s) => s.activeTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlayPause);

  if (!activeTrack) return null;

  const styleTags = (activeTrack.style || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <section
      aria-label="Сейчас играет"
      className={cn(glass.card, "overflow-hidden rounded-2xl p-4 flex flex-col gap-3", className)}
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <Music2 className="w-3.5 h-3.5" />
        Сейчас играет
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/40">
        {activeTrack.cover_url ? (
          <LazyImage
            src={activeTrack.cover_url}
            alt={activeTrack.title || "Track cover"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Music2 className="w-10 h-10" />
          </div>
        )}
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Пауза" : "Играть"}
          className={cn(
            "absolute bottom-2 right-2 h-11 w-11 rounded-full grid place-items-center",
            "bg-primary text-primary-foreground shadow-lg",
            "transition-transform hover:scale-105 active:scale-95",
          )}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
        </button>
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
          {activeTrack.title || "Без названия"}
        </h3>
        {styleTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {styleTags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground/90 border border-accent/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});
