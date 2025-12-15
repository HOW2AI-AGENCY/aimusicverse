import { Button } from '@/components/ui/button';
import { Plus, Music, FileAudio } from 'lucide-react';

interface GenerateFormActionsProps {
  onOpenAudioDialog: () => void;
  onOpenArtistDialog: () => void;
  onOpenProjectDialog: () => void;
}

/**
 * Быстрые действия для формы генерации
 * 3 кнопки в ряд - аудио, персона, проект
 * История перенесена в шапку как иконка
 */
export function GenerateFormActions({
  onOpenAudioDialog,
  onOpenArtistDialog,
  onOpenProjectDialog,
}: GenerateFormActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 gap-1.5 touch-manipulation hover:bg-accent/50 text-xs"
        onClick={onOpenAudioDialog}
      >
        <FileAudio className="w-4 h-4 text-muted-foreground" />
        <span>Аудио</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 gap-1.5 touch-manipulation hover:bg-accent/50 text-xs"
        onClick={onOpenArtistDialog}
      >
        <Music className="w-4 h-4 text-muted-foreground" />
        <span>Персона</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 gap-1.5 touch-manipulation hover:bg-accent/50 text-xs"
        onClick={onOpenProjectDialog}
      >
        <Plus className="w-4 h-4 text-muted-foreground" />
        <span>Проект</span>
      </Button>
    </div>
  );
}
