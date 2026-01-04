import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, ChevronRight, Sparkles, User, Music, Star } from "lucide-react";
import { usePublicArtists } from "@/hooks/usePublicArtists";
import { motion } from '@/lib/motion';
import { cn } from "@/lib/utils";

export function PublicArtistsSection() {
  const navigate = useNavigate();
  const { data: artists, isLoading } = usePublicArtists(8);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted/30 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-5 w-28 bg-muted/30 rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted/30 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="flex-shrink-0 w-32 h-44 rounded-2xl bg-muted/30 animate-pulse"
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
    <section className="space-y-4">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center border border-purple-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Users className="w-5 h-5 text-purple-400" />
            </motion.div>
            {/* Sparkle indicator */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </motion.div>
          </motion.div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gradient">AI Артисты</h2>
            <p className="text-xs text-muted-foreground">Виртуальные музыканты</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/actors")}
          className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-xl"
        >
          Все
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Horizontal scroll with enhanced cards */}
      <div className="relative -mx-4">
        {/* Gradient fades */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide px-4">
          {artists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              onClick={() => navigate(`/artists?id=${artist.id}`)}
              className="flex-shrink-0 w-36 cursor-pointer group"
            >
              {/* Artist Card */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-card/80 to-card/40 border border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                {/* Avatar area */}
                <div className="relative w-full aspect-square">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl scale-90" />
                  
                  {artist.avatar_url ? (
                    <img
                      src={artist.avatar_url}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center">
                      <Users className="w-12 h-12 text-purple-400/50" />
                    </div>
                  )}
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* AI Badge */}
                  {artist.is_ai_generated && (
                    <motion.div
                      className="absolute top-2 right-2"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none text-[9px] px-1.5 py-0.5 shadow-lg">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        AI
                      </Badge>
                    </motion.div>
                  )}
                  
                  {/* Rank badge for top artists */}
                  {index < 3 && (
                    <div className="absolute top-2 left-2">
                      <Badge 
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 font-bold shadow-lg border-none",
                          index === 0 && "bg-gradient-to-r from-yellow-400 to-amber-500 text-black",
                          index === 1 && "bg-gradient-to-r from-slate-300 to-slate-400 text-black",
                          index === 2 && "bg-gradient-to-r from-orange-400 to-amber-600 text-white"
                        )}
                      >
                        <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                        #{index + 1}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info section */}
                <div className="p-3 space-y-2 min-h-[72px]">
                  {/* Name */}
                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {artist.name}
                  </p>

                  {/* Creator */}
                  {artist.profiles?.username && (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-4 w-4 ring-1 ring-primary/20">
                        <AvatarImage src={artist.profiles.photo_url || undefined} />
                        <AvatarFallback className="text-[8px] bg-primary/10">
                          <User className="h-2 w-2" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-muted-foreground truncate">
                        @{artist.profiles.username}
                      </span>
                    </div>
                  )}

                  {/* Genre tags - Fixed height container */}
                  <div className="flex flex-wrap gap-1 h-5 overflow-hidden">
                    {artist.genre_tags?.slice(0, 2).map((tag, tagIndex) => (
                      <Badge 
                        key={tagIndex}
                        variant="glass" 
                        className="text-[9px] px-1.5 py-0 h-4"
                      >
                        <Music className="w-2 h-2 mr-0.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
