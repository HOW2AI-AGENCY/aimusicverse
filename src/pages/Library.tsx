import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Music2, Search, Loader2 } from 'lucide-react';
import { useTracks } from '@/hooks/useTracks';
import { TrackCard } from '@/components/TrackCard';
import { TrackAnalytics } from '@/components/TrackAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenerationProgress } from '@/components/GenerationProgress';
import { AudioPlayer } from '@/components/AudioPlayer';

export default function Library() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const {
    tracks,
    isLoading,
    deleteTrack,
    toggleLike,
    logPlay,
    downloadTrack,
    syncTags,
  } = useTracks();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const filteredTracks = (tracks || []).filter(
    (track) =>
      track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlay = (trackId: string, audioUrl: string | null) => {
    if (!audioUrl) return;
    
    // Toggle play/pause
    if (playingTrackId === trackId) {
      setPlayingTrackId(null);
    } else {
      setPlayingTrackId(trackId);
      logPlay(trackId);
    }
  };

  const handleDownload = (trackId: string, audioUrl: string | null, coverUrl: string | null) => {
    if (!audioUrl) return;
    
    // Try automatic download to storage
    downloadTrack({ trackId, audioUrl, coverUrl: coverUrl || undefined });
    
    // Also trigger browser download
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `track-${trackId}.mp3`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-24">
      <GenerationProgress />
      
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full glass-card border-primary/20">
            <Music2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Библиотека треков
            </h1>
            <p className="text-muted-foreground">Ваша музыкальная коллекция</p>
          </div>
        </div>

        <Card className="glass-card border-primary/20 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Поиск по названию или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTracks.length === 0 ? (
          <Card className="glass-card border-primary/20 p-12 text-center">
            <Music2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'Ничего не найдено' : 'Пока нет треков'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Попробуйте изменить поисковой запрос'
                : 'Создайте свой первый трек в генераторе'}
            </p>
          </Card>
        ) : (
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="grid">Сетка</TabsTrigger>
              <TabsTrigger value="analytics" disabled={!selectedTrackId}>
                Аналитика
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTracks.map((track) => (
                  <div key={track.id} onClick={() => setSelectedTrackId(track.id)}>
                    <TrackCard
                      track={track}
                      isPlaying={playingTrackId === track.id}
                      onPlay={() => handlePlay(track.id, track.audio_url)}
                      onDelete={() => deleteTrack(track.id)}
                      onDownload={() => handleDownload(track.id, track.audio_url, track.cover_url)}
                      onToggleLike={() =>
                        toggleLike({
                          trackId: track.id,
                          isLiked: track.is_liked || false,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              {selectedTrackId && <TrackAnalytics trackId={selectedTrackId} />}
            </TabsContent>
          </Tabs>
        )}

        {/* Mini Audio Player */}
        {playingTrackId && (() => {
          const track = filteredTracks.find(t => t.id === playingTrackId);
          return track && (
            <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
              <AudioPlayer
                trackId={track.id}
                title={track.title || undefined}
                streamingUrl={track.streaming_url}
                localAudioUrl={track.local_audio_url}
                audioUrl={track.audio_url}
                coverUrl={track.cover_url}
                onPlay={() => logPlay(track.id)}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}