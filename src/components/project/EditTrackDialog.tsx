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
import { useProjectTracks, ProjectTrack } from '@/hooks/useProjectTracks';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface EditTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: ProjectTrack;
}

export const EditTrackDialog = ({ open, onOpenChange, track }: EditTrackDialogProps) => {
  const { updateTrack } = useProjectTracks(track.project_id);
  const [formData, setFormData] = useState({
    title: track.title,
    style_prompt: track.style_prompt || '',
    notes: track.notes || '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        title: track.title,
        style_prompt: track.style_prompt || '',
        notes: track.notes || '',
      });
    }
  }, [open, track]);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Введите название трека');
      return;
    }

    updateTrack({
      id: track.id,
      updates: {
        title: formData.title,
        style_prompt: formData.style_prompt || null,
        notes: formData.notes || null,
      },
    });

    onOpenChange(false);
    toast.success('Трек обновлен');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать трек</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Стиль / Теги</Label>
            <Input
              id="style"
              value={formData.style_prompt}
              onChange={(e) => setFormData({ ...formData, style_prompt: e.target.value })}
              placeholder="Pop, энергичный, гитара..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Заметки / Лирика</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full gap-2">
            <Save className="w-4 h-4" />
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
