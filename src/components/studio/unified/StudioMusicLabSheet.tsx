/**
 * StudioMusicLabSheet - Full MusicLab integration for Studio
 * 
 * Features:
 * - Vocal/Guitar/Instrument recording with realtime levels
 * - Realtime chord detection with history
 * - PromptDJ with channel controls and crossfader
 * - Session recordings management
 * 
 * Mobile-optimized with 44px+ touch targets
 */

import { memo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useMusicLabStudio, MusicLabMode, RecordingType } from '@/hooks/musiclab';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { cn } from '@/lib/utils';
import {
  Mic,
  Guitar,
  Music2,
  Radio,
  Lock,
  CircleDot,
  Loader2,
  Play,
  Pause,
  Square,
  RotateCcw,
  ChevronRight,
  X,
  Trash2,
  Volume2,
  Sparkles,
  AlertCircle,
  FlaskConical,
} from 'lucide-react';

interface StudioMusicLabSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onRecordingComplete?: (track: {
    id: string;
    audioUrl: string;
    type: RecordingType;
    duration: number;
    name: string;
    chords?: Array<{ chord: string; time: number }>;
  }) => void;
  onDJTrackComplete?: (audioUrl: string) => void;
}

const RECORDING_OPTIONS = [
  {
    type: 'vocal' as RecordingType,
    icon: Mic,
    label: 'Вокал',
    description: 'Пение и голос',
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

const MODE_TABS = [
  { value: 'record' as MusicLabMode, icon: Mic, label: 'Запись' },
  { value: 'chords' as MusicLabMode, icon: Guitar, label: 'Аккорды' },
  { value: 'promptdj' as MusicLabMode, icon: Radio, label: 'DJ' },
];

export const StudioMusicLabSheet = memo(function StudioMusicLabSheet({
  open,
  onOpenChange,
  projectId,
  onRecordingComplete,
  onDJTrackComplete,
}: StudioMusicLabSheetProps) {
  const { isActive: isPro } = useSubscriptionStatus({ userId: '', enabled: false });
  
  const musicLab = useMusicLabStudio({
    projectId,
    onRecordingComplete,
    onDJTrackGenerated: onDJTrackComplete,
  });
  
  // Cleanup on close
  useEffect(() => {
    if (!open) {
      musicLab.cleanup();
    }
  }, [open, musicLab.cleanup]);
  
  // Check permission on open
  useEffect(() => {
    if (open && musicLab.hasPermission === null) {
      musicLab.checkPermission();
    }
  }, [open, musicLab.hasPermission, musicLab.checkPermission]);
  
  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle recording toggle
  const handleRecordToggle = useCallback(async () => {
    if (musicLab.isRecording) {
      await musicLab.stopRecording();
    } else {
      await musicLab.startRecording();
    }
  }, [musicLab]);
  
  // Bar count for level visualization
  const barCount = 16;
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-2xl p-0"
      >
        <SheetHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              MusicLab
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Mode Tabs */}
          <Tabs 
            value={musicLab.mode} 
            onValueChange={(v) => musicLab.setMode(v as MusicLabMode)}
            className="mt-2"
          >
            <TabsList className="w-full grid grid-cols-3 h-10">
              {MODE_TABS.map(tab => {
                const Icon = tab.icon;
                const isLocked = tab.value === 'promptdj' && !isPro;
                return (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className="h-9 gap-1.5 relative"
                    disabled={isLocked}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{tab.label}</span>
                    {isLocked && (
                      <Lock className="h-3 w-3 absolute -top-0.5 -right-0.5 text-muted-foreground" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </SheetHeader>
        
        <ScrollArea className="flex-1 h-[calc(85vh-100px)]">
          <div className="p-4">
            <AnimatePresence mode="wait">
              {/* === RECORDING MODE === */}
              {musicLab.mode === 'record' && (
                <motion.div
                  key="record"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {/* Permission warning */}
                  {musicLab.hasPermission === false && (
                    <Card className="border-destructive/50 bg-destructive/10">
                      <CardContent className="p-4 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-destructive">Нет доступа к микрофону</p>
                          <p className="text-muted-foreground">Разрешите в настройках браузера</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Recording type selection (when not recording) */}
                  {!musicLab.isRecording && !musicLab.isUploading && (
                    <>
                      <p className="text-sm text-muted-foreground text-center">
                        Выберите тип записи
                      </p>
                      
                      {RECORDING_OPTIONS.map(option => {
                        const Icon = option.icon;
                        const isSelected = musicLab.recordingType === option.type;
                        
                        return (
                          <Card
                            key={option.type}
                            className={cn(
                              'cursor-pointer transition-all active:scale-[0.98]',
                              isSelected && 'ring-2 ring-primary'
                            )}
                            onClick={() => musicLab.setRecordingType(option.type)}
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
                              {isSelected && (
                                <Badge variant="default" className="shrink-0">
                                  Выбрано
                                </Badge>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                      
                      {/* Start recording button */}
                      <Button
                        size="lg"
                        className="w-full h-14 gap-2"
                        onClick={handleRecordToggle}
                        disabled={musicLab.hasPermission === false}
                      >
                        <CircleDot className="h-5 w-5" />
                        Начать запись
                      </Button>
                    </>
                  )}
                  
                  {/* Active recording */}
                  {musicLab.isRecording && (
                    <div className="space-y-6">
                      {/* Duration & type */}
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-3 h-3 rounded-full bg-red-500"
                          />
                          <span className="text-4xl font-mono font-bold tabular-nums">
                            {formatDuration(musicLab.recordingDuration)}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {RECORDING_OPTIONS.find(o => o.type === musicLab.recordingType)?.label}
                        </Badge>
                      </div>
                      
                      {/* Audio level visualization */}
                      <div className="flex items-center justify-center gap-1 h-20">
                        {Array.from({ length: barCount }).map((_, i) => {
                          const threshold = i / barCount;
                          const isActive = musicLab.audioLevel > threshold;
                          return (
                            <motion.div
                              key={i}
                              className={cn(
                                'w-2 rounded-full transition-colors',
                                isActive ? 'bg-primary' : 'bg-muted'
                              )}
                              animate={{
                                height: isActive 
                                  ? 30 + Math.random() * 50
                                  : 8,
                              }}
                              transition={{ duration: 0.05 }}
                            />
                          );
                        })}
                      </div>
                      
                      {/* Current chord (for guitar) */}
                      {musicLab.recordingType === 'guitar' && musicLab.chordDetection.currentChord && (
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-3xl font-bold font-mono">
                              {musicLab.chordDetection.currentChord.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {musicLab.chordDetection.currentChord.quality}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* Stop/Cancel buttons */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1 h-14"
                          onClick={musicLab.cancelRecording}
                        >
                          <X className="h-5 w-5 mr-2" />
                          Отмена
                        </Button>
                        <Button
                          variant="destructive"
                          size="lg"
                          className="flex-1 h-14"
                          onClick={handleRecordToggle}
                        >
                          <Square className="h-5 w-5 mr-2" />
                          Стоп
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Uploading state */}
                  {musicLab.isUploading && (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                      <p className="text-sm text-muted-foreground">Сохранение записи...</p>
                    </div>
                  )}
                  
                  {/* Session recordings */}
                  {musicLab.sessionRecordings.length > 0 && !musicLab.isRecording && !musicLab.isUploading && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-3">Записи сессии</h4>
                        <div className="space-y-2">
                          {musicLab.sessionRecordings.map(track => (
                            <div
                              key={track.id}
                              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                            >
                              <span className={cn(
                                'w-9 h-9 rounded-lg flex items-center justify-center',
                                RECORDING_OPTIONS.find(o => o.type === track.type)?.color
                              )}>
                                {track.type === 'vocal' && <Mic className="h-4 w-4" />}
                                {track.type === 'guitar' && <Guitar className="h-4 w-4" />}
                                {track.type === 'instrument' && <Music2 className="h-4 w-4" />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{track.name}</p>
                                {track.chords && track.chords.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {track.chords.length} аккордов
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => musicLab.removeSessionRecording(track.id)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
              
              {/* === CHORD DETECTION MODE === */}
              {musicLab.mode === 'chords' && (
                <motion.div
                  key="chords"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {/* Current chord display */}
                  <Card>
                    <CardContent className="p-6 text-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={musicLab.chordDetection.currentChord?.name || 'none'}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="mb-4"
                        >
                          <span className="text-6xl font-bold font-mono">
                            {musicLab.chordDetection.currentChord?.name || '—'}
                          </span>
                        </motion.div>
                      </AnimatePresence>
                      
                      {musicLab.chordDetection.currentChord && (
                        <p className="text-sm text-muted-foreground">
                          {musicLab.chordDetection.currentChord.quality} • 
                          Точность: {Math.round(musicLab.chordDetection.currentChord.confidence * 100)}%
                        </p>
                      )}
                      
                      {/* Volume indicator */}
                      <div className="mt-4 flex justify-center">
                        <div className="flex gap-0.5 h-8">
                          {Array.from({ length: 20 }).map((_, i) => {
                            const isActive = musicLab.chordDetection.volume > i / 20;
                            return (
                              <motion.div
                                key={i}
                                className={cn(
                                  'w-1.5 rounded-full transition-colors',
                                  isActive ? 'bg-primary' : 'bg-muted'
                                )}
                                animate={{
                                  height: isActive ? 16 + Math.random() * 16 : 8,
                                }}
                                transition={{ duration: 0.05 }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Chord history */}
                  {musicLab.chordDetection.chordHistory.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">История аккордов</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={musicLab.chordDetection.clearHistory}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Очистить
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {musicLab.chordDetection.chordHistory.slice(0, 16).map((chord, i) => (
                            <Badge key={i} variant="secondary" className="font-mono">
                              {chord.name}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 font-mono">
                          {musicLab.chordDetection.exportProgression()}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Control button */}
                  <Button
                    size="lg"
                    variant={musicLab.chordDetection.isListening ? 'destructive' : 'default'}
                    className="w-full h-14 gap-2"
                    onClick={() => {
                      if (musicLab.chordDetection.isListening) {
                        musicLab.chordDetection.stopListening();
                      } else {
                        musicLab.chordDetection.startListening();
                      }
                    }}
                    disabled={musicLab.chordDetection.isInitializing}
                  >
                    {musicLab.chordDetection.isInitializing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Инициализация...
                      </>
                    ) : musicLab.chordDetection.isListening ? (
                      <>
                        <Square className="h-5 w-5" />
                        Остановить
                      </>
                    ) : (
                      <>
                        <Guitar className="h-5 w-5" />
                        Начать распознавание
                      </>
                    )}
                  </Button>
                  
                  {musicLab.chordDetection.error && (
                    <p className="text-sm text-destructive text-center">
                      {musicLab.chordDetection.error}
                    </p>
                  )}
                </motion.div>
              )}
              
              {/* === PROMPTDJ MODE === */}
              {musicLab.mode === 'promptdj' && (
                <motion.div
                  key="promptdj"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {!isPro ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h4 className="font-semibold mb-2">PromptDJ — PRO функция</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Создавайте музыку с AI DJ интерфейсом. Миксуйте стили и генерируйте уникальные треки.
                        </p>
                        <Button>Получить PRO</Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Current prompt preview */}
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Текущий промпт
                          </h4>
                          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 font-mono">
                            {musicLab.promptDJ.currentPrompt || 'Настройте каналы для генерации'}
                          </p>
                        </CardContent>
                      </Card>
                      
                      {/* Global settings */}
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <h4 className="font-medium">Настройки</h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">BPM</span>
                              <span className="text-sm font-mono">{musicLab.promptDJ.globalSettings.bpm}</span>
                            </div>
                            <Slider
                              value={[musicLab.promptDJ.globalSettings.bpm]}
                              onValueChange={([v]) => musicLab.promptDJ.updateGlobalSettings({ bpm: v })}
                              min={60}
                              max={180}
                              step={1}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Плотность</span>
                              <span className="text-sm font-mono">
                                {Math.round(musicLab.promptDJ.globalSettings.density * 100)}%
                              </span>
                            </div>
                            <Slider
                              value={[musicLab.promptDJ.globalSettings.density]}
                              onValueChange={([v]) => musicLab.promptDJ.updateGlobalSettings({ density: v })}
                              min={0}
                              max={1}
                              step={0.1}
                            />
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Яркость</span>
                              <span className="text-sm font-mono">
                                {Math.round(musicLab.promptDJ.globalSettings.brightness * 100)}%
                              </span>
                            </div>
                            <Slider
                              value={[musicLab.promptDJ.globalSettings.brightness]}
                              onValueChange={([v]) => musicLab.promptDJ.updateGlobalSettings({ brightness: v })}
                              min={0}
                              max={1}
                              step={0.1}
                            />
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Channels */}
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <h4 className="font-medium">Каналы</h4>
                          {musicLab.promptDJ.channels.filter(c => c.enabled).map(channel => (
                            <div key={channel.id} className="flex items-center gap-3">
                              <Badge variant="outline" className="capitalize min-w-[80px] justify-center">
                                {channel.type}
                              </Badge>
                              <span className="flex-1 text-sm truncate">{channel.value}</span>
                              <span className="text-xs text-muted-foreground font-mono">
                                x{channel.weight.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                      
                      {/* Preview and generate buttons */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1 h-14"
                          onClick={() => {
                            if (musicLab.promptDJ.isPreviewPlaying) {
                              musicLab.promptDJ.stopPreview();
                            } else {
                              musicLab.promptDJ.previewPrompt();
                            }
                          }}
                        >
                          {musicLab.promptDJ.isPreviewPlaying ? (
                            <>
                              <Square className="h-5 w-5 mr-2" />
                              Стоп
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-5 w-5 mr-2" />
                              Превью
                            </>
                          )}
                        </Button>
                        <Button
                          size="lg"
                          className="flex-1 h-14"
                          onClick={musicLab.promptDJ.generateMusic}
                          disabled={musicLab.promptDJ.isGenerating}
                        >
                          {musicLab.promptDJ.isGenerating ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Генерация...
                            </>
                          ) : (
                            <>
                              <Radio className="h-5 w-5 mr-2" />
                              Сгенерировать
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* Generated tracks */}
                      {musicLab.promptDJ.generatedTracks.length > 0 && (
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-3">Сгенерированные треки</h4>
                            <div className="space-y-2">
                              {musicLab.promptDJ.generatedTracks.map(track => (
                                <div
                                  key={track.id}
                                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 shrink-0"
                                    onClick={() => {
                                      if (musicLab.promptDJ.currentTrack?.id === track.id && musicLab.promptDJ.isPlaying) {
                                        musicLab.promptDJ.stopPlayback();
                                      } else {
                                        musicLab.promptDJ.playTrack(track);
                                      }
                                    }}
                                  >
                                    {musicLab.promptDJ.currentTrack?.id === track.id && musicLab.promptDJ.isPlaying ? (
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
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => musicLab.promptDJ.removeTrack(track.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                  </Button>
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
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});
