import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Track } from '@/hooks/useTracks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music2, GitBranch, History, Sparkles } from 'lucide-react';
import { TrackDetailsTab } from './track-detail/TrackDetailsTab';
import { TrackVersionsTab } from './track-detail/TrackVersionsTab';
import { TrackChangelogTab } from './track-detail/TrackChangelogTab';
import { TrackAnalysisTab } from './track-detail/TrackAnalysisTab';

interface TrackDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function TrackDetailSheet({ open, onOpenChange, track }: TrackDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            Детали трека
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="details" className="flex-1 mt-4">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="details" className="gap-1 text-xs">
              <Music2 className="w-4 h-4" />
              <span className="hidden sm:inline">Детали</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-1 text-xs">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Анализ</span>
            </TabsTrigger>
            <TabsTrigger value="versions" className="gap-1 text-xs">
              <GitBranch className="w-4 h-4" />
              <span className="hidden sm:inline">Версии</span>
            </TabsTrigger>
            <TabsTrigger value="changelog" className="gap-1 text-xs">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">История</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-10rem)]">
            <div className="pr-4">
              <TabsContent value="details" className="mt-0">
                <TrackDetailsTab track={track} />
              </TabsContent>

              <TabsContent value="analysis" className="mt-0">
                <TrackAnalysisTab track={track} />
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
      </SheetContent>
    </Sheet>
  );
}
