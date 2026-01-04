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
    <div className="grid gap-2 grid-cols-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-12 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50 border-dashed"
        onClick={onOpenAudioDialog}
      >
        <FileAudio className="w-4 h-4 text-muted-foreground" />
        <span className="text-[10px] leading-none font-medium">Аудио</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-12 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50 border-dashed"
        onClick={onOpenArtistDialog}
      >
        <Music className="w-4 h-4 text-muted-foreground" />
        <span className="text-[10px] leading-none font-medium">Персона</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-12 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50 border-dashed"
        onClick={onOpenProjectDialog}
      >
        <FolderOpen className="w-4 h-4 text-muted-foreground" />
        <span className="text-[10px] leading-none font-medium">Проект</span>
      </Button>
    </div>
  );
}
