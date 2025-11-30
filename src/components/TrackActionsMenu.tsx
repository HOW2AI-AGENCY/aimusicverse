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
import { MoreVertical, Trash2 } from 'lucide-react';
import { ExtendTrackDialog } from './ExtendTrackDialog';
import { LyricsDialog } from './LyricsDialog';
import { TrackDetailDialog } from './TrackDetailDialog';
import { AddVocalsDialog } from './AddVocalsDialog';
import { AddInstrumentalDialog } from './AddInstrumentalDialog';
import { useTrackActions } from '@/hooks/useTrackActions';
import { TrackInfoSection } from './track-menu/TrackInfoSection';
import { TrackEditSection } from './track-menu/TrackEditSection';
import { TrackProcessingSection } from './track-menu/TrackProcessingSection';
import { TrackShareSection } from './track-menu/TrackShareSection';

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
    handleCreateVideo,
  } = useTrackActions();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <TrackInfoSection
            track={track}
            onDetailClick={() => setDetailDialogOpen(true)}
            onLyricsClick={() => setLyricsDialogOpen(true)}
          />

          <TrackEditSection
            track={track}
            isProcessing={isProcessing}
            onExtendClick={() => setExtendDialogOpen(true)}
            onAddVocalsClick={() => setAddVocalsDialogOpen(true)}
            onAddInstrumentalClick={() => setAddInstrumentalDialogOpen(true)}
            onRemix={() => handleRemix(track)}
          />

          <TrackProcessingSection
            track={track}
            isProcessing={isProcessing}
            onSeparateVocals={(mode) => handleSeparateVocals(track, mode)}
            onGenerateCover={() => handleGenerateCover(track)}
            onConvertToWav={() => handleConvertToWav(track)}
            onCreateVideo={() => handleCreateVideo(track)}
          />

          <TrackShareSection
            track={track}
            isProcessing={isProcessing}
            onDownload={onDownload || (() => {})}
            onShare={() => handleShare(track)}
            onTogglePublic={() => handleTogglePublic(track)}
          />

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
