/**
 * Reference MIDI Sheet
 * Component for transcribing stems to MIDI, Guitar Pro (GP5), or MusicXML
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic2,
  Guitar,
  Drum,
  Music,
  FileAudio,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReferenceMidiSheetProps {
  reference: {
    id: string;
    vocal_stem_url?: string | null;
    instrumental_stem_url?: string | null;
    drums_stem_url?: string | null;
    bass_stem_url?: string | null;
    other_stem_url?: string | null;
  };
  onClose: () => void;
}

type StemType = 'vocal' | 'instrumental' | 'drums' | 'bass' | 'other';
type OutputFormat = 'midi' | 'musicxml' | 'gp5' | 'pdf';
type TranscriptionModel = 'basic-pitch' | 'mt3' | 'drums' | 'vocal';

interface TranscriptionResult {
  midiUrl?: string;
  musicxmlUrl?: string;
  gp5Url?: string;
  pdfUrl?: string;
}

const STEM_CONFIG: Record<StemType, { icon: typeof Mic2; label: string; color: string; models: TranscriptionModel[] }> = {
  vocal: { icon: Mic2, label: 'Вокал', color: 'text-pink-500', models: ['vocal', 'basic-pitch'] },
  instrumental: { icon: Guitar, label: 'Инструментал', color: 'text-blue-500', models: ['basic-pitch', 'mt3'] },
  drums: { icon: Drum, label: 'Ударные', color: 'text-amber-500', models: ['drums'] },
  bass: { icon: Music, label: 'Бас', color: 'text-purple-500', models: ['basic-pitch'] },
  other: { icon: FileAudio, label: 'Другое', color: 'text-gray-500', models: ['basic-pitch', 'mt3'] },
};

const FORMAT_OPTIONS: { value: OutputFormat; label: string; description: string }[] = [
  { value: 'midi', label: 'MIDI', description: 'Стандартный MIDI файл для DAW' },
  { value: 'musicxml', label: 'MusicXML', description: 'Для нотных редакторов' },
  { value: 'gp5', label: 'Guitar Pro', description: 'Табулатура для Guitar Pro' },
  { value: 'pdf', label: 'PDF Ноты', description: 'Печатные ноты' },
];

const MODEL_OPTIONS: { value: TranscriptionModel; label: string; description: string }[] = [
  { value: 'basic-pitch', label: 'Basic Pitch', description: 'Универсальный, быстрый' },
  { value: 'mt3', label: 'MT3', description: 'Мультитрековый, точный' },
  { value: 'drums', label: 'Drums Model', description: 'Специализированный для ударных' },
  { value: 'vocal', label: 'Vocal Model', description: 'Оптимизирован для мелодии' },
];

export function ReferenceMidiSheet({ reference, onClose }: ReferenceMidiSheetProps) {
  const { user } = useAuth();
  const [selectedStem, setSelectedStem] = useState<StemType | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>('midi');
  const [selectedModel, setSelectedModel] = useState<TranscriptionModel>('basic-pitch');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get available stems
  const availableStems: { type: StemType; url: string }[] = [];
  if (reference.vocal_stem_url) availableStems.push({ type: 'vocal', url: reference.vocal_stem_url });
  if (reference.instrumental_stem_url) availableStems.push({ type: 'instrumental', url: reference.instrumental_stem_url });
  if (reference.drums_stem_url) availableStems.push({ type: 'drums', url: reference.drums_stem_url });
  if (reference.bass_stem_url) availableStems.push({ type: 'bass', url: reference.bass_stem_url });
  if (reference.other_stem_url) availableStems.push({ type: 'other', url: reference.other_stem_url });

  // Get valid models for selected stem
  const validModels = selectedStem ? STEM_CONFIG[selectedStem].models : [];

  const handleTranscribe = async () => {
    if (!selectedStem || !user) return;

    const stemUrl = availableStems.find(s => s.type === selectedStem)?.url;
    if (!stemUrl) {
      toast.error('Стем не найден');
      return;
    }

    setIsTranscribing(true);
    setProgress(10);
    setError(null);
    setResult(null);

    try {
      // Call transcribe-midi edge function
      const { data, error: fnError } = await supabase.functions.invoke('transcribe-midi', {
        body: {
          audio_url: stemUrl,
          user_id: user.id,
          model: selectedModel,
          output_formats: [selectedFormat],
          reference_id: reference.id,
          stem_type: selectedStem,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setProgress(100);
      
      // Map result based on format
      const transcriptionResult: TranscriptionResult = {};
      if (data?.midi_url) transcriptionResult.midiUrl = data.midi_url;
      if (data?.musicxml_url) transcriptionResult.musicxmlUrl = data.musicxml_url;
      if (data?.gp5_url) transcriptionResult.gp5Url = data.gp5_url;
      if (data?.pdf_url) transcriptionResult.pdfUrl = data.pdf_url;

      setResult(transcriptionResult);
      toast.success('Транскрипция завершена!');
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка транскрипции');
      toast.error('Ошибка транскрипции');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleDownload = (url: string, format: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedStem}_transcription.${format}`;
    link.click();
  };

  return (
    <ScrollArea className="h-full mt-4">
      <div className="space-y-6 pb-8">
        {/* Step 1: Select Stem */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">1</span>
            Выберите стем
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableStems.map((stem) => {
              const config = STEM_CONFIG[stem.type];
              const Icon = config.icon;
              const isSelected = selectedStem === stem.type;
              
              return (
                <motion.button
                  key={stem.type}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedStem(stem.type);
                    // Auto-select best model for stem type
                    const bestModel = config.models[0];
                    setSelectedModel(bestModel);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${config.color}`} />
                  <span className="text-sm font-medium">{config.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Model */}
        {selectedStem && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">2</span>
              Модель транскрипции
            </h3>
            <RadioGroup value={selectedModel} onValueChange={(v) => setSelectedModel(v as TranscriptionModel)}>
              <div className="grid grid-cols-2 gap-2">
                {MODEL_OPTIONS.filter(m => validModels.includes(m.value)).map((model) => (
                  <div key={model.value} className="flex items-start space-x-2 p-2 rounded-lg border">
                    <RadioGroupItem value={model.value} id={model.value} className="mt-1" />
                    <Label htmlFor={model.value} className="flex flex-col cursor-pointer">
                      <span className="font-medium text-sm">{model.label}</span>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </motion.div>
        )}

        {/* Step 3: Select Format */}
        {selectedStem && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">3</span>
              Формат вывода
            </h3>
            <RadioGroup value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as OutputFormat)}>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((format) => (
                  <div key={format.value} className="flex items-start space-x-2 p-2 rounded-lg border">
                    <RadioGroupItem value={format.value} id={format.value} className="mt-1" />
                    <Label htmlFor={format.value} className="flex flex-col cursor-pointer">
                      <span className="font-medium text-sm">{format.label}</span>
                      <span className="text-xs text-muted-foreground">{format.description}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </motion.div>
        )}

        {/* Progress */}
        {isTranscribing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Транскрипция... это может занять 1-2 минуты
            </p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-3"
          >
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Транскрипция завершена!</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.midiUrl && (
                <Button size="sm" variant="outline" onClick={() => handleDownload(result.midiUrl!, 'mid')}>
                  <Download className="w-4 h-4 mr-1" />
                  MIDI
                </Button>
              )}
              {result.musicxmlUrl && (
                <Button size="sm" variant="outline" onClick={() => handleDownload(result.musicxmlUrl!, 'musicxml')}>
                  <Download className="w-4 h-4 mr-1" />
                  MusicXML
                </Button>
              )}
              {result.gp5Url && (
                <Button size="sm" variant="outline" onClick={() => handleDownload(result.gp5Url!, 'gp5')}>
                  <Download className="w-4 h-4 mr-1" />
                  Guitar Pro
                </Button>
              )}
              {result.pdfUrl && (
                <Button size="sm" variant="outline" onClick={() => handleDownload(result.pdfUrl!, 'pdf')}>
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Закрыть
          </Button>
          <Button
            className="flex-1"
            onClick={handleTranscribe}
            disabled={!selectedStem || isTranscribing}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <Music className="w-4 h-4 mr-2" />
                Транскрибировать
              </>
            )}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
