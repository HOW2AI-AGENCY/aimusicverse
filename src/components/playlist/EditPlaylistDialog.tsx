import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePlaylists, type Playlist } from '@/hooks/usePlaylists';

interface EditPlaylistDialogProps {
  playlist: Playlist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlaylistDialog({ playlist, open, onOpenChange }: EditPlaylistDialogProps) {
  const { updatePlaylist } = usePlaylists();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (playlist) {
      setTitle(playlist.title);
      setDescription(playlist.description || '');
      setIsPublic(playlist.is_public);
    }
  }, [playlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlist || !title.trim()) return;

    setIsSubmitting(true);
    try {
      await updatePlaylist({
        id: playlist.id,
        title: title.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать плейлист</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Название</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Мой плейлист"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Описание</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите плейлист..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="edit-public">Публичный</Label>
              <p className="text-sm text-muted-foreground">
                Другие пользователи смогут видеть плейлист
              </p>
            </div>
            <Switch
              id="edit-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
