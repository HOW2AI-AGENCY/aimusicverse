/**
 * TrackDetailPanel - Desktop track detail view
 * Shows track info, waveform, lyrics, versions, and actions
 */

import { useState } from 'react';
import { Track } from '@/hooks/useTracks';
import { useTrackVersions } from '@/hooks/useTrackVersions';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Music2, 
  FileText, 
  GitBranch, 
  Sparkles, 
  Download,
  Heart,
  Share2,
  MoreHorizontal,
  Mic2,
  Guitar
} from 'lucide-react';
import { TrackDetailsTab } from '@/components/track-detail/TrackDetailsTab';
import { TrackVersionsTab } from '@/components/track-detail/TrackVersionsTab';
import { TrackStemsTab } from '@/components/track-detail/TrackStemsTab';
import { TrackAnalysisTab } from '@/components/track-detail/TrackAnalysisTab';
import { LyricsView } from '@/components/track-detail/LyricsView';
import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';

// Helper to format duration
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface TrackDetailPanelProps {
  track: Track;
  onPlay: (track: Track) => void;
  onClose: () => void;
}

export function TrackDetailPanel({ track, onPlay, onClose }: TrackDetailPanelProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const { data: versions } = useTrackVersions(track.id);
  const { activeTrack, isPlaying } = usePlayerStore();
  
  const isCurrentTrack = activeTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;

  const handlePlayClick = () => {
    if (isCurrentTrack) {
      usePlayerStore.setState({ isPlaying: !isPlaying });
    } else {
      onPlay(track);
    }
  };

  const trackDuration = track.duration_seconds || 0;
  const genreTag = track.style_prompt?.split(' ')[0] || '';
  const moodTag = track.style_prompt?.split(' ')[1] || '';

  return (
    <div className="flex flex-col h-full">
      {/* Track Hero */}
      <div className="p-4 space-y-4">
        {/* Cover and Info */}
        <div className="flex gap-4">
          {/* Cover */}
          <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {track.cover_url ? (
              <img 
                src={track.cover_url} 
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <Music2 className="w-10 h-10 text-primary/40" />
              </div>
            )}
            
            {/* Play overlay */}
            <button
              onClick={handlePlayClick}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
            >
              {isCurrentlyPlaying ? (
                <Pause className="w-10 h-10 text-white" />
              ) : (
                <Play className="w-10 h-10 text-white" />
              )}
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <h2 className="text-lg font-semibold truncate">{track.title}</h2>
            
            <div className="flex flex-wrap gap-1.5">
              {genreTag && (
                <Badge variant="secondary" className="text-xs">
                  {genreTag}
                </Badge>
              )}
              {moodTag && (
                <Badge variant="outline" className="text-xs">
                  {moodTag}
                </Badge>
              )}
              {track.has_vocals && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Mic2 className="w-3 h-3" />
                  Вокал
                </Badge>
              )}
              {track.is_instrumental && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Guitar className="w-3 h-3" />
                  Инструментал
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {trackDuration ? formatDuration(trackDuration) : '—'} • {track.play_count || 0} прослушиваний
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handlePlayClick}
                size="sm"
                className="gap-1.5"
              >
                {isCurrentlyPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Пауза
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Играть
                  </>
                )}
              </Button>
              
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Heart className={cn(
                  "w-4 h-4",
                  track.is_liked && "fill-red-500 text-red-500"
                )} />
              </Button>
              
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Share2 className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Download className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 grid grid-cols-5 h-9">
          <TabsTrigger value="details" className="text-xs gap-1 px-2">
            <Music2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Детали</span>
          </TabsTrigger>
          <TabsTrigger value="lyrics" className="text-xs gap-1 px-2">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Текст</span>
          </TabsTrigger>
          <TabsTrigger value="versions" className="text-xs gap-1 px-2">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Версии</span>
            {versions && versions.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[9px] ml-1">
                {versions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stems" className="text-xs gap-1 px-2">
            <Music2 className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Стемы</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs gap-1 px-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">AI</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-4 py-3">
          <TabsContent value="details" className="mt-0 h-full">
            <TrackDetailsTab track={track} />
          </TabsContent>

          <TabsContent value="lyrics" className="mt-0 h-full">
            <LyricsView lyrics={track.lyrics} />
          </TabsContent>

          <TabsContent value="versions" className="mt-0 h-full">
            <TrackVersionsTab trackId={track.id} />
          </TabsContent>

          <TabsContent value="stems" className="mt-0 h-full">
            <TrackStemsTab trackId={track.id} />
          </TabsContent>

          <TabsContent value="analysis" className="mt-0 h-full">
            <TrackAnalysisTab track={track} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}