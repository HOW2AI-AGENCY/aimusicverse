/**
 * StemTranscriptionSheet - Mobile-optimized MIDI/Notes export for individual stems
 * Opens as bottom sheet with TranscriptionExportPanel inside
 */

import { useState } from 'react';
import { FileMusic } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { TrackStem } from '@/hooks/useTrackStems';
import { TranscriptionExportPanel } from '../TranscriptionExportPanel';
import { cn } from '@/lib/utils';

interface StemTranscriptionSheetProps {
  stem: TrackStem;
  stemLabel: string;
  trigger?: React.ReactNode;
  className?: string;
}

export function StemTranscriptionSheet({
  stem,
  stemLabel,
  trigger,
  className,
}: StemTranscriptionSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", className)}
          >
            <FileMusic className="w-4 h-4" />
            MIDI/Ноты
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Экспорт в MIDI/Ноты</SheetTitle>
          <SheetDescription>
            Транскрибируйте стем "{stemLabel}" в ноты и MIDI с помощью klang.io AI
          </SheetDescription>
        </SheetHeader>

        <TranscriptionExportPanel
          stemId={stem.id}
          stemType={stem.stem_type}
          stemLabel={stemLabel}
          audioUrl={stem.audio_url}
        />
      </SheetContent>
    </Sheet>
  );
}
