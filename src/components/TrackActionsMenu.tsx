import { useState } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreVertical,
  Info,
  FileText,
  Plus,
  Music,
  Scissors,
  Download,
  Share2,
  Globe,
  Lock,
  Trash2,
  Video,
  FileAudio,
  Wand2,
  Mic,
  ImagePlus,
  FileArchive,
  Volume2,
} from 'lucide-react';
import { ExtendTrackDialog } from './ExtendTrackDialog';
import { LyricsDialog } from './LyricsDialog';
import { TrackDetailDialog } from './TrackDetailDialog';
import { AddVocalsDialog } from './AddVocalsDialog';
import { AddInstrumentalDialog } from './AddInstrumentalDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrackActionsMenuProps {
  track: Track;
  onDelete?: () => void;
  onDownload?: () => void;
}

export function TrackActionsMenu({ track, onDelete, onDownload }: TrackActionsMenuProps) {
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [lyricsDialogOpen, setLyricsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addVocalsDialogOpen, setAddVocalsDialogOpen] = useState(false);
  const [addInstrumentalDialogOpen, setAddInstrumentalDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleShare = async () => {
    if (navigator.share && track.audio_url) {
      try {
        await navigator.share({
          title: track.title || 'Трек',
          text: `Послушай ${track.title || 'этот трек'}`,
          url: track.audio_url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleRemix = async () => {
    if (!track.suno_id) {
      toast.error('Невозможно создать ремикс для этого трека');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-remix', {
        body: {
          audioId: track.suno_id,
          prompt: `Remix of ${track.prompt}`,
          style: track.style,
        },
      });

      if (error) throw error;

      toast.success('Ремикс начат! Трек появится в библиотеке после завершения');
    } catch (error: any) {
      console.error('Remix error:', error);
      toast.error(error.message || 'Ошибка создания ремикса');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSeparateVocals = async (mode: 'simple' | 'detailed' = 'simple') => {
    if (!track.suno_task_id || !track.suno_id) {
      toast.error('Невозможно разделить вокал для этого трека');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-separate-vocals', {
        body: {
          taskId: track.suno_task_id,
          audioId: track.suno_id,
          mode,
        },
      });

      if (error) throw error;

      toast.success('Разделение началось! Стемы появятся после завершения');
    } catch (error: any) {
      console.error('Separation error:', error);
      toast.error(error.message || 'Ошибка разделения');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePublic = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('tracks')
        .update({ is_public: !track.is_public })
        .eq('id', track.id);

      if (error) throw error;

      toast.success(track.is_public ? 'Трек теперь приватный' : 'Трек теперь публичный');
      window.location.reload();
    } catch (error: any) {
      console.error('Toggle public error:', error);
      toast.error('Ошибка изменения видимости');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertToWav = async () => {
    if (!track.suno_id) {
      toast.error('Невозможно конвертировать этот трек');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-convert-wav', {
        body: { audioId: track.suno_id },
      });

      if (error) throw error;

      toast.success('Конвертация в WAV началась!', {
        description: 'Файл будет готов через несколько минут',
      });
    } catch (error: any) {
      console.error('WAV conversion error:', error);
      toast.error(error.message || 'Ошибка конвертации');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateCover = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-generate-cover-image', {
        body: {
          trackId: track.id,
          prompt: track.prompt,
          style: track.style,
        },
      });

      if (error) throw error;

      toast.success('Генерация обложки началась!', {
        description: 'Новая обложка будет готова через минуту',
      });
    } catch (error: any) {
      console.error('Cover generation error:', error);
      toast.error(error.message || 'Ошибка генерации обложки');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!track.suno_id) {
      toast.error('Невозможно создать видео для этого трека');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('suno-create-video', {
        body: { audioId: track.suno_id },
      });

      if (error) throw error;

      toast.success('Создание видео началось!', {
        description: 'Видео будет готово через несколько минут',
      });
    } catch (error: any) {
      console.error('Video creation error:', error);
      toast.error(error.message || 'Ошибка создания видео');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setDetailDialogOpen(true)}>
            <Info className="w-4 h-4 mr-2" />
            Детали трека
          </DropdownMenuItem>

          {track.audio_url && track.status === 'completed' && (
            <>
              <DropdownMenuSeparator />
              
              {(track.lyrics || (track.suno_task_id && track.suno_id)) && (
                <DropdownMenuItem onClick={() => setLyricsDialogOpen(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Текст песни
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => setExtendDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Расширить трек
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setAddVocalsDialogOpen(true)}>
                <Mic className="w-4 h-4 mr-2" />
                Добавить вокал
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setAddInstrumentalDialogOpen(true)}>
                <Volume2 className="w-4 h-4 mr-2" />
                Добавить инструментал
              </DropdownMenuItem>

              {track.suno_id && (
                <DropdownMenuItem onClick={handleRemix} disabled={isProcessing}>
                  <Music className="w-4 h-4 mr-2" />
                  Создать ремикс
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {track.suno_task_id && track.suno_id && (
                <>
                  <DropdownMenuItem onClick={() => handleSeparateVocals('simple')} disabled={isProcessing}>
                    <Scissors className="w-4 h-4 mr-2" />
                    Стемы: Вокал/Инструментал
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleSeparateVocals('detailed')} disabled={isProcessing}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Стемы: Детальное разделение
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleGenerateCover} disabled={isProcessing}>
                <ImagePlus className="w-4 h-4 mr-2" />
                Сгенерировать обложку
              </DropdownMenuItem>

              {track.suno_id && (
                <>
                  <DropdownMenuItem onClick={handleConvertToWav} disabled={isProcessing}>
                    <FileAudio className="w-4 h-4 mr-2" />
                    Конвертировать в WAV
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleCreateVideo} disabled={isProcessing}>
                    <Video className="w-4 h-4 mr-2" />
                    Создать музыкальное видео
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Скачать MP3
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Поделиться
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleTogglePublic} disabled={isProcessing}>
                {track.is_public ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Сделать приватным
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Сделать публичным
                  </>
                )}
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExtendTrackDialog
        open={extendDialogOpen}
        onOpenChange={setExtendDialogOpen}
        track={track}
      />

      <AddVocalsDialog
        open={addVocalsDialogOpen}
        onOpenChange={setAddVocalsDialogOpen}
        track={track}
      />

      <AddInstrumentalDialog
        open={addInstrumentalDialogOpen}
        onOpenChange={setAddInstrumentalDialogOpen}
        track={track}
      />

      <LyricsDialog
        open={lyricsDialogOpen}
        onOpenChange={setLyricsDialogOpen}
        track={track}
      />

      <TrackDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        track={track}
      />
    </>
  );
}
