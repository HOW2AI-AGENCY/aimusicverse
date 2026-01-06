/**
 * TrackCoverSection - Full-width track cover with title overlay
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Music2 } from 'lucide-react';
import type { Track } from '@/types/track';

interface TrackCoverSectionProps {
  track: Track;
}

export const TrackCoverSection = memo(function TrackCoverSection({ track }: TrackCoverSectionProps) {
  return (
    <div className="relative -mx-4 sm:mx-0">
      {track.cover_url ? (
        <div className="relative">
          <img
            src={track.cover_url}
            alt={track.title || 'Track cover'}
            className="w-full aspect-square sm:aspect-video sm:max-h-64 object-cover sm:rounded-xl"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent sm:rounded-xl" />
        </div>
      ) : (
        <div className="w-full aspect-square sm:aspect-video sm:max-h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center sm:rounded-xl">
          <Music2 className="w-24 h-24 text-primary/40" />
        </div>
      )}
      
      {/* Title overlay on cover */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
        <h3 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
          {track.title || 'Без названия'}
        </h3>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant={track.status === 'completed' ? 'default' : 'secondary'} className="bg-background/80 backdrop-blur-sm">
            {track.status}
          </Badge>
          {track.is_public && (
            <Badge variant="outline" className="border-primary bg-background/80 backdrop-blur-sm">
              Публичный
            </Badge>
          )}
          {track.generation_mode && (
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm capitalize">
              {track.generation_mode === 'cover' ? 'Кавер' : 
               track.generation_mode === 'extend' ? 'Расширение' : 
               track.generation_mode}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});
