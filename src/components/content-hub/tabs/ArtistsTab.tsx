import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, Users, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateArtistFromTrackDialog } from '@/components/artist/CreateArtistFromTrackDialog';
import { ArtistDetailsPanel } from '@/components/artist/ArtistDetailsPanel';
import type { Artist } from '@/hooks/useArtists';

interface ArtistData {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  genre_tags: string[] | null;
  is_public: boolean;
  created_at: string;
  user_id: string;
}

export function ArtistsTab() {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ArtistData | null>(null);

  const { data: artists, isLoading } = useQuery({
    queryKey: ['my-artists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, avatar_url, bio, genre_tags, is_public, created_at, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ArtistData[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {artists?.length || 0} артистов
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Создать
        </Button>
      </div>

      {/* Artists Grid */}
      {artists && artists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {artists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => setSelectedArtist(artist)}
              className={cn(
                "relative group p-3 rounded-xl bg-card/50 border border-border/50",
                "hover:bg-card hover:border-border cursor-pointer transition-all",
                "active:scale-[0.98] touch-manipulation"
              )}
            >
              {/* Avatar */}
              <div className="aspect-square rounded-lg bg-secondary overflow-hidden mb-2">
                {artist.avatar_url ? (
                  <img
                    src={artist.avatar_url}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Info */}
              <h3 className="font-medium text-sm truncate">{artist.name}</h3>
              {artist.genre_tags && artist.genre_tags.length > 0 && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {artist.genre_tags.slice(0, 2).join(', ')}
                </p>
              )}

              {/* Public badge */}
              {artist.is_public && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-medium">
                  Public
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Music className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Нет созданных артистов</p>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Создать артиста
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <CreateArtistFromTrackDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Artist Details Panel */}
      {selectedArtist && (
        <ArtistDetailsPanel
          artist={selectedArtist as Artist}
          open={!!selectedArtist}
          onOpenChange={(open) => !open && setSelectedArtist(null)}
        />
      )}
    </div>
  );
}
