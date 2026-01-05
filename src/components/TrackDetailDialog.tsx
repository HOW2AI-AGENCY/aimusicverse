import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Track } from '@/types/track';
import { Music2 } from 'lucide-react';
import { TrackDetailContent } from './track-detail/TrackDetailContent';
import { TrackDetailSheet } from './TrackDetailSheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface TrackDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function TrackDetailDialog({ open, onOpenChange, track }: TrackDetailDialogProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <TrackDetailSheet open={open} onOpenChange={onOpenChange} track={track} />;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            Детали трека
          </DialogTitle>
        </DialogHeader>

        <TrackDetailContent 
          track={track} 
          variant="dialog" 
          className="flex-1"
        />
      </DialogContent>
    </Dialog>
  );
}
