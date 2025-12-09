/**
 * MelodyMixer - DJ-style interface for creative melody creation
 * Blend musical styles to generate audio references for generation
 */

import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  Mic,
  Download,
  Sparkles,
  Settings,
  Volume2,
  Music,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { StyleKnob } from './StyleKnob';
import { useMelodyMixer } from '@/hooks/useMelodyMixer';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface MelodyMixerProps {
  onUseAsReference?: (audioUrl: string, prompt: string) => void;
  className?: string;
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALES = [
  { value: 'major', label: 'Мажор' },
  { value: 'minor', label: 'Минор' },
  { value: 'pentatonic', label: 'Пентатоника' },
  { value: 'blues', label: 'Блюз' },
];

export const MelodyMixer = memo(function MelodyMixer({
  onUseAsReference,
  className,
}: MelodyMixerProps) {
  const haptic = useHapticFeedback();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const mixer = useMelodyMixer({
    onRecordingComplete: (url) => {
      // Recording completed
    },
  });

  // Initialize on first interaction
  const handleInitialize = async () => {
    if (!isInitialized) {
      await mixer.initialize();
      setIsInitialized(true);
    }
  };

  const handlePlay = async () => {
    await handleInitialize();
    if (mixer.isPlaying) {
      mixer.stopPlaying();
    } else {
      mixer.startPlaying();
    }
  };

  const handleRecord = async () => {
    await handleInitialize();
    if (mixer.isRecording) {
      mixer.stopRecording();
    } else {
      mixer.startRecording();
    }
  };

  const handleUseAsReference = () => {
    if (mixer.recordedAudioUrl) {
      const prompt = mixer.getStylePrompt();
      onUseAsReference?.(mixer.recordedAudioUrl, prompt);
      haptic.success();
    }
  };

  // Calculate background gradient based on active styles
  const activeSlots = mixer.slots.filter(s => s.enabled && s.weight > 0);
  const gradientColors = activeSlots.slice(0, 4).map(s => s.color).join(', ');

  return (
    <div className={cn('relative', className)}>
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-20 blur-3xl pointer-events-none"
        animate={{
          background: gradientColors
            ? `linear-gradient(135deg, ${gradientColors})`
            : 'transparent',
        }}
        transition={{ duration: 1 }}
      />

      <Card className="relative overflow-hidden border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Melody Mixer</CardTitle>
            </div>
            <Sheet open={showSettings} onOpenChange={setShowSettings}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Настройки</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div>
                    <Label>BPM: {mixer.bpm}</Label>
                    <Slider
                      value={[mixer.bpm]}
                      onValueChange={([v]) => mixer.setBpm(v)}
                      min={40}
                      max={240}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Тональность</Label>
                    <Select value={mixer.key} onValueChange={mixer.setKey}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KEYS.map(key => (
                          <SelectItem key={key} value={key}>{key}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Лад</Label>
                    <Select value={mixer.scale} onValueChange={(v) => mixer.setScale(v as any)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCALES.map(scale => (
                          <SelectItem key={scale.value} value={scale.value}>
                            {scale.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Style grid */}
          <div className="grid grid-cols-4 gap-4">
            {mixer.slots.map((slot, index) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <StyleKnob
                  value={slot.weight}
                  color={slot.color}
                  label={slot.name}
                  enabled={slot.enabled}
                  isActive={mixer.isPlaying && slot.enabled && slot.weight > 0}
                  onChange={(v) => mixer.updateSlotWeight(slot.id, v)}
                  onToggle={() => mixer.toggleSlot(slot.id)}
                  onLabelChange={(name) => mixer.updateSlotName(slot.id, name)}
                />
              </motion.div>
            ))}
          </div>

          {/* Master controls */}
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{mixer.key} {mixer.scale}</span>
                </div>
                <Badge variant="outline">
                  {mixer.bpm} BPM
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={mixer.isPlaying ? 'destructive' : 'default'}
              size="lg"
              className="w-20 h-20 rounded-full"
              onClick={handlePlay}
            >
              {mixer.isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>

            <Button
              variant={mixer.isRecording ? 'destructive' : 'outline'}
              size="lg"
              className={cn(
                'w-16 h-16 rounded-full',
                mixer.isRecording && 'animate-pulse'
              )}
              onClick={handleRecord}
            >
              <Mic className="h-6 w-6" />
            </Button>
          </div>

          {/* Recording status */}
          <AnimatePresence>
            {mixer.isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-center gap-2 text-destructive"
              >
                <motion.div
                  className="w-3 h-3 rounded-full bg-destructive"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                <span className="text-sm font-medium">Запись...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recorded audio */}
          <AnimatePresence>
            {mixer.recordedAudioUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="py-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Записано</span>
                    </div>

                    <audio
                      src={mixer.recordedAudioUrl}
                      controls
                      className="w-full h-10"
                    />

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={handleUseAsReference}
                      >
                        <Sparkles className="h-4 w-4" />
                        Использовать
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = mixer.recordedAudioUrl!;
                          a.download = 'melody-mix.webm';
                          a.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={mixer.clearRecording}
                      >
                        Очистить
                      </Button>
                    </div>

                    {/* Style prompt preview */}
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Стиль:</p>
                      <p className="text-sm">{mixer.getStylePrompt() || 'Не задан'}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <p className="text-xs text-muted-foreground text-center">
            Крутите ручки для смешивания стилей • Нажмите на название для вкл/выкл
          </p>
        </CardContent>
      </Card>
    </div>
  );
});
