import { Play } from "@/lib/icons";
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
  /** Called with the track id; matches useHomePageHandlers.handleTrackClick. */
  onTrackClick: (trackId: string) => void;
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
      <h3 className="font-sans font-bold text-[17px] text-foreground">В тренде сообщества</h3>
      <div className="flex flex-col gap-1">
        {tracks.slice(0, 4).map((track) => (
          <button
            key={track.id}
            onClick={() => onTrackClick(track.id)}
            className="flex items-center gap-3.5 p-2.5 rounded-[14px] hover:bg-card/60 transition-colors text-left w-full"
          >
            <div className="relative w-[50px] h-[50px] rounded-xl overflow-hidden flex-shrink-0">
              <LazyImage
                src={track.cover_url ?? ""}
                alt={track.title ?? "Track"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-radial from-white/25 to-transparent opacity-60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14.5px] text-foreground/90 truncate">{track.title ?? "Без названия"}</p>
              <p className="text-[12.5px] text-muted-foreground mt-0.5 truncate">
                AI · {track.style ?? ""}
              </p>
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
