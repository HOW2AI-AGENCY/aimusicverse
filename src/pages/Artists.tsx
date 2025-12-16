import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams } from "react-router-dom";
import { Users, Search, Plus, User, Sparkles, Star, TrendingUp, Music2, Mic2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePublicArtists } from "@/hooks/usePublicArtists";
import { useArtists, type Artist } from "@/hooks/useArtists";
import { ActorCard } from "@/components/actors/ActorCard";
import { CreateArtistFromTrackDialog } from "@/components/artist/CreateArtistFromTrackDialog";
import { ArtistDetailsPanel } from "@/components/artist/ArtistDetailsPanel";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";

const GENRES = ["Pop", "Rock", "Hip-Hop", "Electronic", "R&B", "Jazz", "Classical", "Folk"];

export default function Artists() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'my';
  
  const { data: publicArtists, isLoading: publicLoading } = usePublicArtists(50);
  const { artists: myArtists, isLoading: myLoading } = useArtists();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary" />
          <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
    setSearchQuery("");
    setSelectedGenre(null);
  };

  // Filter artists based on search and genre
  const filterArtists = (artists: Artist[]) => {
    return artists?.filter((artist) => {
      const matchesSearch = artist.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = !selectedGenre || artist.genre_tags?.includes(selectedGenre);
      return matchesSearch && matchesGenre;
    }) || [];
  };

  const filteredPublicArtists = filterArtists((publicArtists || []) as Artist[]);
  const filteredMyArtists = filterArtists(myArtists || []);
  const isLoading = activeTab === 'my' ? myLoading : publicLoading;
  const currentArtists = activeTab === 'my' ? filteredMyArtists : filteredPublicArtists;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-border/30 bg-gradient-to-b from-primary/5 via-background to-background">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="absolute top-10 right-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-0 left-20 w-24 h-24 rounded-full bg-generate/10 blur-2xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
        </div>

        <div className="container max-w-6xl mx-auto px-4 py-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.div 
                  className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg border border-primary/20"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Users className="w-7 h-7 text-primary" />
                </motion.div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    AI Артисты
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {activeTab === 'my' ? 'Управляйте вашими AI артистами' : 'Исследуйте AI-артистов сообщества'}
                  </p>
                </div>
              </div>
            </div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => setCreateDialogOpen(true)} 
                className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Создать</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats row */}
          <motion.div 
            className="flex items-center gap-4 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Mic2 className="w-3.5 h-3.5" />
              {myArtists?.length || 0} своих
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {(publicArtists?.length || 0)} публичных
            </Badge>
          </motion.div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Tabs with animations */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger 
              value="my" 
              className={cn(
                "gap-2 rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-md",
                activeTab === 'my' && "text-primary"
              )}
            >
              <User className="w-4 h-4" />
              Мои артисты
              {(myArtists?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {myArtists?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="community" 
              className={cn(
                "gap-2 rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-md",
                activeTab === 'community' && "text-primary"
              )}
            >
              <Users className="w-4 h-4" />
              Сообщество
              {(publicArtists?.length || 0) > 0 && (
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">
                  {publicArtists?.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search with glass effect */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base bg-card/50 border-border/50 focus:border-primary/50 focus:bg-card transition-all rounded-xl"
            />
            {searchQuery && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Badge variant="secondary" className="text-xs">
                  {currentArtists.length} найдено
                </Badge>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Genre Filter Pills with animations */}
        <motion.div 
          className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Badge
              variant={!selectedGenre ? "default" : "outline"}
              className={cn(
                "cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-all",
                !selectedGenre && "bg-primary shadow-md"
              )}
              onClick={() => setSelectedGenre(null)}
            >
              <Star className="w-3 h-3 mr-1" />
              Все
            </Badge>
          </motion.div>
          {GENRES.map((genre, index) => (
            <motion.div 
              key={genre}
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Badge
                variant={selectedGenre === genre ? "default" : "outline"}
                className={cn(
                  "cursor-pointer whitespace-nowrap px-4 py-2 text-sm transition-all",
                  selectedGenre === genre && "bg-primary shadow-md"
                )}
                onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
              >
                {genre}
              </Badge>
            </motion.div>
          ))}
        </motion.div>

        {/* Artists Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div 
                  key={i} 
                  className="h-28 rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 animate-pulse"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                />
              ))}
            </motion.div>
          ) : currentArtists.length > 0 ? (
            <motion.div 
              key="artists"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {activeTab === 'my' ? (
                // My Artists - enhanced Card layout
                currentArtists.map((artist, index) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card 
                      className="p-5 glass-card border-primary/20 hover:border-primary/40 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
                      onClick={() => {
                        setSelectedArtist(artist);
                        setDetailsPanelOpen(true);
                      }}
                    >
                      {/* Hover glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex items-start gap-4 relative">
                        <motion.div 
                          className="relative"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0 border-2 border-primary/20 group-hover:border-primary/40 transition-all shadow-lg">
                            {artist.avatar_url ? (
                              <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Users className="w-7 h-7 text-primary/50" />
                              </div>
                            )}
                          </div>
                          {artist.is_ai_generated && (
                            <div className="absolute -top-1 -right-1 p-1 rounded-full bg-primary shadow-md">
                              <Sparkles className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {artist.name}
                            </h3>
                          </div>

                          {artist.bio && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{artist.bio}</p>
                          )}

                          {artist.genre_tags && artist.genre_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {artist.genre_tags.slice(0, 3).map((tag: string) => (
                                <Badge key={tag} variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary border-0">
                                  <Music2 className="w-2.5 h-2.5" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                // Community Artists - use ActorCard
                currentArtists.map((artist, index) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ActorCard artist={artist} />
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="p-12 glass-card border-primary/20 text-center relative overflow-hidden">
                {/* Decorative elements */}
                <motion.div 
                  className="absolute top-4 right-4 w-20 h-20 rounded-full bg-primary/5 blur-2xl"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center mx-auto mb-5 shadow-lg">
                    <Users className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                </motion.div>
                
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || selectedGenre 
                    ? "Артисты не найдены" 
                    : activeTab === 'my' 
                      ? "Создайте вашего первого артиста"
                      : "Нет публичных артистов"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  {searchQuery || selectedGenre
                    ? "Попробуйте изменить фильтры поиска"
                    : activeTab === 'my'
                      ? "AI артисты помогут вам создавать музыку в определенном стиле"
                      : "Станьте первым, кто создаст публичного AI-артиста!"}
                </p>
                {activeTab === 'my' && !searchQuery && !selectedGenre && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 shadow-lg">
                      <Plus className="w-4 h-4" />
                      Создать артиста
                    </Button>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateArtistFromTrackDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <ArtistDetailsPanel 
        artist={selectedArtist} 
        open={detailsPanelOpen} 
        onOpenChange={setDetailsPanelOpen}
      />
    </div>
  );
}