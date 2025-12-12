import { Button } from '@/components/ui/button';
import { Plus, Music, ArrowRight } from 'lucide-react';

interface GenerateFormActionsProps {
  onOpenAudioDialog: () => void;
  onOpenArtistDialog: () => void;
  onOpenProjectDialog: () => void;
  onOpenCoverMode?: () => void;
  onOpenExtendMode?: () => void;
}

export function GenerateFormActions({
  onOpenAudioDialog,
  onOpenArtistDialog,
  onOpenProjectDialog,
  onOpenCoverMode,
  onOpenExtendMode,
}: GenerateFormActionsProps) {
  return (
    <div className="space-y-2">
      {/* Cover and Extend Actions */}
      {(onOpenCoverMode || onOpenExtendMode) && (
        <div className="grid grid-cols-2 gap-2">
          {onOpenCoverMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] h-auto py-2 gap-1.5 flex-col touch-manipulation"
              onClick={onOpenCoverMode}
            >
              <Music className="w-4 h-4" />
              <span className="text-xs leading-none">Кавер</span>
            </Button>
          )}
          {onOpenExtendMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] h-auto py-2 gap-1.5 flex-col touch-manipulation"
              onClick={onOpenExtendMode}
            >
              <ArrowRight className="w-4 h-4" />
              <span className="text-xs leading-none">Расширение</span>
            </Button>
          )}
        </div>
      )}
      
      {/* Regular Actions */}
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
    </div>
  );
}