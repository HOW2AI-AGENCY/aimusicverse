import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Music } from 'lucide-react';

interface Artist {
  id: string;
  name: string;
  avatar_url?: string | null;
  genre_tags?: string[] | null;
  is_ai_generated?: boolean | null;
}

interface ArtistSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artists?: Artist[];
  selectedArtistId?: string;
  onSelect: (artistId: string) => void;
}

export function ArtistSelector({
  open,
  onOpenChange,
  artists,
  selectedArtistId,
  onSelect,
}: ArtistSelectorProps) {
  const handleSelect = (artistId: string) => {
    onSelect(artistId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Выберите артиста
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {!artists || artists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">Нет доступных артистов</p>
              <p className="text-sm text-muted-foreground mt-2">
                Создайте артиста в разделе "Артисты"
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {artists.map((artist) => (
                <Button
                  key={artist.id}
                  type="button"
                  variant={selectedArtistId === artist.id ? 'default' : 'outline'}
                  className="h-auto p-4 justify-start"
                  onClick={() => handleSelect(artist.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {artist.avatar_url ? (
                        <img
                          src={artist.avatar_url}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="font-medium mb-1">{artist.name}</div>
                      {artist.genre_tags && artist.genre_tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {artist.genre_tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {artist.is_ai_generated && (
                      <Badge variant="outline" className="ml-auto">
                        AI
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
