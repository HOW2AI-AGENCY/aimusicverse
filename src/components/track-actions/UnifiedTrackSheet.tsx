/**
 * UnifiedTrackSheet - Minimalist flat track actions panel
 * Compact header with maximized scroll area
 */

import { useState, useEffect } from 'react';
import type { Track } from '@/types/track';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTrackActionsState } from '@/hooks/useTrackActionsState';
import { TrackDialogsPortal } from './TrackDialogsPortal';
import { CompactSheetHeader } from './CompactSheetHeader';
import { PromptPreview } from './sections/PromptPreview';
import { LyricsPreview } from './sections/LyricsPreview';
import { ActionGroup, ActionDivider, ActionGridContainer } from './ActionGrid';
import { IconGridButton } from './IconGridButton';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticImpact } from '@/lib/haptic';
import { 
  ImagePlus, Disc, Plus, Music, Video, Mic2, Guitar,
  Layers, RefreshCw, Scissors, Wand2, Music2, FileMusic,
  FileAudio, Archive, Send, Link, ListMusic, Folder,
  Info, Pencil, Globe, Lock, Trash2, Sparkles, Check, Loader2
} from 'lucide-react';
import { isActionAvailable } from '@/lib/trackActionConditions';

interface UnifiedTrackSheetProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
  onDownload?: () => void;
  trackList?: Track[];
  trackIndex?: number;
}

interface TrackVersion {
  id: string;
  version_label: string | null;
}

