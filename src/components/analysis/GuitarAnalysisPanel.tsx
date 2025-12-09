import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  ArrowUpDown,
  FileMusic,
  Waves,
  AlertTriangle,
} from 'lucide-react';
import { PianoRollPreview } from './PianoRollPreview';
import { BeatGridVisualization } from './BeatGridVisualization';
import { ChordProgressionDisplay } from './ChordProgressionDisplay';
import { GuitarTabVisualization } from './GuitarTabVisualization';
import { StrummingPatternVisualization } from './StrummingPatternVisualization';
import { WaveformWithChords } from '@/components/guitar/WaveformWithChords';
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
    const midiUrl = analysis.transcriptionFiles?.midiUrl || analysis.midiUrl;
    if (midiUrl) {
      window.open(midiUrl, '_blank');
      toast.success('Скачивание MIDI...');
    } else {
      toast.error('MIDI файл недоступен');
    }
  };

  const handleDownloadGP5 = () => {
    if (analysis.transcriptionFiles?.gp5Url) {
      window.open(analysis.transcriptionFiles.gp5Url, '_blank');
      toast.success('Скачивание Guitar Pro...');
    } else {
      toast.error('Guitar Pro файл недоступен');
    }
  };

  const handleDownloadPDF = () => {
    if (analysis.transcriptionFiles?.pdfUrl) {
      window.open(analysis.transcriptionFiles.pdfUrl, '_blank');
      toast.success('Скачивание PDF...');
    } else {
      toast.error('PDF файл недоступен');
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

      {/* Waveform with Chords Visualization */}
      {analysis.chords.length > 0 && (
        <WaveformWithChords
          audioUrl={audioUrl}
          chords={analysis.chords}
          duration={analysis.totalDuration}
        />
      )}

      {/* Tabs for different visualizations */}
      <Tabs defaultValue="chords" className="w-full">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="chords" className="gap-1">
            <Guitar className="w-4 h-4" />
            <span className="hidden sm:inline">Аккорды</span>
          </TabsTrigger>
          <TabsTrigger value="tab" className="gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">TAB</span>
          </TabsTrigger>
          <TabsTrigger value="strum" className="gap-1">
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden sm:inline">Бой</span>
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
          {analysis.chords.length > 0 ? (
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
          ) : (
            <Card className="p-6 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Аккорды не обнаружены</p>
              <p className="text-xs text-muted-foreground mt-1">
                Попробуйте записать более длинный фрагмент
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tab" className="mt-4">
          <GuitarTabVisualization
            notes={analysis.notes}
            bpm={analysis.bpm}
          />
        </TabsContent>

        <TabsContent value="strum" className="mt-4">
          <StrummingPatternVisualization
            strumming={analysis.strumming || []}
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
      {analysis.styleDescription && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              Описание стиля
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {analysis.styleDescription}
            </p>
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
      <div className="flex flex-wrap gap-2">
        {(analysis.transcriptionFiles?.midiUrl || analysis.midiUrl) && (
          <Button variant="outline" size="sm" onClick={handleDownloadMidi} className="gap-1.5">
            <Download className="w-4 h-4" />
            MIDI
          </Button>
        )}
        {analysis.transcriptionFiles?.gp5Url && (
          <Button variant="outline" size="sm" onClick={handleDownloadGP5} className="gap-1.5">
            <FileMusic className="w-4 h-4" />
            Guitar Pro
          </Button>
        )}
        {analysis.transcriptionFiles?.pdfUrl && (
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5">
            <FileText className="w-4 h-4" />
            PDF
          </Button>
        )}
        {onCreateTrack && (
          <Button onClick={onCreateTrack} className="flex-1 min-w-32">
            Создать трек
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
