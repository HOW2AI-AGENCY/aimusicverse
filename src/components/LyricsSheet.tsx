import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimestampedLyrics } from './TimestampedLyrics';
import { ScrollArea } from './ui/scroll-area';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface LyricsSheetProps {
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

export function LyricsSheet({ open, onOpenChange, track }: LyricsSheetProps) {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
        <SheetHeader>
          <SheetTitle>
            {track.title || 'Текст песни'}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'synced' | 'plain')} className="mt-4">
          <TabsList className="w-full">
            {hasTimestampedLyrics && (
              <TabsTrigger value="synced" className="flex-1">
                🎵 Синхронизированный
              </TabsTrigger>
            )}
            <TabsTrigger value="plain" className="flex-1">
              📝 Обычный текст
            </TabsTrigger>
          </TabsList>

          {hasTimestampedLyrics && (
            <TabsContent value="synced" className="h-[calc(90vh-12rem)]">
              <TimestampedLyrics
                taskId={track.suno_task_id}
                audioId={track.suno_id}
                currentTime={currentTime}
                isPlaying={isPlaying}
                duration={duration}
              />
            </TabsContent>
          )}

          <TabsContent value="plain" className="h-[calc(90vh-12rem)]">
            <ScrollArea className="h-full pr-4">
              {track.lyrics ? (
                <div className="whitespace-pre-wrap text-base leading-relaxed p-4">
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
      </SheetContent>
    </Sheet>
  );
}
