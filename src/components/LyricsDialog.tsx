import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimestampedLyrics } from './TimestampedLyrics';
import { ScrollArea } from './ui/scroll-area';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface LyricsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    id: string;
    title?: string | null;
    audio_url?: string | null;
    streaming_url?: string | null;
    local_audio_url?: string | null;
    lyrics?: string | null;
    suno_task_id?: string | null;
    suno_id?: string | null;
  };
}

export function LyricsDialog({ open, onOpenChange, track }: LyricsDialogProps) {
  const [activeTab, setActiveTab] = useState<'synced' | 'plain'>('synced');

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {track.title || 'Текст песни'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'synced' | 'plain')}>
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
                taskId={track.suno_task_id}
                audioId={track.suno_id}
                currentTime={currentTime}
                isPlaying={isPlaying}
                duration={duration}
              />
            </TabsContent>
          )}

          <TabsContent value="plain">
            <ScrollArea className="h-[500px] pr-4">
              {track.lyrics ? (
                <div className="whitespace-pre-wrap text-lg leading-relaxed p-4">
                  {track.lyrics}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Текст песни недоступен</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
