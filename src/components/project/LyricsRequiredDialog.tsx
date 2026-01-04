import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProjectTrack } from '@/hooks/useProjectTracks';
import { cn } from '@/lib/utils';

interface LyricsRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: ProjectTrack;
  onConfirm: (lyrics: string) => void;
  onOpenAIAssistant: () => void;
}

export function LyricsRequiredDialog({
  open,
  onOpenChange,
  track,
  onConfirm,
  onOpenAIAssistant,
}: LyricsRequiredDialogProps) {
  const isMobile = useIsMobile();
  // Use the new lyrics field, fall back to notes for backward compatibility
  const existingLyrics = (track as any).lyrics || track.notes || '';
  const [lyrics, setLyrics] = useState(existingLyrics);

  const hasMinimalLyrics = lyrics.trim().length >= 50;

  const handleConfirm = () => {
    if (hasMinimalLyrics) {
      onConfirm(lyrics);
      onOpenChange(false);
    }
  };

  const handleOpenAI = () => {
    onOpenChange(false);
    onOpenAIAssistant();
  };

  const content = (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-600 dark:text-amber-400">
            Требуется текст песни
          </p>
          <p className="text-muted-foreground mt-1">
            Для генерации трека необходимо сначала написать полный текст песни. 
            Это обеспечит качественный результат.
          </p>
        </div>
      </div>

      {/* Track Info */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline">{track.position}</Badge>
          <span className="font-medium">{track.title}</span>
        </div>
        {track.style_prompt && (
          <p className="text-xs text-muted-foreground">{track.style_prompt}</p>
        )}
      </div>

      {/* Lyrics Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="lyrics">Текст песни</Label>
          <span className={cn(
            "text-xs",
            lyrics.length < 50 ? "text-muted-foreground" : "text-green-500"
          )}>
            {lyrics.length} символов {lyrics.length < 50 && "(мин. 50)"}
          </span>
        </div>
        <Textarea
          id="lyrics"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder="Введите полный текст песни с куплетами, припевами и т.д..."
          className="min-h-[200px] text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleConfirm}
          disabled={!hasMinimalLyrics}
          className="gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Продолжить генерацию
        </Button>
        <Button
          variant="outline"
          onClick={handleOpenAI}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Создать с AI Ассистентом
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Лирика трека
            </DrawerTitle>
            <DrawerDescription>
              Подтвердите или напишите текст песни перед генерацией
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Лирика трека
          </DialogTitle>
          <DialogDescription>
            Подтвердите или напишите текст песни перед генерацией
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
