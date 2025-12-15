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
 */
export function GenerateFormActions({
  onOpenAudioDialog,
  onOpenArtistDialog,
  onOpenProjectDialog,
}: GenerateFormActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 gap-2 touch-manipulation hover:bg-accent/50"
        onClick={onOpenAudioDialog}
      >
        <FileAudio className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs">Аудио</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 gap-2 touch-manipulation hover:bg-accent/50"
        onClick={onOpenArtistDialog}
      >
        <Music className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs">Персона</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 gap-2 touch-manipulation hover:bg-accent/50"
        onClick={onOpenProjectDialog}
      >
        <Plus className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs">Проект</span>
      </Button>
    </div>
  );
}
