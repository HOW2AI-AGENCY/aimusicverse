import { useState, useEffect } from 'react';
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
import { 
  MoreVertical, Trash2, Info, FileText, Plus, Mic, Volume2, Music, 
  Wand2, Scissors, ImagePlus, FileAudio, Music2, Download, Share2, 
  Send, Lock, Globe 
} from 'lucide-react';
import { ExtendTrackDialog } from './ExtendTrackDialog';
import { LyricsDialog } from './LyricsDialog';
import { TrackDetailDialog } from './TrackDetailDialog';
import { AddVocalsDialog } from './AddVocalsDialog';
import { AddInstrumentalDialog } from './AddInstrumentalDialog';
import { useTrackActions } from '@/hooks/useTrackActions';
import { TrackStudioSection } from './track-menu/TrackStudioSection';
import { TrackInfoSection } from './track-menu/TrackInfoSection';
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
  const [stemCount, setStemCount] = useState(0);

  const {
    isProcessing,
    handleShare,
    handleRemix,
    handleSeparateVocals,
    handleTogglePublic,
    handleConvertToWav,
    handleGenerateCover,
    handleSendToTelegram,
  } = useTrackActions();

  useEffect(() => {
    const fetchStemCount = async () => {
      const { count } = await supabase
        .from('track_stems')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', track.id);
      setStemCount(count || 0);
    };
    fetchStemCount();
  }, [track.id]);

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


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 max-h-[70vh] bg-background/95 backdrop-blur-sm" style={{ zIndex: 9999 }}>
          {/* Info Section */}
          <TrackInfoSection
            track={track}
            onDetailClick={() => setDetailDialogOpen(true)}
            onLyricsClick={() => setLyricsDialogOpen(true)}
          />

          <DropdownMenuSeparator />

          {/* Studio Section */}
          <TrackStudioSection track={track} stemCount={stemCount} />

          {stemCount > 0 && <DropdownMenuSeparator />}

          {/* Edit Section */}
          {track.audio_url && track.status === 'completed' && (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Music className="w-4 h-4 mr-2" />
                  Редактировать
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm" sideOffset={8} alignOffset={-4}>
                  <DropdownMenuItem onClick={() => setExtendDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Расширить
                  </DropdownMenuItem>

                  {track.has_vocals === false && (
                    <DropdownMenuItem onClick={() => setAddVocalsDialogOpen(true)}>
                      <Mic className="w-4 h-4 mr-2" />
                      Добавить вокал
                    </DropdownMenuItem>
                  )}

                  {track.has_vocals === true && (
                    <DropdownMenuItem onClick={() => setAddInstrumentalDialogOpen(true)}>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Добавить инструментал
                    </DropdownMenuItem>
                  )}

                  {track.suno_id && (
                    <DropdownMenuItem onClick={() => handleRemix(track)} disabled={isProcessing}>
                      <Music className="w-4 h-4 mr-2" />
                      Ремикс
                    </DropdownMenuItem>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Processing Section */}
          {track.audio_url && track.status === 'completed' && (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Обработка
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm" sideOffset={8} alignOffset={-4}>
                  {track.suno_id && (
                    <>
                      <DropdownMenuItem onClick={() => handleSeparateVocals(track, 'simple')} disabled={isProcessing}>
                        <Scissors className="w-4 h-4 mr-2" />
                        Стемы (простое)
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => handleSeparateVocals(track, 'detailed')} disabled={isProcessing}>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Стемы (детальное)
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuItem onClick={() => handleGenerateCover(track)} disabled={isProcessing}>
                    <ImagePlus className="w-4 h-4 mr-2" />
                    Обложка
                  </DropdownMenuItem>

                  {track.suno_id && (
                    <DropdownMenuItem onClick={() => handleConvertToWav(track)} disabled={isProcessing}>
                      <FileAudio className="w-4 h-4 mr-2" />
                      WAV формат
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={handleTranscribeMidi} disabled={isProcessing}>
                    <Music2 className="w-4 h-4 mr-2" />
                    MIDI файл
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Share Section */}
          {track.audio_url && track.status === 'completed' && (
            <>
              <DropdownMenuItem onClick={onDownload || (() => {})}>
                <Download className="w-4 h-4 mr-2" />
                Скачать
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleShare(track)}>
                <Share2 className="w-4 h-4 mr-2" />
                Поделиться
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleSendToTelegram(track)} disabled={isProcessing}>
                <Send className="w-4 h-4 mr-2" />
                Отправить в Telegram
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => handleTogglePublic(track)} disabled={isProcessing}>
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
          
          {/* Delete */}
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
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
