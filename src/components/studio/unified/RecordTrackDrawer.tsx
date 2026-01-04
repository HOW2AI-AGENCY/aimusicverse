/**
 * RecordTrackDrawer - Recording interface for studio
 * 
 * Allows recording vocals, guitar, and other instruments
 * directly into the studio project.
 * 
 * Features:
 * - Real-time audio level visualization
 * - Real-time chord detection for guitar
 * - Recording type selection (vocal, guitar, instrument)
 * - Auto-upload to cloud storage
 * - Add recorded track to project
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
import { ChordDiagram } from '@/components/guitar/ChordDiagram';
import {
  Mic, Guitar, Music2, Square, Loader2,
  CircleDot, AlertCircle
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

export const RecordTrackDrawer = memo(function RecordTrackDrawer({
  open,
  onOpenChange,
  projectId,
  onRecordingComplete,
}: RecordTrackDrawerProps) {
  const { user } = useAuth();
  const { patterns } = useHaptic();
  
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
        // Log chord with timestamp
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
      mediaRecorder.start(1000); // Collect data every second
      
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
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
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop monitoring
    stopAudioLevelMonitoring();
    
    // Stop chord detection
    if (recordingType === 'guitar') {
      chordDetection.stopListening();
    }
    
    setIsRecording(false);
    
    // Stop recorder and get final blob
    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current!;
      
      recorder.onstop = async () => {
        // Stop stream
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
        
        // Upload to storage
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
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('reference-audio')
            .getPublicUrl(fileName);
          
          const audioUrl = urlData.publicUrl;
          const duration = recordingDuration;
          
          // Create track name
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
  
  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Recording type icons
  const typeIcons: Record<RecordingType, React.ReactNode> = {
    vocal: <Mic className="w-5 h-5" />,
    guitar: <Guitar className="w-5 h-5" />,
    instrument: <Music2 className="w-5 h-5" />,
  };
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent 
        className="max-h-[85vh]"
        style={{ paddingBottom: safeAreaBottom }}
      >
        <div style={{ paddingTop: safeAreaTop }}>
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle className="flex items-center justify-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Запись в проект
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 pb-6 space-y-6">
            {/* Permission check */}
            {hasPermission === false && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Нет доступа к микрофону</p>
                  <p className="text-destructive/70">
                    Разрешите доступ в настройках браузера
                  </p>
                </div>
              </div>
            )}
            
            {/* Recording type selection */}
            {!isRecording && !isUploading && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Тип записи</Label>
                <RadioGroup
                  value={recordingType}
                  onValueChange={(v) => setRecordingType(v as RecordingType)}
                  className="grid grid-cols-3 gap-2"
                >
                  {(['vocal', 'guitar', 'instrument'] as RecordingType[]).map((type) => (
                    <Label
                      key={type}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        recordingType === type
                          ? 'border-primary bg-primary/10'
                          : 'border-border/50 hover:border-border'
                      )}
                    >
                      <RadioGroupItem value={type} className="sr-only" />
                      <span className={cn(
                        'p-2 rounded-full',
                        recordingType === type ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        {typeIcons[type]}
                      </span>
                      <span className="text-xs font-medium">
                        {type === 'vocal' && 'Вокал'}
                        {type === 'guitar' && 'Гитара'}
                        {type === 'instrument' && 'Инструмент'}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
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
                    <span className="text-3xl font-mono font-bold">
                      {formatDuration(recordingDuration)}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {recordingType === 'vocal' && 'Запись вокала'}
                    {recordingType === 'guitar' && 'Запись гитары'}
                    {recordingType === 'instrument' && 'Запись инструмента'}
                  </Badge>
                </div>
                
                {/* Audio level visualization */}
                <div className="flex items-center justify-center gap-1 h-16">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const threshold = i / 20;
                    const isActive = audioLevel > threshold;
                    return (
                      <motion.div
                        key={i}
                        className={cn(
                          'w-2 rounded-full transition-all',
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
                    <div className="w-32 h-32">
                      <ChordDiagram 
                        chord={chordDetection.currentChord.name}
                        size="sm"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {/* Uploading state */}
            {isUploading && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Сохранение записи...</p>
              </div>
            )}
            
            {/* Record button */}
            {hasPermission !== false && !isUploading && (
              <div className="flex justify-center pt-4">
                {isRecording ? (
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={stopRecording}
                    className="h-16 w-16 rounded-full"
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={startRecording}
                    className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white"
                    disabled={!hasPermission}
                  >
                    <CircleDot className="w-8 h-8" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Tips */}
            {!isRecording && !isUploading && (
              <div className="text-center text-xs text-muted-foreground">
                {recordingType === 'guitar' && (
                  <p>Аккорды будут распознаны автоматически</p>
                )}
                {recordingType === 'vocal' && (
                  <p>Используйте наушники для лучшего качества</p>
                )}
                {recordingType === 'instrument' && (
                  <p>Подключите инструмент к аудиоинтерфейсу</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
});

RecordTrackDrawer.displayName = 'RecordTrackDrawer';
