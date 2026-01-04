/**
 * StemActionSheet
 * 
 * Bottom sheet for per-stem actions:
 * - Use as reference for generation
 * - MIDI transcription (model based on instrument type)
 * - Guitar tab/chord analysis
 * - Download individual stem
 */

import { useState } from 'react';
import { 
  Mic2, Music2, Piano, Guitar, Layers, FileAudio,
  Wand2, Download, ExternalLink, ChevronRight, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { getStemLabel } from '@/lib/stemLabels';
import { useIsMobile } from '@/hooks/use-mobile';
import { TrackStem } from '@/hooks/useTrackStems';

interface StemActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stem: TrackStem | null;
  trackTitle: string;
  onUseAsReference: (stem: TrackStem) => void;
  onMidiTranscription: (stem: TrackStem, model: string) => void;
  onGuitarAnalysis?: (stem: TrackStem) => void;
  onDownload: (stem: TrackStem) => void;
}

// MIDI models per instrument type
const MIDI_MODELS: Record<string, { model: string; label: string; description: string }[]> = {
  vocal: [
    { model: 'basic-pitch', label: 'Basic Pitch', description: 'Мелодия и ноты' },
  ],
  vocals: [
    { model: 'basic-pitch', label: 'Basic Pitch', description: 'Мелодия и ноты' },
  ],
  piano: [
    { model: 'bytedance-piano', label: 'ByteDance Piano', description: 'Высокоточная транскрипция пианино' },
    { model: 'mt3', label: 'MT3', description: 'Универсальная транскрипция' },
  ],
  drums: [
    { model: 'mt3', label: 'MT3', description: 'Транскрипция ударных' },
  ],
  bass: [
    { model: 'mt3', label: 'MT3', description: 'Транскрипция баса' },
  ],
  guitar: [
    { model: 'mt3', label: 'MT3', description: 'Ноты гитары' },
    { model: 'basic-pitch', label: 'Basic Pitch', description: 'Мелодическая линия' },
  ],
  instrumental: [
    { model: 'mt3', label: 'MT3', description: 'Мульти-инструментальная транскрипция' },
  ],
  default: [
    { model: 'mt3', label: 'MT3', description: 'Универсальная транскрипция' },
    { model: 'basic-pitch', label: 'Basic Pitch', description: 'Базовая транскрипция' },
  ],
};

// Stem icons
const STEM_ICONS: Record<string, React.ElementType> = {
  vocal: Mic2,
  vocals: Mic2,
  instrumental: Music2,
  backing: Music2,
  accompaniment: Music2,
  drums: Layers,
  bass: Guitar,
  piano: Piano,
  guitar: Guitar,
};

export function StemActionSheet({
  open,
  onOpenChange,
  stem,
  trackTitle,
  onUseAsReference,
  onMidiTranscription,
  onGuitarAnalysis,
  onDownload,
}: StemActionSheetProps) {
  const isMobile = useIsMobile();
  const [selectedMidiModel, setSelectedMidiModel] = useState<string | null>(null);

  if (!stem) return null;

  const stemType = stem.stem_type.toLowerCase();
  const Icon = STEM_ICONS[stemType] || FileAudio;
  const midiModels = MIDI_MODELS[stemType] || MIDI_MODELS.default;
  const isGuitar = stemType === 'guitar';

  // Using centralized getStemLabel from stemLabels utility

  const content = (
    <div className="space-y-6 p-4">
      {/* Stem Info */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{getStemLabel(stemType)}</h4>
          <p className="text-sm text-muted-foreground truncate">{trackTitle}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Use as Reference */}
        <Button
          variant="outline"
          className="w-full justify-between h-auto py-3"
          onClick={() => {
            onUseAsReference(stem);
            onOpenChange(false);
          }}
        >
          <div className="flex items-center gap-3">
            <Wand2 className="w-5 h-5 text-primary" />
            <div className="text-left">
              <span className="font-medium block">Использовать как референс</span>
              <span className="text-xs text-muted-foreground">
                Сгенерировать новый трек на основе этого стема
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Button>

        {/* MIDI Transcription */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Piano className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Транскрипция в MIDI</span>
          </div>
          <div className="grid gap-2">
            {midiModels.map((model) => (
              <Button
                key={model.model}
                variant="outline"
                className={cn(
                  "w-full justify-between h-auto py-2.5",
                  selectedMidiModel === model.model && "border-primary"
                )}
                onClick={() => {
                  onMidiTranscription(stem, model.model);
                  onOpenChange(false);
                }}
              >
                <div className="text-left">
                  <span className="font-medium block">{model.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.description}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  MIDI
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Guitar Analysis - Only for guitar stems */}
        {isGuitar && onGuitarAnalysis && (
          <Button
            variant="outline"
            className="w-full justify-between h-auto py-3"
            onClick={() => {
              onGuitarAnalysis(stem);
              onOpenChange(false);
            }}
          >
            <div className="flex items-center gap-3">
              <Guitar className="w-5 h-5 text-primary" />
              <div className="text-left">
                <span className="font-medium block">Анализ гитары</span>
                <span className="text-xs text-muted-foreground">
                  Аккорды, табы, стиль игры
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}

        {/* Download */}
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-3"
          onClick={() => {
            onDownload(stem);
            onOpenChange(false);
          }}
        >
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5" />
            <div className="text-left">
              <span className="font-medium block">Скачать стем</span>
              <span className="text-xs text-muted-foreground">
                Скачать аудио файл стема
              </span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="border-b border-border/30">
            <DrawerTitle>Действия со стемом</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Действия со стемом</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
