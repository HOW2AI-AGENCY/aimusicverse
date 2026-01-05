/**
 * TrackStyleSection - Style and tags display
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { DetailSection } from '@/components/common/DetailSection';
import type { Track } from '@/types/track';

interface TrackStyleSectionProps {
  track: Track;
}

export const TrackStyleSection = memo(function TrackStyleSection({ track }: TrackStyleSectionProps) {
  if (!track.style && !track.tags) return null;

  return (
    <DetailSection icon={Tag} title="Стиль и теги" showSeparator>
      <div className="space-y-4">
        {track.style && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Стиль:</p>
            <Badge variant="outline" className="text-base px-3 py-1">
              {track.style}
            </Badge>
          </div>
        )}

        {track.tags && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Теги:</p>
            <div className="flex flex-wrap gap-2">
              {track.tags.split(',').map((tag, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {track.negative_tags && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Негативные теги:</p>
            <Badge variant="destructive">{track.negative_tags}</Badge>
          </div>
        )}
      </div>
    </DetailSection>
  );
});
