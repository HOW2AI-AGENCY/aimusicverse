import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Music, Users, Sparkles } from 'lucide-react';
import { usePublicArtists } from '@/hooks/usePublicArtists';

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
  const [activeTab, setActiveTab] = useState<'my' | 'community'>('my');
  const { data: publicArtists } = usePublicArtists(30);

  const handleSelect = (artistId: string) => {
    onSelect(artistId);
    onOpenChange(false);
  };

  const currentArtists = activeTab === 'my' ? artists : publicArtists;

  const renderArtistList = (artistList: Artist[] | undefined) => {
    if (!artistList || artistList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Music className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">
            {activeTab === 'my' ? 'Нет ваших артистов' : 'Нет публичных артистов'}
          </p>
          {activeTab === 'my' && (
            <p className="text-sm text-muted-foreground mt-2">
              Создайте артиста в разделе "Артисты"
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-2">
        {artistList.map((artist) => (
          <Button
            key={artist.id}
            type="button"
            variant={selectedArtistId === artist.id ? 'default' : 'outline'}
            className="h-auto p-3 justify-start"
            onClick={() => handleSelect(artist.id)}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {artist.avatar_url ? (
                  <img
                    src={artist.avatar_url}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>

              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm truncate">{artist.name}</span>
                  {artist.is_ai_generated && (
                    <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                  )}
                </div>
                {artist.genre_tags && artist.genre_tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {artist.genre_tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Выберите артиста
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my' | 'community')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my" className="gap-1.5 text-xs">
              <User className="w-3.5 h-3.5" />
              Мои артисты
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" />
              Сообщество
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4 -mx-2 px-2">
            <TabsContent value="my" className="mt-0">
              {renderArtistList(artists)}
            </TabsContent>
            <TabsContent value="community" className="mt-0">
              {renderArtistList(publicArtists as Artist[])}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
