import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Music, ArrowRight, Disc, Upload } from 'lucide-react';

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
    <div className="space-y-3">
      {/* Cover and Extend Actions - Featured */}
      {(onOpenCoverMode || onOpenExtendMode) && (
        <div className="grid grid-cols-2 gap-2">
          {onOpenCoverMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-[60px] py-2 gap-1.5 flex-col items-center justify-center touch-manipulation relative overflow-hidden border-primary/30 hover:border-primary/50 hover:bg-primary/5 group"
              onClick={onOpenCoverMode}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Disc className="w-5 h-5 mb-0.5 text-primary" />
              <span className="text-xs leading-none font-medium">Кавер</span>
              <Badge variant="secondary" className="absolute top-1 right-1 text-[9px] px-1 py-0 h-4 bg-primary/10 text-primary border-0">
                AI
              </Badge>
            </Button>
          )}
          {onOpenExtendMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-[60px] py-2 gap-1.5 flex-col items-center justify-center touch-manipulation relative overflow-hidden border-primary/30 hover:border-primary/50 hover:bg-primary/5 group"
              onClick={onOpenExtendMode}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <ArrowRight className="w-5 h-5 mb-0.5 text-primary" />
              <span className="text-xs leading-none font-medium">Расширение</span>
              <Badge variant="secondary" className="absolute top-1 right-1 text-[9px] px-1 py-0 h-4 bg-primary/10 text-primary border-0">
                AI
              </Badge>
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
          className="h-[52px] py-2 gap-1.5 flex-col items-center justify-center touch-manipulation hover:bg-accent/50"
          onClick={onOpenAudioDialog}
        >
          <Upload className="w-4 h-4 mb-0.5 text-muted-foreground" />
          <span className="text-xs leading-none">Референс</span>
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
    </div>
  );
}