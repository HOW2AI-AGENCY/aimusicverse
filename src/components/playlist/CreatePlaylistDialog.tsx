import { useState } from 'react';
import { UnifiedDialog } from '@/components/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useTelegram } from '@/contexts/TelegramContext';

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (playlistId: string) => void;
}

export function CreatePlaylistDialog({ open, onOpenChange, onCreated }: CreatePlaylistDialogProps) {
  const { createPlaylist, isCreating } = usePlaylists();
  const { hapticFeedback } = useTelegram();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    hapticFeedback('light');
    
    try {
      const playlist = await createPlaylist({
        title: title.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
      });
      
      hapticFeedback('success');
      setTitle('');
      setDescription('');
      setIsPublic(false);
      onOpenChange(false);
      onCreated?.(playlist.id);
    } catch (error) {
      hapticFeedback('error');
      // Error handled in hook
    }
  };

  return (
    <UnifiedDialog 
      variant="sheet"
      open={open} 
      onOpenChange={onOpenChange}
      title="Новый плейлист"
      snapPoints={[0.5, 0.9]}
      defaultSnapPoint={0}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-0">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Название
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Мой плейлист"
            required
            className="min-h-[44px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Описание
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите плейлист..."
            rows={3}
            className="min-h-[44px]"
          />
        </div>

        <div className="flex items-center justify-between min-h-[44px] gap-3">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="public" className="text-sm font-medium cursor-pointer">
              Публичный
            </Label>
            <p className="text-xs text-muted-foreground">
              Другие пользователи смогут видеть плейлист
            </p>
          </div>
          <Switch
            id="public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
            className="flex-shrink-0"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] min-w-[80px]"
          >
            Отмена
          </Button>
          <Button 
            type="submit" 
            disabled={!title.trim() || isCreating}
            className="min-h-[48px] min-w-[100px]"
          >
            {isCreating ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </form>
    </UnifiedDialog>
  );
}
