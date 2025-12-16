/**
 * MobileMainTab - Main tab content for mobile studio
 * Contains: Waveform timeline, lyrics, track info
 */

import { ReactNode } from 'react';
import { Music2, Mic } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MobileMainTabProps {
  waveformTimeline: ReactNode;
  lyricsPanel?: ReactNode;
  trackInfo?: {
    title: string;
    style?: string | null;
    tags?: string | null;
    hasStems?: boolean;
    stemsCount?: number;
  };
}

export function MobileMainTab({
  waveformTimeline,
  lyricsPanel,
  trackInfo,
}: MobileMainTabProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Waveform Timeline */}
      <div className="shrink-0">
        {waveformTimeline}
      </div>

      {/* Track Info Card */}
      {trackInfo && (
        <div className="px-4 py-3 border-b border-border/30">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <Music2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{trackInfo.title}</h3>
              {trackInfo.style && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {trackInfo.style}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {trackInfo.hasStems && (
                  <Badge variant="secondary" className="text-[10px]">
                    {trackInfo.stemsCount || 0} стемов
                  </Badge>
                )}
                {trackInfo.tags?.split(',').slice(0, 3).map((tag, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="text-[10px] bg-muted/30"
                  >
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lyrics Panel */}
      {lyricsPanel && (
        <div className="flex-1 overflow-y-auto">
          {lyricsPanel}
        </div>
      )}
    </div>
  );
}
