import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { useLyricsTemplates } from '@/hooks/useLyricsTemplates';
import { Loader2, FileText, Music, Tag } from 'lucide-react';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lyrics: string;
  style: string;
  genre?: string;
  mood?: string;
  tags?: string[];
}

export function SaveTemplateDialog({
  open,
  onOpenChange,
  lyrics,
  style,
  genre,
  mood,
  tags,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const { saveTemplate, isSaving } = useLyricsTemplates();

  const handleSave = async () => {
    if (!name.trim()) return;

    await saveTemplate({
      name: name.trim(),
      lyrics,
      style,
      genre,
      mood,
      tags,
    });

    setName('');
    onOpenChange(false);
  };

  // Extract preview from lyrics
  const lyricsPreview = lyrics
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .slice(0, 100)
    .trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Сохранить в библиотеку
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="template-name">Название шаблона</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Романтичная баллада"
              className="mt-1.5"
            />
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            {lyricsPreview && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                "{lyricsPreview}..."
              </p>
            )}

            <div className="flex flex-wrap gap-1.5">
              {style && (
                <Badge variant="secondary" className="text-xs">
                  <Music className="w-3 h-3 mr-1" />
                  {style.slice(0, 30)}{style.length > 30 ? '...' : ''}
                </Badge>
              )}
              {genre && (
                <Badge variant="outline" className="text-xs">
                  {genre}
                </Badge>
              )}
              {mood && (
                <Badge variant="outline" className="text-xs">
                  {mood}
                </Badge>
              )}
              {tags && tags.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tags.length} тегов
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              'Сохранить'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}