import { Button } from '@/components/ui/button';
import { Plus, Music, FileAudio, History } from 'lucide-react';

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
    <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 px-3 gap-1.5 shrink-0 touch-manipulation hover:bg-accent/50"
        onClick={onOpenAudioDialog}
      >
        <FileAudio className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px]">Аудио</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 px-3 gap-1.5 shrink-0 touch-manipulation hover:bg-accent/50"
        onClick={onOpenArtistDialog}
      >
        <Music className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px]">Персона</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 px-3 gap-1.5 shrink-0 touch-manipulation hover:bg-accent/50"
        onClick={onOpenProjectDialog}
      >
        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px]">Проект</span>
      </Button>

      {onOpenHistory && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-3 gap-1.5 shrink-0 touch-manipulation hover:bg-accent/50"
          onClick={onOpenHistory}
        >
          <History className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px]">История</span>
        </Button>
      )}
    </div>
  );
}
