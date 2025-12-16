import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Track } from '@/hooks/useTracksOptimized';
import { updateTrack } from '@/api/tracks.api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface RenameTrackDialogProps {
  track: Track;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameTrackDialog({ track, open, onOpenChange }: RenameTrackDialogProps) {
  const [title, setTitle] = useState(track.title || '');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setTitle(track.title || '');
    }
  }, [open, track.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error('Введите название трека');
      return;
    }

    if (trimmedTitle === track.title) {
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      await updateTrack(track.id, { title: trimmedTitle });
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['track', track.id] });
      toast.success('Трек переименован');
      onOpenChange(false);
    } catch (error) {
      toast.error('Не удалось переименовать трек');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Переименовать трек</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 py-3">
            <Label htmlFor="track-title">Название</Label>
            <Input
              id="track-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название трека"
              autoFocus
              maxLength={200}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
