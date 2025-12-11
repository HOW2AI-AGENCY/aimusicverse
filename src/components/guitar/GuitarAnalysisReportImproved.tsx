/**
 * Improved GuitarAnalysisReport - Unified responsive component
 * Combines desktop and mobile views with enhanced features
 * - Full responsive design without separate mobile component
 * - Integrated ScoreViewer for PDF/MusicXML viewing
 * - Enhanced chord diagrams with unified component
 * - Better mobile UX with haptic feedback and collapsible sections
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Play,
  Pause,
  Copy,
  Sparkles,
  ArrowRight,
  FileText,
  Music2,
  Gauge,
  Key,
  Clock,
  Save,
  Guitar,
  Piano,
  Drum,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Music,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/useIsMobile';
import { ChordDiagramUnified } from './ChordDiagramUnified';
import { ScoreViewer } from './ScoreViewer';
import { ChordAwarePlayer } from './ChordAwarePlayer';
import { WaveformWithChords } from './WaveformWithChords';
import { ExportFilesPanel } from './ExportFilesPanel';
import { PianoRollPreview } from '@/components/analysis/PianoRollPreview';
import { BeatGridVisualization } from '@/components/analysis/BeatGridVisualization';
import { GuitarTabVisualization } from '@/components/analysis/GuitarTabVisualization';
import { StrummingPatternVisualization } from '@/components/analysis/StrummingPatternVisualization';
import type { GuitarAnalysisResult } from '@/hooks/useGuitarAnalysis';

interface GuitarAnalysisReportImprovedProps {
  analysis: GuitarAnalysisResult;
  audioUrl: string;
  onCreateTrack?: () => void;
  onSave?: () => void;
  className?: string;
}

export function GuitarAnalysisReportImproved({
  analysis,
  audioUrl,
  onCreateTrack,
  onSave,
  className,
}: GuitarAnalysisReportImprovedProps) {
  const isMobile = useIsMobile();
  const { tap, selectionChanged } = useHapticFeedback();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showAllChords, setShowAllChords] = useState(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('tab');
  const [expandedSections, setExpandedSections] = useState({
    chords: true,
    score: false,
    analysis: false,
    style: false,
    tags: true,
    export: false,
  });

  const uniqueChords = [...new Set(analysis.chords.map(c => c.chord))];
  const displayedChords = showAllChords ? uniqueChords : uniqueChords.slice(0, 6);

  // Audio playback handling
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
    tap();
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    tap();
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCopyTags = () => {
    tap();
    navigator.clipboard.writeText(analysis.generatedTags.join(', '));
    toast.success('Теги скопированы');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('space-y-3 sm:space-y-4', className)}>
      <audio
        ref={audioRef}
        src={audioUrl}
        className="hidden"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />

      {/* Sticky Stats Header (Mobile) */}
      {isMobile && (
        <motion.div
          className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-lg border-b"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-4 gap-2">
            <StatBadge icon={<Key className="w-3.5 h-3.5" />} value={analysis.key} color="text-purple-400" />
            <StatBadge icon={<Gauge className="w-3.5 h-3.5" />} value={`${analysis.bpm}`} color="text-blue-400" />
            <StatBadge icon={<Clock className="w-3.5 h-3.5" />} value={analysis.timeSignature} color="text-green-400" />
            <StatBadge
              icon={<Guitar className="w-3.5 h-3.5" />}
              value={analysis.style.technique?.slice(0, 6) || '...'}
              color="text-orange-400"
            />
          </div>
        </motion.div>
      )}

      {/* Hero Section with Player */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
          <CardContent className="p-3 sm:p-6">
            {/* Desktop Stats Grid */}
            {!isMobile && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <StatCard icon={<Key className="w-4 h-4" />} label="Тональность" value={analysis.key} color="text-purple-400" />
                <StatCard icon={<Gauge className="w-4 h-4" />} label="Темп" value={`${analysis.bpm} BPM`} color="text-blue-400" />
                <StatCard icon={<Clock className="w-4 h-4" />} label="Размер" value={analysis.timeSignature} color="text-green-400" />
                <StatCard
                  icon={<Guitar className="w-4 h-4" />}
                  label="Техника"
                  value={analysis.style.technique || 'Определяется'}
                  color="text-orange-400"
                />
              </div>
            )}

            {/* Audio Player */}
            {isMobile && analysis.chords.length > 0 ? (
              <ChordAwarePlayer
                audioUrl={audioUrl}
                chords={analysis.chords}
                duration={analysis.totalDuration}
                onTimeUpdate={setCurrentTime}
              />
            ) : analysis.chords.length > 0 ? (
              <WaveformWithChords
                audioUrl={audioUrl}
                chords={analysis.chords}
                duration={analysis.totalDuration}
                className="border-0 bg-transparent p-0"
              />
            ) : (
              <div className="flex items-center gap-4 p-3 sm:p-4 rounded-xl bg-muted/30">
                <Button
                  size="icon"
                  variant={isPlaying ? 'secondary' : 'default'}
                  onClick={togglePlayback}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
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

      {/* Score Viewer Section - NEW! */}
      {(analysis.transcriptionFiles.pdfUrl || analysis.transcriptionFiles.musicXmlUrl || analysis.transcriptionFiles.gp5Url) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          {isMobile ? (
            <Collapsible open={expandedSections.score} onOpenChange={() => toggleSection('score')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardContent className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Ноты и табулатура</span>
                      <Badge variant="secondary" className="text-xs">PDF</Badge>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.score && 'rotate-180')} />
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3">
                    <ScoreViewer transcriptionFiles={analysis.transcriptionFiles} />
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ) : (
            <ScoreViewer transcriptionFiles={analysis.transcriptionFiles} />
          )}
        </motion.div>
      )}

      {/* Chord Diagrams Section */}
      {uniqueChords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {isMobile ? (
            <Collapsible open={expandedSections.chords} onOpenChange={() => toggleSection('chords')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardContent className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Guitar className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Диаграммы аккордов</span>
                      <Badge variant="secondary" className="text-xs">{uniqueChords.length}</Badge>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.chords && 'rotate-180')} />
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-3 pb-3 pt-0">
                    <ChordDiagramsGrid
                      chords={displayedChords}
                      showAllChords={showAllChords}
                      totalChords={uniqueChords.length}
                      onToggleShowAll={() => {
                        tap();
                        setShowAllChords(!showAllChords);
                      }}
                      isMobile={isMobile}
                    />
                    <Separator className="my-3" />
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <span className="text-xs text-muted-foreground shrink-0">Прогрессия:</span>
                      <p className="text-xs sm:text-sm font-mono text-primary">{uniqueChords.join(' → ')}</p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Guitar className="w-4 h-4 text-primary" />
                    Аккорды ({uniqueChords.length})
                  </h3>
                  {uniqueChords.length > 6 && (
                    <Button variant="ghost" size="sm" onClick={() => setShowAllChords(!showAllChords)} className="h-7 text-xs">
                      {showAllChords ? (
                        <>
                          Свернуть <ChevronUp className="w-3 h-3 ml-1" />
                        </>
                      ) : (
                        <>
                          Все ({uniqueChords.length}) <ChevronDown className="w-3 h-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <ChordDiagramsGrid
                  chords={displayedChords}
                  showAllChords={showAllChords}
                  totalChords={uniqueChords.length}
                  onToggleShowAll={() => setShowAllChords(!showAllChords)}
                  isMobile={isMobile}
                />

                <Separator className="my-3" />
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs text-muted-foreground shrink-0">Прогрессия:</span>
                  <p className="text-sm font-mono text-primary">{uniqueChords.join(' → ')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Analysis Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {isMobile ? (
          <Collapsible open={expandedSections.analysis} onOpenChange={() => toggleSection('analysis')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardContent className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Детальный анализ</span>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.analysis && 'rotate-180')} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3">
                  <AnalysisTabs
                    analysis={analysis}
                    currentTime={currentTime}
                    activeTab={activeAnalysisTab}
                    onTabChange={tab => {
                      selectionChanged();
                      setActiveAnalysisTab(tab);
                    }}
                  />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ) : (
          <AnalysisTabs
            analysis={analysis}
            currentTime={currentTime}
            activeTab={activeAnalysisTab}
            onTabChange={setActiveAnalysisTab}
          />
        )}
      </motion.div>

      {/* Style Description */}
      {analysis.styleDescription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {isMobile ? (
            <Collapsible open={expandedSections.style} onOpenChange={() => toggleSection('style')}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardContent className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Music2 className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Описание стиля</span>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.style && 'rotate-180')} />
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-3 pb-3 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">{analysis.styleDescription}</p>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ) : (
            <Card className="bg-gradient-to-r from-muted/50 to-background">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Music2 className="w-4 h-4 text-primary" />
                  Описание стиля
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.styleDescription}</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Generated Tags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        {isMobile ? (
          <Collapsible open={expandedSections.tags} onOpenChange={() => toggleSection('tags')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardContent className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Теги для генерации</span>
                    <Badge variant="secondary" className="text-xs">{analysis.generatedTags.length}</Badge>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.tags && 'rotate-180')} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-3 pb-3 pt-0">
                  <Button size="sm" variant="ghost" onClick={handleCopyTags} className="h-7 text-xs w-full mb-2">
                    <Copy className="w-3 h-3 mr-1" />
                    Копировать все теги
                  </Button>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.generatedTags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ) : (
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
        )}
      </motion.div>

      {/* Export & Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {isMobile ? (
          <Collapsible open={expandedSections.export} onOpenChange={() => toggleSection('export')}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardContent className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Экспорт и действия</span>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.export && 'rotate-180')} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-3 pb-3 pt-0">
                  <ExportFilesPanel transcriptionFiles={analysis.transcriptionFiles} midiUrl={analysis.midiUrl} />
                  {(onSave || onCreateTrack) && (
                    <>
                      <Separator className="my-3" />
                      <div className="flex flex-col gap-2">
                        {onSave && (
                          <Button variant="outline" onClick={onSave} className="w-full">
                            <Save className="w-4 h-4 mr-2" />
                            Сохранить
                          </Button>
                        )}
                        {onCreateTrack && (
                          <Button onClick={onCreateTrack} className="w-full">
                            Создать трек
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ) : (
          <Card>
            <CardContent className="p-4">
              <ExportFilesPanel transcriptionFiles={analysis.transcriptionFiles} midiUrl={analysis.midiUrl} />
              {(onSave || onCreateTrack) && (
                <>
                  <Separator className="my-4" />
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
                </>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

// Helper Components

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-background/60 backdrop-blur border border-border/50">
      <div className={cn('flex items-center gap-1.5 mb-1', color)}>
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-semibold text-sm truncate">{value}</p>
    </div>
  );
}

function StatBadge({ icon, value, color }: { icon: React.ReactNode; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/60 backdrop-blur border border-border/50">
      <div className={color}>{icon}</div>
      <span className="text-[10px] font-semibold truncate max-w-full">{value}</span>
    </div>
  );
}

function ChordDiagramsGrid({
  chords,
  showAllChords,
  totalChords,
  onToggleShowAll,
  isMobile,
}: {
  chords: string[];
  showAllChords: boolean;
  totalChords: number;
  onToggleShowAll: () => void;
  isMobile: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
      <AnimatePresence>
        {chords.map((chord, i) => (
          <motion.div
            key={chord}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: i * 0.05 }}
          >
            <ChordDiagramUnified
              chord={chord}
              size={isMobile ? 'sm' : 'md'}
              showFingers={!isMobile}
              animated={!isMobile}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AnalysisTabs({
  analysis,
  currentTime,
  activeTab,
  onTabChange,
}: {
  analysis: GuitarAnalysisResult;
  currentTime: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full grid grid-cols-4 h-9 sm:h-10">
        <TabsTrigger value="tab" className="gap-1 text-[10px] sm:text-sm">
          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Табы</span>
          <span className="sm:hidden">TAB</span>
        </TabsTrigger>
        <TabsTrigger value="strum" className="gap-1 text-[10px] sm:text-sm">
          <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Бой</span>
          <span className="sm:hidden">Бой</span>
        </TabsTrigger>
        <TabsTrigger value="beats" className="gap-1 text-[10px] sm:text-sm">
          <Drum className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Ритм</span>
        </TabsTrigger>
        <TabsTrigger value="notes" className="gap-1 text-[10px] sm:text-sm">
          <Piano className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Ноты</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tab" className="mt-3">
        <GuitarTabVisualization notes={analysis.notes} bpm={analysis.bpm} />
      </TabsContent>

      <TabsContent value="strum" className="mt-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <StrummingPatternVisualization strumming={analysis.strumming || []} bpm={analysis.bpm} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="beats" className="mt-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
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
        <PianoRollPreview notes={analysis.notes} duration={analysis.totalDuration} currentTime={currentTime} height={180} />
      </TabsContent>
    </Tabs>
  );
}

// Export with backward compatibility
export { GuitarAnalysisReportImproved as GuitarAnalysisReport };
