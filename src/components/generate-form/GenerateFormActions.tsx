import { Button } from '@/components/ui/button';
import { Plus, Music, FileAudio } from 'lucide-react';

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
    <div className="grid grid-cols-3 gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-[52px] py-2 gap-1.5 flex-col items-center justify-center touch-manipulation hover:bg-accent/50"
        onClick={onOpenAudioDialog}
      >
        <FileAudio className="w-4 h-4 mb-0.5 text-muted-foreground" />
        <span className="text-xs leading-none">Аудио</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-[52px] py-2 gap-1.5 flex-col items-center justify-center touch-manipulation hover:bg-accent/50"
        onClick={onOpenArtistDialog}
      >
        <Music className="w-4 h-4 mb-0.5 text-muted-foreground" />
        <span className="text-xs leading-none">Персона</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-[52px] py-2 gap-1.5 flex-col items-center justify-center touch-manipulation hover:bg-accent/50"
        onClick={onOpenProjectDialog}
      >
        <Plus className="w-4 h-4 mb-0.5 text-muted-foreground" />
        <span className="text-xs leading-none">Проект</span>
      </Button>
    </div>
  );
}
