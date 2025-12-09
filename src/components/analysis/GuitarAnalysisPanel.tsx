import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Music2, 
  Piano, 
  Drum, 
  Guitar, 
  Play, 
  Pause, 
  Download, 
  Copy,
  Sparkles,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { PianoRollPreview } from './PianoRollPreview';
import { BeatGridVisualization } from './BeatGridVisualization';
import { ChordProgressionDisplay } from './ChordProgressionDisplay';
import { GuitarTabVisualization } from './GuitarTabVisualization';
import type { GuitarAnalysisResult } from '@/hooks/useGuitarAnalysis';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GuitarAnalysisPanelProps {
  analysis: GuitarAnalysisResult;
  audioUrl: string;
  onCreateTrack?: () => void;
  className?: string;
}

export function GuitarAnalysisPanel({
  analysis,
  audioUrl,
  onCreateTrack,
  className,
}: GuitarAnalysisPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleCopyTags = () => {
    const tagsText = analysis.generatedTags.join(', ');
    navigator.clipboard.writeText(tagsText);
    toast.success('Теги скопированы');
  };

  const handleDownloadMidi = () => {
    if (analysis.midiUrl) {
      window.open(analysis.midiUrl, '_blank');
      toast.success('Скачивание MIDI...');
    } else {
      toast.error('MIDI файл недоступен');
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <audio ref={audioRef} src={audioUrl} className="hidden" />

      {/* Summary Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Guitar className="w-5 h-5 text-primary" />
              Результат анализа
            </CardTitle>
            <Button
              size="icon"
              variant={isPlaying ? "secondary" : "default"}
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Тональность</p>
              <p className="font-semibold">{analysis.key}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Темп</p>
              <p className="font-semibold">{analysis.bpm} BPM</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Размер</p>
              <p className="font-semibold">{analysis.timeSignature}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Техника</p>
              <p className="font-semibold truncate">
                {analysis.style.technique || 'Определяется'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different visualizations */}
      <Tabs defaultValue="chords" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="chords" className="gap-1">
            <Guitar className="w-4 h-4" />
            <span className="hidden sm:inline">Аккорды</span>
          </TabsTrigger>
          <TabsTrigger value="tab" className="gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">TAB</span>
          </TabsTrigger>
          <TabsTrigger value="beats" className="gap-1">
            <Drum className="w-4 h-4" />
            <span className="hidden sm:inline">Ритм</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1">
            <Piano className="w-4 h-4" />
            <span className="hidden sm:inline">Ноты</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chords" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <ChordProgressionDisplay
                chords={analysis.chords}
                duration={analysis.totalDuration}
                currentTime={currentTime}
                showTimeline
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab" className="mt-4">
          <GuitarTabVisualization
            notes={analysis.notes}
            bpm={analysis.bpm}
          />
        </TabsContent>

        <TabsContent value="beats" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <BeatGridVisualization
                beats={analysis.beats}
                downbeats={analysis.downbeats}
                duration={analysis.totalDuration}
                bpm={analysis.bpm}
                timeSignature={analysis.timeSignature}
                currentTime={currentTime}
                height={80}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <PianoRollPreview
                notes={analysis.notes}
                duration={analysis.totalDuration}
                currentTime={currentTime}
                height={150}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Style Analysis */}
      {analysis.style.fullResponse && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              Анализ стиля
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-24">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {analysis.style.fullResponse}
              </p>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Generated Tags */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Сгенерированные теги
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={handleCopyTags}>
              <Copy className="w-4 h-4 mr-1" />
              Копировать
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {analysis.generatedTags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        {analysis.midiUrl && (
          <Button variant="outline" onClick={handleDownloadMidi} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Скачать MIDI
          </Button>
        )}
        {onCreateTrack && (
          <Button onClick={onCreateTrack} className="flex-1">
            Создать трек
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
