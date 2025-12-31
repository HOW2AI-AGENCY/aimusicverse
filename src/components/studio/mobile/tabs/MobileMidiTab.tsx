/**
 * MobileMidiTab - MIDI transcription for mobile
 *
 * Features:
 * - Transcribe stems to MIDI
 * - Select model (Guitar, Piano, Drums, etc.)
 * - Export formats (MIDI, MusicXML, GP5, PDF)
 */

import { useState } from 'react';
import { Sparkles, Music, Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudioData } from '@/hooks/useStudioData';
import { useStemTranscription, StemTranscription } from '@/hooks/useStemTranscription';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface MobileMidiTabProps {
  trackId?: string;
  mode: 'track' | 'project';
}

const MIDI_MODELS = [
  { value: 'guitar', label: 'Гитара', icon: '🎸' },
  { value: 'piano', label: 'Фортепиано', icon: '🎹' },
  { value: 'drums', label: 'Ударные', icon: '🥁' },
  { value: 'vocal', label: 'Вокал', icon: '🎤' },
  { value: 'bass', label: 'Бас', icon: '🎸' },
  { value: 'universal', label: 'Универсальный', icon: '🎵' },
];

export default function MobileMidiTab({ trackId, mode }: MobileMidiTabProps) {
  const { stems, sortedStems } = useStudioData(trackId || '');
  const [selectedStemId, setSelectedStemId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('guitar');

  const { transcriptions } = useStemTranscription(selectedStemId || '');

  const selectedStem = stems?.find(s => s.id === selectedStemId);

  if (mode === 'track' && !stems) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stems || stems.length === 0) {
    return (
      <div className="p-4">
        <Alert>
          <AlertDescription className="text-xs">
            Сначала разделите трек на стемы, чтобы создать MIDI транскрипцию.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          MIDI Транскрипция
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Преобразуйте стемы в MIDI ноты
        </p>
      </div>

      {/* Stem Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Выберите стем</label>
        <div className="grid grid-cols-1 gap-2">
          {sortedStems?.map((stem, index) => (
            <motion.button
              key={stem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedStemId(stem.id)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all",
                selectedStemId === stem.id
                  ? "bg-primary/10 border-primary shadow-sm"
                  : "bg-card border-border/50 hover:bg-accent/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    selectedStemId === stem.id
                      ? "bg-primary/20"
                      : "bg-muted"
                  )}
                >
                  <Music className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate capitalize">
                    {stem.stem_type}
                  </p>
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    Stem
                  </Badge>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      {selectedStemId && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Модель транскрипции</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MIDI_MODELS.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  {model.icon} {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Transcription Action */}
      {selectedStemId && (
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={() => {
            // TODO: Trigger MIDI transcription
          }}
        >
          <Sparkles className="w-4 h-4" />
          Создать MIDI
        </Button>
      )}

      {/* Existing Transcriptions */}
      {transcriptions && transcriptions.length > 0 && (
        <div className="pt-4 border-t border-border/30 space-y-2">
          <h4 className="text-sm font-medium">Доступные транскрипции</h4>
          {transcriptions.map((trans: StemTranscription, index: number) => (
            <motion.div
              key={trans.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 bg-card rounded-lg border border-border/50 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">
                  {trans.model}
                </p>
                <Badge variant="secondary" className="text-[10px] mt-1">
                  MIDI
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (trans.midi_url) {
                    window.open(trans.midi_url, '_blank');
                  }
                }}
                className="h-9 w-9 shrink-0"
              >
                <Download className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
