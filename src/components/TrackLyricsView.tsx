import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioPlayer } from './AudioPlayer';
import { TimestampedLyrics } from './TimestampedLyrics';
import { useAudioPlayer } from '@/hooks/audio';

interface TrackLyricsViewProps {
  track: {
    id: string;
    title?: string | null;
    audio_url?: string | null;
    streaming_url?: string | null;
    local_audio_url?: string | null;
    cover_url?: string | null;
    lyrics?: string | null;
    suno_task_id?: string | null;
    suno_id?: string | null;
  };
}

export function TrackLyricsView({ track }: TrackLyricsViewProps) {
  const [activeTab, setActiveTab] = useState<'plain' | 'synced'>('synced');

  const {
    isPlaying,
    currentTime,
    duration,
  } = useAudioPlayer({
    trackId: track.id,
    streamingUrl: track.streaming_url,
    localAudioUrl: track.local_audio_url,
    audioUrl: track.audio_url,
  });

  const hasTimestampedLyrics = track.suno_task_id && track.suno_id;

  return (
    <div className="space-y-4">
      <AudioPlayer
        trackId={track.id}
        title={track.title || undefined}
        streamingUrl={track.streaming_url}
        localAudioUrl={track.local_audio_url}
        audioUrl={track.audio_url}
        coverUrl={track.cover_url}
      />

      <Card className="glass-card border-primary/20">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'plain' | 'synced')}>
          <TabsList className="w-full">
            {hasTimestampedLyrics && (
              <TabsTrigger value="synced" className="flex-1">
                🎵 Синхронизированный текст
              </TabsTrigger>
            )}
            <TabsTrigger value="plain" className="flex-1">
              📝 Обычный текст
            </TabsTrigger>
          </TabsList>

          {hasTimestampedLyrics && (
            <TabsContent value="synced" className="h-[500px]">
              <TimestampedLyrics
                taskId={track.suno_task_id || undefined}
                audioId={track.suno_id || undefined}
                currentTime={currentTime}
                isPlaying={isPlaying}
                duration={duration}
              />
            </TabsContent>
          )}

          <TabsContent value="plain" className="h-[500px] overflow-auto p-6">
            {track.lyrics ? (
              <div className="whitespace-pre-wrap text-lg leading-relaxed">
                {track.lyrics}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Текст песни недоступен</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
