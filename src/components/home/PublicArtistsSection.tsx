import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, ChevronRight, Sparkles, User } from "lucide-react";
import { usePublicArtists } from "@/hooks/usePublicArtists";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";

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
            <div 
              key={i} 
              className="flex-shrink-0 w-32 h-40 rounded-xl bg-muted/50 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
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
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </motion.div>
          <span className="text-gradient">AI Артисты</span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/actors")}
          className="text-muted-foreground hover:text-foreground group"
        >
          Все <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>

      {/* Horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {artists.map((artist, index) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            onClick={() => navigate(`/artists?id=${artist.id}`)}
            className="flex-shrink-0 w-32 cursor-pointer group"
          >
            {/* Avatar with glow */}
            <div className="relative w-32 h-32 mb-2">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 blur-xl opacity-0 group-hover:opacity-60 transition-opacity scale-90" />
              
              <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-all shadow-lg">
                {artist.avatar_url ? (
                  <img
                    src={artist.avatar_url}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary/50" />
                  </div>
                )}
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Name */}
            <div className="flex items-center gap-1 mb-0.5">
              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {artist.name}
              </p>
              {artist.is_ai_generated && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                </motion.div>
              )}
            </div>

            {/* Creator */}
            {artist.profiles?.username && (
              <div className="flex items-center gap-1 mb-1">
                <Avatar className="h-3.5 w-3.5 ring-1 ring-primary/20">
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
              <Badge variant="glass" className="text-[10px]">
                {artist.genre_tags[0]}
              </Badge>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
