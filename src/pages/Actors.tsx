import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Users, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePublicArtists } from "@/hooks/usePublicArtists";
import { ActorCard } from "@/components/actors/ActorCard";
import { CreateArtistDialog } from "@/components/CreateArtistDialog";

const GENRES = ["Pop", "Rock", "Hip-Hop", "Electronic", "R&B", "Jazz", "Classical", "Folk"];

export default function Actors() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: publicArtists, isLoading } = usePublicArtists(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

  const filteredArtists = publicArtists?.filter((artist) => {
    const matchesSearch = artist.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = !selectedGenre || artist.genre_tags?.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  }) || [];

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
              Исследуйте AI-артистов сообщества
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2" size="sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Создать</span>
          </Button>
        </header>

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
        ) : filteredArtists.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArtists.map((artist) => (
              <ActorCard key={artist.id} artist={artist} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || selectedGenre ? "Артисты не найдены" : "Нет публичных артистов"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || selectedGenre
                ? "Попробуйте изменить фильтры"
                : "Станьте первым, кто создаст AI-артиста!"}
            </p>
          </div>
        )}
      </div>

      <CreateArtistDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
