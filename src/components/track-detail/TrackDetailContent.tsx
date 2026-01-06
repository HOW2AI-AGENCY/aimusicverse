/**
 * TrackDetailContent - Unified tabs content for track details
 * 
 * Replaces duplicate tab logic in:
 * - TrackDetailSheet (mobile)
 * - TrackDetailDialog (desktop)
 */

import { memo, ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music2, FileText, Sparkles, GitBranch, History, MessageSquare } from 'lucide-react';
import type { Track } from '@/types/track';
import { TrackDetailsTab } from './TrackDetailsTab';
import { TrackAnalysisTab } from './TrackAnalysisTab';
import { TrackVersionsTab } from './TrackVersionsTab';
import { TrackStemsTab } from './TrackStemsTab';
import { TrackChangelogTab } from './TrackChangelogTab';
import { CommentsList } from '@/components/comments/CommentsList';
import { LyricsView } from './LyricsView';

export interface TrackDetailContentProps {
  /** Track data */
  track: Track;
  /** Display variant (affects number of tabs and layout) */
  variant: 'sheet' | 'dialog';
  /** Scroll area height class */
  scrollHeight?: string;
  /** Additional className for tabs */
  className?: string;
}

/**
 * Tab configuration based on variant
 */
const SHEET_TABS = [
  { value: 'details', icon: Music2, label: null },
  { value: 'lyrics', icon: FileText, label: null },
  { value: 'comments', icon: MessageSquare, label: null },
  { value: 'analysis', icon: Sparkles, label: null },
  { value: 'versions', icon: GitBranch, label: null },
  { value: 'stems', icon: Music2, label: null },
  { value: 'changelog', icon: History, label: null },
] as const;

const DIALOG_TABS = [
  { value: 'details', icon: Music2, label: 'Детали' },
  { value: 'analysis', icon: Sparkles, label: 'Анализ' },
  { value: 'versions', icon: GitBranch, label: 'Версии' },
  { value: 'stems', icon: Music2, label: 'Стемы' },
  { value: 'changelog', icon: History, label: 'История' },
] as const;

export const TrackDetailContent = memo(function TrackDetailContent({
  track,
  variant,
  scrollHeight,
  className,
}: TrackDetailContentProps) {
  const tabs = variant === 'sheet' ? SHEET_TABS : DIALOG_TABS;
  const defaultScrollHeight = variant === 'sheet' 
    ? 'h-[calc(90vh-10rem)]' 
    : 'h-[calc(90vh-12rem)]';

  return (
    <Tabs defaultValue="details" className={className}>
      <TabsList className={`grid w-full mb-4 ${variant === 'sheet' ? 'grid-cols-7' : 'grid-cols-5'}`}>
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value} 
            className={variant === 'sheet' ? 'gap-1 text-xs px-1' : 'gap-2'}
          >
            <tab.icon className={variant === 'sheet' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <ScrollArea className={scrollHeight || defaultScrollHeight}>
        <div className="pr-4">
          <TabsContent value="details" className="mt-0">
            <TrackDetailsTab track={track} />
          </TabsContent>

          {/* Sheet-only: Lyrics tab */}
          {variant === 'sheet' && (
            <TabsContent value="lyrics" className="mt-0">
              <LyricsView lyrics={track.lyrics} />
            </TabsContent>
          )}

          {/* Sheet-only: Comments tab */}
          {variant === 'sheet' && (
            <TabsContent value="comments" className="mt-0">
              <CommentsList trackId={track.id} />
            </TabsContent>
          )}

          <TabsContent value="analysis" className="mt-0">
            <TrackAnalysisTab track={track} />
          </TabsContent>

          <TabsContent value="versions" className="mt-0">
            <TrackVersionsTab trackId={track.id} />
          </TabsContent>

          <TabsContent value="stems" className="mt-0">
            <TrackStemsTab trackId={track.id} />
          </TabsContent>

          <TabsContent value="changelog" className="mt-0">
            <TrackChangelogTab trackId={track.id} />
          </TabsContent>
        </div>
      </ScrollArea>
    </Tabs>
  );
});

export default TrackDetailContent;
