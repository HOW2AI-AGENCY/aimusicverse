/**
 * StudioActionsPanel
 * 
 * State-aware action panel that shows available operations
 * based on track state:
 * - No stems: Section replacement, Stem separation
 * - Simple stems (vocal/instrumental): + New Vocal, New Arrangement  
 * - Detailed stems: + Per-stem MIDI/Reference actions
 */

import { useState } from 'react';
import { 
  Scissors, Split, Music2, Mic2, Piano, Guitar,
  FileAudio, Wand2, Clock, Layers, ChevronRight, 
  Download, Share2, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TrackStem } from '@/hooks/useTrackStems';

export type StudioTrackState = 'raw' | 'simple_stems' | 'detailed_stems';

interface StudioActionsPanelProps {
  trackState: StudioTrackState;
  stems?: TrackStem[];
  canReplaceSection: boolean;
  onSectionReplace: () => void;
  onStemSeparation: (mode: 'simple' | 'detailed') => void;
  onNewVocal?: () => void;
  onAddVocal?: () => void; // For instrumental tracks
  onNewArrangement?: () => void;
  onStemAction?: (stem: TrackStem, action: StemActionType) => void;
  onTrim?: () => void;
  onExtend?: () => void;
  onRemix?: () => void;
  isSeparating?: boolean;
  className?: string;
}

export type StemActionType = 
  | 'use_as_reference' 
  | 'midi_transcription' 
  | 'download'
  | 'guitar_analysis';

// Stem type to icon mapping
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
  other: FileAudio,
};

// MIDI models available per stem type
const STEM_MIDI_MODELS: Record<string, string> = {
  vocal: 'Basic Pitch (мелодия)',
  vocals: 'Basic Pitch (мелодия)',
  piano: 'ByteDance Piano',
  drums: 'MT3 (ударные)',
  bass: 'MT3 (бас)',
  guitar: 'MT3 (гитара)',
  instrumental: 'MT3 (мульти)',
};

