import { useState } from 'react';
import { 
  Music2, Download, Loader2, FileMusic, Sparkles, 
  Piano, Drum, Guitar, Mic2, Waves, Wand2, Play
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStemMidi, MIDI_MODELS, MidiModelType } from '@/hooks/useStemMidi';
import { TrackStem } from '@/hooks/useTrackStems';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface StemMidiPanelProps {
  trackId: string;
  trackTitle: string;
  trackAudioUrl?: string;
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

export const StemMidiPanel = ({ trackId, trackTitle, trackAudioUrl, stems }: StemMidiPanelProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stems' | 'piano'>('stems');
  const [selectedStem, setSelectedStem] = useState<TrackStem | null>(null);
  const [modelType, setModelType] = useState<MidiModelType>('mt3');
  const [pop2pianoComposer, setPop2pianoComposer] = useState('composer1');

  // Hook for all track MIDI (no stem filter)
  const { 
    midiVersions: allMidiVersions, 
    pianoArrangements,
    isLoading: allLoading,
  } = useStemMidi(trackId);

  // Hook for selected stem MIDI
  const {
    midiOnly: stemMidiVersions,
    isLoading: stemLoading,
    isTranscribing,
    transcribeToMidi,
    downloadFile,
    hasMidi: stemHasMidi,
  } = useStemMidi(trackId, selectedStem?.id);

  const handleTranscribeStem = async () => {
    if (!selectedStem) return;
    
    await transcribeToMidi(
      selectedStem.audio_url, 
      modelType,
      selectedStem.stem_type,
      { autoSelect: modelType === 'mt3' } // Auto-select if using default
    );
  };

  const handleCreatePianoArrangement = async () => {
    const audioUrl = trackAudioUrl || stems[0]?.audio_url;
    if (!audioUrl) return;
    
    // Use bytedance-piano for piano transcription instead of deprecated pop2piano
    await transcribeToMidi(
      audioUrl,
      'bytedance-piano',
      undefined,
      { autoSelect: false }
    );
  };

  // Count total files
  const totalMidiCount = allMidiVersions?.filter(m => m.metadata?.output_type !== 'audio').length || 0;
  const totalPianoCount = pianoArrangements?.length || 0;

  // Get stem-specific MIDI files
  const getStemMidiCount = (stemId: string) => {
    return allMidiVersions?.filter(m => 
      m.metadata?.stem_id === stemId && m.metadata?.output_type !== 'audio'
    ).length || 0;
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
            (totalMidiCount > 0 || totalPianoCount > 0) && "border-primary/50 text-primary"
          )}
        >
          <Piano className="w-4 h-4" />
          MIDI & Piano
          {(totalMidiCount + totalPianoCount) > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {totalMidiCount + totalPianoCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileMusic className="w-5 h-5 text-primary" />
            MIDI & Фортепианные аранжировки
          </DialogTitle>
          <DialogDescription>
            Создайте MIDI файлы или фортепианные версии для работы в DAW
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stems" className="gap-2">
              <Music2 className="w-4 h-4" />
              MIDI Стемы
              {totalMidiCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {totalMidiCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="piano" className="gap-2">
              <Piano className="w-4 h-4" />
              Pop2Piano
              {totalPianoCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {totalPianoCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* MIDI Stems Tab */}
          <TabsContent value="stems" className="space-y-4 mt-4">
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
                  <Select value={modelType} onValueChange={(v) => setModelType(v as MidiModelType)}>
                    <SelectTrigger className="w-44 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mt3">
                        <span className="flex items-center gap-2">
                          🎹 MT3 (точный)
                        </span>
                      </SelectItem>
                      <SelectItem value="basic-pitch">
                        <span className="flex items-center gap-2">
                          ⚡ Basic Pitch (быстрый)
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
                  {MIDI_MODELS[modelType]?.description}
                </div>

                <Button 
                  onClick={handleTranscribeStem} 
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
                            {midi.metadata?.model_name || midi.metadata?.model_type?.toUpperCase()} • {' '}
                            {format(new Date(midi.created_at), 'd MMM, HH:mm', { locale: ru })}
                            {midi.metadata?.auto_selected && ' • Auto'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadFile(
                          midi.audio_url, 
                          `${trackTitle}_${selectedStem.stem_type}`,
                          midi.metadata?.output_type
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
          </TabsContent>

          {/* Pop2Piano Tab */}
          <TabsContent value="piano" className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Piano className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Pop2Piano</p>
                  <p className="text-xs text-muted-foreground">
                    Создайте красивую фортепианную версию вашего трека
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Стиль пианиста</span>
                <Select value={pop2pianoComposer} onValueChange={setPop2pianoComposer}>
                  <SelectTrigger className="w-36 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="composer1">Классический</SelectItem>
                    <SelectItem value="composer2">Джазовый</SelectItem>
                    <SelectItem value="composer3">Романтичный</SelectItem>
                    <SelectItem value="composer4">Минималист</SelectItem>
                    <SelectItem value="composer5">Виртуоз</SelectItem>
                    <SelectItem value="composer6">Поп-стиль</SelectItem>
                    <SelectItem value="composer7">Импрессионист</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
                🎹 Pop2Piano анализирует мелодию и гармонию трека и создаёт 
                фортепианную аранжировку в выбранном стиле
              </div>

              <Button 
                onClick={handleCreatePianoArrangement} 
                disabled={isTranscribing || (!trackAudioUrl && stems.length === 0)}
                className="w-full gap-2"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Создание аранжировки...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Создать фортепианную версию
                  </>
                )}
              </Button>
            </div>

            {/* Existing piano arrangements */}
            {pianoArrangements && pianoArrangements.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Фортепианные аранжировки
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pianoArrangements.map((piano) => (
                    <div 
                      key={piano.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Piano className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {trackTitle}_piano.mp3
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {piano.version_label || 'Piano Arrangement'} • {' '}
                            {format(new Date(piano.created_at), 'd MMM, HH:mm', { locale: ru })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const audio = new Audio(piano.audio_url);
                            audio.play();
                          }}
                          className="h-8 w-8"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadFile(
                            piano.audio_url, 
                            `${trackTitle}_piano`,
                            'audio'
                          )}
                          className="h-8 w-8"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for piano */}
            {(!pianoArrangements || pianoArrangements.length === 0) && (
              <div className="text-center py-4 text-muted-foreground">
                <Piano className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Фортепианные аранжировки ещё не созданы</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Summary */}
        {(totalMidiCount > 0 || totalPianoCount > 0) && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              MIDI: {totalMidiCount} • Piano: {totalPianoCount}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
