import { Play, Music2 } from "@/lib/icons";
import { LazyImage } from "@/components/ui/lazy-image";
import { cn } from "@/lib/utils";

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

export function CommunityTrending({ tracks, onTrackClick, className }: CommunityTrendingProps) {
  if (!tracks || tracks.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-sans font-bold text-base text-foreground">В тренде сообщества</h3>
      <div className="flex flex-col gap-1">
        {tracks.slice(0, 4).map((track) => (
          <button
            key={track.id}
            onClick={() => onTrackClick(track)}
            className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-card/60 transition-colors text-left w-full min-h-touch"
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <LazyImage
                src={track.cover_url ?? ""}
                alt={track.title ?? "Track"}
                coverSize="small"
                className="w-full h-full object-cover"
                fallback={
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Music2 className="w-5 h-5 text-primary/40" aria-hidden="true" />
                  </div>
                }
              />
              <div className="absolute inset-0 bg-gradient-radial from-foreground/20 to-transparent opacity-60 pointer-events-none" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground/90 truncate">{track.title ?? "Без названия"}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">AI · {track.style ?? ""}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Play className="w-3.5 h-3.5 fill-primary text-primary" />
              {formatPlayCount(track.play_count ?? 0)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
