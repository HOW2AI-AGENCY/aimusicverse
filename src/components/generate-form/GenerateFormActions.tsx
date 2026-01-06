import { Button } from '@/components/ui/button';
import { Music, Mic2, FolderOpen } from 'lucide-react';

interface GenerateFormActionsProps {
  onOpenAudioDialog: () => void;
  onOpenProjectDialog: () => void;
  onOpenArtistDialog: () => void;
}

export function GenerateFormActions({
  onOpenAudioDialog,
  onOpenProjectDialog,
  onOpenArtistDialog,
}: GenerateFormActionsProps) {
  return (
    <div className="flex justify-center gap-2" role="group" aria-label="Дополнительные опции генерации">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50 border-dashed px-4"
        onClick={onOpenAudioDialog}
        aria-label="Добавить аудио референс"
      >
        <Mic2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-[10px] leading-none font-medium">Референс</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50 border-dashed px-4"
        onClick={onOpenProjectDialog}
        aria-label="Выбрать проект"
      >
        <FolderOpen className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-[10px] leading-none font-medium">Проект</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50 border-dashed px-4"
        onClick={onOpenArtistDialog}
        aria-label="Выбрать AI персону"
      >
        <Music className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-[10px] leading-none font-medium">Персона</span>
      </Button>
    </div>
  );
}
