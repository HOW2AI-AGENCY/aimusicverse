import { Button } from '@/components/ui/button';
import { Music, FileAudio, FolderOpen, History } from 'lucide-react';

interface GenerateFormActionsProps {
  onOpenAudioDialog: () => void;
  onOpenArtistDialog: () => void;
  onOpenProjectDialog: () => void;
  onOpenHistory?: () => void;
}

export function GenerateFormActions({
  onOpenAudioDialog,
  onOpenArtistDialog,
  onOpenProjectDialog,
  onOpenHistory,
}: GenerateFormActionsProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50"
        onClick={onOpenAudioDialog}
      >
        <FileAudio className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] leading-none">Аудио</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50"
        onClick={onOpenArtistDialog}
      >
        <Music className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] leading-none">Персона</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50"
        onClick={onOpenProjectDialog}
      >
        <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] leading-none">Проект</span>
      </Button>

      {onOpenHistory && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50"
          onClick={onOpenHistory}
        >
          <History className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] leading-none">История</span>
        </Button>
      )}
    </div>
  );
}
