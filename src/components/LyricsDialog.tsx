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
import { useAudioPlayer } from '@/hooks/audio/useAudioPlayer';
import { LyricsSheet } from './LyricsSheet';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
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

  if (isMobile) {
    return <LyricsSheet open={open} onOpenChange={onOpenChange} track={track} />;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {track.title || 'Текст песни'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'synced' | 'plain')} className="flex-1 flex flex-col">
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
            <TabsContent value="synced" className="flex-1 min-h-0">
              <ScrollArea className="h-full">
                <TimestampedLyrics
                  taskId={track.suno_task_id || undefined}
                  audioId={track.suno_id || undefined}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  duration={duration}
                />
              </ScrollArea>
            </TabsContent>
          )}

          <TabsContent value="plain" className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
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
