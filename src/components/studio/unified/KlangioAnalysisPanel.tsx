/**
 * KlangioAnalysisPanel - Inline Klangio AI tools for the studio
 * 
 * Provides chord detection, beat tracking, and saves results to the database
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Music,
  Drum,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Save,
} from 'lucide-react';
import { useKlangioAnalysis, ChordResult, BeatResult } from '@/hooks/useKlangioAnalysis';
import { useKlangioSaveAnalysis } from '@/hooks/useKlangioSaveAnalysis';
import { ChordProgressionDisplay } from '@/components/analysis/ChordProgressionDisplay';
import { cn } from '@/lib/utils';

interface KlangioAnalysisPanelProps {
  trackId: string;
  audioUrl: string | null;
  duration: number;
  currentTime: number;
  onChordsDetected?: (chords: ChordResult) => void;
  onBeatsDetected?: (beats: BeatResult) => void;
}

export const KlangioAnalysisPanel = memo(function KlangioAnalysisPanel({
  trackId,
  audioUrl,
  duration,
  currentTime,
  onChordsDetected,
  onBeatsDetected,
}: KlangioAnalysisPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [extendedChords, setExtendedChords] = useState(true);
  
  const {
    chords,
    beats,
    detectChords,
    detectBeats,
    resetChords,
    resetBeats,
  } = useKlangioAnalysis();

  const { saveAnalysis, isSaving } = useKlangioSaveAnalysis();

  const handleDetectChords = useCallback(async () => {
    if (!audioUrl) return;
    const result = await detectChords(audioUrl, extendedChords);
    if (result) {
      onChordsDetected?.(result);
    }
  }, [audioUrl, extendedChords, detectChords, onChordsDetected]);

  const handleDetectBeats = useCallback(async () => {
    if (!audioUrl) return;
    const result = await detectBeats(audioUrl);
    if (result) {
      onBeatsDetected?.(result);
    }
  }, [audioUrl, detectBeats, onBeatsDetected]);

  const handleSaveAll = useCallback(async () => {
    await saveAnalysis({
      trackId,
      analysisType: 'full',
      chords: chords.result,
      beats: beats.result,
    });
  }, [trackId, chords.result, beats.result, saveAnalysis]);

  const hasSaveableResults = chords.status === 'completed' || beats.status === 'completed';
  const isLoading = chords.status === 'processing' || chords.status === 'pending' ||
                    beats.status === 'processing' || beats.status === 'pending';

  if (!audioUrl) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-3 px-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium">AI Анализ</CardTitle>
                {(chords.status === 'completed' || beats.status === 'completed') && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Готово
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-4">
            {/* Chord Detection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Аккорды</span>
                  {chords.status === 'completed' && (
                    <Badge variant="outline" className="text-xs">
                      {chords.result?.chords?.length || 0} найдено
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Расширенные</Label>
                  <Switch
                    checked={extendedChords}
                    onCheckedChange={setExtendedChords}
                    className="scale-75"
                  />
                </div>
              </div>

              {chords.status === 'processing' || chords.status === 'pending' ? (
                <div className="space-y-1">
                  <Progress value={chords.progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground text-center">
                    {chords.progress}%
                  </p>
                </div>
              ) : chords.status === 'completed' && chords.result?.chords ? (
              <ChordProgressionDisplay
                  chords={chords.result.chords}
                  currentTime={currentTime}
                  duration={duration}
                  showTimeline
                />
              ) : chords.status === 'error' ? (
                <p className="text-xs text-destructive">{chords.error}</p>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDetectChords}
                  disabled={!audioUrl}
                  className="w-full"
                >
                  <Music className="h-3.5 w-3.5 mr-2" />
                  Распознать аккорды
                </Button>
              )}

              {chords.status === 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetChords}
                  className="w-full text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Повторить
                </Button>
              )}
            </div>

            {/* Beat Detection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Drum className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Ритм и BPM</span>
                {beats.status === 'completed' && beats.result?.bpm && (
                  <Badge className="text-xs">{beats.result.bpm} BPM</Badge>
                )}
              </div>

              {beats.status === 'processing' || beats.status === 'pending' ? (
                <div className="space-y-1">
                  <Progress value={beats.progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground text-center">
                    {beats.progress}%
                  </p>
                </div>
              ) : beats.status === 'completed' && beats.result ? (
                <div className="p-2 bg-muted/30 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Темп</span>
                    <span className="font-mono font-medium">{beats.result.bpm || 'Н/Д'} BPM</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Битов</span>
                    <span className="font-mono">{beats.result.beats?.length || 0}</span>
                  </div>
                  {beats.result.time_signature && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Размер</span>
                      <span className="font-mono">{beats.result.time_signature}</span>
                    </div>
                  )}
                </div>
              ) : beats.status === 'error' ? (
                <p className="text-xs text-destructive">{beats.error}</p>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDetectBeats}
                  disabled={!audioUrl}
                  className="w-full"
                >
                  <Drum className="h-3.5 w-3.5 mr-2" />
                  Определить ритм
                </Button>
              )}

              {beats.status === 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetBeats}
                  className="w-full text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Повторить
                </Button>
              )}
            </div>

            {/* Save Button */}
            {hasSaveableResults && (
              <Button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="w-full gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Сохранить анализ
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});
