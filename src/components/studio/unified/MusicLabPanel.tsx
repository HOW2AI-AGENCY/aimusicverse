/**
 * MusicLabPanel - Creative workspace for recording and chord detection
 * Mobile-optimized with 44px+ touch targets
 * 
 * Features:
 * - Vocal recording
 * - Guitar recording with chord detection
 * - Instrument recording
 * - PromptDJ (PRO users only)
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RecordTrackDrawer, RecordingType } from './RecordTrackDrawer';
import { useRealtimeChordDetection } from '@/hooks/useRealtimeChordDetection';
import { usePromptDJ } from '@/hooks/usePromptDJ';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useHaptic } from '@/hooks/useHaptic';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Mic,
  Guitar,
  Music2,
  Radio,
  ChevronRight,
  Lock,
  CircleDot,
  Loader2,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

interface MusicLabPanelProps {
  projectId: string;
  onRecordingComplete?: (track: {
    id: string;
    audioUrl: string;
    type: RecordingType;
    duration: number;
    name: string;
    chords?: Array<{ chord: string; time: number }>;
  }) => void;
  className?: string;
}

type LabMode = 'record' | 'chords' | 'promptdj';

const RECORDING_OPTIONS = [
  {
    type: 'vocal' as RecordingType,
    icon: Mic,
    label: 'Вокал',
    description: 'Запись голоса и пения',
    color: 'bg-red-500/20 text-red-400',
  },
  {
    type: 'guitar' as RecordingType,
    icon: Guitar,
    label: 'Гитара',
    description: 'С распознаванием аккордов',
    color: 'bg-amber-500/20 text-amber-400',
  },
  {
    type: 'instrument' as RecordingType,
    icon: Music2,
    label: 'Инструмент',
    description: 'Любой инструмент',
    color: 'bg-purple-500/20 text-purple-400',
  },
];

export const MusicLabPanel = memo(function MusicLabPanel({
  projectId,
  onRecordingComplete,
  className,
}: MusicLabPanelProps) {
  const haptic = useHaptic();
  const { isActive: isPro } = useSubscriptionStatus({ userId: '', enabled: false });
  
  const [activeMode, setActiveMode] = useState<LabMode>('record');
  const [showRecordDrawer, setShowRecordDrawer] = useState(false);
  const [selectedRecordingType, setSelectedRecordingType] = useState<RecordingType>('vocal');
  
  // Chord detection
  const chordDetection = useRealtimeChordDetection({
    onChordChange: () => {
      haptic.impact('medium');
    },
    minConfidence: 0.6,
    stabilityFrames: 3,
  });
  
  // PromptDJ
  const promptDJ = usePromptDJ();
  
  // Handle recording type selection
  const handleRecordingSelect = useCallback((type: RecordingType) => {
    haptic.patterns.tap();
    setSelectedRecordingType(type);
    setShowRecordDrawer(true);
  }, [haptic]);
  
  // Handle chord detection toggle
  const handleToggleChordDetection = useCallback(() => {
    haptic.patterns.tap();
    if (chordDetection.isListening) {
      chordDetection.stopListening();
    } else {
      chordDetection.startListening();
    }
  }, [chordDetection, haptic]);
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Mode Tabs */}
      <div className="px-3 pt-2">
        <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as LabMode)}>
          <TabsList className="w-full grid grid-cols-3 h-10">
            <TabsTrigger value="record" className="h-9 gap-1.5">
              <Mic className="h-4 w-4" />
              <span className="text-xs">Запись</span>
            </TabsTrigger>
            <TabsTrigger value="chords" className="h-9 gap-1.5">
              <Guitar className="h-4 w-4" />
              <span className="text-xs">Аккорды</span>
            </TabsTrigger>
            <TabsTrigger value="promptdj" className="h-9 gap-1.5 relative">
              <Radio className="h-4 w-4" />
              <span className="text-xs">DJ</span>
              {!isPro && (
                <Lock className="h-3 w-3 absolute -top-0.5 -right-0.5 text-muted-foreground" />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-3">
        <AnimatePresence mode="wait">
          {/* Recording Mode */}
          {activeMode === 'record' && (
            <motion.div
              key="record"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground text-center mb-4">
                Выберите тип записи
              </p>
              
              {RECORDING_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <Card
                    key={option.type}
                    className="cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => handleRecordingSelect(option.type)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <span className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                        option.color
                      )}>
                        <Icon className="h-6 w-6" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{option.label}</h4>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>
          )}
          
          {/* Chord Detection Mode */}
          {activeMode === 'chords' && (
            <motion.div
              key="chords"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Current Chord Display */}
              <Card className="overflow-hidden">
                <CardContent className="p-6 text-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={chordDetection.currentChord?.name || 'none'}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="mb-4"
                    >
                      <span className="text-5xl font-bold font-mono">
                        {chordDetection.currentChord?.name || '—'}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                  
                  {chordDetection.currentChord && (
                    <p className="text-sm text-muted-foreground">
                      {chordDetection.currentChord.quality} • 
                      Confidence: {Math.round(chordDetection.currentChord.confidence * 100)}%
                    </p>
                  )}
                  
                  {/* Volume indicator */}
                  <div className="mt-4 flex justify-center">
                    <div className="flex gap-0.5 h-8">
                      {Array.from({ length: 16 }).map((_, i) => {
                        const isActive = chordDetection.volume > i / 16;
                        return (
                          <motion.div
                            key={i}
                            className={cn(
                              'w-1.5 rounded-full transition-colors',
                              isActive ? 'bg-primary' : 'bg-muted'
                            )}
                            animate={{
                              height: isActive ? 20 + Math.random() * 12 : 8,
                            }}
                            transition={{ duration: 0.05 }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Chord History */}
              {chordDetection.chordHistory.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">История аккордов</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={chordDetection.clearHistory}
                        className="h-7"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Очистить
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {chordDetection.chordHistory.slice(0, 12).map((chord, i) => (
                        <Badge key={i} variant="secondary" className="font-mono">
                          {chord.name}
                        </Badge>
                      ))}
                    </div>
                    {chordDetection.chordHistory.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Прогрессия: {chordDetection.exportProgression()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Control Button */}
              <Button
                size="lg"
                variant={chordDetection.isListening ? 'destructive' : 'default'}
                className="w-full h-14 gap-2"
                onClick={handleToggleChordDetection}
                disabled={chordDetection.isInitializing}
              >
                {chordDetection.isInitializing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Инициализация...</span>
                  </>
                ) : chordDetection.isListening ? (
                  <>
                    <CircleDot className="h-5 w-5" />
                    <span>Остановить</span>
                  </>
                ) : (
                  <>
                    <Guitar className="h-5 w-5" />
                    <span>Начать распознавание</span>
                  </>
                )}
              </Button>
              
              {chordDetection.error && (
                <p className="text-sm text-destructive text-center">
                  {chordDetection.error}
                </p>
              )}
            </motion.div>
          )}
          
          {/* PromptDJ Mode */}
          {activeMode === 'promptdj' && (
            <motion.div
              key="promptdj"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {!isPro ? (
                <Card className="overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">PromptDJ — PRO функция</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Создавайте музыку с помощью AI DJ интерфейса. 
                      Настраивайте каналы, миксуйте стили и генерируйте уникальные треки.
                    </p>
                    <Button variant="default" className="gap-2">
                      <span>Получить PRO</span>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* PromptDJ Interface */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Текущий промпт</h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 font-mono">
                        {promptDJ.currentPrompt || 'Настройте каналы для генерации'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  {/* Channel Controls */}
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-medium">Каналы</h4>
                      {promptDJ.channels.filter(c => c.enabled).map(channel => (
                        <div key={channel.id} className="flex items-center gap-3">
                          <Badge variant="outline" className="capitalize">
                            {channel.type}
                          </Badge>
                          <span className="flex-1 text-sm">{channel.value}</span>
                          <span className="text-xs text-muted-foreground">
                            x{channel.weight.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  {/* Generate Button */}
                  <Button
                    size="lg"
                    className="w-full h-14 gap-2"
                    onClick={promptDJ.generateMusic}
                    disabled={promptDJ.isGenerating}
                  >
                    {promptDJ.isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Генерация...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="h-5 w-5" />
                        <span>Сгенерировать</span>
                      </>
                    )}
                  </Button>
                  
                  {/* Generated Tracks */}
                  {promptDJ.generatedTracks.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-3">Сгенерированные</h4>
                        <div className="space-y-2">
                          {promptDJ.generatedTracks.map((track) => (
                            <div
                              key={track.id}
                              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 shrink-0"
                                onClick={() => 
                                  promptDJ.currentTrack?.id === track.id && promptDJ.isPlaying
                                    ? promptDJ.stopPlayback()
                                    : promptDJ.playTrack(track)
                                }
                              >
                                {promptDJ.currentTrack?.id === track.id && promptDJ.isPlaying ? (
                                  <Pause className="h-5 w-5" />
                                ) : (
                                  <Play className="h-5 w-5" />
                                )}
                              </Button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{track.prompt}</p>
                                <p className="text-xs text-muted-foreground">
                                  {track.createdAt.toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
      
      {/* Recording Drawer */}
      <RecordTrackDrawer
        open={showRecordDrawer}
        onOpenChange={setShowRecordDrawer}
        projectId={projectId}
        onRecordingComplete={(track) => {
          onRecordingComplete?.(track);
          toast.success(`${track.name} добавлен в проект`);
        }}
      />
    </div>
  );
});
