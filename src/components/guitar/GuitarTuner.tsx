/**
 * GuitarTuner - Real-time guitar tuning tool
 * Detects pitch and shows tuning accuracy
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Music, Mic, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface GuitarTunerProps {
  className?: string;
}

// Standard guitar tuning (E A D G B E)
const STANDARD_TUNING = [
  { note: 'E', frequency: 82.41, string: 6 },
  { note: 'A', frequency: 110.00, string: 5 },
  { note: 'D', frequency: 146.83, string: 4 },
  { note: 'G', frequency: 196.00, string: 3 },
  { note: 'B', frequency: 246.94, string: 2 },
  { note: 'E', frequency: 329.63, string: 1 },
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Calculate frequency to note
const frequencyToNote = (frequency: number) => {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const noteIndex = Math.round(noteNum) + 69;
  const noteName = NOTE_NAMES[noteIndex % 12];
  const octave = Math.floor(noteIndex / 12) - 1;
  const cents = Math.floor((noteNum - Math.round(noteNum)) * 100);
  
  return { noteName, octave, cents, frequency };
};

// Auto-correlation algorithm for pitch detection
const autoCorrelate = (buffer: Float32Array, sampleRate: number): number => {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  // Calculate RMS (Root Mean Square) for volume detection
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);

  // Not enough signal
  if (rms < 0.01) return -1;

  // Find the best correlation offset
  let lastCorrelation = 1;
  for (let offset = 1; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;
    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / MAX_SAMPLES;

    if (correlation > 0.9 && correlation > lastCorrelation) {
      const foundGoodCorrelation = correlation > bestCorrelation;
      if (foundGoodCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }
    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.01) {
    return sampleRate / bestOffset;
  }
  return -1;
};

export function GuitarTuner({ className }: GuitarTunerProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentNote, setCurrentNote] = useState<ReturnType<typeof frequencyToNote> | null>(null);
  const [targetString, setTargetString] = useState<typeof STANDARD_TUNING[0] | null>(null);
  const [cents, setCents] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const detectPitch = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const frequency = autoCorrelate(buffer, audioContextRef.current!.sampleRate);

    if (frequency > 0 && frequency < 1000) {
      const note = frequencyToNote(frequency);
      setCurrentNote(note);

      // Find closest target string
      let closestString = STANDARD_TUNING[0];
      let minDiff = Math.abs(frequency - closestString.frequency);

      for (const tuning of STANDARD_TUNING) {
        const diff = Math.abs(frequency - tuning.frequency);
        if (diff < minDiff) {
          minDiff = diff;
          closestString = tuning;
        }
      }

      setTargetString(closestString);
      setCents(note.cents);
    }

    animationFrameRef.current = requestAnimationFrame(detectPitch);
  }, []);

  const startTuner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      streamRef.current = stream;

      setIsActive(true);
      detectPitch();
    } catch (error) {
      console.error('Microphone access error:', error);
    }
  };

  const stopTuner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setIsActive(false);
    setCurrentNote(null);
    setTargetString(null);
    setCents(0);
  };

  useEffect(() => {
    return () => {
      stopTuner();
    };
  }, []);

  const isTuned = Math.abs(cents) < 5;
  const isClose = Math.abs(cents) < 15;

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Тюнер</h3>
        </div>
        {isActive && (
          <Badge variant="default" className="bg-red-500">
            <Mic className="w-3 h-3 mr-1" />
            Слушаю
          </Badge>
        )}
      </div>

      {/* Standard tuning reference */}
      {!isActive && (
        <div className="grid grid-cols-6 gap-2">
          {STANDARD_TUNING.map(tuning => (
            <Button
              key={tuning.string}
              variant="outline"
              size="sm"
              className="flex flex-col h-auto py-2"
            >
              <span className="text-xs text-muted-foreground">{tuning.string}</span>
              <span className="text-lg font-bold">{tuning.note}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Tuning display */}
      {isActive && (
        <div className="space-y-4">
          {/* Current note */}
          <div className="text-center space-y-2">
            {currentNote ? (
              <>
                <motion.div
                  className="text-6xl font-bold"
                  animate={{ scale: isTuned ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentNote.noteName}
                  <span className="text-3xl text-muted-foreground">
                    {currentNote.octave}
                  </span>
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  {currentNote.frequency.toFixed(2)} Hz
                </p>

                {/* Target string */}
                {targetString && (
                  <Badge variant="outline" className="text-sm">
                    Струна {targetString.string} ({targetString.note})
                  </Badge>
                )}
              </>
            ) : (
              <div className="py-8 text-muted-foreground">
                <Mic className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Сыграйте ноту на гитаре</p>
              </div>
            )}
          </div>

          {/* Tuning indicator */}
          {currentNote && (
            <div className="space-y-2">
              {/* Visual indicator bar */}
              <div className="relative h-16 bg-muted/30 rounded-lg overflow-hidden">
                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />
                
                {/* Tuned zone */}
                <div className="absolute left-1/2 top-0 bottom-0 w-16 bg-green-500/10 -translate-x-1/2" />

                {/* Needle */}
                <motion.div
                  className={cn(
                    'absolute top-0 bottom-0 w-1 rounded-full',
                    isTuned ? 'bg-green-500' : isClose ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ left: '50%' }}
                  animate={{
                    x: `${Math.max(-100, Math.min(100, cents * 2))}px`,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>

              {/* Cents display */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Низкая</span>
                <div className="flex items-center gap-2">
                  {isTuned ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className={cn(
                    'font-mono font-bold text-lg',
                    isTuned ? 'text-green-500' : isClose ? 'text-yellow-500' : 'text-red-500'
                  )}>
                    {cents > 0 ? '+' : ''}{cents} ¢
                  </span>
                </div>
                <span className="text-muted-foreground">Высокая</span>
              </div>

              {/* Status text */}
              <div className="text-center text-sm">
                {isTuned ? (
                  <p className="text-green-500 font-medium">✓ Настроено идеально!</p>
                ) : cents > 0 ? (
                  <p className="text-muted-foreground">
                    ↑ Слишком высоко — ослабьте струну
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    ↓ Слишком низко — подтяните струну
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Control button */}
      <Button
        onClick={isActive ? stopTuner : startTuner}
        variant={isActive ? 'destructive' : 'default'}
        className="w-full"
        size="lg"
      >
        {isActive ? (
          <>
            <Mic className="w-5 h-5 mr-2" />
            Остановить тюнер
          </>
        ) : (
          <>
            <Music className="w-5 h-5 mr-2" />
            Запустить тюнер
          </>
        )}
      </Button>

      {/* Tips */}
      {!isActive && (
        <p className="text-xs text-center text-muted-foreground">
          💡 Настройте гитару перед записью для лучшего результата
        </p>
      )}
    </Card>
  );
}
