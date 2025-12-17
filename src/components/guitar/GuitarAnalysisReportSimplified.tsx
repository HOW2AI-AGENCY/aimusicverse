/**
 * Simplified GuitarAnalysisReport - Clean, compact, professional
 * Focus on essential features: stats, chords, score viewer, downloads
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Play,
  Pause,
  Copy,
  Sparkles,
  Download,
  FileText,
  Music2,
  Gauge,
  Key,
  Clock,
  Save,
  Guitar,
  FileMusic,
  Music,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'GuitarAnalysisReport' });
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChordDiagramUnified } from './ChordDiagramUnified';
import { WaveformWithChords } from './WaveformWithChords';
import type { GuitarAnalysisResult } from '@/hooks/useGuitarAnalysis';

interface GuitarAnalysisReportSimplifiedProps {
  analysis: GuitarAnalysisResult;
  audioUrl: string;
  onCreateTrack?: () => void;
  onSave?: () => void;
  className?: string;
}

export function GuitarAnalysisReportSimplified({
  analysis,
  audioUrl,
  onCreateTrack,
  onSave,
  className,
}: GuitarAnalysisReportSimplifiedProps) {
  const isMobile = useIsMobile();
  const { tap } = useHapticFeedback();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState('chords');

  const uniqueChords = [...new Set(analysis.chords.map(c => c.chord))];

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

  const handleDownload = (url: string | undefined, name: string) => {
    if (!url) {
      toast.error('Файл недоступен');
      return;
    }
    tap();
    window.open(url, '_blank');
    toast.success(`Скачивание ${name}...`);
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

  const { pdfUrl, musicXmlUrl, gp5Url, midiUrl, midiQuantUrl } = analysis.transcriptionFiles;
  const hasPdf = !!pdfUrl;
  const hasMidi = !!(midiUrl || midiQuantUrl);
  const hasScore = hasPdf || musicXmlUrl || gp5Url;

  // Debug logging to diagnose missing files issue
  useEffect(() => {
    log.debug('Analysis data:', {
      transcriptionFiles: JSON.stringify(analysis.transcriptionFiles),
      pdfUrl,
      midiUrl,
      midiQuantUrl,
      gp5Url,
      musicXmlUrl,
      hasPdf,
      hasMidi,
      hasScore,
      analysisComplete: analysis.analysisComplete,
      notesCount: analysis.notes?.length || 0,
    });
  }, [analysis, pdfUrl, midiUrl, midiQuantUrl, gp5Url, musicXmlUrl, hasPdf, hasMidi, hasScore]);

  return (
    <div className={cn('space-y-4', className)}>
      <audio
        ref={audioRef}
        src={audioUrl}
        className="hidden"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      />

      {/* Compact Stats Header */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-2 mb-4">
            <StatBadge icon={<Key className="w-3.5 h-3.5" />} label="Key" value={analysis.key} />
            <StatBadge icon={<Gauge className="w-3.5 h-3.5" />} label="BPM" value={`${analysis.bpm}`} />
            <StatBadge icon={<Clock className="w-3.5 h-3.5" />} label="Metre" value={analysis.timeSignature} />
            <StatBadge icon={<Guitar className="w-3.5 h-3.5" />} label="Type" value={analysis.style.technique?.slice(0, 4) || 'Mix'} />
          </div>

          {/* Simple Waveform Player */}
          {analysis.chords.length > 0 ? (
            <WaveformWithChords
              audioUrl={audioUrl}
              chords={analysis.chords}
              duration={analysis.totalDuration}
              className="border-0 bg-transparent p-0"
            />
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Button
                size="icon"
                variant={isPlaying ? 'secondary' : 'default'}
                onClick={togglePlayback}
                className="h-10 w-10 rounded-full shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>
              <div className="flex-1 min-w-0">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(currentTime / analysis.totalDuration) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatDuration(currentTime)} / {formatDuration(analysis.totalDuration)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-10">
          <TabsTrigger value="chords" className="text-xs sm:text-sm">
            <Guitar className="w-4 h-4 mr-1.5" />
            Аккорды
          </TabsTrigger>
          <TabsTrigger value="score" className="text-xs sm:text-sm" disabled={!hasScore}>
            <Music className="w-4 h-4 mr-1.5" />
            Ноты
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs sm:text-sm">
            <Download className="w-4 h-4 mr-1.5" />
            Экспорт
          </TabsTrigger>
        </TabsList>

        {/* Chords Tab */}
        <TabsContent value="chords" className="mt-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Найдено аккордов: {uniqueChords.length}</h3>
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {uniqueChords.slice(0, 12).map((chord, i) => (
                  <ChordDiagramUnified
                    key={chord}
                    chord={chord}
                    size={isMobile ? 'sm' : 'md'}
                    showFingers={!isMobile}
                  />
                ))}
              </div>

              {uniqueChords.length > 12 && (
                <p className="text-xs text-center text-muted-foreground">
                  и ещё {uniqueChords.length - 12} аккордов...
                </p>
              )}

              <Separator className="my-3" />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0">Прогрессия:</span>
                  <p className="text-xs sm:text-sm font-mono text-primary overflow-x-auto pb-1">
                    {uniqueChords.slice(0, 8).join(' → ')}
                    {uniqueChords.length > 8 && ' ...'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Теги для генерации:</span>
                  <Button size="sm" variant="ghost" onClick={handleCopyTags} className="h-7 text-xs">
                    <Copy className="w-3 h-3 mr-1" />
                    Копировать
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {analysis.generatedTags.slice(0, 8).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Score/Notes Tab */}
        <TabsContent value="score" className="mt-3">
          {hasPdf ? (
            <Card>
              <CardContent className="p-0">
                <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Ноты и табулатура (PDF)</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(pdfUrl, 'PDF')}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Скачать
                  </Button>
                </div>

                <div className="relative w-full h-[400px] sm:h-[500px] bg-muted/10">
                  <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-0"
                    title="PDF Score Viewer"
                  />
                </div>

                <div className="p-3 bg-muted/20 text-xs text-muted-foreground border-t flex items-center justify-between">
                  <span>💡 Скачайте для лучшего просмотра</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => window.open(pdfUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Открыть
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <Music className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">PDF ноты недоступны</p>

                  {/* Diagnostic info */}
                  <div className="text-xs text-muted-foreground space-y-1 max-w-md mx-auto">
                    <p>Статус транскрипции: {analysis.analysisComplete.transcription ? '✅ Завершено' : '❌ Не выполнено'}</p>
                    {analysis.notes && analysis.notes.length > 0 && (
                      <p>Найдено нот: {analysis.notes.length}</p>
                    )}
                    {(musicXmlUrl || gp5Url || midiUrl) && (
                      <p className="text-primary">Доступны другие форматы во вкладке "Экспорт"</p>
                    )}
                    {!analysis.analysisComplete.transcription && (
                      <p className="text-amber-500 mt-2">⚠️ Klangio не смог сгенерировать файлы. Попробуйте:</p>
                    )}
                  </div>

                  {!analysis.analysisComplete.transcription && (
                    <div className="text-xs text-left bg-muted/50 p-3 rounded-lg max-w-md mx-auto space-y-1">
                      <p>• Улучшить качество записи</p>
                      <p>• Записать более длинный фрагмент (15+ сек)</p>
                      <p>• Убрать фоновый шум</p>
                      <p>• Повторить анализ</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="mt-3">
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* MIDI Downloads - Prominent */}
              {hasMidi ? (
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <FileMusic className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">MIDI файлы</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {midiUrl && (
                      <Button
                        onClick={() => handleDownload(midiUrl, 'MIDI')}
                        className="w-full"
                        size="lg"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        MIDI (оригинал)
                      </Button>
                    )}
                    {midiQuantUrl && (
                      <Button
                        onClick={() => handleDownload(midiQuantUrl, 'MIDI квантизированный')}
                        className="w-full"
                        size="lg"
                        variant="outline"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        MIDI (квант.)
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Используйте в DAW или музыкальных редакторах
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <FileMusic className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">MIDI файлы недоступны</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analysis.analysisComplete.transcription
                      ? 'Файлы не были сгенерированы. Проверьте логи браузера.'
                      : 'Транскрипция не завершена. См. вкладку "Ноты" для деталей.'}
                  </p>
                </div>
              )}

              <Separator />

              {/* Other Formats */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Другие форматы
                </h4>

                <div className="grid grid-cols-1 gap-2">
                  {pdfUrl && (
                    <FileDownloadButton
                      label="PDF нотная запись"
                      description="Табулатура и ноты"
                      onClick={() => handleDownload(pdfUrl, 'PDF')}
                    />
                  )}

                  {musicXmlUrl && (
                    <FileDownloadButton
                      label="MusicXML"
                      description="Для MuseScore, Sibelius"
                      onClick={() => handleDownload(musicXmlUrl, 'MusicXML')}
                    />
                  )}

                  {gp5Url && (
                    <FileDownloadButton
                      label="Guitar Pro 5"
                      description="Для Guitar Pro, TuxGuitar"
                      onClick={() => handleDownload(gp5Url, 'Guitar Pro')}
                    />
                  )}
                </div>

                {!pdfUrl && !musicXmlUrl && !gp5Url && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Файлы не сгенерированы. Попробуйте повторить анализ.
                  </p>
                )}
              </div>

              {/* Actions */}
              {(onSave || onCreateTrack) && (
                <>
                  <Separator />
                  <div className="flex flex-col sm:flex-row gap-2">
                    {onSave && (
                      <Button variant="outline" onClick={onSave} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Сохранить
                      </Button>
                    )}
                    {onCreateTrack && (
                      <Button onClick={onCreateTrack} className="flex-1">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Создать трек
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Style Description - Compact */}
      {analysis.styleDescription && (
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">
              <Music2 className="w-3 h-3 inline mr-1" />
              {analysis.styleDescription}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Components

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-background/60 backdrop-blur border border-border/50">
      <div className="text-primary">{icon}</div>
      <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-xs font-semibold truncate max-w-full">{value}</span>
    </div>
  );
}

function FileDownloadButton({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors text-left w-full"
    >
      <div className="p-2 rounded bg-primary/10">
        <Download className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

// Export with backward compatibility
export { GuitarAnalysisReportSimplified as GuitarAnalysisReport };
