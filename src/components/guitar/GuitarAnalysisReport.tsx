import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Play, Pause, Copy, Sparkles, ArrowRight, FileText,
  Music2, Gauge, Key, Clock,
  Guitar, Piano, Drum, ArrowUpDown, ChevronDown,
  ChevronUp, Save, MicVocal
} from 'lucide-react';
import { ChordDiagramUnified as ChordDiagram } from './ChordDiagramUnified';
import { WaveformWithChords } from './WaveformWithChords';
import { ExportFilesPanel } from './ExportFilesPanel';
import { PianoRollPreview } from '@/components/analysis/PianoRollPreview';
import { BeatGridVisualization } from '@/components/analysis/BeatGridVisualization';
import { GuitarTabVisualization } from '@/components/analysis/GuitarTabVisualization';
import { StrummingPatternVisualization } from '@/components/analysis/StrummingPatternVisualization';
import { AddVocalsToGuitarDialog } from './AddVocalsToGuitarDialog';
import type { GuitarAnalysisResult } from '@/hooks/useGuitarAnalysis';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from '@/lib/motion';
import { formatDuration } from '@/lib/player-utils';

interface GuitarAnalysisReportProps {
  analysis: GuitarAnalysisResult;
  audioUrl: string;
  onCreateTrack?: () => void;
  onSave?: () => void;
  className?: string;
}

export function GuitarAnalysisReport({
  analysis,
  audioUrl,
  onCreateTrack,
  onSave,
  className,
}: GuitarAnalysisReportProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showAllChords, setShowAllChords] = useState(false);
  const [addVocalsOpen, setAddVocalsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
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
    navigator.clipboard.writeText(analysis.generatedTags.join(', '));
    toast.success('Теги скопированы');
  };

  const uniqueChords = [...new Set(analysis.chords.map(c => c.chord))];
  const displayedChords = showAllChords ? uniqueChords : uniqueChords.slice(0, 6);


  return (
    <div className={cn("space-y-4", className)}>
      <audio ref={audioRef} src={audioUrl} className="hidden" />

      {/* Hero Section with Waveform */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
          <CardContent className="p-4 sm:p-6">
            {/* Header Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatCard
                icon={<Key className="w-4 h-4" />}
                label="Тональность"
                value={analysis.key}
                color="text-purple-400"
              />
              <StatCard
                icon={<Gauge className="w-4 h-4" />}
                label="Темп"
                value={`${analysis.bpm} BPM`}
                color="text-blue-400"
              />
              <StatCard
                icon={<Clock className="w-4 h-4" />}
                label="Размер"
                value={analysis.timeSignature}
                color="text-green-400"
              />
              <StatCard
                icon={<Guitar className="w-4 h-4" />}
                label="Техника"
                value={analysis.style.technique || 'Определяется'}
                color="text-orange-400"
              />
            </div>

            {/* Waveform Visualization */}
            {analysis.chords.length > 0 ? (
              <WaveformWithChords
                audioUrl={audioUrl}
                chords={analysis.chords}
                duration={analysis.totalDuration}
                className="border-0 bg-transparent p-0"
              />
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                <Button
                  size="icon"
                  variant={isPlaying ? "secondary" : "default"}
                  onClick={togglePlayback}
                  className="h-12 w-12 rounded-full shrink-0"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(currentTime / analysis.totalDuration) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDuration(currentTime)} / {formatDuration(analysis.totalDuration)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Chord Diagrams Section */}
      {uniqueChords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Guitar className="w-4 h-4 text-primary" />
                  Аккорды ({uniqueChords.length})
                </h3>
                {uniqueChords.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllChords(!showAllChords)}
                    className="h-7 text-xs"
                  >
                    {showAllChords ? (
                      <>Свернуть <ChevronUp className="w-3 h-3 ml-1" /></>
                    ) : (
                      <>Все ({uniqueChords.length}) <ChevronDown className="w-3 h-3 ml-1" /></>
                    )}
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center">
                <AnimatePresence>
                  {displayedChords.map((chord, i) => (
                    <motion.div
                      key={chord}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ChordDiagram chord={chord} size="md" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Chord Progression Text */}
              <Separator className="my-3" />
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-muted-foreground shrink-0">Прогрессия:</span>
                <p className="text-sm font-mono text-primary">
                  {uniqueChords.join(' → ')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Detailed Analysis Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Tabs defaultValue="tab" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-10">
            <TabsTrigger value="tab" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Табулатура</span>
              <span className="sm:hidden">TAB</span>
            </TabsTrigger>
            <TabsTrigger value="strum" className="gap-1.5 text-xs sm:text-sm">
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">Паттерн</span>
              <span className="sm:hidden">Бой</span>
            </TabsTrigger>
            <TabsTrigger value="beats" className="gap-1.5 text-xs sm:text-sm">
              <Drum className="w-4 h-4" />
              <span className="hidden sm:inline">Ритм</span>
              <span className="sm:hidden">Ритм</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5 text-xs sm:text-sm">
              <Piano className="w-4 h-4" />
              <span className="hidden sm:inline">Ноты</span>
              <span className="sm:hidden">Ноты</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tab" className="mt-3">
            <GuitarTabVisualization notes={analysis.notes} bpm={analysis.bpm} />
          </TabsContent>

          <TabsContent value="strum" className="mt-3">
            <Card>
              <CardContent className="p-4">
                <StrummingPatternVisualization 
                  strumming={analysis.strumming || []} 
                  bpm={analysis.bpm} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="beats" className="mt-3">
            <Card>
              <CardContent className="p-4">
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

          <TabsContent value="notes" className="mt-3">
            <PianoRollPreview
              notes={analysis.notes}
              duration={analysis.totalDuration}
              currentTime={currentTime}
              height={180}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Style Description */}
      {analysis.styleDescription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-muted/50 to-background">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Music2 className="w-4 h-4 text-primary" />
                Описание стиля
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.styleDescription}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Generated Tags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Теги для генерации
              </h3>
              <Button size="sm" variant="ghost" onClick={handleCopyTags} className="h-7 text-xs">
                <Copy className="w-3 h-3 mr-1" />
                Копировать
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {analysis.generatedTags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export & Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardContent className="p-4">
            <ExportFilesPanel
              transcriptionFiles={analysis.transcriptionFiles}
              midiUrl={analysis.midiUrl}
            />

            <Separator className="my-4" />

            <div className="flex flex-col gap-2">
              {/* Add Vocals Button - NEW */}
              <Button 
                variant="outline" 
                onClick={() => setAddVocalsOpen(true)} 
                className="w-full gap-2 bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-rose-500/30 hover:border-rose-500/50"
              >
                <MicVocal className="w-4 h-4 text-rose-400" />
                Добавить вокал
              </Button>

              <div className="flex gap-2">
                {onSave && (
                  <Button variant="outline" onClick={onSave} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
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
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Vocals Dialog */}
      <AddVocalsToGuitarDialog
        open={addVocalsOpen}
        onOpenChange={setAddVocalsOpen}
        audioUrl={analysis.audioUrl || audioUrl}
        suggestedStyle={analysis.styleDescription}
        suggestedTags={analysis.generatedTags}
      />
    </div>
  );
}

// Helper Components
function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-background/60 backdrop-blur border border-border/50">
      <div className={cn("flex items-center gap-1.5 mb-1", color)}>
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-semibold text-sm truncate">{value}</p>
    </div>
  );
}
