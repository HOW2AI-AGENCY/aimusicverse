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
  Scissors,
  Download,
  Loader2,
  FileMusic,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface KlangioToolsPanelProps {
  audioUrl?: string;
  trackId?: string;
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  onChordsDetected?: (chords: ChordData[]) => void;
  onBeatsDetected?: (beats: BeatData) => void;
  onStemsReady?: (stems: StemData[]) => void;
}

interface TranscriptionResult {
  midi_url?: string;
  gp5_url?: string;
  pdf_url?: string;
  musicxml_url?: string;
  notes?: NoteData[];
}

interface ChordData {
  chord: string;
  start: number;
  end: number;
}

interface BeatData {
  bpm: number;
  beats: number[];
  downbeats: number[];
  time_signature: string;
}

interface StemData {
  type: string;
  url: string;
}

interface NoteData {
  time: number;
  pitch: number;
  duration: number;
  velocity: number;
  string?: number;
  fret?: number;
}

type TaskStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'error';

interface ToolState {
  status: TaskStatus;
  progress: number;
  error?: string;
}

const transcriptionModels = [
  { value: 'guitar', label: 'Гитара', icon: Guitar },
  { value: 'bass', label: 'Бас', icon: Music },
  { value: 'piano', label: 'Пианино', icon: Music },
  { value: 'drums', label: 'Ударные', icon: Drum },
];

const stemModes = [
  { value: '2stems', label: '2 стема (Вокал + Инстр.)' },
  { value: '4stems', label: '4 стема (Вокал, Ударные, Бас, Другое)' },
  { value: '5stems', label: '5 стемов (+ Пианино)' },
  { value: '6stems', label: '6 стемов (+ Гитара)' },
];

const exportFormats = [
  { value: 'midi', label: 'MIDI', icon: FileMusic },
  { value: 'gp5', label: 'Guitar Pro', icon: Guitar },
  { value: 'pdf', label: 'PDF (Ноты)', icon: FileText },
  { value: 'musicxml', label: 'MusicXML', icon: FileMusic },
];

