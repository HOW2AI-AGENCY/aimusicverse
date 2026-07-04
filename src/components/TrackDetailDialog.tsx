import { UnifiedDialog } from "@/components/dialog";
import { Track } from "@/types/track";
import { TrackDetailContent } from "./track-detail/TrackDetailContent";

interface TrackDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function TrackDetailDialog({ open, onOpenChange, track }: TrackDetailDialogProps) {
  return (
    <UnifiedDialog variant="modal" open={open} onOpenChange={onOpenChange} title="Детали трека" size="xl">
      <TrackDetailContent track={track} variant="dialog" className="flex-1" />
    </UnifiedDialog>
  );
}
