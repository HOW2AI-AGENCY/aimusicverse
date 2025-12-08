import { useState, useCallback, useEffect, useMemo } from 'react';
import { Scissors, Wand2, Loader2, AlertTriangle, Music, FileText, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SectionSelector } from './SectionSelector';
import { useReplaceSectionMutation } from '@/hooks/useReplaceSectionMutation';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useSectionDetection, DetectedSection } from '@/hooks/useSectionDetection';
import { cn } from '@/lib/utils';

interface ReplaceSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  trackLyrics?: string | null;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  taskId?: string | null;
  audioId?: string | null;
}

export function ReplaceSectionDialog({
  open,
  onOpenChange,
  trackId,
  trackTitle,
  trackTags,
  trackLyrics,
  duration,
  currentTime,
  onSeek,
  taskId,
  audioId,
}: ReplaceSectionDialogProps) {
  const [startTime, setStartTime] = useState(duration * 0.2);
  const [endTime, setEndTime] = useState(duration * 0.4);
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState(trackTags || '');
  const [newLyrics, setNewLyrics] = useState('');
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const [showLyricsEditor, setShowLyricsEditor] = useState(false);

  // Fetch timestamped lyrics for section detection
  const { data: lyricsData } = useTimestampedLyrics(taskId || null, audioId || null);
  
  // Detect sections from lyrics
  const detectedSections = useSectionDetection(lyricsData?.alignedWords, duration);

  const replaceMutation = useReplaceSectionMutation();

  const maxDuration = duration * 0.5;
  const sectionDuration = endTime - startTime;
  const isValid = sectionDuration <= maxDuration && sectionDuration > 0;

  // Get selected section
  const selectedSection = useMemo(() => {
    if (selectedSectionIndex !== null && detectedSections[selectedSectionIndex]) {
      return detectedSections[selectedSectionIndex];
    }
    return null;
  }, [selectedSectionIndex, detectedSections]);

  // Update form when section is selected
  useEffect(() => {
    if (selectedSection) {
      setStartTime(selectedSection.startTime);
      setEndTime(selectedSection.endTime);
      setNewLyrics(selectedSection.lyrics);
    }
  }, [selectedSection]);

  const handleSelectionChange = useCallback((start: number, end: number) => {
    setStartTime(start);
    setEndTime(end);
    
    // Find matching section
    const matchingIndex = detectedSections.findIndex(
      section => 
        Math.abs(section.startTime - start) < 0.5 && 
        Math.abs(section.endTime - end) < 0.5
    );
    
    if (matchingIndex !== -1) {
      setSelectedSectionIndex(matchingIndex);
      setNewLyrics(detectedSections[matchingIndex].lyrics);
    } else {
      setSelectedSectionIndex(null);
      // Extract lyrics for custom range
      if (lyricsData?.alignedWords) {
        const wordsInRange = lyricsData.alignedWords.filter(
          w => w.startS >= start && w.endS <= end && !/^\[.*\]$/.test(w.word.trim())
        );
        setNewLyrics(wordsInRange.map(w => w.word.replace('\n', ' ')).join(' ').trim());
      }
    }
  }, [detectedSections, lyricsData]);

  const handleSectionSelect = useCallback((index: number) => {
    const section = detectedSections[index];
    if (section) {
      // Check if section is within allowed duration
      const sectionLen = section.endTime - section.startTime;
      if (sectionLen > maxDuration) {
        // Trim section to max allowed
        setStartTime(section.startTime);
        setEndTime(section.startTime + maxDuration);
      } else {
        setStartTime(section.startTime);
        setEndTime(section.endTime);
      }
      setSelectedSectionIndex(index);
      setNewLyrics(section.lyrics);
    }
  }, [detectedSections, maxDuration]);

  const handleReplace = async () => {
    if (!isValid) return;

    // Build prompt with lyrics if provided
    let finalPrompt = prompt;
    if (newLyrics && newLyrics !== selectedSection?.lyrics) {
      finalPrompt = newLyrics + (prompt ? `\n\n${prompt}` : '');
    }

    await replaceMutation.mutateAsync({
      trackId,
      prompt: finalPrompt || undefined,
      tags: tags || undefined,
      infillStartS: Math.round(startTime * 10) / 10,
      infillEndS: Math.round(endTime * 10) / 10,
    });

    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Section type colors
  const getSectionColor = (type: DetectedSection['type']) => {
    const colors: Record<DetectedSection['type'], string> = {
      'verse': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'chorus': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'bridge': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      'intro': 'bg-green-500/20 text-green-400 border-green-500/30',
      'outro': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      'pre-chorus': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      'hook': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'unknown': 'bg-muted text-muted-foreground border-border',
    };
    return colors[type];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            Заменить секцию трека
          </DialogTitle>
          <DialogDescription>
            Выберите секцию из текста или укажите диапазон вручную
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{trackTitle}</p>
                <p className="text-xs text-muted-foreground">
                  Длительность: {formatTime(duration)}
                </p>
              </div>
            </div>

            {/* Detected Sections from Lyrics */}
            {detectedSections.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Секции из текста песни
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {detectedSections.map((section, idx) => {
                    const isSelected = selectedSectionIndex === idx;
                    const sectionLen = section.endTime - section.startTime;
                    const isTooLong = sectionLen > maxDuration;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSectionSelect(idx)}
                        className={cn(
                          'p-2 rounded-lg border text-left transition-all',
                          'hover:ring-2 hover:ring-primary/50',
                          isSelected && 'ring-2 ring-primary',
                          getSectionColor(section.type)
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium text-sm truncate">
                            {section.label}
                          </span>
                          {isTooLong && (
                            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs opacity-70 mt-0.5">
                          {formatTime(section.startTime)} - {formatTime(section.endTime)}
                        </p>
                        <p className="text-[10px] opacity-50 truncate mt-1">
                          {section.lyrics.slice(0, 40)}...
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section Selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Выберите диапазон для замены
              </Label>
              <SectionSelector
                duration={duration}
                currentTime={currentTime}
                onSelectionChange={handleSelectionChange}
                onSeek={onSeek}
                initialStart={startTime}
                initialEnd={endTime}
              />
            </div>

            {/* Selection Info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Выбрано:</span>
                <Badge variant="outline">
                  {formatTime(startTime)} - {formatTime(endTime)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Длина:</span>
                <Badge 
                  variant={isValid ? 'secondary' : 'destructive'}
                  className={cn(!isValid && 'animate-pulse')}
                >
                  {formatTime(sectionDuration)} / {formatTime(maxDuration)}
                </Badge>
              </div>
            </div>

            {/* Warning for long sections */}
            {!isValid && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-destructive">Секция слишком длинная</p>
                  <p className="text-muted-foreground text-xs">
                    Максимальная длительность — 50% от трека ({formatTime(maxDuration)})
                  </p>
                </div>
              </div>
            )}

            {/* Lyrics Editor */}
            <Collapsible open={showLyricsEditor} onOpenChange={setShowLyricsEditor}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Изменить текст секции
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    showLyricsEditor && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-lyrics" className="text-sm">
                    Новый текст для секции
                  </Label>
                  <Textarea
                    id="new-lyrics"
                    placeholder="Введите новый текст для этой секции..."
                    value={newLyrics}
                    onChange={(e) => setNewLyrics(e.target.value)}
                    className="min-h-[100px] resize-none font-mono text-sm"
                  />
                  {selectedSection && newLyrics !== selectedSection.lyrics && (
                    <p className="text-xs text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Текст изменён от оригинала
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">
                Описание новой секции
                <span className="text-muted-foreground font-normal ml-1">(опционально)</span>
              </Label>
              <Textarea
                id="prompt"
                placeholder="Опишите стиль новой секции... Например: более энергичный, с электро-гитарой, агрессивный вокал..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Tags Input */}
            <div className="space-y-2">
              <Label htmlFor="tags">Стиль музыки</Label>
              <Input
                id="tags"
                placeholder="rock, guitar, energetic..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              {trackTags && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Оригинал:</span>
                  <Badge variant="secondary" className="text-xs truncate max-w-[300px]">
                    {trackTags}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={replaceMutation.isPending}
          >
            Отмена
          </Button>
          <Button
            onClick={handleReplace}
            disabled={!isValid || replaceMutation.isPending}
            className="gap-2"
          >
            {replaceMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Запуск...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Заменить секцию
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
