import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';

interface GenerateFormActionsProps {
  onOpenArtistDialog: () => void;
}

export function GenerateFormActions({
  onOpenArtistDialog,
}: GenerateFormActionsProps) {
  return (
    <div className="flex justify-center" role="group" aria-label="Дополнительные опции генерации">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-12 py-1.5 gap-1 flex-col items-center justify-center touch-manipulation hover:bg-accent/50 border-dashed px-6"
        onClick={onOpenArtistDialog}
        aria-label="Выбрать AI персону"
      >
        <Music className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-[10px] leading-none font-medium">Персона</span>
      </Button>
    </div>
  );
}
