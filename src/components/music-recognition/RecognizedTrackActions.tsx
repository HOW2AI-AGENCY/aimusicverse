import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Edit3, Music2, Save, Copy, Loader2, 
  Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLyricsRecognition } from '@/hooks/useLyricsRecognition';
import { RecognizedTrack } from '@/hooks/useMusicRecognition';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RecognizedTrackActionsProps {
  track: RecognizedTrack;
  audioUrl?: string;
  onUseLyrics?: (lyrics: string) => void;
  onCreateCover?: (trackInfo: RecognizedTrack, lyrics?: string) => void;
}

export function RecognizedTrackActions({
  track,
  audioUrl,
  onUseLyrics,
  onCreateCover,
}: RecognizedTrackActionsProps) {
  const isMobile = useIsMobile();
  const [showLyricsDialog, setShowLyricsDialog] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState('');
  const [lyricsSource, setLyricsSource] = useState<'api' | 'recognized' | 'manual'>('api');
  
  const { isRecognizing, result, recognizeLyrics, clearResult } = useLyricsRecognition();

  // Get lyrics from track data (if available from AuDD)
  const apiLyrics = track.lyrics?.lyrics || '';

  // Handle recognize lyrics from audio
  const handleRecognizeLyrics = async () => {
    if (!audioUrl) {
      toast.error('Нет аудио для распознавания');
      return;
    }

    const result = await recognizeLyrics(audioUrl);
    if (result.success && result.lyrics) {
      setEditedLyrics(result.lyrics.text);
      setLyricsSource('recognized');
      setShowLyricsDialog(true);
    }
  };

  // Handle use API lyrics
  const handleUseApiLyrics = () => {
    if (apiLyrics) {
      setEditedLyrics(apiLyrics);
      setLyricsSource('api');
      setShowLyricsDialog(true);
    }
  };

  // Handle copy lyrics
  const handleCopyLyrics = () => {
    navigator.clipboard.writeText(editedLyrics);
    toast.success('Текст скопирован');
  };

  // Handle save/use lyrics
  const handleUseLyrics = () => {
    if (onUseLyrics && editedLyrics) {
      onUseLyrics(editedLyrics);
      setShowLyricsDialog(false);
      toast.success('Текст применён');
    }
  };

  // Handle create cover
  const handleCreateCover = () => {
    if (onCreateCover) {
      onCreateCover(track, editedLyrics || apiLyrics);
      setShowLyricsDialog(false);
    }
  };

  const LyricsDialogContent = () => (
    <div className="space-y-4">
      {/* Lyrics source badges */}
      <div className="flex flex-wrap gap-2">
        {apiLyrics && (
          <Badge 
            variant={lyricsSource === 'api' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => {
              setEditedLyrics(apiLyrics);
              setLyricsSource('api');
            }}
          >
            <FileText className="w-3 h-3 mr-1" />
            Из базы
          </Badge>
        )}
        {result?.lyrics && (
          <Badge 
            variant={lyricsSource === 'recognized' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => {
              setEditedLyrics(result.lyrics!.text);
              setLyricsSource('recognized');
            }}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Распознанный
          </Badge>
        )}
        <Badge 
          variant={lyricsSource === 'manual' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setLyricsSource('manual')}
        >
          <Edit3 className="w-3 h-3 mr-1" />
          Свой текст
        </Badge>
      </div>

      {/* Lyrics textarea */}
      <Textarea
        value={editedLyrics}
        onChange={(e) => {
          setEditedLyrics(e.target.value);
          if (lyricsSource !== 'manual') setLyricsSource('manual');
        }}
        placeholder="Введите или отредактируйте текст песни..."
        className="min-h-[300px] font-mono text-sm"
      />

      {/* Character count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{editedLyrics.length} символов</span>
        {result?.lyrics?.language && (
          <span>Язык: {result.lyrics.language}</span>
        )}
      </div>
    </div>
  );

  const LyricsDialogFooterContent = () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleCopyLyrics}>
        <Copy className="w-4 h-4 mr-2" />
        Копировать
      </Button>
      {onUseLyrics && (
        <Button variant="default" size="sm" onClick={handleUseLyrics}>
          <Save className="w-4 h-4 mr-2" />
          Использовать
        </Button>
      )}
      {onCreateCover && (
        <Button variant="secondary" size="sm" onClick={handleCreateCover}>
          <Music2 className="w-4 h-4 mr-2" />
          Создать кавер
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
        {/* Show lyrics from API if available */}
        {apiLyrics && (
          <Button variant="outline" size="sm" onClick={handleUseApiLyrics}>
            <FileText className="w-4 h-4 mr-2" />
            Показать текст
          </Button>
        )}

        {/* Recognize lyrics from audio */}
        {audioUrl && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRecognizeLyrics}
            disabled={isRecognizing}
          >
            {isRecognizing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isRecognizing ? 'Распознаю...' : 'Распознать текст'}
          </Button>
        )}

        {/* Create cover */}
        {onCreateCover && (
          <Button variant="secondary" size="sm" onClick={() => handleCreateCover()}>
            <Music2 className="w-4 h-4 mr-2" />
            Создать кавер
          </Button>
        )}
      </div>

      {/* Lyrics dialog */}
      {isMobile ? (
        <Drawer open={showLyricsDialog} onOpenChange={setShowLyricsDialog}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Текст песни: {track.title}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto">
              <LyricsDialogContent />
            </div>
            <DrawerFooter>
              <LyricsDialogFooterContent />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showLyricsDialog} onOpenChange={setShowLyricsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Текст песни: {track.title}
              </DialogTitle>
            </DialogHeader>
            <LyricsDialogContent />
            <DialogFooter>
              <LyricsDialogFooterContent />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
