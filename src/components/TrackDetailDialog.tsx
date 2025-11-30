import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Track } from '@/hooks/useTracks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music2, GitBranch, History } from 'lucide-react';
import { TrackDetailsTab } from './track-detail/TrackDetailsTab';
import { TrackVersionsTab } from './track-detail/TrackVersionsTab';
import { TrackChangelogTab } from './track-detail/TrackChangelogTab';

interface TrackDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function TrackDetailDialog({ open, onOpenChange, track }: TrackDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            Детали трека
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="details" className="gap-2">
              <Music2 className="w-4 h-4" />
              Детали
            </TabsTrigger>
            <TabsTrigger value="versions" className="gap-2">
              <GitBranch className="w-4 h-4" />
              Версии
            </TabsTrigger>
            <TabsTrigger value="changelog" className="gap-2">
              <History className="w-4 h-4" />
              История
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-12rem)]">
            <div className="pr-4">
              <TabsContent value="details" className="mt-0">
                <TrackDetailsTab track={track} />
              </TabsContent>

              <TabsContent value="versions" className="mt-0">
                <TrackVersionsTab trackId={track.id} />
              </TabsContent>

              <TabsContent value="changelog" className="mt-0">
                <TrackChangelogTab trackId={track.id} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
