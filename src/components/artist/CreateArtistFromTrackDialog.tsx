import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Sparkles, X, Plus, Music2, Check } from 'lucide-react';
import { useArtists } from '@/hooks/useArtists';
import { useTracks } from '@/hooks/useTracks';
import type { Track } from '@/types/track';
import { ArtistAvatarUpload } from './ArtistAvatarUpload';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateArtistFromTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateArtistFromTrackDialog({ open, onOpenChange }: CreateArtistFromTrackDialogProps) {
  const isMobile = useIsMobile();
  const { tracks } = useTracks();
  const { createArtist, isCreating } = useArtists();
  
  const [step, setStep] = useState<'select' | 'create'>('select');
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [styleDescription, setStyleDescription] = useState('');
  const [genreTags, setGenreTags] = useState<string[]>([]);
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [newGenreTag, setNewGenreTag] = useState('');
  const [newMoodTag, setNewMoodTag] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const selectedTrack = tracks?.find((t: Track) => t.id === selectedTrackId);

  const resetForm = () => {
    setName('');
    setBio('');
    setStyleDescription('');
    setGenreTags([]);
    setMoodTags([]);
    setAvatarUrl(null);
    setNewGenreTag('');
    setNewMoodTag('');
  };

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('select');
      setSelectedTrackId(null);
      resetForm();
    }
  }, [open]);

  // Pre-fill from selected track
  useEffect(() => {
    if (selectedTrack && step === 'create') {
      const trackTitle = selectedTrack.title || '';
      const artistName = trackTitle.includes(' - ')
        ? trackTitle.split(' - ')[0].trim()
        : `Артист "${trackTitle}"`;

      setName(artistName);
      setStyleDescription(selectedTrack.style || '');
      setAvatarUrl(selectedTrack.local_cover_url || selectedTrack.cover_url || null);

      if (selectedTrack.tags && typeof selectedTrack.tags === 'string') {
        const tags = selectedTrack.tags.split(',').map(t => t.trim()).filter(Boolean);
        setGenreTags(tags.slice(0, 5));
      }

      setBio(`AI артист, вдохновлённый треком "${trackTitle}"`);
    }
  }, [selectedTrack, step]);

  const handleSelectTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
    setStep('create');
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

    onOpenChange(false);
  };

  const content = (
    <div className="flex flex-col h-full">
      {step === 'select' ? (
        <>
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              Выберите трек, на основе которого будет создан AI артист
            </p>
          </div>
          
          <ScrollArea className="flex-1 -mx-4 px-4">
            {tracks && tracks.length > 0 ? (
              <div className="space-y-2 pb-4">
                {tracks.filter((t: Track) => t.audio_url).map((track: Track) => (
                  <Card
                    key={track.id}
                    onClick={() => handleSelectTrack(track.id)}
                    className={cn(
                      "p-3 cursor-pointer hover:bg-accent/50 transition-colors",
                      selectedTrackId === track.id && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                        {track.cover_url || track.local_cover_url ? (
                          <img 
                            src={track.local_cover_url || track.cover_url || ''} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{track.title || 'Без названия'}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.style || ''}</p>
                      </div>
                      {selectedTrackId === track.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Нет сгенерированных треков</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Сначала создайте трек, чтобы использовать его для артиста
                </p>
              </div>
            )}
          </ScrollArea>
        </>
      ) : (
        <ScrollArea className="flex-1 -mx-4 px-4">
          <div className="space-y-5 pb-4">
            {/* Avatar Upload */}
            <ArtistAvatarUpload
              avatarUrl={avatarUrl}
              onAvatarChange={setAvatarUrl}
              artistName={name}
              styleDescription={styleDescription}
              disabled={isCreating}
            />

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
                rows={2}
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
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenreTag())}
                  placeholder="Добавить жанр"
                  className="flex-1"
                />
                <Button type="button" onClick={addGenreTag} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {genreTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
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
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMoodTag())}
                  placeholder="Добавить настроение"
                  className="flex-1"
                />
                <Button type="button" onClick={addMoodTag} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {moodTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
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
        </ScrollArea>
      )}

      {/* Footer */}
      <div className="flex gap-2 pt-4 border-t mt-auto">
        {step === 'create' && (
          <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
            Назад
          </Button>
        )}
        <Button 
          onClick={step === 'create' ? handleSubmit : () => onOpenChange(false)} 
          disabled={step === 'create' && (isCreating || !name.trim())}
          className="flex-1"
        >
          {step === 'create' ? (
            isCreating ? 'Создание...' : 'Создать артиста'
          ) : (
            'Отмена'
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {step === 'select' ? 'Выберите трек' : 'Создать AI Артиста'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 flex-1 flex flex-col min-h-0">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {step === 'select' ? 'Выберите трек' : 'Создать AI Артиста'}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