export function StudioActionsPanel({
  trackState,
  stems = [],
  canReplaceSection,
  onSectionReplace,
  onStemSeparation,
  onNewVocal,
  onAddVocal,
  onNewArrangement,
  onStemAction,
  onTrim,
  onExtend,
  onRemix,
  isSeparating,
  className,
}: StudioActionsPanelProps) {
  const hasSimpleStems = trackState === 'simple_stems' || trackState === 'detailed_stems';
  const hasDetailedStems = trackState === 'detailed_stems';

  // Get stem icon component
  const getStemIcon = (stemType: string) => {
    const normalizedType = stemType.toLowerCase();
    return STEM_ICONS[normalizedType] || FileAudio;
  };

  // Get MIDI model for stem type
  const getMidiModel = (stemType: string) => {
    const normalizedType = stemType.toLowerCase();
    return STEM_MIDI_MODELS[normalizedType] || 'MT3 (universal)';
  };

  // Get stem display name
  const getStemLabel = (stemType: string) => {
    const labels: Record<string, string> = {
      vocal: 'Вокал',
      vocals: 'Вокал',
      instrumental: 'Инструментал',
      backing: 'Бэкинг',
      accompaniment: 'Аккомпанемент',
      drums: 'Ударные',
      bass: 'Бас',
      piano: 'Пианино',
      guitar: 'Гитара',
      other: 'Другое',
    };
    return labels[stemType.toLowerCase()] || stemType;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary Actions */}
      <Card className="p-4 bg-card/50 border-border/30">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Основные действия
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Section Replacement - Always available for generated tracks */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSectionReplace}
            disabled={!canReplaceSection}
            className="h-auto py-3 flex-col gap-1.5 items-start"
          >
            <div className="flex items-center gap-2 w-full">
              <Scissors className="w-4 h-4 text-primary" />
              <span className="font-medium">Заменить секцию</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">
              Изменить часть трека
            </span>
          </Button>

          {/* Stem Separation - Only for raw tracks */}
          {trackState === 'raw' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSeparating}
                  className="h-auto py-3 flex-col gap-1.5 items-start"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Split className="w-4 h-4 text-primary" />
                    <span className="font-medium">
                      {isSeparating ? 'Разделение...' : 'Разделить на стемы'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground text-left">
                    Вокал + инструментал
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => onStemSeparation('simple')}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Простое (2 стема)</span>
                    <span className="text-xs text-muted-foreground">
                      Вокал + Инструментал
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStemSeparation('detailed')}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Детальное (6+ стемов)</span>
                    <span className="text-xs text-muted-foreground">
                      Вокал, Бас, Ударные, Пианино...
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Add Vocal - For instrumental tracks */}
          {onAddVocal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddVocal}
              className="h-auto py-3 flex-col gap-1.5 items-start"
            >
              <div className="flex items-center gap-2 w-full">
                <Mic2 className="w-4 h-4 text-primary" />
                <span className="font-medium">Добавить вокал</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Для инструментала
              </span>
            </Button>
          )}

          {/* New Vocal - After simple stems */}
          {hasSimpleStems && onNewVocal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewVocal}
              className="h-auto py-3 flex-col gap-1.5 items-start"
            >
              <div className="flex items-center gap-2 w-full">
                <Mic2 className="w-4 h-4 text-primary" />
                <span className="font-medium">Новый вокал</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Сгенерировать вокал
              </span>
            </Button>
          )}

          {/* New Arrangement - After simple stems */}
          {hasSimpleStems && onNewArrangement && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewArrangement}
              className="h-auto py-3 flex-col gap-1.5 items-start"
            >
              <div className="flex items-center gap-2 w-full">
                <Music2 className="w-4 h-4 text-primary" />
                <span className="font-medium">Новая аранжировка</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Новый инструментал
              </span>
            </Button>
          )}
        </div>
      </Card>

      {/* Stem-specific Actions - After detailed separation */}
      {hasDetailedStems && stems.length > 0 && onStemAction && (
        <Card className="p-4 bg-card/50 border-border/30">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Действия со стемами
          </h3>
          <div className="space-y-2">
            {stems.map((stem) => {
              const Icon = getStemIcon(stem.stem_type);
              const midiModel = getMidiModel(stem.stem_type);
              
              return (
                <div
                  key={stem.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium text-sm">
                        {getStemLabel(stem.stem_type)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {midiModel}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => onStemAction(stem, 'use_as_reference')}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Использовать как референс
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStemAction(stem, 'midi_transcription')}
                      >
                        <Piano className="w-4 h-4 mr-2" />
                        Транскрипция в MIDI
                      </DropdownMenuItem>
                      {stem.stem_type.toLowerCase() === 'guitar' && (
                        <DropdownMenuItem
                          onClick={() => onStemAction(stem, 'guitar_analysis')}
                        >
                          <Guitar className="w-4 h-4 mr-2" />
                          Анализ гитары
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onStemAction(stem, 'download')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Скачать стем
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Secondary Actions */}
      <Card className="p-4 bg-card/50 border-border/30">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Дополнительно
        </h3>
        <div className="flex flex-wrap gap-2">
          {onTrim && (
            <Button variant="ghost" size="sm" onClick={onTrim}>
              <Scissors className="w-4 h-4 mr-1.5" />
              Обрезать
            </Button>
          )}
          {onExtend && (
            <Button variant="ghost" size="sm" onClick={onExtend}>
              <Clock className="w-4 h-4 mr-1.5" />
              Расширить
            </Button>
          )}
          {onRemix && (
            <Button variant="ghost" size="sm" onClick={onRemix}>
              <Wand2 className="w-4 h-4 mr-1.5" />
              Ремикс
            </Button>
          )}
        </div>
      </Card>

      {/* State Badge */}
      <div className="flex items-center justify-center">
        <Badge variant="outline" className="text-xs">
          {trackState === 'raw' && 'Исходный трек'}
          {trackState === 'simple_stems' && 'Разделён (2 стема)'}
          {trackState === 'detailed_stems' && `Разделён (${stems.length} стемов)`}
        </Badge>
      </div>
    </div>
  );
}
