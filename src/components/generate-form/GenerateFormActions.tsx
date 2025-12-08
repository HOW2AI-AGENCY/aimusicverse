import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
        className="min-h-[44px] h-auto py-2 gap-1.5 flex-col touch-manipulation"
        onClick={onOpenAudioDialog}
      >
        <Plus className="w-4 h-4" />
        <span className="text-xs leading-none">Аудио</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-[44px] h-auto py-2 gap-1.5 flex-col touch-manipulation"
        onClick={onOpenArtistDialog}
      >
        <Plus className="w-4 h-4" />
        <span className="text-xs leading-none">Персона</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-[44px] h-auto py-2 gap-1.5 flex-col touch-manipulation"
        onClick={onOpenProjectDialog}
      >
        <Plus className="w-4 h-4" />
        <span className="text-xs leading-none">Проект</span>
      </Button>
    </div>
  );
}