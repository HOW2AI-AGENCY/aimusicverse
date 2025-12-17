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
      whileHover={{ y: -3, scale: 1.02 }} 
      whileTap={{ scale: 0.98 }}
      className="w-[140px] sm:w-[150px] flex-shrink-0"
    >
      <Card
        onClick={() => navigate(`/artists?id=${artist.id}`)}
        className="p-2.5 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm border-border/50 hover:border-primary/40 transition-all cursor-pointer group relative overflow-hidden h-full"
      >
        {/* Rank badge */}
        {rank && rank <= 3 && (
          <div className={cn(
            "absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold z-10",
            rank === 1 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900",
            rank === 2 && "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700",
            rank === 3 && "bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100"
          )}>
            {rank}
          </div>
        )}
        
        <div className="flex flex-col items-center text-center gap-2">
          {/* Avatar */}
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-border/50 group-hover:border-primary/40 transition-colors shadow-sm">
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary/40" />
                </div>
              )}
            </div>
            
            {artist.is_ai_generated && (
              <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-primary shadow-sm border border-background">
                <Sparkles className="w-2 h-2 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="w-full min-w-0 space-y-1">
            <h3 className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
              {artist.name}
            </h3>

            {artist.profiles?.username && (
              <p className="text-[9px] text-muted-foreground truncate">
                @{artist.profiles.username}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-1">
              {artist.genre_tags?.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[8px] px-1 py-0 h-3.5 bg-primary/10 text-primary/80 border-0">
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
