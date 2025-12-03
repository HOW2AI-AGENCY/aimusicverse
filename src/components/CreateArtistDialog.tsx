import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Sparkles, Image as ImageIcon, X, Plus } from 'lucide-react';
import { useArtists } from '@/hooks/useArtists';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TrackData {
  title?: string | null;
  style?: string | null;
  tags?: string | null;
  cover_url?: string | null;
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

  // Pre-fill from track data when dialog opens
  useEffect(() => {
    if (open && fromTrack) {
      // Extract artist name from track title (before " - " if present)
      const trackTitle = fromTrack.title || '';
      const artistName = trackTitle.includes(' - ') 
        ? trackTitle.split(' - ')[0].trim() 
        : `Артист "${trackTitle}"`;
      
      setName(artistName);
      setStyleDescription(fromTrack.style || '');
      setAvatarUrl(fromTrack.cover_url || null);
      
      // Parse tags into genre tags
      if (fromTrack.tags) {
        const tags = fromTrack.tags.split(',').map(t => t.trim()).filter(Boolean);
        setGenreTags(tags.slice(0, 5));
      }
      
      setBio(`AI артист, вдохновлённый треком "${trackTitle}"`);
    }
  }, [open, fromTrack]);

  const { createArtist, isCreating } = useArtists();

  const handleGeneratePortrait = async () => {
    if (!name.trim()) {
      toast.error('Введите имя артиста для генерации портрета');
      return;
    }

    setIsGeneratingPortrait(true);
    try {
      const prompt = `Professional studio portrait of ${name}, ${styleDescription || 'music artist'}, high quality, cinematic lighting, detailed face, 4k`;
      
      const { data, error } = await supabase.functions.invoke('generate-cover-image', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.image) {
        setAvatarUrl(data.image);
        toast.success('Портрет сгенерирован');
      }
    } catch (error) {
      console.error('Error generating portrait:', error);
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
      is_public: true, // Делаем артиста публичным по умолчанию
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Создать AI Артиста
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 p-6 rounded-lg border border-border/50 bg-muted/30">
            {avatarUrl ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                <button
                  onClick={() => setAvatarUrl(null)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-4 border-primary/20">
                <User className="w-16 h-16 text-primary/50" />
              </div>
            )}

            <Button
              onClick={handleGeneratePortrait}
              disabled={isGeneratingPortrait || !name.trim()}
              className="w-full"
              variant="outline"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              {isGeneratingPortrait ? 'Генерация...' : 'Сгенерировать портрет'}
            </Button>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Имя артиста *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: DJ Вibe Master"
              className="mt-1.5"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-sm font-medium">
              Биография
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажите об артисте..."
              rows={3}
              className="mt-1.5"
            />
          </div>

          {/* Style Description */}
          <div>
            <Label htmlFor="style" className="text-sm font-medium">
              Описание стиля
            </Label>
            <Textarea
              id="style"
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              placeholder="Например: Современный электронный поп с элементами R&B"
              rows={2}
              className="mt-1.5"
            />
          </div>

          {/* Genre Tags */}
          <div>
            <Label className="text-sm font-medium">Жанры</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={newGenreTag}
                onChange={(e) => setNewGenreTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addGenreTag()}
                placeholder="Добавить жанр"
              />
              <Button type="button" onClick={addGenreTag} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {genreTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {genreTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
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
            <Label className="text-sm font-medium">Настроение</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={newMoodTag}
                onChange={(e) => setNewMoodTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMoodTag()}
                placeholder="Добавить настроение"
              />
              <Button type="button" onClick={addMoodTag} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {moodTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {moodTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="gap-1">
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

        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating || !name.trim()}>
            {isCreating ? 'Создание...' : 'Создать артиста'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
