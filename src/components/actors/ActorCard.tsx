import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles, Star, Music2, TrendingUp } from "lucide-react";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { PublicArtist } from "@/hooks/usePublicArtists";

interface ActorCardProps {
  artist: PublicArtist;
  rank?: number;
}

export function ActorCard({ artist, rank }: ActorCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
      <Card
        onClick={() => navigate(`/artists?id=${artist.id}`)}
        className="p-3 glass-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer group relative overflow-hidden"
      >
        {/* Rank badge */}
        {rank && rank <= 3 && (
          <div className={cn(
            "absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
            rank === 1 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900",
            rank === 2 && "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700",
            rank === 3 && "bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100"
          )}>
            {rank}
          </div>
        )}
        
        <div className="flex items-center gap-3 relative">
          {/* Avatar */}
          <div className="relative">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-primary/20 flex-shrink-0">
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary/50" />
                </div>
              )}
            </div>
            
            {artist.is_ai_generated && (
              <div className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-primary shadow-sm border border-background">
                <Sparkles className="w-2 h-2 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
              {artist.name}
            </h3>

            {artist.profiles?.username && (
              <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 text-primary/50" />
                @{artist.profiles.username}
              </p>
            )}

            <div className="flex flex-wrap gap-1">
              {artist.genre_tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
