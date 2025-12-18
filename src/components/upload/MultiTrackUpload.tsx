/**
 * Multi-Track Upload Component
 * Allows uploading multiple audio files at once with progress tracking
 */

import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Music,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface MultiTrackUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/m4a'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;

export function MultiTrackUpload({ open, onOpenChange, onComplete }: MultiTrackUploadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const validFiles = selectedFiles
      .filter(file => {
        if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|aac|flac|m4a)$/i)) {
          toast.error(`${file.name}: неподдерживаемый формат`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: файл слишком большой (макс. 50MB)`);
          return false;
        }
        return true;
      })
      .slice(0, MAX_FILES - files.length);

    if (validFiles.length + files.length > MAX_FILES) {
      toast.warning(`Максимум ${MAX_FILES} файлов за раз`);
    }

    const newFiles: FileUploadState[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  }, [files.length]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFile = async (fileState: FileUploadState, index: number): Promise<void> => {
    if (!user) throw new Error('Not authenticated');

    try {
      // Update status
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'uploading', progress: 10 } : f
      ));

      const fileName = `${user.id}/${Date.now()}-${fileState.file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('reference-audio')
        .upload(fileName, fileState.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 60 } : f
      ));

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('reference-audio')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('reference_audio')
        .insert({
          user_id: user.id,
          file_name: fileState.file.name,
          file_url: publicUrl,
          file_size: fileState.file.size,
          mime_type: fileState.file.type,
          source: 'upload',
          analysis_status: 'pending',
        });

      if (dbError) throw dbError;

      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'completed', progress: 100 } : f
      ));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка загрузки';
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error', error: message } : f
      ));
    }
  };

  const startUpload = async () => {
    if (!user || files.length === 0) return;

    setIsUploading(true);

    // Upload all files in parallel (max 3 concurrent)
    const pendingFiles = files.filter(f => f.status === 'pending');
    const chunks: FileUploadState[][] = [];
    
    for (let i = 0; i < pendingFiles.length; i += 3) {
      chunks.push(pendingFiles.slice(i, i + 3));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((fileState) => {
          const index = files.findIndex(f => f.file === fileState.file);
          return uploadFile(fileState, index);
        })
      );
    }

    setIsUploading(false);
    
    // Refresh audio list
    queryClient.invalidateQueries({ queryKey: ['reference-audio'] });
    
    const completed = files.filter(f => f.status === 'completed').length;
    if (completed > 0) {
      toast.success(`Загружено ${completed} файлов`);
      onComplete?.();
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setFiles([]);
    onOpenChange(false);
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const totalProgress = files.length > 0 
    ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Загрузка аудио
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <label 
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
              "hover:border-primary/50 hover:bg-muted/50",
              files.length >= MAX_FILES && "opacity-50 pointer-events-none"
            )}
          >
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Выберите файлы или перетащите сюда
            </span>
            <span className="text-xs text-muted-foreground">
              MP3, WAV, OGG, AAC, FLAC • до 50MB • макс. {MAX_FILES} файлов
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".mp3,.wav,.ogg,.aac,.flac,.m4a,audio/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={files.length >= MAX_FILES || isUploading}
            />
          </label>

          {/* File list */}
          {files.length > 0 && (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {files.map((fileState, index) => (
                  <div 
                    key={`${fileState.file.name}-${index}`}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="shrink-0">
                      {fileState.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : fileState.status === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : fileState.status === 'uploading' ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Music className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{fileState.file.name}</p>
                      {fileState.status === 'uploading' && (
                        <Progress value={fileState.progress} className="h-1 mt-1" />
                      )}
                      {fileState.error && (
                        <p className="text-xs text-destructive truncate">{fileState.error}</p>
                      )}
                    </div>

                    {fileState.status === 'pending' && !isUploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Progress summary */}
          {isUploading && (
            <div className="space-y-1">
              <Progress value={totalProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Загружено {completedCount} из {files.length}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleClose}
              disabled={isUploading}
            >
              {completedCount > 0 && !isUploading ? 'Готово' : 'Отмена'}
            </Button>
            
            {pendingCount > 0 && (
              <Button 
                className="flex-1 gap-2"
                onClick={startUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Загрузить ({pendingCount})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
