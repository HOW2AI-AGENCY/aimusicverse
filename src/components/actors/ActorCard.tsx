import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles } from "lucide-react";
import type { PublicArtist } from "@/hooks/usePublicArtists";

interface ActorCardProps {
  artist: PublicArtist;
}

export function ActorCard({ artist }: ActorCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/artists?id=${artist.id}`)}
      className="p-4 glass-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-all flex-shrink-0">
          {artist.avatar_url ? (
            <img
              src={artist.avatar_url}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary/50" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{artist.name}</h3>
            {artist.is_ai_generated && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                AI
              </Badge>
            )}
          </div>

          {/* Creator */}
          {artist.profiles?.username && (
            <p className="text-xs text-muted-foreground mb-2">
              by @{artist.profiles.username}
            </p>
          )}

          {/* Genre Tags */}
          <div className="flex flex-wrap gap-1">
            {artist.genre_tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
            {artist.mood_tags?.slice(0, 1).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
