/**
 * ProfessionalArchiveExport - Complete archive download for production use
 * Phase 6: Professional archive export
 * 
 * Creates a ZIP with:
 * - Audio/ (main track MP3/WAV + stems)
 * - MIDI/ (all stem MIDI files)
 * - Notation/ (GuitarPro, PDF sheets)
 * - Lyrics/ (track lyrics)
 * - README.txt (project info)
 */

import { useState, useCallback } from 'react';
import { Package, Download, Music2, FileText, FileMusic, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Track } from '@/types/track';
import { TrackStem } from '@/hooks/useTrackStems';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { logger } from '@/lib/logger';
import { getStemLabel } from '@/lib/stemLabels';
import { cn } from '@/lib/utils';

interface StemTranscription {
  midi_url?: string | null;
  midi_quant_url?: string | null;
  gp5_url?: string | null;
  pdf_url?: string | null;
  musicxml_url?: string | null;
}

interface ProfessionalArchiveExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  stems: TrackStem[];
  transcriptions?: Record<string, StemTranscription>;
}

const sanitizeFilename = (name: string): string => {
  return name.replace(/[^a-zA-Zа-яА-Я0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
};

type ArchiveSection = 'audio' | 'stems' | 'midi' | 'notation' | 'lyrics';

interface ExportOptions {
  audio: boolean;
  stems: boolean;
  midi: boolean;
  notation: boolean;
  lyrics: boolean;
  format: 'mp3' | 'wav';
}

export function ProfessionalArchiveExport({ 
  open, 
  onOpenChange, 
  track, 
  stems, 
  transcriptions = {} 
}: ProfessionalArchiveExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [completedSections, setCompletedSections] = useState<ArchiveSection[]>([]);
  const [options, setOptions] = useState<ExportOptions>({
    audio: true,
    stems: true,
    midi: true,
    notation: true,
    lyrics: true,
    format: 'mp3'
  });

  const hasMidi = Object.values(transcriptions).some(t => t?.midi_url);
  const hasNotation = Object.values(transcriptions).some(t => t?.gp5_url || t?.pdf_url);
  const hasLyrics = !!track.lyrics;

  const fetchBlob = async (url: string): Promise<Blob | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.blob();
    } catch (error) {
      logger.error('Failed to fetch file', { url, error });
      return null;
    }
  };

  const generateReadme = (): string => {
    const date = new Date().toISOString().split('T')[0];
    const durationSec = track.duration_seconds || 0;
    const duration = durationSec ? `${Math.floor(durationSec / 60)}:${String(Math.floor(durationSec % 60)).padStart(2, '0')}` : 'N/A';
    
    return `
╔══════════════════════════════════════════════════════════════╗
║                    MUSICVERSE AI EXPORT                       ║
╚══════════════════════════════════════════════════════════════╝

TRACK INFORMATION
─────────────────
Title:     ${track.title}
Duration:  ${duration}
Created:   ${new Date(track.created_at || new Date()).toLocaleDateString('ru-RU')}
Exported:  ${date}

STYLE & TAGS
─────────────────
${track.style || 'No style description'}

ARCHIVE CONTENTS
─────────────────
📁 Audio/
   └── Main track (${options.format.toUpperCase()})
   └── Stems/ (separated tracks)

📁 MIDI/
   └── MIDI files for each stem
   └── Quantized MIDI versions

📁 Notation/
   └── GuitarPro/ (.gp5 tabs)
   └── PDF/ (sheet music)

📁 Lyrics/
   └── Track lyrics (.txt)

CREDITS
─────────────────
Generated with MusicVerse AI
https://musicverse.ai

© ${new Date().getFullYear()} All rights reserved.
`.trim();
  };

  const handleExport = useCallback(async () => {
    if (!track.audio_url) {
      toast.error('Нет аудио для экспорта');
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setCompletedSections([]);

    try {
      const zip = new JSZip();
      const trackName = sanitizeFilename(track.title || 'Track');
      const root = zip.folder(`${trackName}_Professional_Export`);
      
      if (!root) throw new Error('Failed to create archive');

      let totalSteps = 0;
      let completedSteps = 0;

      // Calculate total steps
      if (options.audio) totalSteps += 1;
      if (options.stems) totalSteps += stems.length;
      if (options.midi) totalSteps += Object.keys(transcriptions).length;
      if (options.notation) totalSteps += Object.keys(transcriptions).length;
      if (options.lyrics) totalSteps += 1;
      totalSteps += 1; // README

      const updateProgress = () => {
        completedSteps++;
        setProgress(Math.round((completedSteps / totalSteps) * 100));
      };

      // 1. Audio folder - main track
      if (options.audio && track.audio_url) {
        setCurrentStep('Скачиваю основной трек...');
        const audioFolder = root.folder('Audio');
        const mainBlob = await fetchBlob(track.audio_url as string);
        if (mainBlob && audioFolder) {
          audioFolder.file(`${trackName}_Master.${options.format}`, mainBlob);
        }
        updateProgress();
        setCompletedSections(prev => [...prev, 'audio']);
      }

      // 2. Stems folder
      if (options.stems && stems.length > 0) {
        const stemsFolder = root.folder('Audio')?.folder('Stems') || root.folder('Stems');
        
        for (const stem of stems) {
          setCurrentStep(`Скачиваю стем: ${getStemLabel(stem.stem_type)}...`);
          const blob = await fetchBlob(stem.audio_url);
          if (blob && stemsFolder) {
            stemsFolder.file(`${getStemLabel(stem.stem_type)}.${options.format}`, blob);
          }
          updateProgress();
        }
        setCompletedSections(prev => [...prev, 'stems']);
      }

      // 3. MIDI folder
      if (options.midi && hasMidi) {
        const midiFolder = root.folder('MIDI');
        
        for (const [stemType, trans] of Object.entries(transcriptions)) {
          setCurrentStep(`Скачиваю MIDI: ${getStemLabel(stemType)}...`);
          
          if (trans?.midi_url && midiFolder) {
            const blob = await fetchBlob(trans.midi_url);
            if (blob) {
              midiFolder.file(`${getStemLabel(stemType)}.mid`, blob);
            }
          }
          
          if (trans?.midi_quant_url && midiFolder) {
            const quantFolder = midiFolder.folder('Quantized') || midiFolder;
            const blob = await fetchBlob(trans.midi_quant_url);
            if (blob) {
              quantFolder.file(`${getStemLabel(stemType)}_quantized.mid`, blob);
            }
          }
          updateProgress();
        }
        setCompletedSections(prev => [...prev, 'midi']);
      }

      // 4. Notation folder
      if (options.notation && hasNotation) {
        const notationFolder = root.folder('Notation');
        const gpFolder = notationFolder?.folder('GuitarPro');
        const pdfFolder = notationFolder?.folder('PDF');
        
        for (const [stemType, trans] of Object.entries(transcriptions)) {
          setCurrentStep(`Скачиваю ноты: ${getStemLabel(stemType)}...`);
          
          if (trans?.gp5_url && gpFolder) {
            const blob = await fetchBlob(trans.gp5_url);
            if (blob) {
              gpFolder.file(`${getStemLabel(stemType)}.gp5`, blob);
            }
          }
          
          if (trans?.pdf_url && pdfFolder) {
            const blob = await fetchBlob(trans.pdf_url);
            if (blob) {
              pdfFolder.file(`${getStemLabel(stemType)}.pdf`, blob);
            }
          }
          updateProgress();
        }
        setCompletedSections(prev => [...prev, 'notation']);
      }

      // 5. Lyrics folder
      if (options.lyrics && hasLyrics && track.lyrics) {
        setCurrentStep('Добавляю текст песни...');
        const lyricsFolder = root.folder('Lyrics');
        if (lyricsFolder) {
          lyricsFolder.file(`${trackName}_Lyrics.txt`, track.lyrics);
        }
        updateProgress();
        setCompletedSections(prev => [...prev, 'lyrics']);
      }

      // 6. README
      setCurrentStep('Создаю README...');
      root.file('README.txt', generateReadme());
      updateProgress();

      // Generate ZIP
      setCurrentStep('Создаю архив...');
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, (metadata) => {
        setProgress(Math.round(metadata.percent));
      });

      // Download
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trackName}_Professional_Export.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Профессиональный архив создан!', {
        description: 'Все материалы упакованы и готовы к использованию'
      });
      onOpenChange(false);

    } catch (error) {
      logger.error('Export failed', error);
      toast.error('Ошибка экспорта');
    } finally {
      setIsExporting(false);
      setProgress(0);
      setCurrentStep('');
    }
  }, [track, stems, transcriptions, options, onOpenChange, hasMidi, hasNotation, hasLyrics]);

  const toggleOption = (key: keyof ExportOptions) => {
    if (key === 'format') return;
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Профессиональный архив
          </SheetTitle>
          <SheetDescription>
            Скачай всё одним ZIP: трек, стемы, MIDI, ноты, лирика
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4 space-y-4">
          {/* Export Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Что включить в архив:</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <label className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                options.audio ? "border-primary bg-primary/5" : "border-border"
              )}>
                <Checkbox 
                  checked={options.audio} 
                  onCheckedChange={() => toggleOption('audio')}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Основной трек</span>
                  </div>
                </div>
              </label>

              <label className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                options.stems ? "border-primary bg-primary/5" : "border-border",
                stems.length === 0 && "opacity-50 cursor-not-allowed"
              )}>
                <Checkbox 
                  checked={options.stems && stems.length > 0} 
                  onCheckedChange={() => toggleOption('stems')}
                  disabled={stems.length === 0}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">Стемы</span>
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {stems.length}
                    </Badge>
                  </div>
                </div>
              </label>

              <label className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                options.midi ? "border-primary bg-primary/5" : "border-border",
                !hasMidi && "opacity-50 cursor-not-allowed"
              )}>
                <Checkbox 
                  checked={options.midi && hasMidi} 
                  onCheckedChange={() => toggleOption('midi')}
                  disabled={!hasMidi}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileMusic className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">MIDI</span>
                    {!hasMidi && (
                      <Badge variant="outline" className="text-[10px] h-4">
                        нет
                      </Badge>
                    )}
                  </div>
                </div>
              </label>

              <label className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                options.notation ? "border-primary bg-primary/5" : "border-border",
                !hasNotation && "opacity-50 cursor-not-allowed"
              )}>
                <Checkbox 
                  checked={options.notation && hasNotation} 
                  onCheckedChange={() => toggleOption('notation')}
                  disabled={!hasNotation}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Ноты</span>
                    {!hasNotation && (
                      <Badge variant="outline" className="text-[10px] h-4">
                        нет
                      </Badge>
                    )}
                  </div>
                </div>
              </label>

              <label className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                options.lyrics ? "border-primary bg-primary/5" : "border-border",
                !hasLyrics && "opacity-50 cursor-not-allowed"
              )}>
                <Checkbox 
                  checked={options.lyrics && hasLyrics} 
                  onCheckedChange={() => toggleOption('lyrics')}
                  disabled={!hasLyrics}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Текст</span>
                    {!hasLyrics && (
                      <Badge variant="outline" className="text-[10px] h-4">
                        нет
                      </Badge>
                    )}
                  </div>
                </div>
              </label>
            </div>

            {/* Format Selection */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-sm text-muted-foreground">Формат аудио:</span>
              <div className="flex gap-2">
                <Button
                  variant={options.format === 'mp3' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOptions(prev => ({ ...prev, format: 'mp3' }))}
                >
                  MP3
                </Button>
                <Button
                  variant={options.format === 'wav' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOptions(prev => ({ ...prev, format: 'wav' }))}
                >
                  WAV
                </Button>
              </div>
            </div>
          </div>

          {/* Archive Preview */}
          <div className="bg-muted/30 rounded-xl p-4">
            <h3 className="text-sm font-medium mb-3">Структура архива:</h3>
            <pre className="text-xs text-muted-foreground font-mono">
{`${sanitizeFilename(track.title || 'Track')}_Professional_Export/
├── Audio/
│   ├── ${sanitizeFilename(track.title || 'Track')}_Master.${options.format}
│   └── Stems/
│       └── [${stems.length} стемов]
├── MIDI/
│   └── [MIDI файлы]
├── Notation/
│   ├── GuitarPro/
│   └── PDF/
├── Lyrics/
│   └── ${sanitizeFilename(track.title || 'Track')}_Lyrics.txt
└── README.txt`}
            </pre>
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{currentStep}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              <div className="flex flex-wrap gap-2 mt-2">
                {(['audio', 'stems', 'midi', 'notation', 'lyrics'] as ArchiveSection[]).map(section => (
                  <Badge 
                    key={section}
                    variant={completedSections.includes(section) ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {completedSections.includes(section) ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : null}
                    {section === 'audio' ? 'Аудио' : 
                     section === 'stems' ? 'Стемы' :
                     section === 'midi' ? 'MIDI' :
                     section === 'notation' ? 'Ноты' : 'Текст'}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full h-12 gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Создаю архив... {progress}%
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Скачать профессиональный архив
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
