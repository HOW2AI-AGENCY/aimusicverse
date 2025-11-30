import { useState } from 'react';
import { Track } from '@/hooks/useTracksOptimized';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2, Info, FileText, Edit3, Wand2, Share2, Send } from 'lucide-react';
import { ExtendTrackDialog } from './ExtendTrackDialog';
import { LyricsDialog } from './LyricsDialog';
import { TrackDetailDialog } from './TrackDetailDialog';
import { AddVocalsDialog } from './AddVocalsDialog';
import { AddInstrumentalDialog } from './AddInstrumentalDialog';
import { useTrackActions } from '@/hooks/useTrackActions';
import { TrackEditSection } from './track-menu/TrackEditSection';
import { TrackProcessingSection } from './track-menu/TrackProcessingSection';
import { TrackShareSection } from './track-menu/TrackShareSection';
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

  const {
    isProcessing,
    handleShare,
    handleRemix,
    handleSeparateVocals,
    handleTogglePublic,
    handleConvertToWav,
    handleGenerateCover,
  } = useTrackActions();

  const handleTranscribeMidi = async () => {
    const { useMidiTranscription } = await import('@/hooks/useMidiTranscription');
    const transcribe = useMidiTranscription();
    if (track.audio_url) {
      transcribe.mutate({
        trackId: track.id,
        audioUrl: track.audio_url,
        modelType: 'mt3',
      });
    }
  };

  const handleSendToTelegram = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Войдите в систему');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.telegram_id) {
        toast.error('Telegram не подключен');
        return;
      }

      toast.promise(
        supabase.functions.invoke('send-telegram-notification', {
          body: {
            chatId: profile.telegram_id,
            trackId: track.id,
            type: 'track_share'
          }
        }),
        {
          loading: 'Отправляем трек...',
          success: 'Трек отправлен в Telegram!',
          error: 'Ошибка отправки'
        }
      );
    } catch (error) {
      console.error('Error sending to Telegram:', error);
      toast.error('Ошибка отправки в Telegram');
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
          {/* Информация */}
          <DropdownMenuItem onClick={() => setDetailDialogOpen(true)}>
            <Info className="w-4 h-4 mr-2" />
            Детали трека
          </DropdownMenuItem>

          {track.audio_url && track.status === 'completed' && (track.lyrics || (track.suno_task_id && track.suno_id)) && (
            <DropdownMenuItem onClick={() => setLyricsDialogOpen(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Текст песни
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Редактирование */}
          {track.audio_url && track.status === 'completed' && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Edit3 className="w-4 h-4 mr-2" />
                Редактировать
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <TrackEditSection
                  track={track}
                  isProcessing={isProcessing}
                  onExtendClick={() => setExtendDialogOpen(true)}
                  onAddVocalsClick={() => setAddVocalsDialogOpen(true)}
                  onAddInstrumentalClick={() => setAddInstrumentalDialogOpen(true)}
                  onRemix={() => handleRemix(track)}
                />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {/* Обработка */}
          {track.audio_url && track.status === 'completed' && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Wand2 className="w-4 h-4 mr-2" />
                Обработка
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <TrackProcessingSection
                  track={track}
                  isProcessing={isProcessing}
                  onSeparateVocals={(mode) => handleSeparateVocals(track, mode)}
                  onGenerateCover={() => handleGenerateCover(track)}
                  onConvertToWav={() => handleConvertToWav(track)}
                  onTranscribeMidi={handleTranscribeMidi}
                />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          {/* Поделиться */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Share2 className="w-4 h-4 mr-2" />
              Поделиться
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <TrackShareSection
                track={track}
                isProcessing={isProcessing}
                onDownload={onDownload || (() => {})}
                onShare={() => handleShare(track)}
                onTogglePublic={() => handleTogglePublic(track)}
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSendToTelegram}>
                <Send className="w-4 h-4 mr-2" />
                Отправить в Telegram
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

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
