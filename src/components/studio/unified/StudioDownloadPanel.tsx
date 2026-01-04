/**
 * StudioDownloadPanel
 * Panel for downloading stems in various formats (MP3/WAV/ZIP)
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Download, FileAudio, Archive, Check, Loader2, 
  Volume2, Music2, Mic2, Drum, Guitar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';

interface StudioDownloadPanelProps {
  tracks: StudioTrack[];
  projectName: string;
  onClose?: () => void;
}

type ExportFormat = 'mp3' | 'wav';

const TRACK_ICONS: Record<string, React.ElementType> = {
  'vocal': Mic2,
  'instrumental': Music2,
  'drums': Drum,
  'bass': Guitar,
  'other': Volume2,
  'master': Volume2,
};

export const StudioDownloadPanel = memo(function StudioDownloadPanel({
  tracks,
  projectName,
  onClose,
}: StudioDownloadPanelProps) {
  const [format, setFormat] = useState<ExportFormat>('mp3');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingTrackId, setDownloadingTrackId] = useState<string | null>(null);
  const [downloadedTracks, setDownloadedTracks] = useState<Set<string>>(new Set());

  // Get audio URL from track (clip or direct)
  const getTrackAudioUrl = useCallback((track: StudioTrack): string | null => {
    if (track.audioUrl) return track.audioUrl;
    if (track.clips?.length) {
      return track.clips[0]?.audioUrl || null;
    }
    return null;
  }, []);

  // Filter tracks with audio
  const downloadableTracks = tracks.filter(t => {
    const url = getTrackAudioUrl(t);
    return url && t.status === 'ready';
  });

  // Download single track
  const downloadTrack = useCallback(async (track: StudioTrack) => {
    const audioUrl = getTrackAudioUrl(track);
    if (!audioUrl) {
      toast.error('Аудио недоступно');
      return;
    }

    setDownloadingTrackId(track.id);
    setDownloadProgress(0);

    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error('Failed to fetch audio');

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const chunks: ArrayBuffer[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value.buffer as ArrayBuffer);
        received += value.length;
        if (total > 0) {
          setDownloadProgress(Math.round((received / total) * 100));
        }
      }

      const blob = new Blob(chunks, { type: format === 'mp3' ? 'audio/mpeg' : 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s-]/g, '')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadedTracks(prev => new Set([...prev, track.id]));
      toast.success(`${track.name} скачан`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Ошибка скачивания');
    } finally {
      setDownloadingTrackId(null);
      setDownloadProgress(0);
    }
  }, [format, getTrackAudioUrl]);

  // Download all as ZIP
  const downloadAllAsZip = useCallback(async () => {
    if (downloadableTracks.length === 0) {
      toast.error('Нет треков для скачивания');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < downloadableTracks.length; i++) {
        const track = downloadableTracks[i];
        const audioUrl = getTrackAudioUrl(track);
        if (!audioUrl) continue;

        try {
          const response = await fetch(audioUrl);
          if (!response.ok) continue;
          
          const blob = await response.blob();
          const filename = `${track.name.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s-]/g, '')}.${format}`;
          zip.file(filename, blob);
        } catch (err) {
          console.warn(`Failed to fetch ${track.name}:`, err);
        }

        setDownloadProgress(Math.round(((i + 1) / downloadableTracks.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s-]/g, '')}_stems.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Архив со стемами скачан');
      onClose?.();
    } catch (error) {
      console.error('ZIP error:', error);
      toast.error('Ошибка создания архива');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  }, [downloadableTracks, format, getTrackAudioUrl, projectName, onClose]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h3 className="text-lg font-semibold">Скачать стемы</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {downloadableTracks.length} {downloadableTracks.length === 1 ? 'трек' : 'треков'} доступно
        </p>
      </div>

      {/* Format selection */}
      <div className="p-4 border-b border-border/50">
        <Label className="text-sm font-medium mb-3 block">Формат</Label>
        <RadioGroup
          value={format}
          onValueChange={(v) => setFormat(v as ExportFormat)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mp3" id="mp3" />
            <Label htmlFor="mp3" className="cursor-pointer">
              MP3 <span className="text-muted-foreground text-xs">(сжатый)</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="wav" id="wav" />
            <Label htmlFor="wav" className="cursor-pointer">
              WAV <span className="text-muted-foreground text-xs">(без потерь)</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Track list */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-2">
          {downloadableTracks.map((track) => {
            const Icon = TRACK_ICONS[track.type] || Volume2;
            const isThisDownloading = downloadingTrackId === track.id;
            const isDownloaded = downloadedTracks.has(track.id);

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  isDownloaded 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-card border-border/50 hover:bg-accent/30"
                )}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: track.color + '20' }}
                >
                  <Icon className="w-5 h-5" style={{ color: track.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{track.type}</p>
                </div>

                {isThisDownloading ? (
                  <div className="flex items-center gap-2">
                    <Progress value={downloadProgress} className="w-16 h-2" />
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                ) : isDownloaded ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                    <Check className="w-3 h-3 mr-1" />
                    Готово
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadTrack(track)}
                    disabled={isDownloading || !!downloadingTrackId}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            );
          })}

          {downloadableTracks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileAudio className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Нет доступных треков</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Download all button */}
      <div className="p-4 border-t border-border/50 space-y-3">
        {isDownloading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Создание архива...</span>
              <span>{downloadProgress}%</span>
            </div>
            <Progress value={downloadProgress} className="h-2" />
          </div>
        )}

        <Button
          className="w-full"
          onClick={downloadAllAsZip}
          disabled={isDownloading || downloadableTracks.length === 0}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Archive className="w-4 h-4 mr-2" />
          )}
          Скачать всё ({format.toUpperCase()})
        </Button>
      </div>
    </div>
  );
});
