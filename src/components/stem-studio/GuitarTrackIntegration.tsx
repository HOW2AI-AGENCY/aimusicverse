/**
 * GuitarTrackIntegration - Integration component for guitar analysis in Stem Studio
 * Displays chord progression, MIDI data, and analysis results within stem mixing interface
 * Enables synced playback with stem channels
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Music2,
  Activity,
  FileMusic,
  ChevronDown,
  ChevronUp,
  Download,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GuitarAnalysisResult } from '@/hooks/useGuitarAnalysis';
import { ChordProgressionTimeline } from '@/components/guitar/ChordProgressionTimeline';
import { BeatGridVisualizer } from '@/components/guitar/BeatGridVisualizer';
import { MidiExportPanelMobile } from '@/components/guitar/MidiExportPanelMobile';

interface GuitarTrackIntegrationProps {
  analysisResult: GuitarAnalysisResult | null;
  trackId: string;
  currentTime?: number;
  isPlaying?: boolean;
  className?: string;
}

export function GuitarTrackIntegration({
  analysisResult,
  trackId,
  currentTime = 0,
  isPlaying = false,
  className,
}: GuitarTrackIntegrationProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'chords' | 'beats' | 'export'>('chords');

  if (!analysisResult) {
    return null;
  }

  const hasChords = analysisResult.chords.length > 0;
  const hasBeats = analysisResult.beats.length > 0;
  const hasExport = !!(
    analysisResult.midiUrl || 
    analysisResult.transcriptionFiles.midiUrl ||
    analysisResult.transcriptionFiles.gp5Url
  );

  const completionStats = [
    { 
      label: 'Ритм', 
      complete: analysisResult.analysisComplete.beats,
      icon: <Activity className="w-3 h-3" />,
    },
    { 
      label: 'Аккорды', 
      complete: analysisResult.analysisComplete.chords,
      icon: <Music2 className="w-3 h-3" />,
    },
    { 
      label: 'Ноты', 
      complete: analysisResult.analysisComplete.transcription,
      icon: <FileMusic className="w-3 h-3" />,
    },
  ];

  return (
    <motion.div
      layout
      className={cn("space-y-3", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-orange-500/5 via-red-500/5 to-pink-500/5 border-orange-500/20">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 text-left touch-manipulation"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <Music2 className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  Guitar Analysis
                  <Zap className="w-3 h-3 text-orange-400" />
                </h3>
                <p className="text-xs text-muted-foreground">
                  {analysisResult.bpm} BPM • {analysisResult.key}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Completion badges */}
              <div className="hidden sm:flex items-center gap-1">
                {completionStats.map((stat, i) => (
                  <Badge
                    key={i}
                    variant={stat.complete ? 'default' : 'outline'}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 h-5",
                      stat.complete && "bg-green-500"
                    )}
                  >
                    {stat.icon}
                    <span className="ml-0.5">{stat.label}</span>
                  </Badge>
                ))}
              </div>

              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </button>
      </Card>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-3"
          >
            {/* Analysis Summary */}
            <Card className="p-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Аккорды</div>
                  <div className="text-lg font-bold text-purple-400">
                    {analysisResult.chords.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Биты</div>
                  <div className="text-lg font-bold text-blue-400">
                    {analysisResult.beats.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Ноты</div>
                  <div className="text-lg font-bold text-green-400">
                    {analysisResult.notes.length}
                  </div>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger 
                  value="chords" 
                  disabled={!hasChords}
                  className="text-xs"
                >
                  <Music2 className="w-3 h-3 mr-1" />
                  Аккорды
                </TabsTrigger>
                <TabsTrigger 
                  value="beats" 
                  disabled={!hasBeats}
                  className="text-xs"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Ритм
                </TabsTrigger>
                <TabsTrigger 
                  value="export" 
                  disabled={!hasExport}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Экспорт
                </TabsTrigger>
              </TabsList>

              <div className="mt-3">
                <TabsContent value="chords" className="mt-0">
                  {hasChords ? (
                    <ChordProgressionTimeline
                      chords={analysisResult.chords}
                      audioUrl={analysisResult.audioUrl}
                      duration={analysisResult.totalDuration}
                      keySignature={analysisResult.key}
                    />
                  ) : (
                    <Card className="p-6 text-center">
                      <Music2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Аккорды не распознаны
                      </p>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="beats" className="mt-0">
                  {hasBeats ? (
                    <BeatGridVisualizer
                      beats={analysisResult.beats}
                      downbeats={analysisResult.downbeats}
                      bpm={analysisResult.bpm}
                      audioUrl={analysisResult.audioUrl}
                      duration={analysisResult.totalDuration}
                    />
                  ) : (
                    <Card className="p-6 text-center">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Ритм-сетка недоступна
                      </p>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="export" className="mt-0">
                  {hasExport ? (
                    <MidiExportPanelMobile
                      transcriptionFiles={analysisResult.transcriptionFiles}
                      midiUrl={analysisResult.midiUrl}
                    />
                  ) : (
                    <Card className="p-6 text-center">
                      <FileMusic className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Файлы экспорта недоступны
                      </p>
                    </Card>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {/* Style Tags */}
            {analysisResult.generatedTags.length > 0 && (
              <>
                <Separator />
                <Card className="p-3">
                  <div className="text-xs text-muted-foreground mb-2">
                    AI Теги для генерации
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.generatedTags.slice(0, 8).map((tag, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="text-[10px] px-2 py-0.5"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {analysisResult.generatedTags.length > 8 && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        +{analysisResult.generatedTags.length - 8}
                      </Badge>
                    )}
                  </div>
                </Card>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
