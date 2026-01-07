/**
 * RecordTrackDrawer - Recording interface for studio
 * 
 * Mobile-optimized with:
 * - 64px record button
 * - Adaptive visualization (12 bars mobile, 20 desktop)
 * - Touch-friendly type selection (44px+)
 * - Clear hints for each recording type
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useHaptic } from '@/hooks/useHaptic';
import { useRealtimeChordDetection } from '@/hooks/useRealtimeChordDetection';
import { useHintTracking } from '@/hooks/useHintTracking';
import { ChordDiagram } from '@/components/guitar/ChordDiagram';
import {
  Mic, Guitar, Music2, Square, Loader2,
  CircleDot, AlertCircle, Info
} from 'lucide-react';

export type RecordingType = 'vocal' | 'guitar' | 'instrument';

interface RecordedTrack {
  id: string;
  audioUrl: string;
  type: RecordingType;
  duration: number;
  name: string;
  chords?: Array<{ chord: string; time: number }>;
}

interface RecordTrackDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onRecordingComplete?: (track: RecordedTrack) => void;
}

const TYPE_CONFIG = {
  vocal: {
    icon: Mic,
    label: 'Вокал',
    description: 'Пение, речь, напевание',
    hint: 'Используйте наушники для лучшего качества',
    color: 'text-red-400',
    bg: 'bg-red-500/20',
  },
  guitar: {
    icon: Guitar,
    label: 'Гитара',
    description: 'Акустика или электро',
    hint: 'Аккорды распознаются автоматически',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
  },
  instrument: {
    icon: Music2,
    label: 'Инструмент',
    description: 'Клавиши, духовые, другие',
    hint: 'Подключите к аудиоинтерфейсу',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
  },
} as const;

export const RecordTrackDrawer = memo(function RecordTrackDrawer({
  open,
  onOpenChange,
  projectId,
  onRecordingComplete,
}: RecordTrackDrawerProps) {
  const { user } = useAuth();
  const { patterns } = useHaptic();
  
  // First-time hint
  const { hasSeenHint, markAsSeen } = useHintTracking('guitar-chords');
  
  // Recording state
  const [recordingType, setRecordingType] = useState<RecordingType>('vocal');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelAnimationRef = useRef<number | null>(null);
  const detectedChordsRef = useRef<Array<{ chord: string; time: number }>>([]);
  
  // Chord detection for guitar mode
  const chordDetection = useRealtimeChordDetection({
    onChordChange: (chord) => {
      if (isRecording && recordingType === 'guitar') {
        markAsSeen();
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        detectedChordsRef.current.push({
          chord: chord.name,
          time: elapsed,
        });
      }
    },
    minConfidence: 0.5,
    stabilityFrames: 2,
  });
  
  // Telegram safe area
  const safeAreaTop = `calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.5rem, env(safe-area-inset-top, 0px) + 0.5rem))`;
  const safeAreaBottom = `calc(max(var(--tg-safe-area-inset-bottom, 0px) + 1rem, env(safe-area-inset-bottom, 0px) + 1rem))`;
  
  // Audio level monitoring
  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(1, average / 128);
        setAudioLevel(normalized);
        
        levelAnimationRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (error) {
      console.error('Audio level monitoring failed:', error);
    }
  }, []);
  
  const stopAudioLevelMonitoring = useCallback(() => {
    if (levelAnimationRef.current) {
      cancelAnimationFrame(levelAnimationRef.current);
      levelAnimationRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);
  
  // Request microphone permission on mount
  useEffect(() => {
    if (open && hasPermission === null) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach(track => track.stop());
          setHasPermission(true);
        })
        .catch(() => {
          setHasPermission(false);
        });
    }
  }, [open, hasPermission]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      stopAudioLevelMonitoring();
      if (recordingType === 'guitar') {
        chordDetection.stopListening();
      }
    };
  }, [recordingType, chordDetection, stopAudioLevelMonitoring]);
  
  // Start recording
  const startRecording = useCallback(async () => {
    try {
      patterns.select();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: recordingType === 'vocal',
          noiseSuppression: recordingType === 'vocal',
          autoGainControl: false,
        },
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      detectedChordsRef.current = [];
      
      // Start audio level monitoring
      startAudioLevelMonitoring(stream);
      
      // Start chord detection for guitar
      if (recordingType === 'guitar') {
        chordDetection.startListening();
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Не удалось начать запись');
      patterns.error();
    }
  }, [recordingType, patterns, startAudioLevelMonitoring, chordDetection]);
  
  // Stop recording and upload
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    patterns.tap();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    stopAudioLevelMonitoring();
    
    if (recordingType === 'guitar') {
      chordDetection.stopListening();
    }
    
    setIsRecording(false);
    
    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      
      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size < 1000) {
          toast.error('Запись слишком короткая');
          resolve();
          return;
        }
        
        setIsUploading(true);
        
        try {
          const fileName = `${user?.id}/${Date.now()}-${recordingType}.webm`;
          
          const { error: uploadError } = await supabase.storage
            .from('reference-audio')
            .upload(fileName, audioBlob, {
              contentType: 'audio/webm',
              upsert: false,
            });
          
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage
            .from('reference-audio')
            .getPublicUrl(fileName);
          
          const audioUrl = urlData.publicUrl;
          const duration = recordingDuration;
          
          const typeLabels: Record<RecordingType, string> = {
            vocal: 'Вокал',
            guitar: 'Гитара',
            instrument: 'Инструмент',
          };
          
          const track: RecordedTrack = {
            id: crypto.randomUUID(),
            audioUrl,
            type: recordingType,
            duration,
            name: `${typeLabels[recordingType]} (${formatDuration(duration)})`,
            chords: recordingType === 'guitar' ? detectedChordsRef.current : undefined,
          };
          
          patterns.success();
          toast.success('Запись сохранена');
          
          onRecordingComplete?.(track);
          onOpenChange(false);
          
        } catch (error) {
          console.error('Upload failed:', error);
          toast.error('Ошибка загрузки записи');
          patterns.error();
        } finally {
          setIsUploading(false);
        }
        
        resolve();
      };
      
      recorder.stop();
    });
  }, [
    isRecording, recordingType, recordingDuration, user?.id,
    patterns, stopAudioLevelMonitoring, chordDetection, onRecordingComplete, onOpenChange
  ]);
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Adaptive bar count - 12 on mobile, 16 on tablet, 20 on desktop
  const barCount = typeof window !== 'undefined' && window.innerWidth < 640 ? 12 : 20;
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent 
        className="max-h-[90vh]"
        style={{ paddingBottom: safeAreaBottom }}
      >
        <div style={{ paddingTop: safeAreaTop }}>
          <DrawerHeader className="text-center pb-3">
            <DrawerTitle className="flex items-center justify-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Запись в проект
            </DrawerTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Запишите аудио напрямую в студийный проект
            </p>
          </DrawerHeader>
          
          <div className="px-4 pb-6 space-y-5">
            {/* Permission check */}
            {hasPermission === false && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Нет доступа к микрофону</p>
                  <p className="text-destructive/70">
                    Разрешите доступ в настройках браузера
                  </p>
                </div>
              </div>
            )}
            
            {/* Recording type selection - touch-friendly */}
            {!isRecording && !isUploading && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Тип записи
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </Label>
                <RadioGroup
                  value={recordingType}
                  onValueChange={(v) => setRecordingType(v as RecordingType)}
                  className="grid grid-cols-3 gap-2"
                >
                  {(Object.keys(TYPE_CONFIG) as RecordingType[]).map((type) => {
                    const config = TYPE_CONFIG[type];
                    const Icon = config.icon;
                    const isSelected = recordingType === type;
                    
                    return (
                      <Label
                        key={type}
                        className={cn(
                          // Touch-friendly - 80px minimum height
                          'flex flex-col items-center gap-2 p-3 min-h-[80px] rounded-xl',
                          'border-2 cursor-pointer transition-all active:scale-[0.98]',
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border/50 hover:border-border bg-card'
                        )}
                      >
                        <RadioGroupItem value={type} className="sr-only" />
                        <span className={cn(
                          // 44px icon container
                          'w-11 h-11 min-w-[44px] min-h-[44px] rounded-full',
                          'flex items-center justify-center',
                          isSelected ? 'bg-primary text-primary-foreground' : config.bg
                        )}>
                          <Icon className={cn('w-5 h-5', !isSelected && config.color)} />
                        </span>
                        <span className="text-xs font-medium text-center">
                          {config.label}
                        </span>
                      </Label>
                    );
                  })}
                </RadioGroup>
                
                {/* Type description */}
                <p className="text-xs text-muted-foreground text-center">
                  {TYPE_CONFIG[recordingType].description}
                </p>
              </div>
            )}
            
            {/* Recording visualization */}
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Duration */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-3 h-3 rounded-full bg-red-500"
                    />
                    <span className="text-3xl font-mono font-bold tabular-nums">
                      {formatDuration(recordingDuration)}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {TYPE_CONFIG[recordingType].label}
                  </Badge>
                </div>
                
                {/* Audio level visualization - adaptive bars */}
                <div className="flex items-center justify-center gap-1 h-16">
                  {Array.from({ length: barCount }).map((_, i) => {
                    const threshold = i / barCount;
                    const isActive = audioLevel > threshold;
                    return (
                      <motion.div
                        key={i}
                        className={cn(
                          'w-2 sm:w-2.5 rounded-full transition-colors',
                          isActive ? 'bg-primary' : 'bg-muted'
                        )}
                        animate={{
                          height: isActive ? `${20 + Math.random() * 40}px` : '8px',
                        }}
                        transition={{ duration: 0.05 }}
                      />
                    );
                  })}
                </div>
                
                {/* Chord display for guitar */}
                {recordingType === 'guitar' && chordDetection.currentChord && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl font-bold text-primary">
                      {chordDetection.currentChord.name}
                    </span>
                    <div className="w-28 h-28 sm:w-32 sm:h-32">
                      <ChordDiagram 
                        chord={chordDetection.currentChord.name}
                        size="sm"
                      />
                    </div>
                  </motion.div>
                )}
                
                {/* First-time guitar hint */}
                {recordingType === 'guitar' && !hasSeenHint && !chordDetection.currentChord && (
                  <p className="text-xs text-center text-muted-foreground animate-pulse">
                    🎸 Играйте — аккорды появятся автоматически
                  </p>
                )}
              </motion.div>
            )}
            
            {/* Uploading state */}
            {isUploading && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium">Сохранение записи...</p>
                  <p className="text-xs text-muted-foreground">Загрузка в облако</p>
                </div>
              </div>
            )}
            
            {/* Record button - 64px for easy touch */}
            {hasPermission !== false && !isUploading && (
              <div className="flex justify-center pt-2">
                {isRecording ? (
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={stopRecording}
                    className="h-16 w-16 min-h-[64px] min-w-[64px] rounded-full shadow-lg"
                    aria-label="Остановить запись"
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={startRecording}
                    className="h-16 w-16 min-h-[64px] min-w-[64px] rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
                    disabled={!hasPermission}
                    aria-label="Начать запись"
                  >
                    <CircleDot className="w-8 h-8" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Tips - more visible */}
            {!isRecording && !isUploading && hasPermission && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg py-2 px-3 inline-block">
                  💡 {TYPE_CONFIG[recordingType].hint}
                </p>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});

RecordTrackDrawer.displayName = 'RecordTrackDrawer';
