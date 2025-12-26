import { Button } from '@/components/ui/button';
import { Music, FileAudio, FolderOpen, History, Palette } from 'lucide-react';

interface GenerateFormActionsProps {
  onOpenAudioDialog: () => void;
  onOpenArtistDialog: () => void;
  onOpenProjectDialog: () => void;
  onOpenHistory?: () => void;
  onOpenStyles?: () => void;
}

export function GenerateFormActions({
  onOpenAudioDialog,
  onOpenArtistDialog,
  onOpenProjectDialog,
  onOpenHistory,
  onOpenStyles,
}: GenerateFormActionsProps) {
  // Determine grid columns based on available actions
  const hasStyles = Boolean(onOpenStyles);
  const hasHistory = Boolean(onOpenHistory);
  const totalButtons = 3 + (hasStyles ? 1 : 0) + (hasHistory ? 1 : 0);
  
  return (
    <div className={`grid gap-1.5 ${totalButtons === 5 ? 'grid-cols-5' : totalButtons === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
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

      {onOpenStyles && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-12 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-primary/10 hover:border-primary/50 border-dashed"
          onClick={onOpenStyles}
        >
          <Palette className="w-4 h-4 text-primary" />
          <span className="text-[10px] leading-none font-medium text-primary">Стили</span>
        </Button>
      )}

      {onOpenHistory && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-12 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50 border-dashed"
          onClick={onOpenHistory}
        >
          <History className="w-4 h-4 text-muted-foreground" />
          <span className="text-[10px] leading-none font-medium">История</span>
        </Button>
      )}
    </div>
  );
}
