/**
 * StemMidiDrawer - In-studio MIDI transcription panel
 * 
 * Opens as a drawer/sheet for MIDI transcription without navigation
 * Now includes MIDI playback and note visualization
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Music2, Download, X, Loader2, 
  Piano, Mic2, Drum, Guitar, FileAudio,
  Play, Pause
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
import { useReplicateMidiTranscription } from '@/hooks/useReplicateMidiTranscription';
import { useStemMidi, MIDI_MODELS, MidiModelType } from '@/hooks/useStemMidi';
import { MidiPlayerCard } from '@/components/studio/MidiPlayerCard';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface StemMidiDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stem: TrackStem | null;
  trackId: string;
  trackTitle: string;
}

const modelIcons: Record<string, React.ReactNode> = {
  'mt3': <FileAudio className="w-4 h-4" />,
  'bytedance-piano': <Piano className="w-4 h-4" />,
  'drums': <Drum className="w-4 h-4" />,
  'vocal': <Mic2 className="w-4 h-4" />,
  'basic-pitch': <Music2 className="w-4 h-4" />,
  'ismir2021': <Piano className="w-4 h-4" />,
};

export function StemMidiDrawer({ 
  open, 
  onOpenChange, 
  stem, 
  trackId,
  trackTitle 
}: StemMidiDrawerProps) {
  const isMobile = useIsMobile();
  const [selectedModel, setSelectedModel] = useState<MidiModelType>('mt3');
  const [activeTab, setActiveTab] = useState<'create' | 'player'>('create');
  const [activeMidiUrl, setActiveMidiUrl] = useState<string | null>(null);
  
  const { 
    transcribe, 
    isLoading: isTranscribingReplicate, 
    result: replicateResult,
    progress 
  } = useReplicateMidiTranscription();
  
  const { 
    midiVersions, 
    transcribeToMidi, 
    isTranscribing: isStemTranscribing 
  } = useStemMidi(trackId, stem?.id);

  const isTranscribing = isTranscribingReplicate || isStemTranscribing;

  const handleTranscribe = useCallback(async () => {
    if (!stem) return;

    try {
      // Use replicate for MT3 model
      if (selectedModel === 'mt3') {
        const result = await transcribe(stem.audio_url, { trackId });
        if (result?.midiUrl) {
          setActiveMidiUrl(result.midiUrl);
          setActiveTab('player');
        }
        toast.success('MIDI транскрипция создана');
      } else {
        // Use klangio for other models
        await transcribeToMidi(stem.audio_url, selectedModel, stem.stem_type);
        toast.success('MIDI транскрипция создана');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Ошибка транскрипции');
    }
  }, [stem, selectedModel, transcribe, transcribeToMidi, trackId]);

  const handleDownloadMidi = useCallback((url: string) => {
    window.open(url, '_blank');
  }, []);

  const handlePlayMidi = useCallback((url: string) => {
    setActiveMidiUrl(url);
    setActiveTab('player');
  }, []);

  // Get recommended model based on stem type
  const getRecommendedModel = (): MidiModelType => {
    if (!stem) return 'mt3';
    const stemType = stem.stem_type.toLowerCase();
    
    if (stemType.includes('piano') || stemType.includes('keys')) return 'bytedance-piano';
    if (stemType.includes('drum')) return 'drums';
    if (stemType.includes('vocal')) return 'vocal';
    if (stemType.includes('guitar')) return 'basic-pitch';
    return 'mt3';
  };

  const recommendedModel = getRecommendedModel();

  // Auto-switch to player when result comes in
  const latestMidiUrl = replicateResult?.midiUrl || midiVersions?.[0]?.audio_url;

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
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'create' | 'player')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="create">Создать</TabsTrigger>
              <TabsTrigger value="player" disabled={!latestMidiUrl && !activeMidiUrl}>
                Плеер
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
                    <div>
                      <p className="font-medium text-sm">{stem.stem_type}</p>
                      <p className="text-xs text-muted-foreground">{trackTitle}</p>
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Выберите модель</Label>
                    <RadioGroup
                      value={selectedModel}
                      onValueChange={(v) => setSelectedModel(v as MidiModelType)}
                      className="space-y-2"
                    >
                      {Object.entries(MIDI_MODELS).map(([key, model]) => (
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
                          onClick={() => setSelectedModel(key as MidiModelType)}
                        >
                          <RadioGroupItem value={key} id={key} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {modelIcons[key]}
                              <span className="font-medium text-sm">{model.name}</span>
                              {'isNew' in model && model.isNew && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                  NEW
                                </Badge>
                              )}
                              {key === recommendedModel && (
                                <Badge className="text-[10px] h-4 px-1">
                                  Рекомендуется
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {model.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Transcribe Button */}
                  <Button
                    onClick={handleTranscribe}
                    disabled={isTranscribing}
                    className="w-full"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {progress > 0 ? `${progress}%` : 'Обработка...'}
                      </>
                    ) : (
                      <>
                        <Music2 className="w-4 h-4 mr-2" />
                        Создать MIDI
                      </>
                    )}
                  </Button>

                  {/* Result */}
                  <AnimatePresence>
                    {replicateResult?.midiUrl && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-lg bg-success/10 border border-success/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Music2 className="w-5 h-5 text-success" />
                            <span className="text-sm font-medium">MIDI готов!</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePlayMidi(replicateResult.midiUrl)}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Играть
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadMidi(replicateResult.midiUrl)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Previous MIDI versions */}
                  {midiVersions && midiVersions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Предыдущие версии
                      </Label>
                      <div className="space-y-2">
                        {midiVersions.map((version) => (
                          <div
                            key={version.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                          >
                            <div className="flex items-center gap-2">
                              <Music2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-xs">
                                {version.metadata?.model_name || 'MIDI'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePlayMidi(version.audio_url)}
                                title="Воспроизвести"
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadMidi(version.audio_url)}
                                title="Скачать"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
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
                    <MidiPlayerCard
                      midiUrl={activeMidiUrl || latestMidiUrl!}
                      title={`${stem.stem_type} MIDI`}
                      onDownload={() => handleDownloadMidi(activeMidiUrl || latestMidiUrl!)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Piano className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Нет MIDI для воспроизведения</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Создайте транскрипцию во вкладке "Создать"
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