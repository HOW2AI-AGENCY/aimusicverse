import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Track } from '@/types/track';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music2, GitBranch, History, Sparkles, FileText, MessageSquare } from 'lucide-react';
import { TrackDetailsTab } from './track-detail/TrackDetailsTab';
import { TrackVersionsTab } from './track-detail/TrackVersionsTab';
import { TrackChangelogTab } from './track-detail/TrackChangelogTab';
import { TrackAnalysisTab } from './track-detail/TrackAnalysisTab';
import { TrackStemsTab } from './track-detail/TrackStemsTab';
import { LyricsView } from './track-detail/LyricsView';
import { CommentsList } from './comments/CommentsList';
import { HeaderVersionSelector } from './track-detail/HeaderVersionSelector';
import { useState } from 'react';

interface TrackDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function TrackDetailSheet({ open, onOpenChange, track }: TrackDetailSheetProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  
  // Use selected version or fall back to active version
  const currentVersionId = selectedVersionId || track.active_version_id || undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Music2 className="w-5 h-5 text-primary" />
              Детали трека
            </SheetTitle>
            <HeaderVersionSelector
              trackId={track.id}
              activeVersionId={track.active_version_id}
              onVersionChange={setSelectedVersionId}
            />
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" className="flex-1 mt-4">
          <TabsList className="grid w-full grid-cols-7 mb-4">
            <TabsTrigger value="details" className="gap-1 text-xs px-1">
              <Music2 className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="lyrics" className="gap-1 text-xs px-1">
              <FileText className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-1 text-xs px-1">
              <MessageSquare className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-1 text-xs px-1">
              <Sparkles className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="versions" className="gap-1 text-xs px-1">
              <GitBranch className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="stems" className="gap-1 text-xs px-1">
              <Music2 className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="changelog" className="gap-1 text-xs px-1">
              <History className="w-3.5 h-3.5" />
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-10rem)]">
            <div className="pr-4">
              <TabsContent value="details" className="mt-0">
                <TrackDetailsTab track={track} />
              </TabsContent>

              <TabsContent value="lyrics" className="mt-0">
                <LyricsView lyrics={track.lyrics} />
              </TabsContent>

              <TabsContent value="comments" className="mt-0">
                <CommentsList trackId={track.id} />
              </TabsContent>

              <TabsContent value="analysis" className="mt-0">
                <TrackAnalysisTab track={track} />
              </TabsContent>

              <TabsContent value="versions" className="mt-0">
                <TrackVersionsTab trackId={track.id} />
              </TabsContent>

              <TabsContent value="stems" className="mt-0">
                {/* T051 - Enhanced stems tab with better indicators */}
                <TrackStemsTab trackId={track.id} />
              </TabsContent>

              <TabsContent value="changelog" className="mt-0">
                {/* T053 - Version history display */}
                <TrackChangelogTab trackId={track.id} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
