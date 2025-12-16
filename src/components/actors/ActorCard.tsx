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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        onClick={() => navigate(`/artists?id=${artist.id}`)}
        className="p-4 glass-card border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
      >
        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-generate/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rank badge */}
        {rank && rank <= 3 && (
          <div className={cn(
            "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg",
            rank === 1 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900",
            rank === 2 && "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700",
            rank === 3 && "bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100"
          )}>
            {rank}
          </div>
        )}
        
        <div className="flex items-center gap-4 relative">
          {/* Avatar with glow effect */}
          <div className="relative">
            <motion.div 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-all flex-shrink-0 shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
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
            </motion.div>
            
            {/* AI badge */}
            {artist.is_ai_generated && (
              <motion.div 
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-md border-2 border-background"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
              </motion.div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {artist.name}
              </h3>
            </div>

            {/* Creator */}
            {artist.profiles?.username && (
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Star className="w-3 h-3 text-primary/50" />
                @{artist.profiles.username}
              </p>
            )}

            {/* Genre Tags */}
            <div className="flex flex-wrap gap-1.5">
              {artist.genre_tags?.slice(0, 2).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-[10px] gap-1 bg-primary/10 text-primary border-0 hover:bg-primary/20"
                >
                  <Music2 className="w-2.5 h-2.5" />
                  {tag}
                </Badge>
              ))}
              {artist.mood_tags?.slice(0, 1).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-[10px] border-muted-foreground/30"
                >
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
