import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMusicRecognition, RecognizedTrack } from '@/hooks/useMusicRecognition';
import { useIsMobile } from '@/hooks/use-mobile';
import { Mic, MicOff, Upload, Link, Loader2, Music2, ExternalLink, Disc3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MusicRecognitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function RecognitionContent({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('microphone');
  const [audioUrl, setAudioUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isRecognizing,
    isRecording,
    result,
    recognizeFromUrl,
    recognizeFromFile,
    startRecording,
    stopRecordingAndRecognize,
    cancelRecording,
    clearResult,
  } = useMusicRecognition();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await recognizeFromFile(file);
    }
  };

  const handleUrlRecognize = async () => {
    if (audioUrl.trim()) {
      await recognizeFromUrl(audioUrl.trim());
    }
  };

  const handleMicrophoneClick = async () => {
    if (isRecording) {
      await stopRecordingAndRecognize();
    } else {
      clearResult();
      await startRecording();
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="microphone" className="gap-2">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Микрофон</span>
          </TabsTrigger>
          <TabsTrigger value="file" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Файл</span>
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <Link className="h-4 w-4" />
            <span className="hidden sm:inline">Ссылка</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="microphone" className="mt-6">
          <div className="flex flex-col items-center gap-6">
            <p className="text-sm text-muted-foreground text-center">
              Нажмите кнопку и поднесите устройство к источнику музыки
            </p>
            
            <button
              onClick={handleMicrophoneClick}
              disabled={isRecognizing}
              className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300",
                "border-4",
                isRecording 
                  ? "bg-destructive/20 border-destructive animate-pulse" 
                  : "bg-primary/10 border-primary hover:bg-primary/20",
                isRecognizing && "opacity-50 cursor-not-allowed"
              )}
            >
              {isRecognizing ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              ) : isRecording ? (
                <MicOff className="h-12 w-12 text-destructive" />
              ) : (
                <Mic className="h-12 w-12 text-primary" />
              )}
            </button>
            
            <p className="text-sm font-medium">
              {isRecognizing 
                ? 'Распознаём...' 
                : isRecording 
                  ? 'Нажмите для остановки' 
                  : 'Нажмите для записи'}
            </p>

            {isRecording && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={cancelRecording}
              >
                Отмена
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="file" className="mt-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Загрузите аудио файл для распознавания (MP3, WAV, M4A)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecognizing}
              variant="outline"
              className="gap-2"
            >
              {isRecognizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isRecognizing ? 'Распознаём...' : 'Выбрать файл'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-6">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Вставьте ссылку на аудио файл
            </p>
            
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/audio.mp3"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                disabled={isRecognizing}
              />
              <Button
                onClick={handleUrlRecognize}
                disabled={isRecognizing || !audioUrl.trim()}
              >
                {isRecognizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Найти'
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recognition Result */}
      {result && (
        <div className="border-t pt-4">
          {result.found && result.track ? (
            <TrackResult track={result.track} />
          ) : (
            <div className="text-center py-4">
              <Music2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Музыка не найдена</p>
              <p className="text-xs text-muted-foreground mt-1">
                Попробуйте записать более длинный фрагмент или другой источник
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrackResult({ track }: { track: RecognizedTrack }) {
  const spotifyUrl = track.spotify?.external_urls?.spotify;
  const appleMusicUrl = track.appleMusic?.url;
  const artworkUrl = track.spotify?.album?.images?.[0]?.url || 
                     track.appleMusic?.artwork?.url?.replace('{w}x{h}', '300x300');

  return (
    <div className="flex gap-4">
      {artworkUrl ? (
        <img 
          src={artworkUrl} 
          alt={track.album || track.title}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Disc3 className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold truncate">{track.title}</h4>
        <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
        {track.album && (
          <p className="text-xs text-muted-foreground truncate">{track.album}</p>
        )}
        
        <div className="flex gap-2 mt-2">
          {spotifyUrl && (
            <a 
              href={spotifyUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-green-500 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Spotify
            </a>
          )}
          {appleMusicUrl && (
            <a 
              href={appleMusicUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-pink-500 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Apple Music
            </a>
          )}
          {track.songLink && (
            <a 
              href={track.songLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Ссылки
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function MusicRecognitionDialog({ open, onOpenChange }: MusicRecognitionDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Music2 className="h-5 w-5" />
              Распознать музыку
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <RecognitionContent onClose={() => onOpenChange(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5" />
            Распознать музыку
          </DialogTitle>
        </DialogHeader>
        <RecognitionContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
