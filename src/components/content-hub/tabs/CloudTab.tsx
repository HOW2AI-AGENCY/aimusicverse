import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReferenceAudio, type ReferenceAudio } from '@/hooks/useReferenceAudio';
import { useReferenceStems } from '@/hooks/useReferenceStems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Cloud, Search, Upload, Loader2, FolderPlus
} from 'lucide-react';
import { MultiTrackUpload } from '@/components/upload/MultiTrackUpload';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { VirtualizedCloudList } from '@/components/content-hub/VirtualizedCloudList';
import { motion, AnimatePresence } from '@/lib/motion';
import { ReferenceManager } from '@/services/audio-reference';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Extracted components
import { UploadDialog } from '@/components/cloud/UploadDialog';
import { AudioDetailPanel } from '@/components/cloud/AudioDetailPanel';

export function CloudTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { audioList, isLoading, deleteAudio, saveAudio, updateAnalysis } = useReferenceAudio();
  const { separateStems } = useReferenceStems();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudio, setSelectedAudio] = useState<ReferenceAudio | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [multiUploadOpen, setMultiUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dragCounterRef = useRef(0);

  const filteredAudio = audioList?.filter((a) =>
    a.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.genre?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.mood?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (!user) {
      toast.error('Необходимо авторизоваться');
      return;
    }

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('audio/') || 
      file.name.endsWith('.mp3') || 
      file.name.endsWith('.wav') || 
      file.name.endsWith('.m4a') ||
      file.name.endsWith('.webm') ||
      file.name.endsWith('.ogg')
    );

    if (files.length === 0) {
      toast.error('Перетащите аудио файлы (MP3, WAV, M4A)');
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `${user.id}/reference-${timestamp}-${sanitizedName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('reference-audio')
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('reference-audio')
          .getPublicUrl(path);

        // Get audio duration
        const audioEl = new Audio();
        audioEl.src = URL.createObjectURL(file);
        await new Promise<void>((resolve) => {
          audioEl.onloadedmetadata = () => resolve();
          audioEl.onerror = () => resolve();
        });
        const duration = audioEl.duration || null;

        // Save audio record
        const savedAudio = await saveAudio({
          fileName: file.name,
          fileUrl: publicUrl,
          fileSize: file.size,
          mimeType: file.type,
          durationSeconds: duration ? Math.round(duration) : undefined,
          source: 'upload',
          analysisStatus: 'pending',
        });

        successCount++;

        // Auto-trigger analysis in background
        supabase.functions.invoke('analyze-audio-flamingo', {
          body: { 
            audio_url: publicUrl,
            reference_id: savedAudio.id,
          },
        }).then(async ({ data, error }) => {
          if (!error && data?.parsed) {
            const parsed = data.parsed;
            await updateAnalysis({
              id: savedAudio.id,
              genre: parsed.genre,
              mood: parsed.mood,
              styleDescription: parsed.style_description,
              tempo: parsed.tempo,
              energy: parsed.energy,
              bpm: parsed.bpm ? Number(parsed.bpm) : undefined,
              instruments: parsed.instruments,
              vocalStyle: parsed.vocal_style,
              hasVocals: parsed.has_vocals ?? true,
              analysisStatus: 'completed',
            });
          }
        }).catch(err => logger.error('Auto analysis failed', err));

      } catch (error) {
        logger.error('Upload error', { error, fileName: file.name });
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`Загружено ${successCount} ${successCount === 1 ? 'файл' : 'файлов'}`);
    } else {
      toast.error('Не удалось загрузить файлы');
    }
  }, [user, saveAudio, updateAnalysis]);

  const handleSeparateStems = async (audio: ReferenceAudio) => {
    try {
      toast.info('Запускаем разделение стемов...', { duration: 3000 });
      await separateStems({ referenceId: audio.id, mode: 'simple' });
    } catch (error) {
      logger.error('Stem separation error', error);
    }
  };

  const handlePlay = async (audio: ReferenceAudio) => {
    if (!audio.file_url) {
      toast.error('URL аудио недоступен');
      return;
    }

    if (playingId === audio.id) {
      audioElement?.pause();
      setPlayingId(null);
      setAudioElement(null);
    } else {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      
      try {
        const newAudio = new Audio();
        newAudio.preload = 'auto';
        
        newAudio.onended = () => {
          setPlayingId(null);
          setAudioElement(null);
        };
        
        newAudio.onerror = (e) => {
          logger.error('Audio playback error', { error: e, url: audio.file_url });
          toast.error('Ошибка воспроизведения. Проверьте подключение.');
          setPlayingId(null);
          setAudioElement(null);
        };

        newAudio.oncanplay = () => {
          newAudio.play().catch((err) => {
            logger.error('Play failed', err);
            toast.error('Не удалось воспроизвести');
            setPlayingId(null);
            setAudioElement(null);
          });
        };
        
        newAudio.src = audio.file_url;
        newAudio.load();
        
        setAudioElement(newAudio);
        setPlayingId(audio.id);
      } catch (error) {
        logger.error('Audio initialization error', error);
        toast.error('Ошибка инициализации аудио');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAudio(id);
      setDeleteConfirmId(null);
      toast.success('Файл удален');
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

  const handleUseForGeneration = (audio: ReferenceAudio, mode: 'cover' | 'extend') => {
    ReferenceManager.createFromCloud({
      id: audio.id,
      fileUrl: audio.file_url,
      fileName: audio.file_name,
      fileSize: audio.file_size ?? undefined,
      mimeType: audio.mime_type ?? undefined,
      durationSeconds: audio.duration_seconds ?? undefined,
      genre: audio.genre ?? undefined,
      mood: audio.mood ?? undefined,
      bpm: audio.bpm ?? undefined,
      tempo: audio.tempo ?? undefined,
      energy: audio.energy ?? undefined,
      vocalStyle: audio.vocal_style ?? undefined,
      styleDescription: audio.style_description ?? undefined,
      transcription: audio.transcription ?? undefined,
      instruments: audio.instruments ?? undefined,
    }, mode);
    
    setSelectedAudio(null);
    navigate('/');
    toast.success(`Аудио выбрано для ${mode === 'cover' ? 'кавера' : 'расширения'}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div 
      className="space-y-4 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-xl"
          >
            <div className="text-center">
              <Upload className="w-12 h-12 text-primary mx-auto mb-3 animate-bounce" />
              <p className="text-lg font-medium text-primary">Перетащите аудио файлы сюда</p>
              <p className="text-sm text-muted-foreground mt-1">MP3, WAV, M4A, OGG</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl"
          >
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
              <p className="text-lg font-medium">Загрузка файлов...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Upload */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => setMultiUploadOpen(true)} className="gap-1.5 shrink-0">
          <FolderPlus className="w-4 h-4" />
          Пакет
        </Button>
        <Button size="sm" onClick={() => setUploadDialogOpen(true)} className="gap-1.5 shrink-0">
          <Upload className="w-4 h-4" />
          Загрузить
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>{audioList?.length || 0} файлов</span>
        <span>•</span>
        <span>{audioList?.filter(a => a.analysis_status === 'completed').length || 0} проанализировано</span>
      </div>

      {/* Audio List */}
      {filteredAudio.length > 0 ? (
        <VirtualizedCloudList
          audioFiles={filteredAudio}
          playingId={playingId}
          onSelect={setSelectedAudio}
          onPlay={handlePlay}
          onDelete={setDeleteConfirmId}
          onUseForGeneration={handleUseForGeneration}
          onSeparateStems={handleSeparateStems}
        />
      ) : (
        <div 
          className={cn(
            "text-center py-12 border-2 border-dashed rounded-xl transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border/50"
          )}
        >
          <Cloud className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchQuery ? 'Ничего не найдено' : 'Нет загруженных файлов'}
          </p>
          <p className="text-xs text-muted-foreground mt-2 mb-4">
            Перетащите аудио сюда или нажмите кнопку
          </p>
          <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
            <Upload className="w-4 h-4" />
            Загрузить
          </Button>
        </div>
      )}

      {/* Audio Detail Panel */}
      {selectedAudio && (
        <AudioDetailPanel
          audio={selectedAudio}
          open={!!selectedAudio}
          onOpenChange={(open) => !open && setSelectedAudio(null)}
          onDelete={(id) => setDeleteConfirmId(id)}
          onPlay={handlePlay}
          isPlaying={playingId === selectedAudio.id}
          onUseForGeneration={handleUseForGeneration}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить файл?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      {uploadDialogOpen && (
        <UploadDialog 
          open={uploadDialogOpen} 
          onOpenChange={setUploadDialogOpen} 
        />
      )}

      {/* Multi-Track Upload Dialog */}
      <MultiTrackUpload 
        open={multiUploadOpen} 
        onOpenChange={setMultiUploadOpen}
      />
    </div>
  );
}
