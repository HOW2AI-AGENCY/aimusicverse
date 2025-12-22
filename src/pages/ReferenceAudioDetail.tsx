/**
 * Reference Audio Detail Page
 * Shows details of uploaded reference audio with actions
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Music2, 
  Clock, 
  Mic2, 
  Guitar, 
  Drum, 
  FileAudio,
  Sparkles,
  Copy,
  Trash2,
  RefreshCw,
  Layers,
  Wand2,
  FileText,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Format duration helper
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface ReferenceAudio {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  duration_seconds: number | null;
  source: string;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  tempo: string | null;
  energy: string | null;
  vocal_style: string | null;
  style_description: string | null;
  transcription: string | null;
  instruments: string[] | null;
  has_vocals: boolean | null;
  has_instrumentals: boolean | null;
  analysis_status: string | null;
  created_at: string;
  vocal_stem_url: string | null;
  instrumental_stem_url: string | null;
  drums_stem_url: string | null;
  bass_stem_url: string | null;
  stems_status: string | null;
}

export default function ReferenceAudioDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Fetch reference audio details
  const { data: reference, isLoading, error } = useQuery({
    queryKey: ['reference-audio', id],
    queryFn: async () => {
      if (!id) throw new Error('No ID provided');
      
      const { data, error } = await supabase
        .from('reference_audio')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as ReferenceAudio;
    },
    enabled: !!id && !!user,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('No ID');
      const { error } = await supabase
        .from('reference_audio')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Аудио удалено');
      queryClient.invalidateQueries({ queryKey: ['reference-audio'] });
      navigate('/library?tab=uploads');
    },
    onError: (error) => {
      toast.error('Ошибка удаления: ' + (error as Error).message);
    },
  });

  // Re-analyze mutation
  const reanalyzeMutation = useMutation({
    mutationFn: async () => {
      if (!reference) throw new Error('No reference');
      
      const { error } = await supabase.functions.invoke('analyze-reference-audio', {
        body: {
          audioUrl: reference.file_url,
          referenceId: reference.id,
        },
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Анализ запущен');
      queryClient.invalidateQueries({ queryKey: ['reference-audio', id] });
    },
    onError: (error) => {
      toast.error('Ошибка анализа: ' + (error as Error).message);
    },
  });

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  const handlePlayPause = () => {
    if (!reference?.file_url) return;

    if (!audio) {
      const newAudio = new Audio(reference.file_url);
      newAudio.onended = () => setIsPlaying(false);
      setAudio(newAudio);
      newAudio.play();
      setIsPlaying(true);
    } else if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleGenerateCover = () => {
    navigate(`/generate?mode=cover&ref=${id}`);
  };

  const handleGenerateExtend = () => {
    navigate(`/generate?mode=extend&ref=${id}`);
  };

  const handleOpenStudio = () => {
    navigate(`/studio/${id}?type=reference`);
  };

  const handleSeparateStems = async () => {
    if (!reference) return;
    
    toast.loading('Запуск разделения на стемы...');
    
    try {
      const { error } = await supabase.functions.invoke('separate-stems', {
        body: {
          audioUrl: reference.file_url,
          referenceId: reference.id,
        },
      });
      
      if (error) throw error;
      toast.success('Разделение запущено. Это займёт несколько минут.');
      queryClient.invalidateQueries({ queryKey: ['reference-audio', id] });
    } catch (error) {
      toast.error('Ошибка: ' + (error as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Music2 className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (error || !reference) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileAudio className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground">Аудио не найдено или было удалено</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
      </div>
    );
  }

  const analysisComplete = reference.analysis_status === 'completed';
  const hasStemUrls = reference.vocal_stem_url || reference.instrumental_stem_url;

  return (
    <ScrollArea className="h-full">
      <div className="container max-w-2xl mx-auto p-4 pb-24 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{reference.file_name}</h1>
            <p className="text-sm text-muted-foreground">
              Загружено {new Date(reference.created_at).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </motion.div>

        {/* Player Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full"
                  onClick={handlePlayPause}
                >
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.div
                        key="pause"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Pause className="w-6 h-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="play"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Play className="w-6 h-6 ml-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {reference.duration_seconds && (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(reference.duration_seconds)}
                      </Badge>
                    )}
                    {reference.bpm && (
                      <Badge variant="secondary" className="gap-1">
                        <Drum className="w-3 h-3" />
                        {reference.bpm} BPM
                      </Badge>
                    )}
                    {reference.has_vocals && (
                      <Badge variant="outline" className="gap-1">
                        <Mic2 className="w-3 h-3" />
                        Вокал
                      </Badge>
                    )}
                    {reference.has_instrumentals && (
                      <Badge variant="outline" className="gap-1">
                        <Guitar className="w-3 h-3" />
                        Инструментал
                      </Badge>
                    )}
                  </div>
                  
                  {reference.file_size && (
                    <p className="text-xs text-muted-foreground">
                      {(reference.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analysis Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Анализ
                </CardTitle>
                <Badge variant={analysisComplete ? 'default' : 'secondary'}>
                  {reference.analysis_status === 'completed' ? 'Готово' :
                   reference.analysis_status === 'processing' ? 'Обработка...' :
                   reference.analysis_status === 'failed' ? 'Ошибка' : 'Ожидает'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysisComplete ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {reference.genre && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Жанр</p>
                        <p className="font-medium">{reference.genre}</p>
                      </div>
                    )}
                    {reference.mood && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Настроение</p>
                        <p className="font-medium">{reference.mood}</p>
                      </div>
                    )}
                    {reference.energy && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Энергия</p>
                        <p className="font-medium">{reference.energy}</p>
                      </div>
                    )}
                    {reference.vocal_style && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">Стиль вокала</p>
                        <p className="font-medium">{reference.vocal_style}</p>
                      </div>
                    )}
                  </div>

                  {reference.instruments && reference.instruments.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Инструменты</p>
                      <div className="flex flex-wrap gap-1">
                        {reference.instruments.map((inst, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {inst}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {reference.style_description && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Описание стиля</p>
                      <p className="text-sm">{reference.style_description}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-3">
                    {reference.analysis_status === 'processing' 
                      ? 'Анализ выполняется...' 
                      : 'Анализ не выполнен'}
                  </p>
                  <Button
                    onClick={() => reanalyzeMutation.mutate()}
                    disabled={reanalyzeMutation.isPending || reference.analysis_status === 'processing'}
                    variant="outline"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
                    Запустить анализ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Lyrics Section */}
        {reference.transcription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Текст
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-muted/30 max-h-48 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{reference.transcription}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stems Section */}
        {(hasStemUrls || reference.stems_status) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Стемы
                  </CardTitle>
                  <Badge variant={reference.stems_status === 'completed' ? 'default' : 'secondary'}>
                    {reference.stems_status === 'completed' ? 'Готово' :
                     reference.stems_status === 'processing' ? 'Обработка...' : 'Ожидает'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {hasStemUrls ? (
                  <div className="grid grid-cols-2 gap-2">
                    {reference.vocal_stem_url && (
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={reference.vocal_stem_url} target="_blank" rel="noopener noreferrer">
                          <Mic2 className="w-4 h-4" />
                          Вокал
                        </a>
                      </Button>
                    )}
                    {reference.instrumental_stem_url && (
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={reference.instrumental_stem_url} target="_blank" rel="noopener noreferrer">
                          <Guitar className="w-4 h-4" />
                          Инструментал
                        </a>
                      </Button>
                    )}
                    {reference.drums_stem_url && (
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={reference.drums_stem_url} target="_blank" rel="noopener noreferrer">
                          <Drum className="w-4 h-4" />
                          Ударные
                        </a>
                      </Button>
                    )}
                    {reference.bass_stem_url && (
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href={reference.bass_stem_url} target="_blank" rel="noopener noreferrer">
                          <Volume2 className="w-4 h-4" />
                          Бас
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Стемы ещё не созданы
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Separator />

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium text-muted-foreground">Действия</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleGenerateCover} className="gap-2">
              <Wand2 className="w-4 h-4" />
              Создать кавер
            </Button>
            <Button onClick={handleGenerateExtend} variant="secondary" className="gap-2">
              <Copy className="w-4 h-4" />
              Расширить
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleSeparateStems} 
              variant="outline" 
              className="gap-2"
              disabled={reference.stems_status === 'processing'}
            >
              <Layers className="w-4 h-4" />
              Разделить
            </Button>
            <Button 
              onClick={() => reanalyzeMutation.mutate()} 
              variant="outline" 
              className="gap-2"
              disabled={reanalyzeMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
              Переанализ
            </Button>
          </div>

          <Button
            onClick={() => deleteMutation.mutate()}
            variant="destructive"
            className="w-full gap-2"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
            Удалить аудио
          </Button>
        </motion.div>
      </div>
    </ScrollArea>
  );
}
