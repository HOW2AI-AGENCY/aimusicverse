import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe, Music, Users, TrendingUp, Heart, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePublicContentBatch, PublicTrackWithCreator } from "@/hooks/usePublicContent";
import { usePublicArtists } from "@/hooks/usePublicArtists";
import { PublicTrackCard } from "@/components/home/PublicTrackCard";
import { ActorCard } from "@/components/actors/ActorCard";
import { motion } from '@/lib/motion';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { Button } from "@/components/ui/button";

const GENRES = ["Pop", "Rock", "Hip-Hop", "Electronic", "R&B", "Jazz", "Indie", "Lo-Fi"];

export default function Community() {
  // Telegram BackButton
  useTelegramBackButton({
    visible: true,
    fallbackPath: '/',
  });

  // URL params for tag search
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFromUrl = searchParams.get('tag');

  const { data: publicContent, isLoading: tracksLoading } = usePublicContentBatch();
  const { data: publicArtists, isLoading: artistsLoading } = usePublicArtists(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tracks");

  // Apply tag from URL to search query
  useEffect(() => {
    if (tagFromUrl) {
      setSearchQuery(tagFromUrl);
    }
  }, [tagFromUrl]);

  // Clear tag filter
  const clearTagFilter = () => {
    setSearchQuery("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tag');
    setSearchParams(newParams, { replace: true });
  };

  const allTracks = publicContent?.allTracks || [];
  const popularTracks = publicContent?.popularTracks || [];

  const filteredTracks = allTracks.filter((track) => {
    const matchesSearch = 
      track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.style?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || track.style?.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  const filteredArtists = publicArtists?.filter((artist) => {
    const matchesSearch = artist.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || artist.genre_tags?.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div 
        className="container max-w-6xl mx-auto px-4 pb-6"
        style={{ paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + 0.75rem), calc(env(safe-area-inset-top, 0px) + 0.75rem))' }}
      >
        {/* Header */}
        <motion.header 
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full glass-card border-primary/20">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Сообщество
              </h1>
              <p className="text-sm text-muted-foreground">
                Открывайте музыку и артистов со всего мира
              </p>
            </div>
          </div>
        </motion.header>

        {/* Search */}
        {/* Active tag indicator */}
        {tagFromUrl && (
          <motion.div
            className="mb-3 flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
              <Search className="w-3.5 h-3.5" />
              Тег: {tagFromUrl}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 hover:bg-transparent"
                onClick={clearTagFilter}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          </motion.div>
        )}

        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Поиск треков и артистов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base glass border-border/50"
            />
          </div>
        </motion.div>

        {/* Genre Filter Pills */}
        <motion.div 
          className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide -mx-4 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Badge
            variant={!selectedGenre ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap px-3 py-1.5 touch-manipulation"
            onClick={() => setSelectedGenre(null)}
          >
            Все жанры
          </Badge>
          {GENRES.map((genre) => (
            <Badge
              key={genre}
              variant={selectedGenre === genre ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap px-3 py-1.5 touch-manipulation"
              onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
            >
              {genre}
            </Badge>
          ))}
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="tracks" className="gap-2">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Треки</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Популярное</span>
            </TabsTrigger>
            <TabsTrigger value="artists" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Артисты</span>
            </TabsTrigger>
          </TabsList>

          {/* All Tracks */}
          <TabsContent value="tracks" className="mt-0">
            {tracksLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : filteredTracks.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTracks.map((track: PublicTrackWithCreator, index: number) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <PublicTrackCard track={track} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Music}
                title="Треки не найдены"
                description="Попробуйте изменить поисковый запрос или фильтры"
              />
            )}
          </TabsContent>

          {/* Popular Tracks */}
          <TabsContent value="popular" className="mt-0">
            {tracksLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : popularTracks.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">Топ по популярности</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {popularTracks.map((track: PublicTrackWithCreator, index: number) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(index * 0.05, 0.3) }}
                    >
                      <PublicTrackCard track={track} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState 
                icon={TrendingUp}
                title="Пока нет популярных треков"
                description="Лайкайте треки, чтобы они попадали в топ"
              />
            )}
          </TabsContent>

          {/* Artists */}
          <TabsContent value="artists" className="mt-0">
            {artistsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : filteredArtists.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArtists.map((artist, index) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <ActorCard artist={artist} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Users}
                title="Артисты не найдены"
                description="Попробуйте изменить поисковый запрос или фильтры"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
