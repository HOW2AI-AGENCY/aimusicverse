/**
 * GuitarModeRecorder - Recording with realtime chord detection
 * Shows chords in real-time during microphone recording
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, MicOff, Guitar, Music, Waves, Copy, Check,
  Play, Pause, Trash2, Sparkles
} from 'lucide-react';
import { useRealtimeChordDetection } from '@/hooks/useRealtimeChordDetection';
import { ChordDiagram } from '@/components/guitar/ChordDiagram';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { toast } from 'sonner';

interface GuitarModeRecorderProps {
  onRecordingComplete: (data: {
    audioFile: File;
    audioUrl: string;
    chordProgression: string[];
    styleDescription: string;
  }) => void;
  onCancel: () => void;
}

export function GuitarModeRecorder({ 
  onRecordingComplete, 
  onCancel 
}: GuitarModeRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedProgression, setCopiedProgression] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const {
    currentChord,
    chordHistory,
    chromagram,
    isListening,
    isInitializing,
    volume,
    startListening,
    stopListening,
    clearHistory,
    exportProgression,
  } = useRealtimeChordDetection({
    minConfidence: 0.5,
    stabilityFrames: 2,
    maxHistory: 30,
  });

  // Generate style description from chord progression
  const generateStyleDescription = useCallback(() => {
    if (chordHistory.length === 0) return '';
    
    const uniqueChords = [...new Set(chordHistory.map(c => c.name))];
    const hasMinorChords = uniqueChords.some(c => c.includes('m') && !c.includes('maj'));
    const hasMajorChords = uniqueChords.some(c => !c.includes('m') || c.includes('maj'));
    const has7thChords = uniqueChords.some(c => c.includes('7'));
    const hasSus = uniqueChords.some(c => c.includes('sus'));
    
    const characteristics: string[] = [];
    
    if (hasMinorChords && hasMajorChords) {
      characteristics.push('mixed major/minor tonality');
    } else if (hasMinorChords) {
      characteristics.push('minor key, melancholic');
    } else if (hasMajorChords) {
      characteristics.push('major key, uplifting');
    }
    
    if (has7thChords) {
      characteristics.push('jazzy, sophisticated harmony');
    }
    
    if (hasSus) {
      characteristics.push('suspended chords, atmospheric');
    }
    
    const progression = uniqueChords.slice(0, 4).join(' - ');
    
    return `Acoustic guitar, ${characteristics.join(', ')}. Chord progression: ${progression}`;
  }, [chordHistory]);

  // Start recording with chord detection
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        },
      });
      
      streamRef.current = stream;
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        const file = new File([blob], `guitar-${Date.now()}.${ext}`, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        setRecordedFile(file);
        setRecordedAudioUrl(url);
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingDuration(0);
      clearHistory();
      
      // Start chord detection
      await startListening();
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
      
    } catch (error) {
      toast.error('Не удалось получить доступ к микрофону');
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      stopListening();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Clear recording
  const handleClear = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedFile(null);
    setRecordedAudioUrl(null);
    setRecordingDuration(0);
    clearHistory();
  };

  // Toggle playback
  const handleTogglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Copy progression
  const handleCopyProgression = () => {
    const progression = exportProgression();
    navigator.clipboard.writeText(progression);
    setCopiedProgression(true);
    setTimeout(() => setCopiedProgression(false), 2000);
    toast.success('Прогрессия скопирована');
  };

  // Complete and pass data
  const handleComplete = () => {
    if (recordedFile && recordedAudioUrl) {
      onRecordingComplete({
        audioFile: recordedFile,
        audioUrl: recordedAudioUrl,
        chordProgression: chordHistory.map(c => c.name),
        styleDescription: generateStyleDescription(),
      });
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
      stopListening();
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Note labels for chromagram
  const NOTE_LABELS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  return (
    <div className="space-y-4">
      {/* Recording State */}
      {!recordedAudioUrl ? (
        <div className="space-y-4">
          {/* Main Recording Button */}
          <Card className={cn(
            "p-6 flex flex-col items-center justify-center gap-4 transition-all",
            isRecording && "bg-destructive/10 border-destructive"
          )}>
            <div className="relative">
              <motion.div
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center",
                  isRecording 
                    ? "bg-destructive" 
                    : "bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30"
                )}
                animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {isRecording ? (
                  <MicOff className="w-10 h-10 text-destructive-foreground" />
                ) : (
                  <Guitar className="w-10 h-10 text-primary" />
                )}
              </motion.div>
              
              {/* Recording pulse */}
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-destructive"
                  animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>

            <div className="text-center">
              <h3 className="font-semibold text-lg">
                {isRecording ? (
                  <span className="text-destructive font-mono">
                    {formatDuration(recordingDuration)}
                  </span>
                ) : (
                  'Запись гитары'
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isRecording 
                  ? 'Играйте — аккорды определяются в реальном времени' 
                  : 'Нажмите для начала записи с детектированием аккордов'
                }
              </p>
            </div>

            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isInitializing}
              className="gap-2 min-w-40"
            >
              {isInitializing ? (
                <>Инициализация...</>
              ) : isRecording ? (
                <>
                  <MicOff className="w-5 h-5" />
                  Остановить
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Начать запись
                </>
              )}
            </Button>
          </Card>

          {/* Realtime Chord Display */}
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Current Chord */}
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  {/* Volume Indicator */}
                  <div className="w-2 h-16 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="w-full bg-primary rounded-full"
                      style={{ height: `${volume * 100}%` }}
                      animate={{ height: `${volume * 100}%` }}
                    />
                  </div>
                  
                  {/* Current Chord Display */}
                  <div className="flex-1 text-center">
                    <AnimatePresence mode="wait">
                      {currentChord ? (
                        <motion.div
                          key={currentChord.name}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="space-y-1"
                        >
                          <div className="text-3xl font-bold text-primary">
                            {currentChord.name}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(currentChord.confidence * 100)}% уверенность
                          </Badge>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-muted-foreground"
                        >
                          <Waves className="w-8 h-8 mx-auto animate-pulse" />
                          <p className="text-xs mt-1">Играйте...</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Chord Diagram */}
                  {currentChord && (
                    <ChordDiagram chord={currentChord.name} size="sm" />
                  )}
                </div>
              </Card>

              {/* Chromagram Visualization */}
              <div className="flex gap-0.5 h-8">
                {chromagram.map((value, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="flex-1 w-full bg-muted rounded-sm overflow-hidden">
                      <motion.div
                        className="w-full bg-primary/70 rounded-sm"
                        style={{ height: `${value * 100}%` }}
                        animate={{ height: `${value * 100}%` }}
                        transition={{ duration: 0.05 }}
                      />
                    </div>
                    <span className="text-[8px] text-muted-foreground">{NOTE_LABELS[i]}</span>
                  </div>
                ))}
              </div>

              {/* Chord History */}
              {chordHistory.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {chordHistory.slice(0, 12).map((chord, i) => (
                    <Badge 
                      key={`${chord.name}-${i}`}
                      variant={i === 0 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {chord.name}
                    </Badge>
                  ))}
                  {chordHistory.length > 12 && (
                    <Badge variant="outline" className="text-xs">
                      +{chordHistory.length - 12}
                    </Badge>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      ) : (
        /* Recorded Audio Preview */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Audio Player */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant={isPlaying ? "secondary" : "default"}
                onClick={handleTogglePlayback}
                className="h-12 w-12 rounded-full shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              
              <div className="flex-1">
                <p className="font-medium">Записано</p>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(recordingDuration)} • {chordHistory.length} аккордов
                </p>
              </div>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={handleClear}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <audio
              ref={audioRef}
              src={recordedAudioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </Card>

          {/* Chord Progression */}
          {chordHistory.length > 0 && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Прогрессия аккордов</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyProgression}
                  className="h-7 gap-1 text-xs"
                >
                  {copiedProgression ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedProgression ? 'Скопировано' : 'Копировать'}
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(chordHistory.map(c => c.name))].slice(0, 8).map((chord, i) => (
                  <Badge key={i} variant="secondary">{chord}</Badge>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground">
                {exportProgression()}
              </p>
            </Card>
          )}

          {/* Style Description Preview */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Описание стиля</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {generateStyleDescription() || 'Сыграйте аккорды для генерации описания'}
            </p>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!recordedFile}
              className="flex-1 gap-2"
            >
              <Guitar className="w-4 h-4" />
              Использовать
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
