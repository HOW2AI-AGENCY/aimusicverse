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
    <motion.div 
      whileHover={{ scale: 1.03, y: -4 }} 
      whileTap={{ scale: 0.98 }}
      className="w-[140px] sm:w-[150px] flex-shrink-0 cursor-pointer group"
      onClick={() => navigate(`/artists?id=${artist.id}`)}
    >
      <div className={cn(
        "relative p-3 rounded-xl bg-card/80 border border-border/50 backdrop-blur-sm h-full",
        "hover:border-primary/30 hover:shadow-md transition-all",
        rank && rank <= 3 && rank === 1 && "bg-gradient-to-br from-yellow-500/20 to-amber-500/10",
        rank && rank <= 3 && rank === 2 && "bg-gradient-to-br from-gray-400/20 to-gray-500/10",
        rank && rank <= 3 && rank === 3 && "bg-gradient-to-br from-amber-600/20 to-orange-600/10"
      )}>
        {/* Rank badge */}
        {rank && rank <= 3 && (
          <div className="absolute -top-1.5 -right-1.5 z-10 text-base">
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
          </div>
        )}
        
        {/* Avatar */}
        <div className="flex justify-center mb-2">
          <div className={cn(
            "relative",
            rank && rank <= 3 && "after:absolute after:inset-0 after:rounded-full after:bg-primary/10 after:blur-lg after:-z-10"
          )}>
            <div className={cn(
              "w-14 h-14 rounded-full overflow-hidden border-2 transition-all shadow-md",
              rank === 1 && "border-yellow-500 ring-2 ring-yellow-500/30",
              rank === 2 && "border-gray-400 ring-2 ring-gray-400/30",
              rank === 3 && "border-amber-600 ring-2 ring-amber-600/30",
              (!rank || rank > 3) && "border-border/50 group-hover:border-primary/50"
            )}>
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary/40" />
                </div>
              )}
            </div>
            
            {artist.is_ai_generated && (
              <div className="absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-primary shadow-sm border-2 border-background">
                <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-[11px] text-center truncate mb-0.5 group-hover:text-primary transition-colors">
          {artist.name}
        </h3>

        {artist.profiles?.username && (
          <p className="text-[9px] text-muted-foreground text-center truncate mb-1.5">
            @{artist.profiles.username}
          </p>
        )}

        {/* Genre tags */}
        <div className="flex flex-wrap justify-center gap-1">
          {artist.genre_tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[8px] px-1.5 py-0 h-4 bg-primary/10 text-primary/80 border-0">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
