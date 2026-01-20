/**
 * Admin Tracks Tab Component
 * 
 * Track list with search and details view.
 * 
 * @module components/admin/dashboard/tabs/TracksTab
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music, Search, Globe, Lock } from 'lucide-react';

interface Track {
  id: string;
  title: string | null;
  cover_url: string | null;
  creator_username?: string | null;
  is_public: boolean;
  status: string;
}

interface TracksTabProps {
  /** List of tracks to display */
  tracks: Track[] | undefined;
  /** Whether tracks are loading */
  isLoading: boolean;
  /** Current search query */
  searchQuery: string;
  /** Callback when search changes */
  onSearchChange: (query: string) => void;
  /** Callback when track is selected */
  onSelectTrack: (track: Track) => void;
}

/**
 * Tracks tab with search and list
 */
export function TracksTab({
  tracks,
  isLoading,
  searchQuery,
  onSearchChange,
  onSelectTrack,
}: TracksTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Music className="h-5 w-5" />
          Треки ({tracks?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Track List */}
        <ScrollArea className="h-[400px] md:h-[500px]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Загрузка...
            </div>
          ) : (
            <div className="space-y-2">
              {tracks?.map((track) => (
                <TrackListItem
                  key={track.id}
                  track={track}
                  onClick={() => onSelectTrack(track)}
                />
              ))}
              {tracks?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Треки не найдены
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * Single track list item
 */
function TrackListItem({ 
  track, 
  onClick 
}: { 
  track: Track; 
  onClick: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Cover */}
      <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
        {track.cover_url ? (
          <img 
            src={track.cover_url} 
            alt="" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Music className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm md:text-base truncate">
          {track.title || 'Без названия'}
        </div>
        <div className="text-xs md:text-sm text-muted-foreground truncate">
          @{track.creator_username || '—'}
        </div>
      </div>
      
      {/* Status */}
      <div className="flex items-center gap-1 md:gap-2">
        {track.is_public ? (
          <Globe className="h-4 w-4 text-green-500" />
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
        <Badge 
          variant={track.status === 'completed' ? 'default' : 'secondary'} 
          className="text-xs"
        >
          {track.status}
        </Badge>
      </div>
    </div>
  );
}
