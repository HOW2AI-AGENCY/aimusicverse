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
import { MoreVertical, Trash2, Info, FileText } from 'lucide-react';
import { ExtendTrackDialog } from './ExtendTrackDialog';
import { LyricsDialog } from './LyricsDialog';
import { TrackDetailDialog } from './TrackDetailDialog';
import { AddVocalsDialog } from './AddVocalsDialog';
import { AddInstrumentalDialog } from './AddInstrumentalDialog';
import { useTrackActions } from '@/hooks/useTrackActions';
import { TrackEditSection } from './track-menu/TrackEditSection';
import { TrackProcessingSection } from './track-menu/TrackProcessingSection';
import { TrackShareSection } from './track-menu/TrackShareSection';
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

        <DropdownMenuContent align="end" className="w-56 max-h-[70vh] overflow-y-auto">
          {/* Info */}
          <TrackInfoSection
            track={track}
            onDetailClick={() => setDetailDialogOpen(true)}
            onLyricsClick={() => setLyricsDialogOpen(true)}
          />

          <DropdownMenuSeparator />

          {/* Studio */}
          <TrackStudioSection track={track} stemCount={stemCount} />

          {stemCount > 0 && <DropdownMenuSeparator />}

          {/* Edit */}
          {track.audio_url && track.status === 'completed' && (
            <>
              <TrackEditSection
                track={track}
                isProcessing={isProcessing}
                onExtendClick={() => setExtendDialogOpen(true)}
                onAddVocalsClick={() => setAddVocalsDialogOpen(true)}
                onAddInstrumentalClick={() => setAddInstrumentalDialogOpen(true)}
                onRemix={() => handleRemix(track)}
              />
              <DropdownMenuSeparator />
            </>
          )}

          {/* Processing */}
          {track.audio_url && track.status === 'completed' && (
            <>
              <TrackProcessingSection
                track={track}
                isProcessing={isProcessing}
                onSeparateVocals={(mode) => handleSeparateVocals(track, mode)}
                onGenerateCover={() => handleGenerateCover(track)}
                onConvertToWav={() => handleConvertToWav(track)}
                onTranscribeMidi={handleTranscribeMidi}
              />
              <DropdownMenuSeparator />
            </>
          )}

          {/* Share */}
          <TrackShareSection
            track={track}
            isProcessing={isProcessing}
            onDownload={onDownload || (() => {})}
            onShare={() => handleShare(track)}
            onTogglePublic={() => handleTogglePublic(track)}
            onSendToTelegram={() => handleSendToTelegram(track)}
          />

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
