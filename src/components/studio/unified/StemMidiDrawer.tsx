/**
 * StemMidiDrawer - In-studio MIDI transcription panel
 * 
 * Uses Klangio as the main provider for transcription
 * Supports multiple output formats: MIDI, MusicXML, Guitar Pro, PDF
 * Intelligently selects model and formats based on stem type
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Music2, Download, Loader2, 
  Piano, Mic2, Drum, Guitar, FileAudio,
  Play, FileText, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrackStem } from '@/hooks/useTrackStems';
import { useReplicateMidiTranscription, TranscriptionFiles } from '@/hooks/useReplicateMidiTranscription';
import { useStemTranscription, useSaveTranscription } from '@/hooks/useStemTranscription';
import { UnifiedNotesViewer } from '@/components/studio/UnifiedNotesViewer';
import { MidiFilesCard } from '@/components/studio/MidiFilesCard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  getTranscriptionConfig, 
  getFormatLabel, 
  MODEL_INFO,
  type KlangioModel,
  type TranscriptionOutput
} from '@/lib/transcription-utils';

interface StemMidiDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stem: TrackStem | null;
  trackId: string;
  trackTitle: string;
  trackDurationSeconds?: number | null; // For engine auto-selection
}

const modelIcons: Record<string, React.ReactNode> = {
  'guitar': <Guitar className="w-4 h-4" />,
  'piano': <Piano className="w-4 h-4" />,
  'drums': <Drum className="w-4 h-4" />,
  'vocal': <Mic2 className="w-4 h-4" />,
  'bass': <FileAudio className="w-4 h-4" />,
  'universal': <Music2 className="w-4 h-4" />,
  'lead': <Music2 className="w-4 h-4" />,
  'multi': <Music2 className="w-4 h-4" />,
  'wind': <Music2 className="w-4 h-4" />,
  'string': <Music2 className="w-4 h-4" />,
};

// Available models for user selection
const SELECTABLE_MODELS: KlangioModel[] = ['guitar', 'piano', 'drums', 'vocal', 'bass', 'universal'];

export function StemMidiDrawer({ 
  open, 
  onOpenChange, 
  stem, 
  trackId,
  trackTitle,
  trackDurationSeconds 
}: StemMidiDrawerProps) {
  const isMobile = useIsMobile();
  const [selectedModel, setSelectedModel] = useState<KlangioModel>('universal');
  const [activeTab, setActiveTab] = useState<'create' | 'player' | 'files'>('create');
  const [activeMidiUrl, setActiveMidiUrl] = useState<string | null>(null);
  const [transcriptionFiles, setTranscriptionFiles] = useState<TranscriptionFiles>({});
  
  
  const { 
    transcribe, 
    isLoading: isTranscribing, 
    result,
    progress 
  } = useReplicateMidiTranscription();
  
  const { 
    latestTranscription,
    hasTranscription,
    isLoading: isLoadingTranscription,
  } = useStemTranscription(stem?.id);
  
  const { saveTranscription, isSaving } = useSaveTranscription();

  // Get intelligent configuration based on stem type
  const stemConfig = useMemo(() => {
    if (!stem) return getTranscriptionConfig('universal');
    return getTranscriptionConfig(stem.stem_type);
  }, [stem]);

  // Set recommended model when stem changes
  useEffect(() => {
    if (stem) {
      const config = getTranscriptionConfig(stem.stem_type);
      setSelectedModel(config.model as KlangioModel);
    }
  }, [stem]);

  // Load saved transcription data when drawer opens or transcription changes
  useEffect(() => {
    if (latestTranscription) {
      const files: TranscriptionFiles = {};
      if (latestTranscription.midi_url) files.midi = latestTranscription.midi_url;
      if (latestTranscription.midi_quant_url) files.midi_quant = latestTranscription.midi_quant_url;
      if (latestTranscription.mxml_url) files.mxml = latestTranscription.mxml_url;
      if (latestTranscription.gp5_url) files.gp5 = latestTranscription.gp5_url;
      if (latestTranscription.pdf_url) files.pdf = latestTranscription.pdf_url;
      
      setTranscriptionFiles(files);
      
      if (latestTranscription.midi_url) {
        setActiveMidiUrl(latestTranscription.midi_url);
      }
      
      // Set model from saved transcription
      if (latestTranscription.model && SELECTABLE_MODELS.includes(latestTranscription.model as KlangioModel)) {
        setSelectedModel(latestTranscription.model as KlangioModel);
      }
    }
  }, [latestTranscription]);

  // Get outputs based on selected model
  const selectedOutputs = useMemo((): TranscriptionOutput[] => {
    // For manual model selection, determine outputs based on model
    switch (selectedModel) {
      case 'guitar':
        return ['midi', 'midi_quant', 'gp5', 'pdf', 'mxml'];
      case 'bass':
        return ['midi', 'midi_quant', 'gp5', 'mxml'];
      case 'drums':
        return ['midi', 'midi_quant', 'pdf'];
      case 'piano':
        return ['midi', 'midi_quant', 'pdf', 'mxml'];
      case 'vocal':
        return ['midi', 'pdf', 'mxml'];
      default:
        return ['midi', 'midi_quant', 'mxml'];
    }
  }, [selectedModel]);

  // Check if current selection supports tablature
  const supportsTableture = selectedModel === 'guitar' || selectedModel === 'bass';

  // Update files when new result comes in
  useEffect(() => {
    if (result?.files) {
      setTranscriptionFiles(result.files);
      if (result.midiUrl) {
        setActiveMidiUrl(result.midiUrl);
      }
    }
  }, [result]);

  const handleTranscribe = useCallback(async () => {
    if (!stem) return;

    try {
      // Cast model to the subset supported by the API
      const apiModel = SELECTABLE_MODELS.includes(selectedModel) 
        ? selectedModel as 'guitar' | 'piano' | 'drums' | 'vocal' | 'bass' | 'universal'
        : 'universal';
        
      const transcriptionResult = await transcribe(stem.audio_url, { 
        trackId,
        stemId: stem.id,
        model: apiModel,
        outputs: selectedOutputs,
        durationSeconds: trackDurationSeconds || undefined,
      });
      
      if (transcriptionResult) {
        const files = transcriptionResult.files || {};
        setTranscriptionFiles(files);
        
        if (transcriptionResult.midiUrl) {
          setActiveMidiUrl(transcriptionResult.midiUrl);
          setActiveTab('player');
        }
        
        // Check if we have ANY files OR notes to save
        const hasAnyFiles = !!(
          files.midi || 
          files.midi_quant || 
          files.mxml || 
          files.gp5 || 
          files.pdf
        );
        const hasNotes = !!(transcriptionResult.notes && transcriptionResult.notes.length > 0);
        
        // Save transcription if we have files OR notes
        if (hasAnyFiles || hasNotes) {
          try {
            console.log('[StemMidiDrawer] Saving transcription:', {
              stemId: stem.id,
              files: Object.keys(files),
              notesCount: transcriptionResult.notes?.length || 0,
              hasFiles: hasAnyFiles,
              hasNotes,
            });
            
            await saveTranscription({
              stemId: stem.id,
              trackId,
              midiUrl: files.midi || null,
              midiQuantUrl: files.midi_quant || null,
              mxmlUrl: files.mxml || null,
              gp5Url: files.gp5 || null,
              pdfUrl: files.pdf || null,
              model: apiModel,
              notes: transcriptionResult.notes,
              notesCount: transcriptionResult.notes?.length || null,
              bpm: transcriptionResult.bpm || null,
              keyDetected: transcriptionResult.key || null,
              timeSignature: transcriptionResult.timeSignature || null,
              durationSeconds: null,
            });
            
            console.log('[StemMidiDrawer] Transcription saved successfully');
            
            // If we have notes but no MIDI file, show appropriate message
            if (hasNotes && !hasAnyFiles) {
              toast.success(`Распознано ${transcriptionResult.notes?.length} нот`);
            }
          } catch (saveError) {
            console.error('[StemMidiDrawer] Failed to save transcription:', saveError);
            toast.error('Не удалось сохранить транскрипцию');
          }
        } else {
          console.warn('[StemMidiDrawer] No files or notes from transcription result');
          toast.info('Не удалось распознать ноты');
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Ошибка транскрипции');
    }
  }, [stem, selectedModel, selectedOutputs, transcribe, trackId, saveTranscription]);

  const handleDownloadMidi = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  const handlePlayMidi = useCallback((url: string) => {
    setActiveMidiUrl(url);
    setActiveTab('player');
  }, []);

  const latestMidiUrl = result?.midiUrl || activeMidiUrl || latestTranscription?.midi_url;
  const hasFiles = Object.keys(transcriptionFiles).length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isMobile ? 'bottom' : 'right'} 
        className={cn(
          isMobile ? "h-[90vh] rounded-t-2xl flex flex-col" : "w-[450px] flex flex-col"
        )}
      >
        <SheetHeader className="pb-4 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            MIDI Транскрипция
          </SheetTitle>
        </SheetHeader>

        {stem && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'create' | 'player' | 'files')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="create">Создать</TabsTrigger>
              <TabsTrigger value="player" disabled={!latestMidiUrl && !activeMidiUrl}>
                Плеер
              </TabsTrigger>
              <TabsTrigger value="files" disabled={!hasFiles}>
                Файлы
                {hasFiles && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">
                    {Object.keys(transcriptionFiles).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full -mx-6 px-6">
                <div className="space-y-6 pb-6">
                  {/* Stem Info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {stem.stem_type.toLowerCase().includes('vocal') ? (
                        <Mic2 className="w-5 h-5 text-primary" />
                      ) : stem.stem_type.toLowerCase().includes('drum') ? (
                        <Drum className="w-5 h-5 text-primary" />
                      ) : stem.stem_type.toLowerCase().includes('guitar') ? (
                        <Guitar className="w-5 h-5 text-primary" />
                      ) : (
                        <Music2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{stem.stem_type}</p>
                        {stemConfig.supportsTableture && (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
                            <Guitar className="w-3 h-3 mr-1" />
                            Табулатура
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{trackTitle}</p>
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Выберите модель (Klangio)</Label>
                    <RadioGroup
                      value={selectedModel}
                      onValueChange={(v) => setSelectedModel(v as KlangioModel)}
                      className="space-y-2"
                    >
                      {SELECTABLE_MODELS.map((key) => {
                        const model = MODEL_INFO[key];
                        const isRecommended = key === stemConfig.model;
                        const modelSupportsTabs = key === 'guitar' || key === 'bass';
                        
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                              selectedModel === key 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:bg-muted/50"
                            )}
                            onClick={() => setSelectedModel(key)}
                          >
                            <RadioGroupItem value={key} id={key} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {modelIcons[key]}
                                <span className="font-medium text-sm">{model.name}</span>
                                {isRecommended && (
                                  <Badge className="text-[10px] h-4 px-1">
                                    Рекомендуется
                                  </Badge>
                                )}
                                {modelSupportsTabs && (
                                  <Badge variant="outline" className="text-[10px] h-4 px-1 text-amber-500 border-amber-500/30">
                                    TAB
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {model.description}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  {/* Output formats preview */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Будут созданы:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOutputs.map((format) => (
                        <Badge 
                          key={format} 
                          variant="secondary" 
                          className={cn(
                            "text-[10px]",
                            format === 'gp5' && "bg-amber-500/20 text-amber-600 border-amber-500/30"
                          )}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {getFormatLabel(format)}
                        </Badge>
                      ))}
                    </div>
                    {supportsTableture && (
                      <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                        <Guitar className="w-3 h-3" />
                        Guitar Pro содержит табулатуру + ноты
                      </p>
                    )}
                  </div>

                  {/* Transcribe Button */}
                  <Button
                    onClick={handleTranscribe}
                    disabled={isTranscribing || isSaving}
                    className="w-full"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {progress > 0 ? `${progress}%` : 'Обработка...'}
                      </>
                    ) : isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Music2 className="w-4 h-4 mr-2" />
                        Создать транскрипцию
                      </>
                    )}
                  </Button>

                  {/* Result */}
                  <AnimatePresence>
                    {result?.midiUrl && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-lg bg-success/10 border border-success/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Music2 className="w-5 h-5 text-success" />
                            <span className="text-sm font-medium">Готово!</span>
                            <Badge variant="secondary" className="text-xs">
                              {Object.keys(result.files).length} файлов
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePlayMidi(result.midiUrl)}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Играть
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setActiveTab('files')}
                            >
                              Файлы
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Saved transcription info */}
                  {hasTranscription && latestTranscription && !result?.midiUrl && (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        Сохранённая транскрипция
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {latestTranscription.bpm && (
                          <span>BPM: {latestTranscription.bpm}</span>
                        )}
                        {latestTranscription.key_detected && (
                          <span>Тональность: {latestTranscription.key_detected}</span>
                        )}
                        {latestTranscription.notes_count && (
                          <span>Нот: {latestTranscription.notes_count}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="player" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full -mx-6 px-6">
                <div className="pb-6">
                  {(activeMidiUrl || latestMidiUrl) ? (
                    <UnifiedNotesViewer
                      midiUrl={activeMidiUrl || latestMidiUrl}
                      musicXmlUrl={transcriptionFiles.mxml || latestTranscription?.mxml_url}
                      notes={latestTranscription?.notes as any[] || undefined}
                      bpm={latestTranscription?.bpm || undefined}
                      keySignature={latestTranscription?.key_detected || undefined}
                      timeSignature={latestTranscription?.time_signature || undefined}
                      notesCount={latestTranscription?.notes_count || undefined}
                      model={latestTranscription?.model}
                      files={{
                        midiUrl: transcriptionFiles.midi || latestTranscription?.midi_url,
                        midiQuantUrl: transcriptionFiles.midi_quant || latestTranscription?.midi_quant_url,
                        pdfUrl: transcriptionFiles.pdf || latestTranscription?.pdf_url,
                        gp5Url: transcriptionFiles.gp5 || latestTranscription?.gp5_url,
                        musicXmlUrl: transcriptionFiles.mxml || latestTranscription?.mxml_url,
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
                      <Piano className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-3 sm:mb-4" />
                      <p className="text-sm text-muted-foreground">Нет MIDI для воспроизведения</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Создайте транскрипцию во вкладке "Создать"
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="files" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full -mx-6 px-6">
                <div className="pb-6 space-y-4">
                  {hasFiles ? (
                    <MidiFilesCard
                      files={transcriptionFiles}
                      title="Доступные файлы"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Music2 className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Нет файлов</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Создайте транскрипцию для получения файлов
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
