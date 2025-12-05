import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, ChevronRight, Sparkles, User } from "lucide-react";
import { usePublicArtists } from "@/hooks/usePublicArtists";

export function PublicArtistsSection() {
  const navigate = useNavigate();
  const { data: artists, isLoading } = usePublicArtists(8);

  if (isLoading) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            AI Артисты
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-32 h-40 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!artists || artists.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          AI Артисты
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/actors")}
          className="text-muted-foreground hover:text-foreground"
        >
          Все <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {artists.map((artist) => (
          <div
            key={artist.id}
            onClick={() => navigate(`/artists?id=${artist.id}`)}
            className="flex-shrink-0 w-32 cursor-pointer group"
          >
            {/* Avatar */}
            <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-all mb-2">
              {artist.avatar_url ? (
                <img
                  src={artist.avatar_url}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Users className="w-10 h-10 text-primary/50" />
                </div>
              )}
            </div>

            {/* Name */}
            <div className="flex items-center gap-1 mb-0.5">
              <p className="font-medium text-sm truncate">{artist.name}</p>
              {artist.is_ai_generated && (
                <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
              )}
            </div>

            {/* Creator */}
            {artist.profiles?.username && (
              <div className="flex items-center gap-1 mb-1">
                <Avatar className="h-3.5 w-3.5">
                  <AvatarImage src={artist.profiles.photo_url || undefined} />
                  <AvatarFallback className="text-[6px] bg-primary/10">
                    <User className="h-2 w-2" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] text-muted-foreground truncate">
                  @{artist.profiles.username}
                </span>
              </div>
            )}

            {/* Genre tag */}
            {artist.genre_tags?.[0] && (
              <Badge variant="secondary" className="text-[10px]">
                {artist.genre_tags[0]}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
