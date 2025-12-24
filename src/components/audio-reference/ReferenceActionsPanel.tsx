/**
 * Reference Actions Panel
 * Provides action buttons for creating new content from reference audio
 * - Cover (style transfer)
 * - Extend (continue track)
 * - New Arrangement (vocal stem + new instrumental)
 * - New Vocal (instrumental stem + new vocal)
 * - MIDI Transcription (stem to MIDI/GP5/MusicXML)
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Copy,
  Plus,
  Mic2,
  Guitar,
  Music,
  FileMusic,
  Wand2,
  Sparkles,
} from 'lucide-react';
import { motion } from '@/lib/motion';
import { toast } from 'sonner';
import { useReferenceAnalysisData, type ReferenceAnalysisData } from '@/hooks/useReferenceAnalysisData';
import { ReferenceMidiSheet } from './ReferenceMidiSheet';
import { useState } from 'react';

interface ReferenceActionsPanelProps {
  reference: {
    id: string;
    file_name: string;
    file_url: string;
    style_description?: string | null;
    transcription?: string | null;
    bpm?: number | null;
    genre?: string | null;
    mood?: string | null;
    energy?: string | null;
    instruments?: string[] | null;
    vocal_style?: string | null;
    has_vocals?: boolean | null;
    has_instrumentals?: boolean | null;
    vocal_stem_url?: string | null;
    instrumental_stem_url?: string | null;
    drums_stem_url?: string | null;
    bass_stem_url?: string | null;
    other_stem_url?: string | null;
    stems_status?: string | null;
  };
  className?: string;
}

export function ReferenceActionsPanel({ reference, className }: ReferenceActionsPanelProps) {
  const navigate = useNavigate();
  const { saveAnalysisData, buildTitleFromFileName } = useReferenceAnalysisData();
  const [midiSheetOpen, setMidiSheetOpen] = useState(false);

  const hasVocalStem = !!reference.vocal_stem_url;
  const hasInstrumentalStem = !!reference.instrumental_stem_url;
  const hasStemsReady = reference.stems_status === 'completed';

  // Prepare analysis data for form pre-filling
  const prepareAnalysisData = (): ReferenceAnalysisData => ({
    id: reference.id,
    fileName: reference.file_name,
    title: buildTitleFromFileName(reference.file_name),
    style: reference.style_description || undefined,
    lyrics: reference.transcription || undefined,
    bpm: reference.bpm || undefined,
    genre: reference.genre || undefined,
    mood: reference.mood || undefined,
    energy: reference.energy || undefined,
    instruments: reference.instruments || undefined,
    vocalStyle: reference.vocal_style || undefined,
    hasVocals: reference.has_vocals || undefined,
    hasInstrumentals: reference.has_instrumentals || undefined,
    audioUrl: reference.file_url,
    vocalStemUrl: reference.vocal_stem_url || undefined,
    instrumentalStemUrl: reference.instrumental_stem_url || undefined,
    drumsStemUrl: reference.drums_stem_url || undefined,
    bassStemUrl: reference.bass_stem_url || undefined,
    otherStemUrl: reference.other_stem_url || undefined,
  });

  const handleCover = () => {
    const data = prepareAnalysisData();
    saveAnalysisData(data);
    navigate(`/generate?mode=cover&ref=${reference.id}`);
    toast.success('Данные анализа загружены в форму');
  };

  const handleExtend = () => {
    const data = prepareAnalysisData();
    saveAnalysisData(data);
    navigate(`/generate?mode=extend&ref=${reference.id}`);
    toast.success('Данные анализа загружены в форму');
  };

  const handleNewArrangement = () => {
    if (!hasVocalStem) {
      toast.error('Сначала разделите аудио на стемы');
      return;
    }
    
    const data = prepareAnalysisData();
    saveAnalysisData({
      ...data,
      audioUrl: reference.vocal_stem_url!,
    });
    
    // Navigate to PromptDJ with vocal stem context
    navigate(`/prompt-dj?mode=arrangement&stem=vocal&ref=${reference.id}`);
    toast.success('Вокальный стем готов к новой аранжировке');
  };

  const handleNewVocal = () => {
    if (!hasInstrumentalStem) {
      toast.error('Сначала разделите аудио на стемы');
      return;
    }
    
    const data = prepareAnalysisData();
    saveAnalysisData({
      ...data,
      audioUrl: reference.instrumental_stem_url!,
    });
    
    navigate(`/generate?mode=vocal&stem=instrumental&ref=${reference.id}`);
    toast.success('Инструментальный стем готов для нового вокала');
  };

  const handleOpenPromptDJ = () => {
    const data = prepareAnalysisData();
    saveAnalysisData(data);
    navigate(`/prompt-dj?ref=${reference.id}`);
    toast.success('Параметры загружены в PromptDJ');
  };

  const actions = [
    {
      id: 'cover',
      icon: Copy,
      label: 'Кавер',
      description: 'Стиль + текст → новый трек',
      onClick: handleCover,
      enabled: true,
      color: 'text-purple-500',
    },
    {
      id: 'extend',
      icon: Plus,
      label: 'Продолжение',
      description: 'Расширить трек',
      onClick: handleExtend,
      enabled: true,
      color: 'text-blue-500',
    },
    {
      id: 'arrangement',
      icon: Guitar,
      label: 'Новая аранжировка',
      description: 'Вокал + новый инструментал',
      onClick: handleNewArrangement,
      enabled: hasVocalStem,
      color: 'text-green-500',
      badge: !hasStemsReady ? 'Нужны стемы' : undefined,
    },
    {
      id: 'vocal',
      icon: Mic2,
      label: 'Новый вокал',
      description: 'Инструментал + AI вокал',
      onClick: handleNewVocal,
      enabled: hasInstrumentalStem,
      color: 'text-pink-500',
      badge: !hasStemsReady ? 'Нужны стемы' : undefined,
    },
    {
      id: 'promptdj',
      icon: Wand2,
      label: 'PromptDJ',
      description: 'Генерация в стиле референса',
      onClick: handleOpenPromptDJ,
      enabled: true,
      color: 'text-amber-500',
    },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Создать на основе
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="outline"
                className={`w-full h-auto py-3 px-3 flex flex-col items-start gap-1 relative ${
                  !action.enabled ? 'opacity-50' : 'hover:bg-muted'
                }`}
                onClick={action.onClick}
                disabled={!action.enabled}
              >
                <div className="flex items-center gap-2">
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                  <span className="font-medium text-sm">{action.label}</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  {action.badge || action.description}
                </span>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* MIDI Transcription */}
        {hasStemsReady && (
          <Sheet open={midiSheetOpen} onOpenChange={setMidiSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="secondary"
                className="w-full mt-2 gap-2"
              >
                <FileMusic className="w-4 h-4" />
                MIDI транскрипция стемов
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  MIDI транскрипция
                </SheetTitle>
                <SheetDescription>
                  Конвертируйте стемы в MIDI, Guitar Pro или MusicXML
                </SheetDescription>
              </SheetHeader>
              <ReferenceMidiSheet
                reference={reference}
                onClose={() => setMidiSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}
      </CardContent>
    </Card>
  );
}
