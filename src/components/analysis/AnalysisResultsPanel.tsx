/**
 * AnalysisResultsPanel - Tabbed panel for comprehensive analysis results
 * Displays style, chords, beats, and transcription data
 */

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Music, Gauge, Key, Heart, FileMusic, 
  Activity, AudioWaveform, Download, Play, Pause,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChordProgressionDisplay } from './ChordProgressionDisplay';
import { BeatGridVisualization } from './BeatGridVisualization';
import type { UnifiedAnalysisResult } from '@/services/unified-analysis/types';

interface AnalysisResultsPanelProps {
  analysis: UnifiedAnalysisResult | null;
  duration: number;
  currentTime?: number;
  isLoading?: boolean;
  onDownloadMidi?: () => void;
  onDownloadPdf?: () => void;
  className?: string;
}

type TabValue = 'overview' | 'chords' | 'beats' | 'transcription';

export const AnalysisResultsPanel = memo(function AnalysisResultsPanel({
  analysis,
  duration,
  currentTime = 0,
  isLoading,
  onDownloadMidi,
  onDownloadPdf,
  className,
}: AnalysisResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [expanded, setExpanded] = useState(false);

  // Determine available tabs
  const availableTabs = useMemo(() => {
    const tabs: { value: TabValue; label: string; icon: React.ReactNode }[] = [
      { value: 'overview', label: 'Обзор', icon: <Activity className="w-3.5 h-3.5" /> },
    ];

    if (analysis?.chords && analysis.chords.length > 0) {
      tabs.push({ value: 'chords', label: 'Аккорды', icon: <Music className="w-3.5 h-3.5" /> });
    }

    if (analysis?.beats && analysis.beats.length > 0) {
      tabs.push({ value: 'beats', label: 'Ритм', icon: <AudioWaveform className="w-3.5 h-3.5" /> });
    }

    if (analysis?.notes && analysis.notes.length > 0) {
      tabs.push({ value: 'transcription', label: 'Ноты', icon: <FileMusic className="w-3.5 h-3.5" /> });
    }

    return tabs;
  }, [analysis]);

  if (isLoading) {
    return <PanelSkeleton className={className} />;
  }

  if (!analysis) {
    return null;
  }

  return (
    <Card className={cn(
      "bg-gradient-to-br from-card/80 to-card/60",
      "backdrop-blur-sm border-border/50",
      className
    )}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/30">
          <TabsList className="h-8 bg-background/50">
            {availableTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-7 text-xs gap-1.5 data-[state=active]:bg-primary/10"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Expand/Collapse for mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 sm:hidden"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        <CardContent className={cn(
          "p-4 transition-all",
          !expanded && "max-h-[200px] sm:max-h-none overflow-hidden"
        )}>
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0">
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {analysis.bpm && (
                    <QuickStat
                      icon={<Gauge className="w-4 h-4 text-orange-500" />}
                      label="BPM"
                      value={Math.round(analysis.bpm)}
                    />
                  )}
                  {analysis.key && (
                    <QuickStat
                      icon={<Key className="w-4 h-4 text-blue-500" />}
                      label="Тональность"
                      value={analysis.key}
                    />
                  )}
                  {analysis.timeSignature && (
                    <QuickStat
                      icon={<Music className="w-4 h-4 text-purple-500" />}
                      label="Размер"
                      value={analysis.timeSignature}
                    />
                  )}
                  {analysis.arousal !== undefined && (
                    <QuickStat
                      icon={<Heart className="w-4 h-4 text-pink-500" />}
                      label="Энергия"
                      value={`${Math.round(analysis.arousal)}%`}
                    />
                  )}
                </div>

                {/* Genre & Mood Badges */}
                {(analysis.genre || analysis.mood) && (
                  <div className="flex flex-wrap gap-2">
                    {analysis.genre && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {analysis.genre}
                      </Badge>
                    )}
                    {analysis.mood && (
                      <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30">
                        {analysis.mood}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Style Description */}
                {analysis.styleDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.styleDescription}
                  </p>
                )}

                {/* Instruments */}
                {analysis.instruments && analysis.instruments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.instruments.map((inst, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {inst}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* Chords Tab */}
            <TabsContent value="chords" className="mt-0">
              <motion.div
                key="chords"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {analysis.chords && (
                  <ChordProgressionDisplay
                    chords={analysis.chords}
                    duration={duration}
                    currentTime={currentTime}
                    showTimeline
                  />
                )}
              </motion.div>
            </TabsContent>

            {/* Beats Tab */}
            <TabsContent value="beats" className="mt-0">
              <motion.div
                key="beats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {analysis.beats && (
                  <BeatGridVisualization
                    beats={analysis.beats.map((b, i) => ({ 
                      time: b.time, 
                      beatNumber: (i % 4) + 1 
                    }))}
                    downbeats={analysis.downbeats || []}
                    duration={duration}
                    bpm={analysis.bpm || 120}
                    timeSignature={analysis.timeSignature || '4/4'}
                    currentTime={currentTime}
                    height={80}
                  />
                )}
              </motion.div>
            </TabsContent>

            {/* Transcription Tab */}
            <TabsContent value="transcription" className="mt-0">
              <motion.div
                key="transcription"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Notes summary */}
                {analysis.notes && (
                  <div className="text-sm text-muted-foreground">
                    {analysis.notes.length} нот обнаружено
                  </div>
                )}

                {/* Download buttons */}
                <div className="flex flex-wrap gap-2">
                  {analysis.midiUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={onDownloadMidi}
                    >
                      <Download className="w-3.5 h-3.5" />
                      MIDI
                    </Button>
                  )}
                  {analysis.pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={onDownloadPdf}
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </Button>
                  )}
                  {analysis.musicXmlUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      asChild
                    >
                      <a href={analysis.musicXmlUrl} download>
                        <Download className="w-3.5 h-3.5" />
                        MusicXML
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </CardContent>
      </Tabs>
    </Card>
  );
});

// Quick Stat Component
interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function QuickStat({ icon, label, value }: QuickStatProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30">
      {icon}
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// Skeleton
function PanelSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("bg-card/50", className)}>
      <div className="px-4 pt-3 pb-2 border-b border-border/30">
        <Skeleton className="h-8 w-48" />
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default AnalysisResultsPanel;
