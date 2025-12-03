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
  MoreVertical, Trash2, Plus, Mic, Volume2, Music, 
  Wand2, Scissors, ImagePlus, FileAudio, Music2, Download, Share2, 
  Send, Lock, Globe, Sparkles, Folder, ListMusic, Layers 
} from 'lucide-react';
import { ExtendTrackDialog } from './ExtendTrackDialog';
import { LyricsDialog } from './LyricsDialog';
import { TrackDetailDialog } from './TrackDetailDialog';
import { AddVocalsDialog } from './AddVocalsDialog';
import { AddInstrumentalDialog } from './AddInstrumentalDialog';
import { CreateArtistDialog } from './CreateArtistDialog';
import { AddToProjectDialog } from './track-menu/AddToProjectDialog';
import { ShareTrackDialog } from './track-menu/ShareTrackDialog';
import { PlaylistSelector } from './track-menu/PlaylistSelector';
import { AddToPlaylistDialog } from './track/AddToPlaylistDialog';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useTrackActions } from '@/hooks/useTrackActions';
import { TrackInfoSection } from './track-menu/TrackInfoSection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useHapticFeedback } from '@/lib/mobile-utils';

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
  const [createArtistDialogOpen, setCreateArtistDialogOpen] = useState(false);
  const [addToProjectDialogOpen, setAddToProjectDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [playlistSelectorOpen, setPlaylistSelectorOpen] = useState(false);
  const [addToPlaylistDialogOpen, setAddToPlaylistDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); // T064 - Delete confirmation
  const [stemCount, setStemCount] = useState(0);
  const navigate = useNavigate();
  
  // T063 - Haptic feedback for all track actions
  const triggerSelectionHaptic = useHapticFeedback('selection');
  const triggerSuccessHaptic = useHapticFeedback('success');
  const triggerErrorHaptic = useHapticFeedback('error');

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

  const handleTranscribeMidi = () => {
    if (!track.audio_url) return;
    
    // FIXME: Implement MIDI transcription functionality
    // This requires useMidiTranscription hook to be properly implemented
    toast.info('MIDI transcription feature coming soon!');
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

          {/* TODO: T062 - Version Switcher Integration */}
          {/* Future: Add inline version switcher here for quick version switching */}
          {/* <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <GitBranch className="w-4 h-4 mr-2" />
              Версии ({versionCount})
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {versions.map(version => (
                <DropdownMenuItem key={version.id} onClick={() => switchVersion(version.id)}>
                  <Check className={cn("w-4 h-4 mr-2", version.is_master ? "visible" : "invisible")} />
                  {version.version_type} - v{version.version_number}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator /> */}

          {/* Studio Section - Show if stems available */}
          {stemCount > 0 && (
            <>
              <DropdownMenuItem onClick={() => navigate(`/studio/${track.id}`)}>
                <Layers className="w-4 h-4 mr-2" />
                Открыть в студии
                <span className="ml-auto text-xs text-muted-foreground">{stemCount} стемов</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Edit Section */}
          {track.audio_url && track.status === 'completed' && (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Music className="w-4 h-4 mr-2" />
                  Редактировать
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8} alignOffset={-4}>
                  <DropdownMenuItem onClick={() => {
                    triggerSelectionHaptic(); // T063
                    setExtendDialogOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Расширить
                  </DropdownMenuItem>

                  {/* Show "Add vocals" only for instrumental tracks (no vocals) */}
                  {(track.is_instrumental === true || track.has_vocals === false) && (
                    <DropdownMenuItem onClick={() => {
                      triggerSelectionHaptic();
                      setAddVocalsDialogOpen(true);
                    }}>
                      <Mic className="w-4 h-4 mr-2" />
                      Добавить вокал
                    </DropdownMenuItem>
                  )}

                  {/* Show "Add instrumental/arrangement" for tracks with vocals */}
                  {track.has_vocals === true && (
                    <DropdownMenuItem onClick={() => {
                      triggerSelectionHaptic();
                      setAddInstrumentalDialogOpen(true);
                    }}>
                      <Volume2 className="w-4 h-4 mr-2" />
                      {stemCount > 0 ? 'Новая аранжировка' : 'Добавить инструментал'}
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
                <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8} alignOffset={-4}>
                  {/* Stem separation - only show if track doesn't have stems yet */}
                  {track.suno_id && stemCount === 0 && (
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

              <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                Поделиться
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleSendToTelegram(track)} disabled={isProcessing}>
                <Send className="w-4 h-4 mr-2" />
                Отправить в Telegram
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setAddToProjectDialogOpen(true)}>
                <Folder className="w-4 h-4 mr-2" />
                Добавить в проект
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => {
                triggerSelectionHaptic();
                setAddToPlaylistDialogOpen(true);
              }}>
                <ListMusic className="w-4 h-4 mr-2" />
                Добавить в плейлист
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setCreateArtistDialogOpen(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Создать артиста
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
          
          {/* Delete - T064: With confirmation dialog */}
          <DropdownMenuItem 
            onClick={() => {
              triggerSelectionHaptic();
              setDeleteConfirmOpen(true);
            }} 
            className="text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* T064 - Confirmation dialog for destructive delete action */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Удалить трек?"
        description={`Вы уверены, что хотите удалить трек "${track.title || 'Без названия'}"? Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        variant="destructive"
        onConfirm={() => {
          triggerSuccessHaptic();
          onDelete?.();
        }}
        onCancel={() => {
          triggerSelectionHaptic();
        }}
      />

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

      <CreateArtistDialog
        open={createArtistDialogOpen}
        onOpenChange={setCreateArtistDialogOpen}
        fromTrack={{
          title: track.title,
          style: track.style,
          tags: track.tags,
          cover_url: track.cover_url,
        }}
      />

      <AddToProjectDialog
        open={addToProjectDialogOpen}
        onOpenChange={setAddToProjectDialogOpen}
        track={track}
      />

      <ShareTrackDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        track={track}
      />

      <PlaylistSelector
        open={playlistSelectorOpen}
        onOpenChange={setPlaylistSelectorOpen}
        track={track}
      />

      <AddToPlaylistDialog
        open={addToPlaylistDialogOpen}
        onOpenChange={setAddToPlaylistDialogOpen}
        track={track}
      />
    </>
  );
}