export const KlangioToolsPanel = memo(function KlangioToolsPanel({
  audioUrl,
  trackId,
  onTranscriptionComplete,
  onChordsDetected,
  onBeatsDetected,
  onStemsReady,
}: KlangioToolsPanelProps) {
  const haptic = useHapticFeedback();
  
  // Tool states
  const [transcription, setTranscription] = useState<ToolState>({ status: 'idle', progress: 0 });
  const [chords, setChords] = useState<ToolState>({ status: 'idle', progress: 0 });
  const [beats, setBeats] = useState<ToolState>({ status: 'idle', progress: 0 });
  const [stems, setStems] = useState<ToolState>({ status: 'idle', progress: 0 });

  // Settings
  const [transcriptionModel, setTranscriptionModel] = useState('guitar');
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['midi', 'gp5']);
  const [stemMode, setStemMode] = useState('4stems');
  const [extendedChords, setExtendedChords] = useState(true);

  // Expanded sections
  const [expandedSection, setExpandedSection] = useState<string | null>('transcription');

  const toggleFormat = (format: string) => {
    setSelectedFormats(prev =>
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleTranscribe = async () => {
    if (!audioUrl) return;
    haptic.impact('medium');
    
    setTranscription({ status: 'pending', progress: 0 });
    
    // Simulate progress (replace with actual API call)
    const interval = setInterval(() => {
      setTranscription(prev => ({
        ...prev,
        progress: Math.min(prev.progress + 10, 90),
        status: prev.progress >= 30 ? 'processing' : 'pending',
      }));
    }, 500);

    try {
      // TODO: Implement actual Klangio API call
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      clearInterval(interval);
      setTranscription({ status: 'completed', progress: 100 });
      haptic.success();
      
      // Mock result
      onTranscriptionComplete?.({
        midi_url: 'mock://midi',
        gp5_url: 'mock://gp5',
      });
    } catch (error) {
      clearInterval(interval);
      setTranscription({ 
        status: 'error', 
        progress: 0, 
        error: 'Ошибка транскрипции' 
      });
      haptic.error();
    }
  };

  const handleDetectChords = async () => {
    if (!audioUrl) return;
    haptic.impact('medium');
    
    setChords({ status: 'pending', progress: 0 });
    
    try {
      // TODO: Implement actual chord detection
      await new Promise(resolve => setTimeout(resolve, 3000));
      setChords({ status: 'completed', progress: 100 });
      haptic.success();
      
      // Mock result
      onChordsDetected?.([
        { chord: 'Am', start: 0, end: 2 },
        { chord: 'F', start: 2, end: 4 },
      ]);
    } catch (error) {
      setChords({ status: 'error', progress: 0, error: 'Ошибка распознавания' });
      haptic.error();
    }
  };

  const handleDetectBeats = async () => {
    if (!audioUrl) return;
    haptic.impact('medium');
    
    setBeats({ status: 'pending', progress: 0 });
    
    try {
      // TODO: Implement actual beat detection
      await new Promise(resolve => setTimeout(resolve, 2000));
      setBeats({ status: 'completed', progress: 100 });
      haptic.success();
      
      // Mock result
      onBeatsDetected?.({
        bpm: 120,
        beats: [0, 0.5, 1, 1.5],
        downbeats: [0, 2],
        time_signature: '4/4',
      });
    } catch (error) {
      setBeats({ status: 'error', progress: 0, error: 'Ошибка определения' });
      haptic.error();
    }
  };

  const handleSeparateStems = async () => {
    if (!audioUrl) return;
    haptic.impact('medium');
    
    setStems({ status: 'pending', progress: 0 });
    
    const interval = setInterval(() => {
      setStems(prev => ({
        ...prev,
        progress: Math.min(prev.progress + 5, 95),
        status: prev.progress >= 20 ? 'processing' : 'pending',
      }));
    }, 500);

    try {
      // TODO: Implement actual stem separation
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      clearInterval(interval);
      setStems({ status: 'completed', progress: 100 });
      haptic.success();
      
      // Mock result
      onStemsReady?.([
        { type: 'vocals', url: 'mock://vocals' },
        { type: 'drums', url: 'mock://drums' },
      ]);
    } catch (error) {
      clearInterval(interval);
      setStems({ status: 'error', progress: 0, error: 'Ошибка разделения' });
      haptic.error();
    }
  };

  const renderStatusBadge = (state: ToolState) => {
    switch (state.status) {
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
    state,
    children,
    onAction,
    actionLabel,
  }: {
    id: string;
    title: string;
    icon: React.ElementType;
    state: ToolState;
    children: React.ReactNode;
    onAction: () => void;
    actionLabel: string;
  }) => {
    const isExpanded = expandedSection === id;
    const isLoading = state.status === 'pending' || state.status === 'processing';

    return (
      <Card className={cn(
        'overflow-hidden transition-all duration-300',
        isExpanded && 'ring-1 ring-primary/30',
        state.status === 'completed' && 'border-green-500/30'
      )}>
        <CardHeader
          className="cursor-pointer py-3"
          onClick={() => setExpandedSection(isExpanded ? null : id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                state.status === 'completed' ? 'bg-green-500/10' : 'bg-primary/10'
              )}>
                <Icon className={cn(
                  'h-5 w-5',
                  state.status === 'completed' ? 'text-green-500' : 'text-primary'
                )} />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
              {renderStatusBadge(state)}
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
                    <Progress value={state.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {state.status === 'pending' ? 'Подготовка...' : `Обработка: ${state.progress}%`}
                    </p>
                  </div>
                )}

                {/* Error message */}
                {state.status === 'error' && (
                  <p className="text-sm text-destructive">{state.error}</p>
                )}

                {/* Action button */}
                <Button
                  onClick={onAction}
                  disabled={!audioUrl || isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Обработка...
                    </>
                  ) : state.status === 'completed' ? (
                    <>
                      <Download className="h-4 w-4" />
                      Скачать результат
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {actionLabel}
                    </>
                  )}
                </Button>
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

      {/* Transcription */}
      <ToolSection
        id="transcription"
        title="Транскрипция"
        icon={Guitar}
        state={transcription}
        onAction={handleTranscribe}
        actionLabel="Транскрибировать"
      >
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Инструмент</Label>
            <Select value={transcriptionModel} onValueChange={setTranscriptionModel}>
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
        state={chords}
        onAction={handleDetectChords}
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
        state={beats}
        onAction={handleDetectBeats}
        actionLabel="Определить BPM и биты"
      >
        <p className="text-sm text-muted-foreground">
          Автоматическое определение темпа, размера и положения битов
        </p>
      </ToolSection>

      {/* Stem Separation */}
      <ToolSection
        id="stems"
        title="Разделение на стемы"
        icon={Scissors}
        state={stems}
        onAction={handleSeparateStems}
        actionLabel="Разделить на стемы"
      >
        <div>
          <Label className="text-xs">Режим разделения</Label>
          <Select value={stemMode} onValueChange={setStemMode}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stemModes.map(mode => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ToolSection>

      {/* No audio warning */}
      {!audioUrl && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
            Выберите трек для анализа
          </CardContent>
        </Card>
      )}
    </div>
  );
});
