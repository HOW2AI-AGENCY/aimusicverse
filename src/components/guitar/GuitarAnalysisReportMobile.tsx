import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Copy, Sparkles, ArrowRight, FileText,
  Music2, Gauge, Key, Clock, Save,
  Guitar, Piano, Drum, ArrowUpDown, ChevronDown,
  ChevronUp, Maximize2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ChordDiagramEnhanced } from './ChordDiagramEnhanced';
import { ChordTimelineMobile } from './ChordTimelineMobile';
import { ChordAwarePlayer } from './ChordAwarePlayer';
import { ExportFilesPanel } from './ExportFilesPanel';
import { PianoRollPreview } from '@/components/analysis/PianoRollPreview';
import { BeatGridVisualization } from '@/components/analysis/BeatGridVisualization';
import { GuitarTabVisualization } from '@/components/analysis/GuitarTabVisualization';
import { StrummingPatternVisualization } from '@/components/analysis/StrummingPatternVisualization';
import type { GuitarAnalysisResult } from '@/hooks/useGuitarAnalysis';

interface GuitarAnalysisReportMobileProps {
  analysis: GuitarAnalysisResult;
  audioUrl: string;
  onCreateTrack?: () => void;
  onSave?: () => void;
  className?: string;
}

export function GuitarAnalysisReportMobile({
  analysis,
  audioUrl,
  onCreateTrack,
  onSave,
  className,
}: GuitarAnalysisReportMobileProps) {
  const { tap, selectionChanged } = useHapticFeedback();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [showAllChords, setShowAllChords] = useState(false);
  const [fullscreenView, setFullscreenView] = useState<'piano' | 'tab' | 'fretboard' | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    chords: true,
    analysis: false,
    style: false,
    tags: true,
    export: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    tap();
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCopyTags = () => {
    tap();
    navigator.clipboard.writeText(analysis.generatedTags.join(', '));
    toast.success('Теги скопированы');
  };

  const uniqueChords = [...new Set(analysis.chords.map(c => c.chord))];
  const displayedChords = showAllChords ? uniqueChords : uniqueChords.slice(0, 6);

  return (
    <div className={cn("space-y-3", className)}>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        className="hidden"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />

      {/* Sticky Header Stats */}
      <motion.div
        className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-lg border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid grid-cols-4 gap-2">
          <StatBadge icon={<Key className="w-3.5 h-3.5" />} value={analysis.key} color="text-purple-400" />
          <StatBadge icon={<Gauge className="w-3.5 h-3.5" />} value={`${analysis.bpm}`} color="text-blue-400" />
          <StatBadge icon={<Clock className="w-3.5 h-3.5" />} value={analysis.timeSignature} color="text-green-400" />
          <StatBadge icon={<Guitar className="w-3.5 h-3.5" />} value={analysis.style.technique?.slice(0, 6) || '...'} color="text-orange-400" />
        </div>
      </motion.div>

      {/* Chord Aware Player */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ChordAwarePlayer
          audioUrl={audioUrl}
          chords={analysis.chords}
          duration={analysis.totalDuration}
          onTimeUpdate={setCurrentTime}
        />
      </motion.div>

      {/* Chord Timeline */}
      {analysis.chords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <ChordTimelineMobile
            chords={analysis.chords}
            duration={analysis.totalDuration}
            currentTime={currentTime}
            onSeek={(time) => {
              if (audioRef.current) {
                audioRef.current.currentTime = time;
              }
            }}
          />
        </motion.div>
      )}

      {/* Collapsible Chord Diagrams */}
      {uniqueChords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Collapsible open={expandedSections.chords} onOpenChange={() => toggleSection('chords')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardContent className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Guitar className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Диаграммы аккордов</span>
                    <Badge variant="secondary" className="text-xs">{uniqueChords.length}</Badge>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    expandedSections.chords && "rotate-180"
                  )} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="flex flex-wrap gap-2 justify-center">
                    <AnimatePresence>
                      {displayedChords.map((chord, i) => (
                        <motion.div
                          key={chord}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <ChordDiagramEnhanced 
                            chord={chord} 
                            size="sm"
                            animated
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  {uniqueChords.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        tap();
                        setShowAllChords(!showAllChords);
                      }}
                      className="w-full mt-2 h-8 text-xs"
                    >
                      {showAllChords ? 'Свернуть' : `Показать все (${uniqueChords.length})`}
                    </Button>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </motion.div>
      )}

      {/* Analysis Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Collapsible open={expandedSections.analysis} onOpenChange={() => toggleSection('analysis')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardContent className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Детальный анализ</span>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  expandedSections.analysis && "rotate-180"
                )} />
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-3 pb-3 pt-0">
                <Tabs defaultValue="piano" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 h-9">
                    <TabsTrigger value="piano" className="text-xs gap-1 px-1">
                      <Piano className="w-3 h-3" />
                      Ноты
                    </TabsTrigger>
                    <TabsTrigger value="tab" className="text-xs gap-1 px-1">
                      <FileText className="w-3 h-3" />
                      TAB
                    </TabsTrigger>
                    <TabsTrigger value="strum" className="text-xs gap-1 px-1">
                      <ArrowUpDown className="w-3 h-3" />
                      Бой
                    </TabsTrigger>
                    <TabsTrigger value="beats" className="text-xs gap-1 px-1">
                      <Drum className="w-3 h-3" />
                      Ритм
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="piano" className="mt-2">
                    <div className="relative">
                      <PianoRollPreview
                        notes={analysis.notes}
                        duration={analysis.totalDuration}
                        currentTime={currentTime}
                        height={140}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 h-7 w-7"
                        onClick={() => {
                          tap();
                          setFullscreenView('piano');
                        }}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="tab" className="mt-2">
                    <div className="relative">
                      <GuitarTabVisualization
                        notes={analysis.notes}
                        bpm={analysis.bpm}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 h-7 w-7"
                        onClick={() => {
                          tap();
                          setFullscreenView('tab');
                        }}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="strum" className="mt-2">
                    <StrummingPatternVisualization 
                      strumming={analysis.strumming || []} 
                      bpm={analysis.bpm} 
                    />
                  </TabsContent>

                  <TabsContent value="beats" className="mt-2">
                    <BeatGridVisualization
                      beats={analysis.beats}
                      downbeats={analysis.downbeats}
                      duration={analysis.totalDuration}
                      bpm={analysis.bpm}
                      timeSignature={analysis.timeSignature}
                      currentTime={currentTime}
                      height={60}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>

      {/* Style Description */}
      {analysis.styleDescription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Collapsible open={expandedSections.style} onOpenChange={() => toggleSection('style')}>
            <Card className="bg-gradient-to-r from-muted/30 to-background">
              <CollapsibleTrigger asChild>
                <CardContent className="p-3 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Описание стиля</span>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    expandedSections.style && "rotate-180"
                  )} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-3 pb-3 pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.styleDescription}
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </motion.div>
      )}

      {/* Generated Tags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Теги для генерации</span>
              </div>
              <Button size="sm" variant="ghost" onClick={handleCopyTags} className="h-7 text-xs gap-1">
                <Copy className="w-3 h-3" />
                Копировать
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
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
        transition={{ delay: 0.4 }}
      >
        <Collapsible open={expandedSections.export} onOpenChange={() => toggleSection('export')}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardContent className="p-3 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Экспорт файлов</span>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  expandedSections.export && "rotate-180"
                )} />
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="px-3 pb-3 pt-0">
                <ExportFilesPanel
                  transcriptionFiles={analysis.transcriptionFiles}
                  midiUrl={analysis.midiUrl}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex gap-2 pt-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        {onSave && (
          <Button variant="outline" onClick={onSave} className="flex-1 h-12" size="lg">
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </Button>
        )}
        {onCreateTrack && (
          <Button onClick={onCreateTrack} className="flex-1 h-12" size="lg">
            Создать трек
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </motion.div>

      {/* Fullscreen View Sheet */}
      <Sheet open={fullscreenView !== null} onOpenChange={() => setFullscreenView(null)}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="flex items-center justify-between">
              <span>
                {fullscreenView === 'piano' && 'Piano Roll'}
                {fullscreenView === 'tab' && 'Табулатура'}
                {fullscreenView === 'fretboard' && 'Гриф'}
              </span>
              <Button size="icon" variant="ghost" onClick={() => setFullscreenView(null)}>
                <X className="w-4 h-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(85vh-80px)] px-4 pb-4">
            {fullscreenView === 'piano' && (
              <PianoRollPreview
                notes={analysis.notes}
                duration={analysis.totalDuration}
                currentTime={currentTime}
                height={400}
              />
            )}
            {fullscreenView === 'tab' && (
              <GuitarTabVisualization
                notes={analysis.notes}
                bpm={analysis.bpm}
              />
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Helper component for stat badges
function StatBadge({ 
  icon, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-muted/30">
      <span className={cn("", color)}>{icon}</span>
      <span className="text-xs font-medium truncate max-w-full">{value}</span>
    </div>
  );
}
