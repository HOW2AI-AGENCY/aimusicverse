import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Edit, X, Plus, Lock, Globe, AlertTriangle } from 'lucide-react';
import { ArtistAvatarUpload } from './ArtistAvatarUpload';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useArtists, type Artist } from '@/hooks/useArtists';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EditArtistDialogProps {
  artist: Artist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canMakePrivate?: boolean; // Admin or paid users
}

export function EditArtistDialog({ artist, open, onOpenChange, canMakePrivate = false }: EditArtistDialogProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { updateArtist, isUpdating, deleteArtist, isDeleting } = useArtists();
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [styleDescription, setStyleDescription] = useState('');
  const [genreTags, setGenreTags] = useState<string[]>([]);
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [newGenreTag, setNewGenreTag] = useState('');
  const [newMoodTag, setNewMoodTag] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user?.id === artist?.user_id;

  // Reset form when artist changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (artist && open) {
      setName(artist.name || '');
      setBio(artist.bio || '');
      setStyleDescription(artist.style_description || '');
      setGenreTags(artist.genre_tags || []);
      setMoodTags(artist.mood_tags || []);
      setAvatarUrl(artist.avatar_url || null);
      setIsPublic(artist.is_public ?? true);
      setShowDeleteConfirm(false);
    }
  }, [artist, open]);

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

  const handleSave = () => {
    if (!artist?.id) return;
    
    if (!name.trim()) {
      toast.error('Введите имя артиста');
      return;
    }

    // If trying to make private but not allowed
    if (!isPublic && !canMakePrivate) {
      toast.error('Приватные артисты доступны только для подписчиков');
      return;
    }

    updateArtist({
      id: artist.id,
      updates: {
        name: name.trim(),
        bio: bio.trim() || null,
        style_description: styleDescription.trim() || null,
        avatar_url: avatarUrl,
        genre_tags: genreTags.length > 0 ? genreTags : null,
        mood_tags: moodTags.length > 0 ? moodTags : null,
        is_public: isPublic,
      },
    });

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!artist?.id) return;
    deleteArtist(artist.id);
    onOpenChange(false);
  };

  if (!artist) return null;

  const content = (
    <ScrollArea className="flex-1 -mx-4 px-4">
      <div className="space-y-5 pb-4">
        {/* Avatar Upload */}
        <ArtistAvatarUpload
          avatarUrl={avatarUrl}
          onAvatarChange={setAvatarUrl}
          artistName={name}
          styleDescription={styleDescription}
          disabled={isUpdating}
        />

        {/* Name */}
        <div>
          <Label htmlFor="edit-name" className="text-sm font-medium">
            Имя артиста *
          </Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: DJ Vibe Master"
            className="mt-1.5"
          />
        </div>

        {/* Bio */}
        <div>
          <Label htmlFor="edit-bio" className="text-sm font-medium">
            Биография
          </Label>
          <Textarea
            id="edit-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Расскажите об артисте..."
            rows={3}
            className="mt-1.5"
          />
        </div>

        {/* Style Description */}
        <div>
          <Label htmlFor="edit-style" className="text-sm font-medium">
            Описание стиля
          </Label>
          <Textarea
            id="edit-style"
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

        <Separator />

        {/* Privacy Setting */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isPublic ? 'Публичный артист' : 'Приватный артист'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isPublic 
                  ? 'Любой пользователь может использовать этого артиста' 
                  : 'Только вы можете использовать этого артиста'}
              </p>
            </div>
            <Switch 
              checked={!isPublic} 
              onCheckedChange={(checked) => setIsPublic(!checked)}
              disabled={!canMakePrivate && !isPublic}
            />
          </div>
          
          {!canMakePrivate && !isPublic && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Приватные артисты доступны только для подписчиков и администраторов</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Delete Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-destructive">Опасная зона</Label>
          
          {showDeleteConfirm ? (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-3">
              <p className="text-sm text-destructive">
                Вы уверены? Это действие нельзя отменить. Все треки останутся, но без привязки к артисту.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Отмена
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? 'Удаление...' : 'Удалить'}
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              Удалить артиста
            </Button>
          )}
        </div>
      </div>
    </ScrollArea>
  );

  const footer = (
    <div className="flex gap-2 pt-4 border-t mt-auto">
      <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
        Отмена
      </Button>
      <Button 
        onClick={handleSave} 
        disabled={isUpdating || !name.trim()}
        className="flex-1"
      >
        {isUpdating ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Редактировать артиста
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 flex-1 flex flex-col min-h-0">
            {content}
            {footer}
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
            <Edit className="w-5 h-5 text-primary" />
            Редактировать артиста
          </DialogTitle>
        </DialogHeader>
        {content}
        {footer}
      </DialogContent>
    </Dialog>
  );
}
