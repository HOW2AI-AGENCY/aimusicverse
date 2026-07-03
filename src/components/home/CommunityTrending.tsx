import { Play, Music2, Flame } from "@/lib/icons";
import { LazyImage } from "@/components/ui/lazy-image";
import { cn } from "@/lib/utils";
import { motion, type Variants } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Minimal shape — accepts both Track and PublicTrackWithCreator so the
 * home page can pass whichever query result it has without casts.
 */
interface TrendingTrack {
  id: string;
  title: string | null;
  cover_url?: string | null;
  style?: string | null;
  play_count?: number | null;
}

interface CommunityTrendingProps {
  tracks: TrendingTrack[];
  /** Called with the full track record so it plays inline in the compact player. */
  onTrackClick: (track: TrendingTrack) => void;
  className?: string;
}

function formatPlayCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export function CommunityTrending({ tracks, onTrackClick, className }: CommunityTrendingProps) {
  const prefersReducedMotion = useReducedMotion();
  if (!tracks || tracks.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="flex items-center gap-1.5 font-sans font-bold text-base text-foreground">
        <Flame className="w-4 h-4 text-orange-400" aria-hidden="true" />В тренде сообщества
      </h3>
      <motion.div
        className="flex flex-col gap-1"
        initial={prefersReducedMotion ? undefined : "hidden"}
        whileInView={prefersReducedMotion ? undefined : "visible"}
        viewport={{ once: true, amount: 0.3 }}
        variants={prefersReducedMotion ? undefined : listVariants}
      >
        {tracks.slice(0, 4).map((track, index) => {
          const isTop = index === 0;
          return (
            <motion.button
              key={track.id}
              onClick={() => onTrackClick(track)}
              variants={prefersReducedMotion ? undefined : itemVariants}
              whileHover={prefersReducedMotion ? undefined : { x: 2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              className={cn(
                "group relative flex items-center gap-3.5 p-2.5 rounded-xl text-left w-full min-h-touch",
                "border border-transparent transition-colors duration-200",
                "hover:bg-card/60 hover:border-border/40",
                isTop && "bg-gradient-to-r from-primary/[0.06] to-transparent",
              )}
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <LazyImage
                  src={track.cover_url ?? ""}
                  alt={track.title ?? "Track"}
                  coverSize="small"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  fallback={
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Music2 className="w-5 h-5 text-primary/40" aria-hidden="true" />
                    </div>
                  }
                />
                <div className="absolute inset-0 bg-gradient-radial from-foreground/20 to-transparent opacity-60 pointer-events-none" />
                {/* Rank badge */}
                <span
                  className={cn(
                    "absolute -top-1 -left-1 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shadow-sm ring-2 ring-background",
                    isTop
                      ? "bg-gradient-to-br from-orange-400 to-primary text-white animate-pulse-glow"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground/90 truncate">{track.title ?? "Без названия"}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">AI · {track.style ?? ""}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Play className="w-3.5 h-3.5 fill-primary text-primary transition-transform duration-200 group-hover:scale-110" />
                {formatPlayCount(track.play_count ?? 0)}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
