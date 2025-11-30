import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Music2 } from 'lucide-react';
import { useArtists } from '@/hooks/useArtists';
import { CreateArtistDialog } from '@/components/CreateArtistDialog';
import { Badge } from '@/components/ui/badge';

export default function Artists() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { artists, isLoading } = useArtists();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full glass-card border-primary/20">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Артисты
              </h1>
              <p className="text-muted-foreground">Управляйте вашими AI артистами</p>
            </div>
          </div>

          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Создать артиста
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : artists && artists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artists.map((artist) => (
              <Card key={artist.id} className="p-6 glass-card border-primary/20 hover:border-primary/40 transition-all">
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
                        {artist.genre_tags.slice(0, 3).map((tag) => (
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
            ))}
          </div>
        ) : (
          <Card className="p-12 glass-card border-primary/20 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Создайте вашего первого артиста</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AI артисты помогут вам создавать музыку в определенном стиле
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Создать артиста
            </Button>
          </Card>
        )}
      </div>

      <CreateArtistDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
