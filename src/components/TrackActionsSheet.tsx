import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Track } from '@/hooks/useTracksOptimized';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Download, Share2, Info, Trash2, Eye, EyeOff, Send,
  Scissors, Wand2, ImagePlus, FileAudio, Music2, FileText, Layers,
  Plus, Mic, Volume2, Music, Globe, Lock, ChevronDown
} from 'lucide-react';
import { useTrackActions } from '@/hooks/useTrackActions';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrackDetailSheet } from './TrackDetailSheet';
import { LyricsSheet } from './LyricsSheet';
import { ExtendTrackDialog } from './ExtendTrackDialog';
import { AddVocalsDialog } from './AddVocalsDialog';
import { AddInstrumentalDialog } from './AddInstrumentalDialog';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface TrackActionsSheetProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
  onDownload?: () => void;
}

export function TrackActionsSheet({ 
  track, 
  open, 
  onOpenChange,
  onDelete,
  onDownload 
}: TrackActionsSheetProps) {
  const navigate = useNavigate();
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [lyricsSheetOpen, setLyricsSheetOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [addVocalsDialogOpen, setAddVocalsDialogOpen] = useState(false);
  const [addInstrumentalDialogOpen, setAddInstrumentalDialogOpen] = useState(false);
  const [stemCount, setStemCount] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);
  
  const { 
    isProcessing, 
    handleTogglePublic, 
    handleSeparateVocals,
    handleGenerateCover,
    handleConvertToWav,
    handleShare,
    handleRemix,
    handleSendToTelegram,
  } = useTrackActions();

  useEffect(() => {
    if (!track) return;
    
    const fetchStemCount = async () => {
      const { count } = await supabase
        .from('track_stems')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', track.id);
      setStemCount(count || 0);
    };
    fetchStemCount();
  }, [track?.id]);

  const handleTranscribeMidi = () => {
    if (!track?.audio_url) return;
    
    // TODO: Implement MIDI transcription functionality
    // This requires useMidiTranscription hook to be properly implemented
    toast.info('MIDI transcription feature coming soon!');
    onOpenChange(false);
  };
  
  if (!track) return null;

  const hasLyrics = track.audio_url && track.status === 'completed' && (track.lyrics || (track.suno_task_id && track.suno_id));
  const isCompleted = track.audio_url && track.status === 'completed';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left">
              {track.title || 'Без названия'}
            </SheetTitle>
            {track.style && (
              <p className="text-sm text-muted-foreground text-left">
                {track.style}
              </p>
            )}
          </SheetHeader>
          
          <div className="mt-6 space-y-1">
            {/* Info Section */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => {
                onOpenChange(false);
                setDetailSheetOpen(true);
              }}
            >
              <Info className="w-5 h-5" />
              <span>Детали трека</span>
            </Button>

            {hasLyrics && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12"
                onClick={() => {
                  onOpenChange(false);
                  setLyricsSheetOpen(true);
                }}
              >
                <FileText className="w-5 h-5" />
                <span>Текст песни</span>
              </Button>
            )}

            {stemCount > 0 && (
              <>
                <Separator className="my-2" />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/studio/${track.id}`);
                  }}
                >
                  <Layers className="w-5 h-5" />
                  <span>Открыть в студии</span>
                  <span className="ml-auto text-xs text-muted-foreground">{stemCount} стемов</span>
                </Button>
              </>
            )}

            {isCompleted && (
              <>
                <Separator className="my-2" />
                
                {/* Edit Section - Collapsible */}
                <Collapsible open={editOpen} onOpenChange={setEditOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between gap-3 h-12"
                    >
                      <div className="flex items-center gap-3">
                        <Music className="w-5 h-5" />
                        <span>Редактировать</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${editOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11"
                      onClick={() => {
                        onOpenChange(false);
                        setExtendDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Расширить</span>
                    </Button>

                    {track.has_vocals === false && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={() => {
                          onOpenChange(false);
                          setAddVocalsDialogOpen(true);
                        }}
                      >
                        <Mic className="w-4 h-4" />
                        <span>Добавить вокал</span>
                      </Button>
                    )}

                    {track.has_vocals === true && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={() => {
                          onOpenChange(false);
                          setAddInstrumentalDialogOpen(true);
                        }}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Добавить инструментал</span>
                      </Button>
                    )}

                    {track.suno_id && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={async () => {
                          await handleRemix(track);
                          onOpenChange(false);
                        }}
                        disabled={isProcessing}
                      >
                        <Music className="w-4 h-4" />
                        <span>Ремикс</span>
                      </Button>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Processing Section - Collapsible */}
                <Collapsible open={processOpen} onOpenChange={setProcessOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between gap-3 h-12"
                    >
                      <div className="flex items-center gap-3">
                        <Wand2 className="w-5 h-5" />
                        <span>Обработка</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${processOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-1">
                    {track.suno_id && (
                      <>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-11"
                          onClick={async () => {
                            await handleSeparateVocals(track, 'simple');
                            onOpenChange(false);
                          }}
                          disabled={isProcessing}
                        >
                          <Scissors className="w-4 h-4" />
                          <span>Стемы (простое)</span>
                        </Button>

                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-11"
                          onClick={async () => {
                            await handleSeparateVocals(track, 'detailed');
                            onOpenChange(false);
                          }}
                          disabled={isProcessing}
                        >
                          <Wand2 className="w-4 h-4" />
                          <span>Стемы (детальное)</span>
                        </Button>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11"
                      onClick={async () => {
                        await handleGenerateCover(track);
                        onOpenChange(false);
                      }}
                      disabled={isProcessing}
                    >
                      <ImagePlus className="w-4 h-4" />
                      <span>Обложка</span>
                    </Button>

                    {track.suno_id && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11"
                        onClick={async () => {
                          await handleConvertToWav(track);
                          onOpenChange(false);
                        }}
                        disabled={isProcessing}
                      >
                        <FileAudio className="w-4 h-4" />
                        <span>WAV формат</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11"
                      onClick={handleTranscribeMidi}
                      disabled={isProcessing}
                    >
                      <Music2 className="w-4 h-4" />
                      <span>MIDI файл</span>
                    </Button>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-2" />

                {/* Share Section */}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    onDownload?.();
                    onOpenChange(false);
                  }}
                >
                  <Download className="w-5 h-5" />
                  <span>Скачать</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={async () => {
                    await handleShare(track);
                    onOpenChange(false);
                  }}
                >
                  <Share2 className="w-5 h-5" />
                  <span>Поделиться</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={async () => {
                    await handleSendToTelegram(track);
                    onOpenChange(false);
                  }}
                  disabled={isProcessing}
                >
                  <Send className="w-5 h-5" />
                  <span>Отправить в Telegram</span>
                </Button>

                <Separator className="my-2" />

                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={async () => {
                    await handleTogglePublic(track);
                    onOpenChange(false);
                  }}
                  disabled={isProcessing}
                >
                  {track.is_public ? (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Сделать приватным</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-5 h-5" />
                      <span>Сделать публичным</span>
                    </>
                  )}
                </Button>
              </>
            )}

            <Separator className="my-2" />
            
            {/* Delete */}
            {onDelete && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive"
                onClick={() => {
                  onDelete();
                  onOpenChange(false);
                }}
              >
                <Trash2 className="w-5 h-5" />
                <span>Удалить</span>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <TrackDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        track={track}
      />

      <LyricsSheet
        open={lyricsSheetOpen}
        onOpenChange={setLyricsSheetOpen}
        track={track}
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
    </>
  );
}