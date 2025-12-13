import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams } from "react-router-dom";
import { Users, Search, Plus, User } from "lucide-react";
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
import { Music2 } from "lucide-react";

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-1">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              AI Артисты
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'my' ? 'Управляйте вашими AI артистами' : 'Исследуйте AI-артистов сообщества'}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2" size="sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Создать</span>
          </Button>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my" className="gap-2">
              <User className="w-4 h-4" />
              Мои артисты
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-2">
              <Users className="w-4 h-4" />
              Сообщество
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4">
          <Badge
            variant={!selectedGenre ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap px-3 py-1.5"
            onClick={() => setSelectedGenre(null)}
          >
            Все
          </Badge>
          {GENRES.map((genre) => (
            <Badge
              key={genre}
              variant={selectedGenre === genre ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap px-3 py-1.5"
              onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>

        {/* Artists Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : currentArtists.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeTab === 'my' ? (
              // My Artists - use Card layout
              currentArtists.map((artist) => (
                <Card 
                  key={artist.id} 
                  className="p-6 glass-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedArtist(artist);
                    setDetailsPanelOpen(true);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0 border-2 border-primary/20">
                      {artist.avatar_url ? (
                        <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-primary/50" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground truncate">{artist.name}</h3>
                        {artist.is_ai_generated && (
                          <Badge variant="outline" className="text-xs">AI</Badge>
                        )}
                      </div>

                      {artist.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{artist.bio}</p>
                      )}

                      {artist.genre_tags && artist.genre_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {artist.genre_tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Music2 className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              // Community Artists - use ActorCard
              currentArtists.map((artist) => (
                <ActorCard key={artist.id} artist={artist} />
              ))
            )}
          </div>
        ) : (
          <Card className="p-12 glass-card border-primary/20 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || selectedGenre 
                ? "Артисты не найдены" 
                : activeTab === 'my' 
                  ? "Создайте вашего первого артиста"
                  : "Нет публичных артистов"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || selectedGenre
                ? "Попробуйте изменить фильтры"
                : activeTab === 'my'
                  ? "AI артисты помогут вам создавать музыку в определенном стиле"
                  : "Станьте первым, кто создаст публичного AI-артиста!"}
            </p>
            {activeTab === 'my' && !searchQuery && !selectedGenre && (
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Создать артиста
              </Button>
            )}
          </Card>
        )}
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