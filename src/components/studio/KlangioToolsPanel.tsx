import { memo, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Guitar,
  Music,
  Drum,
  Download,
  Loader2,
  FileMusic,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { 
  useKlangioAnalysis, 
  TranscriptionResult, 
  ChordResult, 
  BeatResult,
  TranscriptionModel,
  OutputFormat,
  AnalysisStatus
} from '@/hooks/useKlangioAnalysis';
import { cn } from '@/lib/utils';

interface KlangioToolsPanelProps {
  audioUrl?: string;
  trackId?: string;
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  onChordsDetected?: (result: ChordResult) => void;
  onBeatsDetected?: (result: BeatResult) => void;
}

const transcriptionModels: { value: TranscriptionModel; label: string; icon: typeof Guitar }[] = [
  { value: 'guitar', label: 'Гитара', icon: Guitar },
  { value: 'bass', label: 'Бас', icon: Music },
  { value: 'piano', label: 'Пианино', icon: Music },
  { value: 'drums', label: 'Ударные', icon: Drum },
  { value: 'vocal', label: 'Вокал', icon: Music },
  { value: 'universal', label: 'Универсальный', icon: Music },
];

const exportFormats: { value: OutputFormat; label: string; icon: typeof FileMusic }[] = [
  { value: 'midi', label: 'MIDI', icon: FileMusic },
  { value: 'gp5', label: 'Guitar Pro', icon: Guitar },
  { value: 'pdf', label: 'PDF (Ноты)', icon: FileText },
  { value: 'mxml', label: 'MusicXML', icon: FileMusic },
];

export const KlangioToolsPanel = memo(function KlangioToolsPanel({
  audioUrl,
  trackId,
  onTranscriptionComplete,
  onChordsDetected,
  onBeatsDetected,
}: KlangioToolsPanelProps) {
  const haptic = useHapticFeedback();
  const {
    transcription,
    chords,
    beats,
    startTranscription,
    detectChords,
    detectBeats,
    resetTranscription,
    resetChords,
    resetBeats,
  } = useKlangioAnalysis();

  // Settings
  const [transcriptionModel, setTranscriptionModel] = useState<TranscriptionModel>('guitar');
  const [selectedFormats, setSelectedFormats] = useState<OutputFormat[]>(['midi', 'gp5']);
  const [extendedChords, setExtendedChords] = useState(true);

  // Expanded sections
  const [expandedSection, setExpandedSection] = useState<string | null>('transcription');

  const toggleFormat = (format: OutputFormat) => {
    setSelectedFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleTranscribe = async () => {
    if (!audioUrl) return;
    haptic.impact('medium');
    
    const result = await startTranscription(audioUrl, transcriptionModel, selectedFormats);
    if (result) {
      haptic.success();
      onTranscriptionComplete?.(result);
    } else {
      haptic.error();
    }
  };

  const handleDetectChords = async () => {
    if (!audioUrl) return;
    haptic.impact('medium');
    
    const result = await detectChords(audioUrl, extendedChords);
    if (result) {
      haptic.success();
      onChordsDetected?.(result);
    } else {
      haptic.error();
    }
  };

  const handleDetectBeats = async () => {
    if (!audioUrl) return;
    haptic.impact('medium');
    
    const result = await detectBeats(audioUrl);
    if (result) {
      haptic.success();
      onBeatsDetected?.(result);
    } else {
      haptic.error();
    }
  };

  const renderStatusBadge = (status: AnalysisStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="animate-pulse">В очереди</Badge>;
      case 'processing':
        return <Badge className="bg-primary/80">Обработка</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/80"><Check className="h-3 w-3 mr-1" />Готово</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Ошибка</Badge>;
      default:
        return null;
    }
  };

  const ToolSection = ({
    id,
    title,
    icon: Icon,
    status,
    progress,
    error,
    children,
    onAction,
    onReset,
    actionLabel,
    result,
  }: {
    id: string;
    title: string;
    icon: React.ElementType;
    status: AnalysisStatus;
    progress: number;
    error?: string;
    children: React.ReactNode;
    onAction: () => void;
    onReset: () => void;
    actionLabel: string;
    result?: TranscriptionResult | ChordResult | BeatResult;
  }) => {
    const isExpanded = expandedSection === id;
    const isLoading = status === 'pending' || status === 'processing';

    return (
      <Card className={cn(
        'overflow-hidden transition-all duration-300',
        isExpanded && 'ring-1 ring-primary/30',
        status === 'completed' && 'border-green-500/30'
      )}>
        <CardHeader
          className="cursor-pointer py-3"
          onClick={() => setExpandedSection(isExpanded ? null : id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                status === 'completed' ? 'bg-green-500/10' : 'bg-primary/10'
              )}>
                <Icon className={cn(
                  'h-5 w-5',
                  status === 'completed' ? 'text-green-500' : 'text-primary'
                )} />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
              {renderStatusBadge(status)}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0 pb-4 space-y-4">
                {children}

                {/* Progress bar */}
                {isLoading && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {status === 'pending' ? 'Подготовка...' : `Обработка: ${progress}%`}
                    </p>
                  </div>
                )}

                {/* Error message */}
                {status === 'error' && error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                {/* Result files for transcription */}
                {status === 'completed' && result && 'files' in result && result.files && (
                  <div className="space-y-2">
                    <Label className="text-xs">Скачать результаты:</Label>
                    <div className="flex flex-wrap gap-2">
                      {result.files.midi && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={result.files.midi} target="_blank" rel="noopener noreferrer">
                            <FileMusic className="h-3 w-3 mr-1" />
                            MIDI
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      {result.files.gp5 && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={result.files.gp5} target="_blank" rel="noopener noreferrer">
                            <Guitar className="h-3 w-3 mr-1" />
                            GP5
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      {result.files.pdf && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={result.files.pdf} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-3 w-3 mr-1" />
                            PDF
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                      {result.files.mxml && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={result.files.mxml} target="_blank" rel="noopener noreferrer">
                            <FileMusic className="h-3 w-3 mr-1" />
                            MusicXML
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Result for beats */}
                {status === 'completed' && result && 'bpm' in result && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                    <p className="text-sm font-medium">BPM: {result.bpm || 'Н/Д'}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.beats?.length || 0} битов найдено
                    </p>
                  </div>
                )}

                {/* Result for chords */}
                {status === 'completed' && result && 'chords' in result && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    {result.key && (
                      <p className="text-sm font-medium">Тональность: {result.key}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {result.chords?.slice(0, 12).map((c, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {c.chord}
                        </Badge>
                      ))}
                      {(result.chords?.length || 0) > 12 && (
                        <Badge variant="outline" className="text-xs">
                          +{result.chords!.length - 12}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={onAction}
                    disabled={!audioUrl || isLoading}
                    className="flex-1 gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Обработка...
                      </>
                    ) : status === 'completed' ? (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Повторить
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {actionLabel}
                      </>
                    )}
                  </Button>
                  
                  {(status === 'completed' || status === 'error') && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReset();
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">AI Инструменты</h3>
          <p className="text-xs text-muted-foreground">Powered by Klangio</p>
        </div>
      </div>

      {!audioUrl && (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Выберите трек для анализа
          </p>
        </Card>
      )}

      {/* Transcription */}
      <ToolSection
        id="transcription"
        title="Транскрипция"
        icon={Guitar}
        status={transcription.status}
        progress={transcription.progress}
        error={transcription.error}
        result={transcription.result}
        onAction={handleTranscribe}
        onReset={resetTranscription}
        actionLabel="Транскрибировать"
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Инструмент</Label>
            <Select value={transcriptionModel} onValueChange={(v) => setTranscriptionModel(v as TranscriptionModel)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transcriptionModels.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex items-center gap-2">
                      <model.icon className="h-4 w-4" />
                      {model.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-2 block">Форматы экспорта</Label>
            <div className="flex flex-wrap gap-2">
              {exportFormats.map(format => (
                <Badge
                  key={format.value}
                  variant={selectedFormats.includes(format.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleFormat(format.value)}
                >
                  <format.icon className="h-3 w-3 mr-1" />
                  {format.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </ToolSection>

      {/* Chord Recognition */}
      <ToolSection
        id="chords"
        title="Распознавание аккордов"
        icon={Music}
        status={chords.status}
        progress={chords.progress}
        error={chords.error}
        result={chords.result}
        onAction={handleDetectChords}
        onReset={resetChords}
        actionLabel="Распознать аккорды"
      >
        <div className="flex items-center justify-between">
          <Label className="text-sm">Расширенные аккорды (7, 9, sus...)</Label>
          <Switch
            checked={extendedChords}
            onCheckedChange={setExtendedChords}
          />
        </div>
      </ToolSection>

      {/* Beat Detection */}
      <ToolSection
        id="beats"
        title="Определение ритма"
        icon={Drum}
        status={beats.status}
        progress={beats.progress}
        error={beats.error}
        result={beats.result}
        onAction={handleDetectBeats}
        onReset={resetBeats}
        actionLabel="Определить BPM и биты"
      >
        <p className="text-sm text-muted-foreground">
          Автоматическое определение темпа, размера и положения битов
        </p>
      </ToolSection>
    </div>
  );
});
