import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Track } from '@/hooks/useTracksOptimized';
import { TrackDetailsTab } from './TrackDetailsTab';
import { LyricsView } from './LyricsView';
import { VersionsTab } from './VersionsTab';
import { StemsTab } from './StemsTab';
import { ChangelogTab } from './ChangelogTab';
import { CommentsList } from '@/components/comments';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TrackDetailsSheetProps {
  track: Track;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

export function TrackDetailsSheet({
  track,
  open,
  onOpenChange,
  defaultTab = 'details',
}: TrackDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          'h-[70vh] md:h-[80vh] p-0 rounded-t-2xl',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          'duration-300'
        )}
      >
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-lg font-semibold truncate">
            {track.title || 'Track Details'}
          </SheetTitle>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-[calc(100%-80px)]"
        >
          <div className="overflow-x-auto">
            <TabsList className="w-max justify-start px-6 border-b rounded-none bg-transparent h-auto">
              <TabsTrigger
                value="details"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Детали
              </TabsTrigger>
              <TabsTrigger
                value="lyrics"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Текст
              </TabsTrigger>
              <TabsTrigger
                value="versions"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Версии
              </TabsTrigger>
              <TabsTrigger
                value="stems"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Стемы
              </TabsTrigger>
              <TabsTrigger
                value="changelog"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                История
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Комментарии
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100%-48px)]">
            <TabsContent value="details" className="p-6 m-0">
              <TrackDetailsTab track={track} />
            </TabsContent>

            <TabsContent value="lyrics" className="p-6 m-0">
              <LyricsView track={track} />
            </TabsContent>

            <TabsContent value="versions" className="p-6 m-0">
              <VersionsTab track={track} />
            </TabsContent>

            <TabsContent value="stems" className="p-6 m-0">
              <StemsTab track={track} />
            </TabsContent>

            <TabsContent value="changelog" className="p-6 m-0">
              <ChangelogTab track={track} />
            </TabsContent>

            <TabsContent value="comments" className="p-6 m-0">
              <CommentsList trackId={track.id} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
