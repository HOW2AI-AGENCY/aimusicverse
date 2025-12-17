/**
 * Instrumental Generator Panel - Generate complementary instrumentals
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Music, Play, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useStudioProjectStore } from '@/stores/useStudioProjectStore';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'InstrumentalGenerator' });

interface InstrumentalGeneratorPanelProps {
  mainTrackUrl: string;
  trackId?: string;
  onClose: () => void;
}

interface TrackAnalysis {
  bpm?: number;
  key?: string;
  scale?: string;
  genre?: string;
  mood?: string;
  energy?: string;
  instruments?: string[];
  suggestedInstruments?: string[];
  style_description?: string;
}

const instrumentOptions = [
  { value: 'piano', label: 'Пианино', emoji: '🎹' },
  { value: 'guitar', label: 'Гитара', emoji: '🎸' },
  { value: 'bass', label: 'Бас', emoji: '🎸' },
  { value: 'strings', label: 'Струнные', emoji: '🎻' },
  { value: 'synth', label: 'Синтезатор', emoji: '🎛️' },
  { value: 'pad', label: 'Пэд', emoji: '🌊' },
  { value: 'drums', label: 'Ударные', emoji: '🥁' },
  { value: 'brass', label: 'Духовые', emoji: '🎺' },
  { value: 'choir', label: 'Хор', emoji: '🎤' },
  { value: 'arpeggio', label: 'Арпеджио', emoji: '✨' },
];

export function InstrumentalGeneratorPanel({ 
  mainTrackUrl, 
  trackId,
  onClose 
}: InstrumentalGeneratorPanelProps) {
  const [selectedInstrument, setSelectedInstrument] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [duration, setDuration] = useState(30);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => new Audio());
  
  const { addTrack, addClip, currentProject } = useStudioProjectStore();

  // Analyze main track
  const { data: analysis, isLoading: isAnalyzing, refetch: reanalyze } = useQuery({
    queryKey: ['track-context', trackId || mainTrackUrl],
    queryFn: async (): Promise<TrackAnalysis> => {
      const response = await supabase.functions.invoke('analyze-track-context', {
        body: { audioUrl: mainTrackUrl, trackId },
      });
      
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: !!mainTrackUrl,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  // Set default instrument from suggestions
  useEffect(() => {
    if (analysis?.suggestedInstruments?.length && !selectedInstrument) {
      setSelectedInstrument(analysis.suggestedInstruments[0]);
    }
  }, [analysis, selectedInstrument]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const instrument = instrumentOptions.find(i => i.value === selectedInstrument)?.label || selectedInstrument;
      
      // Build contextual prompt
      let prompt = `${instrument}`;
      if (analysis) {
        prompt += ` in ${analysis.key || 'C'} ${analysis.scale || 'major'}`;
        prompt += `, ${analysis.bpm || 120} BPM`;
        if (analysis.genre) prompt += `, ${analysis.genre} style`;
        if (analysis.mood) prompt += `, ${analysis.mood} mood`;
      }
      if (customPrompt) {
        prompt += `, ${customPrompt}`;
      }
      prompt += ', high quality, studio production, loopable';

      log.debug('Generating instrumental with prompt:', { prompt });

      // Use MusicGen for instrumental generation
      const response = await supabase.functions.invoke('musicgen-generate', {
        body: { 
          prompt,
          duration,
          model: 'melody', // Better for melodic content
        },
      });

      if (response.error) throw response.error;
      return response.data.audioUrl;
    },
    onSuccess: (url) => {
      setGeneratedUrl(url);
      toast.success('Инструментал сгенерирован!');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const handlePreview = () => {
    if (!generatedUrl) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.src = generatedUrl;
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const handleAddToTimeline = () => {
    if (!generatedUrl || !currentProject) return;
    
    const instrument = instrumentOptions.find(i => i.value === selectedInstrument);
    
    const trackIdNew = addTrack({
      name: `${instrument?.emoji || '🎹'} ${instrument?.label || selectedInstrument}`,
      type: 'instrumental',
      volume: 0.7,
      pan: 0,
      muted: false,
      solo: false,
      color: 'hsl(262 83% 58%)',
    });
    
    addClip(trackIdNew, {
      audioUrl: generatedUrl,
      name: `${instrument?.label || selectedInstrument}`,
      startTime: 0,
      duration,
      trimStart: 0,
      trimEnd: 0,
      fadeIn: 0.5,
      fadeOut: 0.5,
    });
    
    toast.success('Инструментал добавлен на таймлайн');
    onClose();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-purple-500" />
            Генератор инструментала
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => reanalyze()}
            disabled={isAnalyzing}
          >
            <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Track Analysis */}
        {isAnalyzing ? (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Анализ основного трека...</span>
          </div>
        ) : analysis ? (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex flex-wrap gap-2">
              {analysis.key && (
                <Badge variant="secondary">🎵 {analysis.key} {analysis.scale}</Badge>
              )}
              {analysis.bpm && (
                <Badge variant="secondary">⏱️ {analysis.bpm} BPM</Badge>
              )}
              {analysis.genre && (
                <Badge variant="secondary">🎸 {analysis.genre}</Badge>
              )}
              {analysis.mood && (
                <Badge variant="secondary">😊 {analysis.mood}</Badge>
              )}
            </div>
            
            {analysis.suggestedInstruments?.length ? (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Рекомендуемые инструменты:</span>
                <div className="flex flex-wrap gap-1">
                  {analysis.suggestedInstruments.map(inst => (
                    <Badge
                      key={inst}
                      variant="outline"
                      className={cn(
                        "cursor-pointer",
                        selectedInstrument === inst && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => setSelectedInstrument(inst)}
                    >
                      {instrumentOptions.find(i => i.value === inst)?.emoji || '🎵'} {inst}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Instrument Selection */}
        <div className="space-y-2">
          <Label>Инструмент</Label>
          <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите инструмент" />
            </SelectTrigger>
            <SelectContent>
              {instrumentOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Prompt */}
        <div className="space-y-2">
          <Label>Дополнительное описание</Label>
          <Input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="soft, melodic, ambient..."
            className="text-sm"
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Длительность</Label>
            <span className="text-sm text-muted-foreground">{duration}с</span>
          </div>
          <Slider
            value={[duration]}
            min={10}
            max={60}
            step={5}
            onValueChange={([v]) => setDuration(v)}
          />
        </div>

        {/* Generate Button */}
        <Button
          className="w-full"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || !selectedInstrument}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Сгенерировать
            </>
          )}
        </Button>

        {/* Preview & Add */}
        {generatedUrl && (
          <div className="flex gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePreview}
            >
              <Play className={cn("h-4 w-4 mr-2", isPlaying && "animate-pulse")} />
              {isPlaying ? 'Играет...' : 'Прослушать'}
            </Button>
            
            <Button
              className="flex-1"
              onClick={handleAddToTimeline}
            >
              <Plus className="h-4 w-4 mr-2" />
              На таймлайн
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