export function UnifiedTrackSheet({ 
  track, 
  open, 
  onOpenChange,
  onDelete,
  onDownload,
}: UnifiedTrackSheetProps) {
  useTelegramBackButton({
    visible: open,
    onClick: () => onOpenChange(false),
  });

  const [versions, setVersions] = useState<TrackVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [trackStatus, setTrackStatus] = useState({ hasMidi: false, hasNotes: false });

  const {
    actionState,
    isProcessing,
    dialogs,
    closeDialog,
    executeAction,
    handleConfirmDelete,
    stems,
  } = useTrackActionsState({
    track: track!,
    onDelete,
    onDownload,
    onClose: () => onOpenChange(false),
  });

  // Fetch versions and status
  useEffect(() => {
    if (!track?.id || !open) return;

    const fetchData = async () => {
      const [versionsResult, transcriptionsResult] = await Promise.all([
        supabase
          .from('track_versions')
          .select('id, version_label')
          .eq('track_id', track.id)
          .order('clip_index', { ascending: true }),
        supabase
          .from('stem_transcriptions')
          .select('midi_url, pdf_url')
          .eq('track_id', track.id),
      ]);

      setVersions(versionsResult.data || []);
      setActiveVersionId((track as any).active_version_id || versionsResult.data?.[0]?.id || null);

      const transcriptions = transcriptionsResult.data || [];
      setTrackStatus({
        hasMidi: transcriptions.some(t => !!t.midi_url),
        hasNotes: transcriptions.some(t => !!t.pdf_url),
      });
    };

    fetchData();
  }, [track?.id, open]);

  const handleVersionSwitch = async (versionId: string) => {
    if (versionId === activeVersionId || !track) return;
    
    hapticImpact('light');
    
    try {
      await supabase
        .from('track_versions')
        .update({ is_primary: false })
        .eq('track_id', track.id);

      await supabase
        .from('track_versions')
        .update({ is_primary: true })
        .eq('id', versionId);

      await supabase
        .from('tracks')
        .update({ active_version_id: versionId })
        .eq('id', track.id);
      
      setActiveVersionId(versionId);
      const version = versions.find(v => v.id === versionId);
      toast.success(`Версия ${version?.version_label || 'A'}`);
    } catch {
      toast.error('Ошибка переключения');
    }
  };

  if (!track) return null;

  // Action visibility checks
  const showGenerateCover = isActionAvailable('generate_cover', track, actionState);
  const showCover = isActionAvailable('cover', track, actionState);
  const showExtend = isActionAvailable('extend', track, actionState);
  const showRemix = isActionAvailable('remix', track, actionState);
  const showAddVocals = isActionAvailable('add_vocals', track, actionState);
  const showAddInstrumental = isActionAvailable('add_instrumental', track, actionState);
  const showStudio = isActionAvailable('open_studio', track, actionState);
  const showReplaceSection = isActionAvailable('replace_section', track, actionState);
  const showStemsSimple = isActionAvailable('stems_simple', track, actionState);
  const showStemsDetailed = isActionAvailable('stems_detailed', track, actionState);
  const showMidi = isActionAvailable('transcribe_midi', track, actionState);
  const showNotes = isActionAvailable('transcribe_notes', track, actionState);
  const showMp3 = isActionAvailable('download_mp3', track, actionState);
  const showWav = isActionAvailable('download_wav', track, actionState);
  const showDownloadStems = isActionAvailable('download_stems', track, actionState);
  const showTelegram = isActionAvailable('send_telegram', track, actionState);
  const showCopyLink = isActionAvailable('copy_link', track, actionState);
  const showPlaylist = isActionAvailable('add_to_playlist', track, actionState);
  const showProject = isActionAvailable('add_to_project', track, actionState);
  const showDetails = isActionAvailable('details', track, actionState);
  const showRename = isActionAvailable('rename', track, actionState);
  const showTogglePublic = isActionAvailable('toggle_public', track, actionState);
  const showUpscaleHd = isActionAvailable('upscale_hd', track, actionState);
  
  // HD status
  const hasHdAudio = !!(track as any).audio_url_hd || (track as any).audio_quality === 'hd';
  const isUpscaling = (track as any).upscale_status === 'processing';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] sm:h-[70vh] max-h-[85vh] sm:max-h-[70vh] rounded-t-2xl flex flex-col pb-0 px-0 bg-background/95 backdrop-blur-xl"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Compact Header - Cover + Title + Quick Actions in one row */}
          <div className="px-4 flex-shrink-0">
            <CompactSheetHeader 
              track={track}
              versions={versions.map(v => ({ id: v.id, label: v.version_label || 'A' }))}
              activeVersionId={activeVersionId}
              onVersionSwitch={handleVersionSwitch}
              onClose={() => onOpenChange(false)}
            />
          </div>

          <ActionDivider />

          {/* Scrollable content - Prompt, Lyrics, and Actions */}
          <ScrollArea className="flex-1">
            <div className="px-4 pb-safe">
              {/* Content previews - now inside scroll area */}
              {(track.prompt || track.style || track.lyrics) && (
                <div className="py-2 space-y-2">
                  <PromptPreview prompt={track.prompt} style={track.style} />
                  <LyricsPreview lyrics={track.lyrics} />
                </div>
              )}

              <ActionGridContainer>
                {/* Create actions */}
                <ActionGroup title="Создать">
                  {showGenerateCover && (
                    <IconGridButton icon={ImagePlus} label="Обложка" color="pink" onClick={() => executeAction('generate_cover')} disabled={isProcessing} />
                  )}
                  {showCover && (
                    <IconGridButton icon={Disc} label="Кавер" color="purple" onClick={() => executeAction('cover')} />
                  )}
                  {showExtend && (
                    <IconGridButton icon={Plus} label="Расширить" color="green" onClick={() => executeAction('extend')} />
                  )}
                  {showRemix && (
                    <IconGridButton icon={Music} label="Ремикс" color="amber" onClick={() => executeAction('remix')} disabled={isProcessing} />
                  )}
                  <IconGridButton icon={Video} label="Видео" color="blue" onClick={() => executeAction('generate_video')} disabled={isProcessing} />
                  {showAddVocals && (
                    <IconGridButton icon={Mic2} label="Вокал" color="cyan" onClick={() => executeAction('add_vocals')} disabled={isProcessing} />
                  )}
                  {showAddInstrumental && (
                    <IconGridButton icon={Guitar} label="Инструм." color="orange" onClick={() => executeAction('add_instrumental')} disabled={isProcessing} />
                  )}
                </ActionGroup>

                {/* Studio actions */}
                <ActionGroup title="Студия">
                  {showStudio && (
                    <IconGridButton icon={Layers} label="Студия" color="blue" badge={actionState.stemCount > 0 ? actionState.stemCount : undefined} onClick={() => executeAction('open_studio')} />
                  )}
                  {showReplaceSection && (
                    <IconGridButton icon={RefreshCw} label="Секция" color="amber" onClick={() => executeAction('replace_section')} />
                  )}
                  {showStemsSimple && (
                    <IconGridButton icon={Scissors} label="2 стема" color="green" onClick={() => executeAction('stems_simple')} disabled={isProcessing} />
                  )}
                  {showStemsDetailed && (
                    <IconGridButton icon={Wand2} label="6+ стемов" color="purple" onClick={() => executeAction('stems_detailed')} disabled={isProcessing} />
                  )}
                  {showMidi && (
                    <IconGridButton icon={Music2} label="MIDI" color="pink" onClick={() => executeAction('transcribe_midi')} />
                  )}
                  {showNotes && (
                    <IconGridButton icon={FileMusic} label="Ноты" color="orange" onClick={() => executeAction('transcribe_notes')} />
                  )}
                </ActionGroup>

                {/* Export actions */}
                <ActionGroup title="Экспорт">
                  {showMp3 && (
                    <IconGridButton icon={FileAudio} label="MP3" color="green" onClick={() => executeAction('download_mp3')} />
                  )}
                  {showWav && (
                    <IconGridButton icon={FileMusic} label="WAV" color="blue" onClick={() => executeAction('download_wav')} disabled={isProcessing} />
                  )}
                  {showDownloadStems && (
                    <IconGridButton icon={Archive} label="Стемы" color="purple" badge={actionState.stemCount > 0 ? actionState.stemCount : undefined} onClick={() => executeAction('download_stems')} />
                  )}
                  {showTelegram && (
                    <IconGridButton icon={Send} label="Telegram" color="blue" onClick={() => executeAction('send_telegram')} disabled={isProcessing} />
                  )}
                  {showCopyLink && (
                    <IconGridButton icon={Link} label="Ссылка" color="muted" onClick={() => executeAction('copy_link')} />
                  )}
                  {showPlaylist && (
                    <IconGridButton icon={ListMusic} label="Плейлист" color="amber" onClick={() => executeAction('add_to_playlist')} />
                  )}
                  {showProject && (
                    <IconGridButton icon={Folder} label="Проект" color="green" onClick={() => executeAction('add_to_project')} />
                  )}
                </ActionGroup>

                {/* Quality actions */}
                {showUpscaleHd && (
                  <ActionGroup title="Качество">
                    {hasHdAudio ? (
                      <IconGridButton 
                        icon={Check} 
                        label="HD 48kHz ✓" 
                        color="green" 
                        disabled 
                        onClick={() => {}}
                      />
                    ) : isUpscaling ? (
                      <IconGridButton 
                        icon={Loader2} 
                        label="Улучшение..." 
                        color="amber" 
                        disabled 
                        onClick={() => {}}
                      />
                    ) : (
                      <IconGridButton 
                        icon={Sparkles} 
                        label="HD Audio" 
                        color="amber" 
                        onClick={() => executeAction('upscale_hd')} 
                        disabled={isProcessing}
                      />
                    )}
                  </ActionGroup>
                )}

                {/* Utils actions */}
                <ActionGroup title="Управление">
                  {showDetails && (
                    <IconGridButton icon={Info} label="Детали" color="sky" onClick={() => executeAction('details')} />
                  )}
                  {showRename && (
                    <IconGridButton icon={Pencil} label="Имя" color="amber" onClick={() => executeAction('rename')} />
                  )}
                  {showTogglePublic && (
                    <IconGridButton 
                      icon={track.is_public ? Lock : Globe} 
                      label={track.is_public ? 'Скрыть' : 'Открыть'} 
                      color={track.is_public ? 'orange' : 'green'} 
                      onClick={() => executeAction('toggle_public')} 
                      disabled={isProcessing} 
                    />
                  )}
                  <IconGridButton icon={Trash2} label="Удалить" color="red" onClick={() => executeAction('delete_all')} />
                </ActionGroup>
              </ActionGridContainer>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <TrackDialogsPortal
        track={track}
        dialogs={dialogs}
        onCloseDialog={closeDialog}
        onConfirmDelete={handleConfirmDelete}
        stems={stems}
      />
    </>
  );
}
