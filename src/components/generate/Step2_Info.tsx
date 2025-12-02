import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { LongPromptAssistant } from "@/components/suno/LongPromptAssistant";
import { ArtistSelector } from "@/components/generate-form/ArtistSelector";
import { useArtists } from "@/hooks/useArtists";
import { User, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Step2InfoProps {
  onNext: (data: { title: string; lyrics: string }) => void;
  onBack: () => void;
}

export const Step2Info = ({ onNext, onBack }: Step2InfoProps) => {
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [selectedArtistId, setSelectedArtistId] = useState<string>();
  const [artistSelectorOpen, setArtistSelectorOpen] = useState(false);

  const { artists } = useArtists();
  const selectedArtist = artists?.find((a) => a.id === selectedArtistId);

  const handleNext = () => {
    onNext({ title, lyrics });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
          Основная информация
        </h2>
        <p className="text-sm text-muted-foreground">Заполните детали для генерации трека</p>
      </div>

      <div className="space-y-6">
        {/* Artist Selection Card */}
        <Card className="p-4 glass-card border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Артист
            </Label>
            {selectedArtist && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedArtistId(undefined)} className="h-6 text-xs">
                Очистить
              </Button>
            )}
          </div>

          {selectedArtist ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 flex-shrink-0 border-2 border-primary/20">
                {selectedArtist.avatar_url ? (
                  <img
                    src={selectedArtist.avatar_url}
                    alt={selectedArtist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{selectedArtist.name}</div>
                {selectedArtist.genre_tags && selectedArtist.genre_tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {selectedArtist.genre_tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setArtistSelectorOpen(true)}
            >
              <Sparkles className="w-4 h-4" />
              Выбрать артиста (опционально)
            </Button>
          )}
        </Card>

        {/* Title Input Card */}
        <Card className="p-4 glass-card border-primary/20">
          <Label htmlFor="title" className="text-sm font-medium mb-2 block">
            Название трека
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Летняя ночь"
            className="bg-background/50"
          />
        </Card>

        {/* Lyrics Input Card */}
        <Card className="p-4 glass-card border-primary/20">
          <Tabs defaultValue="manual" className="w-full">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Текст песни</Label>
              <TabsList className="h-9">
                <TabsTrigger value="manual" className="text-xs">
                  Вручную
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Ассистент
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="manual" className="mt-0">
              <Textarea
                id="lyrics"
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="[Куплет]&#10;Текст первого куплета...&#10;&#10;[Припев]&#10;Текст припева..."
                rows={10}
                className="bg-background/50 font-mono text-sm"
              />
            </TabsContent>

            <TabsContent value="ai" className="mt-0">
              <LongPromptAssistant onGenerateParts={(parts) => setLyrics(parts.join("\n\n"))} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <div className="flex justify-between pt-4 border-t border-border/50">
        <Button variant="outline" onClick={onBack} size="lg">
          Назад
        </Button>
        <Button onClick={handleNext} size="lg" className="gap-2">
          Далее
          <Sparkles className="w-4 h-4" />
        </Button>
      </div>

      <ArtistSelector
        open={artistSelectorOpen}
        onOpenChange={setArtistSelectorOpen}
        artists={artists}
        selectedArtistId={selectedArtistId}
        onSelect={setSelectedArtistId}
      />
    </div>
  );
};
