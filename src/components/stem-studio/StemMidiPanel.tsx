import { useState } from 'react';
import { 
  Music2, Download, Loader2, FileMusic, Sparkles, 
  Piano, Drum, Guitar, Mic2, Waves
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStemMidi } from '@/hooks/useStemMidi';
import { TrackStem } from '@/hooks/useTrackStems';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface StemMidiPanelProps {
  trackId: string;
  trackTitle: string;
  stems: TrackStem[];
}

const stemIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  vocals: Mic2,
  vocal: Mic2,
  drums: Drum,
  bass: Waves,
  guitar: Guitar,
  piano: Piano,
  keyboard: Piano,
  synth: Piano,
  instrumental: Guitar,
};

const stemLabels: Record<string, string> = {
  vocals: 'Вокал',
  vocal: 'Вокал',
  drums: 'Ударные',
  bass: 'Бас',
  guitar: 'Гитара',
  piano: 'Пианино',
  keyboard: 'Клавишные',
  synth: 'Синтезатор',
  instrumental: 'Инструментал',
  other: 'Другое',
};

export const StemMidiPanel = ({ trackId, trackTitle, stems }: StemMidiPanelProps) => {
  const [open, setOpen] = useState(false);
  const [selectedStem, setSelectedStem] = useState<TrackStem | null>(null);
  const [modelType, setModelType] = useState<'mt3' | 'basic-pitch'>('mt3');

  // Hook for all track MIDI (no stem filter)
  const { 
    midiVersions: allMidiVersions, 
    isLoading: allLoading,
  } = useStemMidi(trackId);

  // Hook for selected stem MIDI
  const {
    midiVersions: stemMidiVersions,
    isLoading: stemLoading,
    isTranscribing,
    transcribeToMidi,
    downloadMidi,
    hasMidi: stemHasMidi,
  } = useStemMidi(trackId, selectedStem?.id);

  const handleTranscribe = async () => {
    if (!selectedStem) return;
    
    await transcribeToMidi(
      selectedStem.audio_url, 
      modelType,
      selectedStem.stem_type
    );
  };

  // Count total MIDI files
  const totalMidiCount = allMidiVersions?.length || 0;

  // Get stem-specific MIDI files
  const getStemMidiCount = (stemId: string) => {
    return allMidiVersions?.filter(m => m.metadata?.stem_id === stemId).length || 0;
  };

  const StemIcon = selectedStem 
    ? stemIcons[selectedStem.stem_type.toLowerCase()] || Music2
    : Music2;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            totalMidiCount > 0 && "border-primary/50 text-primary"
          )}
        >
          <Piano className="w-4 h-4" />
          MIDI Стемы
          {totalMidiCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {totalMidiCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileMusic className="w-5 h-5 text-primary" />
            MIDI Транскрипция стемов
          </DialogTitle>
          <DialogDescription>
            Создайте MIDI файлы из отдельных стемов для работы в DAW
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stem Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Выберите стем</label>
            <div className="grid grid-cols-2 gap-2">
              {stems.map((stem) => {
                const Icon = stemIcons[stem.stem_type.toLowerCase()] || Music2;
                const label = stemLabels[stem.stem_type.toLowerCase()] || stem.stem_type;
                const midiCount = getStemMidiCount(stem.id);
                const isSelected = selectedStem?.id === stem.id;

                return (
                  <Button
                    key={stem.id}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedStem(stem)}
                    className={cn(
                      "justify-start gap-2 h-10",
                      isSelected && "ring-2 ring-primary/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{label}</span>
                    {midiCount > 0 && (
                      <Badge variant="secondary" className="ml-auto h-4 px-1 text-[10px]">
                        {midiCount}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Transcription Options */}
          {selectedStem && (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <StemIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {stemLabels[selectedStem.stem_type.toLowerCase()] || selectedStem.stem_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Создать MIDI ноты из этого стема
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Модель</span>
                <Select value={modelType} onValueChange={(v) => setModelType(v as any)}>
                  <SelectTrigger className="w-36 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mt3">MT3 (точный)</SelectItem>
                    <SelectItem value="basic-pitch">Basic Pitch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
                {modelType === 'mt3' 
                  ? '🎹 MT3 обеспечивает высокую точность распознавания нот и аккордов'
                  : '⚡ Basic Pitch работает быстрее, подходит для монофонических партий'}
              </div>

              <Button 
                onClick={handleTranscribe} 
                disabled={isTranscribing}
                className="w-full gap-2"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Создание MIDI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Транскрибировать в MIDI
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Existing MIDI files for selected stem */}
          {selectedStem && !stemLoading && stemMidiVersions && stemMidiVersions.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">
                MIDI файлы для {stemLabels[selectedStem.stem_type.toLowerCase()] || selectedStem.stem_type}
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stemMidiVersions.map((midi) => (
                  <div 
                    key={midi.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileMusic className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {trackTitle}_{selectedStem.stem_type}.mid
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {midi.metadata?.model_type?.toUpperCase() || 'MT3'} • {' '}
                          {format(new Date(midi.created_at), 'd MMM, HH:mm', { locale: ru })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadMidi(
                        midi.audio_url, 
                        `${trackTitle}_${selectedStem.stem_type}`
                      )}
                      className="h-8 w-8"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state for selected stem */}
          {selectedStem && !stemLoading && (!stemMidiVersions || stemMidiVersions.length === 0) && (
            <div className="text-center py-4 text-muted-foreground">
              <Music2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">MIDI для этого стема ещё не создан</p>
            </div>
          )}

          {/* All MIDI files summary */}
          {allMidiVersions && allMidiVersions.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Всего создано: {allMidiVersions.length} MIDI файл(ов)
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
