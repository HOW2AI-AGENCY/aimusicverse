import { useState } from 'react';
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
import { useProjectTracks } from '@/hooks/useProjectTracks';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface AddTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  tracksCount: number;
}

export const AddTrackDialog = ({ open, onOpenChange, projectId, tracksCount }: AddTrackDialogProps) => {
  const { addTrack } = useProjectTracks(projectId);
  const [formData, setFormData] = useState({
    title: '',
    style_prompt: '',
    notes: '',
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Введите название трека');
      return;
    }

    addTrack({
      title: formData.title,
      position: tracksCount + 1,
      project_id: projectId,
      style_prompt: formData.style_prompt || null,
      notes: formData.notes || null,
      status: 'draft',
    });

    setFormData({ title: '', style_prompt: '', notes: '' });
    onOpenChange(false);
    toast.success('Трек добавлен');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить трек</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Введите название..."
              autoFocus
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
            <Label htmlFor="notes">Заметки / Идеи для лирики</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Тема песни, идеи..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Добавить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
