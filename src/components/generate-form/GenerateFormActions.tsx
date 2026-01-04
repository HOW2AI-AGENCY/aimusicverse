import { Button } from '@/components/ui/button';
import { Music, FileAudio, FolderOpen } from 'lucide-react';

interface GenerateFormActionsProps {
  onOpenAudioDialog: () => void;
  onOpenArtistDialog: () => void;
  onOpenProjectDialog: () => void;
}

export function GenerateFormActions({
  onOpenAudioDialog,
  onOpenArtistDialog,
  onOpenProjectDialog,
}: GenerateFormActionsProps) {
  return (
    <div className="grid gap-2 grid-cols-3" role="group" aria-label="Дополнительные опции генерации">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-12 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50 border-dashed"
        onClick={onOpenAudioDialog}
        aria-label="Загрузить референсное аудио"
      >
        <FileAudio className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-[10px] leading-none font-medium">Аудио</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-12 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50 border-dashed"
        onClick={onOpenArtistDialog}
        aria-label="Выбрать AI персону"
      >
        <Music className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-[10px] leading-none font-medium">Персона</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-12 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50 border-dashed"
        onClick={onOpenProjectDialog}
        aria-label="Добавить в проект"
      >
        <FolderOpen className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-[10px] leading-none font-medium">Проект</span>
      </Button>
    </div>
  );
}
