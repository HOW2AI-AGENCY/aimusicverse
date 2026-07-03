import { useState } from "react";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Music, Users, Sparkles } from "@/lib/icons";
import { usePublicArtists } from "@/hooks/usePublicArtists";
import { LazyImage } from "@/components/ui/lazy-image";
import { motion, AnimatePresence } from "@/lib/motion";
import { EASE_OUT, EASE_SPRING } from "@/lib/motion-presets";

const listContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: EASE_OUT },
};

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

export function ArtistSelector({ open, onOpenChange, artists, selectedArtistId, onSelect }: ArtistSelectorProps) {
  const [activeTab, setActiveTab] = useState<"my" | "community">("my");
  const { data: publicArtists } = usePublicArtists(30);

  const handleSelect = (artistId: string) => {
    onSelect(artistId);
    onOpenChange(false);
  };

  const currentArtists = activeTab === "my" ? artists : publicArtists;

  const renderArtistList = (artistList: Artist[] | undefined) => {
    if (!artistList || artistList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Music className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">
            {activeTab === "my" ? "Нет ваших артистов" : "Нет публичных артистов"}
          </p>
          {activeTab === "my" && (
            <p className="text-sm text-muted-foreground mt-2">Создайте артиста в разделе "Артисты"</p>
          )}
        </div>
      );
    }

    return (
      <motion.div variants={listContainer} initial="hidden" animate="show" className="grid gap-2">
        {artistList.map((artist) => {
          const selected = selectedArtistId === artist.id;
          return (
            <motion.div key={artist.id} variants={listItem} whileTap={{ scale: 0.98 }}>
              <Button
                type="button"
                variant={selected ? "default" : "outline"}
                className="h-auto p-3 justify-start w-full transition-[box-shadow,transform] hover:translate-x-0.5"
                onClick={() => handleSelect(artist.id)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="relative flex-shrink-0">
                    <AnimatePresence>
                      {selected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={EASE_SPRING}
                          className="absolute -inset-1 rounded-full border-2 border-primary-foreground/70"
                        />
                      )}
                    </AnimatePresence>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden">
                      {artist.avatar_url ? (
                        <LazyImage src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{artist.name}</span>
                      {artist.is_ai_generated && <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />}
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
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  return (
    <UnifiedDialog variant="modal" open={open} onOpenChange={onOpenChange} title="Выберите артиста">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "my" | "community")}
        className="flex-1 flex flex-col min-h-0"
      >
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
    </UnifiedDialog>
  );
}
