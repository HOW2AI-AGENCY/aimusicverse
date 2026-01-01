/**
 * ImportAudioDialog - Upload local audio files to the studio
 * Supports drag-and-drop and file picker
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileAudio, Loader2, Check, X, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { TrackType, TRACK_COLORS } from '@/stores/useUnifiedStudioStore';
import { logger } from '@/lib/logger';

interface ImportAudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (audioUrl: string, name: string, type: TrackType, duration?: number) => void;
  projectId?: string;
}

const TRACK_TYPE_OPTIONS: { value: TrackType; label: string; emoji: string }[] = [
  { value: 'vocal', label: 'Вокал', emoji: '🎤' },
  { value: 'instrumental', label: 'Инструментал', emoji: '🎸' },
  { value: 'drums', label: 'Ударные', emoji: '🥁' },
  { value: 'bass', label: 'Бас', emoji: '🎸' },
  { value: 'sfx', label: 'Эффекты', emoji: '✨' },
  { value: 'other', label: 'Другое', emoji: '🎵' },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/flac'];

export function ImportAudioDialog({
  open,
  onOpenChange,
  onImport,
  projectId,
}: ImportAudioDialogProps) {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [trackName, setTrackName] = useState('');
  const [trackType, setTrackType] = useState<TrackType>('other');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const resetState = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setFile(null);
    setAudioUrl(null);
    setDuration(null);
    setTrackName('');
    setTrackType('other');
    setIsUploading(false);
    setUploadProgress(0);
    setIsComplete(false);
    setIsDragging(false);
  }, [audioUrl]);

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  }, [onOpenChange, resetState]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      toast.error('Неподдерживаемый формат файла', {
        description: 'Используйте MP3, WAV, OGG, M4A, WebM или FLAC',
      });
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('Файл слишком большой', {
        description: 'Максимальный размер: 50 МБ',
      });
      return;
    }

    // Cleanup previous
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setAudioUrl(url);
    setTrackName(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension

    // Get duration from audio element
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
  }, [audioUrl]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.id}/studio/${projectId || 'import'}/${Date.now()}-${sanitizedName}`;

      setUploadProgress(30);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Ошибка загрузки: ${uploadError.message}`);
      }

      setUploadProgress(80);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      setUploadProgress(100);
      setIsComplete(true);

      logger.info('Audio imported to studio', { fileName, duration });
      
      // Notify parent
      onImport(publicUrl, trackName || 'Imported Track', trackType, duration || undefined);
      
      toast.success('Аудио импортировано!');
      
      // Close after short delay
      setTimeout(() => {
        handleClose(false);
      }, 800);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      logger.error('Import failed', { error: message });
      toast.error('Ошибка импорта', { description: message });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Drop Zone */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all",
            isDragging
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleInputChange}
            className="hidden"
          />
          
          <motion.div
            animate={{ scale: isDragging ? 1.1 : 1 }}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center",
              isDragging ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            <Upload className="w-6 h-6" />
          </motion.div>
          
          <div className="text-center">
            <p className="font-medium">
              {isDragging ? 'Отпустите файл' : 'Перетащите аудио сюда'}
            </p>
            <p className="text-sm text-muted-foreground">
              или нажмите для выбора файла
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            MP3, WAV, OGG, FLAC • до 50 МБ
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Selected File Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/30">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileAudio className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(1)} МБ
                  {duration && ` • ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}`}
                </p>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (audioUrl) URL.revokeObjectURL(audioUrl);
                    setFile(null);
                    setAudioUrl(null);
                    setDuration(null);
                    setTrackName('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Track Name */}
            <div className="space-y-2">
              <Label htmlFor="track-name">Название дорожки</Label>
              <Input
                id="track-name"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                placeholder="Введите название..."
                disabled={isUploading}
              />
            </div>

            {/* Track Type */}
            <div className="space-y-2">
              <Label>Тип дорожки</Label>
              <div className="grid grid-cols-3 gap-2">
                {TRACK_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTrackType(option.value)}
                    disabled={isUploading}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                      trackType === option.value
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border/50 hover:bg-muted/50",
                      isUploading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="text-lg">{option.emoji}</span>
                    <span className="text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  <span className="text-sm">
                    {isComplete ? 'Готово!' : 'Загрузка...'}
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </motion.div>
            )}

            {/* Actions */}
            {!isUploading && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleClose(false)}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={!trackName.trim()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Импортировать
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh]">
          <SheetHeader className="text-left pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              Импорт аудио
            </SheetTitle>
            <SheetDescription>
              Загрузите аудиофайл для добавления в проект
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Импорт аудио
          </DialogTitle>
          <DialogDescription>
            Загрузите аудиофайл для добавления в проект
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
