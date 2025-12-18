import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Sparkles, Image as ImageIcon, X, Plus, Play, Pause, Music } from 'lucide-react';
import { useArtists } from '@/hooks/useArtists';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface TrackData {
  title?: string | null;
  style?: string | null;
  tags?: string | null;
  cover_url?: string | null;
  audio_url?: string | null;
}

interface CreateArtistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromTrack?: TrackData | null;
}

export function CreateArtistDialog({ open, onOpenChange, fromTrack }: CreateArtistDialogProps) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [styleDescription, setStyleDescription] = useState('');
  const [genreTags, setGenreTags] = useState<string[]>([]);
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [newGenreTag, setNewGenreTag] = useState('');
  const [newMoodTag, setNewMoodTag] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = useIsMobile();

  // Pre-fill from track data when dialog opens
  useEffect(() => {
    if (open && fromTrack) {
      const trackTitle = fromTrack.title || '';
      const artistName = trackTitle.includes(' - ') 
        ? trackTitle.split(' - ')[0].trim() 
        : `Артист "${trackTitle}"`;
      
      setName(artistName);
      setStyleDescription(fromTrack.style || '');
      setAvatarUrl(fromTrack.cover_url || null);
      
      if (fromTrack.tags) {
        const tags = fromTrack.tags.split(',').map(t => t.trim()).filter(Boolean);
        setGenreTags(tags.slice(0, 5));
      }
      
      setBio(`AI артист, вдохновлённый треком "${trackTitle}"`);
    }
  }, [open, fromTrack]);

  // Cleanup audio on close
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [open]);

  const { createArtist, isCreating } = useArtists();

  const togglePlayback = () => {
    if (!fromTrack?.audio_url) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(fromTrack.audio_url);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleGeneratePortrait = async () => {
    if (!name.trim()) {
      toast.error('Введите имя артиста для генерации портрета');
      return;
    }

    setIsGeneratingPortrait(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-artist-portrait', {
        body: { 
          artistName: name.trim(),
          styleDescription: styleDescription || undefined,
        }
      });

      if (error) throw error;

      if (data?.avatarUrl) {
        setAvatarUrl(data.avatarUrl);
        toast.success('Портрет сгенерирован');
      } else {
        throw new Error('No avatar URL in response');
      }
    } catch (error) {
      logger.error('Error generating portrait', { error });
      toast.error('Ошибка генерации портрета');
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  const addGenreTag = () => {
    if (newGenreTag.trim() && !genreTags.includes(newGenreTag.trim())) {
      setGenreTags([...genreTags, newGenreTag.trim()]);
      setNewGenreTag('');
    }
  };

  const addMoodTag = () => {
    if (newMoodTag.trim() && !moodTags.includes(newMoodTag.trim())) {
      setMoodTags([...moodTags, newMoodTag.trim()]);
      setNewMoodTag('');
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Введите имя артиста');
      return;
    }

    createArtist({
      name: name.trim(),
      bio: bio.trim() || null,
      style_description: styleDescription.trim() || null,
      avatar_url: avatarUrl,
      genre_tags: genreTags.length > 0 ? genreTags : null,
      mood_tags: moodTags.length > 0 ? moodTags : null,
      is_ai_generated: true,
      is_public: true,
    });

    // Reset form
    setName('');
    setBio('');
    setStyleDescription('');
    setGenreTags([]);
    setMoodTags([]);
    setAvatarUrl(null);
    onOpenChange(false);
  };

  const formContent = (
    <div className="space-y-4">
      {/* Track Preview (if from track) */}
      {fromTrack && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
          <div className="relative shrink-0">
            {fromTrack.cover_url ? (
              <img 
                src={fromTrack.cover_url} 
                alt={fromTrack.title || ''} 
                className="w-14 h-14 rounded-lg object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center">
                <Music className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            {fromTrack.audio_url && (
              <button
                onClick={togglePlayback}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 hover:opacity-100 transition-opacity"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Создание на основе трека</p>
            <p className="text-sm font-medium truncate">{fromTrack.title}</p>
            {fromTrack.audio_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 mt-1 text-xs"
                onClick={togglePlayback}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3 h-3 mr-1" />
                    Пауза
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1" />
                    Прослушать
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Avatar Section */}
      <div className={cn(
        "flex flex-col items-center gap-3 p-4 rounded-lg border border-border/50 bg-muted/30",
        isMobile && "p-3"
      )}>
        {avatarUrl ? (
          <div className={cn(
            "relative rounded-full overflow-hidden border-4 border-primary/20",
            isMobile ? "w-24 h-24" : "w-32 h-32"
          )}>
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            <button
              onClick={() => setAvatarUrl(null)}
              className="absolute top-0.5 right-0.5 p-1 rounded-full bg-background/80 hover:bg-background"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className={cn(
            "rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-4 border-primary/20",
            isMobile ? "w-24 h-24" : "w-32 h-32"
          )}>
            <User className={cn(isMobile ? "w-12 h-12" : "w-16 h-16", "text-primary/50")} />
          </div>
        )}

        <Button
          onClick={handleGeneratePortrait}
          disabled={isGeneratingPortrait || !name.trim()}
          className="w-full"
          variant="outline"
          size={isMobile ? "sm" : "default"}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          {isGeneratingPortrait ? 'Генерация...' : 'Сгенерировать портрет'}
        </Button>
      </div>

      {/* Name */}
      <div>
        <Label htmlFor="name" className="text-xs font-medium">
          Имя артиста *
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: DJ Вibe Master"
          className="mt-1 h-9"
        />
      </div>

      {/* Bio */}
      <div>
        <Label htmlFor="bio" className="text-xs font-medium">
          Биография
        </Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Расскажите об артисте..."
          rows={2}
          className="mt-1 text-sm"
        />
      </div>

      {/* Style Description */}
      <div>
        <Label htmlFor="style" className="text-xs font-medium">
          Описание стиля
        </Label>
        <Textarea
          id="style"
          value={styleDescription}
          onChange={(e) => setStyleDescription(e.target.value)}
          placeholder="Например: Современный электронный поп с элементами R&B"
          rows={2}
          className="mt-1 text-sm"
        />
      </div>

      {/* Genre Tags */}
      <div>
        <Label className="text-xs font-medium">Жанры</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={newGenreTag}
            onChange={(e) => setNewGenreTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addGenreTag()}
            placeholder="Добавить жанр"
            className="h-9"
          />
          <Button type="button" onClick={addGenreTag} size="icon" variant="outline" className="h-9 w-9 shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {genreTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {genreTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 text-xs h-6">
                {tag}
                <button onClick={() => setGenreTags(genreTags.filter((t) => t !== tag))}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Mood Tags */}
      <div>
        <Label className="text-xs font-medium">Настроение</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={newMoodTag}
            onChange={(e) => setNewMoodTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addMoodTag()}
            placeholder="Добавить настроение"
            className="h-9"
          />
          <Button type="button" onClick={addMoodTag} size="icon" variant="outline" className="h-9 w-9 shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {moodTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {moodTags.map((tag) => (
              <Badge key={tag} variant="outline" className="gap-1 text-xs h-6">
                {tag}
                <button onClick={() => setMoodTags(moodTags.filter((t) => t !== tag))}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const actionButtons = (
    <div className={cn(
      "flex gap-2 pt-4 border-t",
      isMobile ? "flex-col" : "justify-end"
    )}>
      {isMobile ? (
        <>
          <Button onClick={handleSubmit} disabled={isCreating || !name.trim()} className="w-full">
            {isCreating ? 'Создание...' : 'Создать артиста'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Отмена
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating || !name.trim()}>
            {isCreating ? 'Создание...' : 'Создать артиста'}
          </Button>
        </>
      )}
    </div>
  );

  // Use Sheet on mobile for better UX
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Sparkles className="w-4 h-4 text-primary" />
              Создать AI Артиста
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 px-4 py-3">
            {formContent}
          </ScrollArea>
          <div className="px-4 pb-6 pt-2 shrink-0 border-t bg-background">
            {actionButtons}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Создать AI Артиста
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          {formContent}
        </ScrollArea>
        <div className="px-6 pb-6 shrink-0">
          {actionButtons}
        </div>
      </DialogContent>
    </Dialog>
  );
}
