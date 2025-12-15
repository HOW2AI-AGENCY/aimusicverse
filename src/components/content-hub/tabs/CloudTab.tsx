import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReferenceAudio, ReferenceAudio } from '@/hooks/useReferenceAudio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Cloud, Search, Trash2, Play, Pause, Music, Mic, Upload, 
  Sparkles, ArrowRight, FileText, Loader2, Edit, Check, X, Disc
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { VirtualizedCloudList } from '@/components/content-hub/VirtualizedCloudList';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

// Simple upload dialog component
function SimpleUploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { saveAudio } = useReferenceAudio();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
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
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => resolve();
        audio.onerror = () => resolve();
      });
      const duration = audio.duration || null;

      await saveAudio({
        fileName: file.name,
        fileUrl: publicUrl,
        fileSize: file.size,
        mimeType: file.type,
        durationSeconds: duration ? Math.round(duration) : undefined,
        source: 'upload',
      });

      toast.success('Файл загружен');
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await uploadRecording(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Запись начата');
    } catch (error) {
      logger.error('Recording error', error);
      toast.error('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const uploadRecording = async (audioBlob: Blob) => {
    if (!user) return;
    
    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileName = `recording_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.webm`;
      const path = `${user.id}/recording-${timestamp}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('reference-audio')
        .upload(path, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('reference-audio')
        .getPublicUrl(path);

      await saveAudio({
        fileName,
        fileUrl: publicUrl,
        fileSize: audioBlob.size,
        mimeType: 'audio/webm',
        durationSeconds: recordingTime,
        source: 'recording',
      });

      toast.success('Запись сохранена');
      onOpenChange(false);
    } catch (error) {
      logger.error('Upload recording error', error);
      toast.error('Ошибка сохранения записи');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (recording) {
        stopRecording();
      }
      onOpenChange(o);
    }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Добавить аудио</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Record Button */}
          <div 
            className={cn(
              "relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all",
              recording 
                ? "border-red-500 bg-red-500/10" 
                : "border-primary/30 bg-primary/5 hover:border-primary/50"
            )}
          >
            {recording && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-red-500">{formatTime(recordingTime)}</span>
              </div>
            )}
            
            <Button
              variant={recording ? "destructive" : "default"}
              size="lg"
              className={cn(
                "w-16 h-16 rounded-full",
                recording && "animate-pulse"
              )}
              onClick={recording ? stopRecording : startRecording}
              disabled={uploading}
            >
              {uploading ? (
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
            
            <p className="text-sm mt-3 text-center">
              {recording ? 'Нажмите, чтобы остановить' : 'Записать с микрофона'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Гитара, голос, мелодия
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">или</span>
            </div>
          </div>

          {/* Upload Button */}
          <Button
            className="w-full h-12 gap-2"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || recording}
          >
            <Upload className="w-5 h-5" />
            Загрузить файл
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Поддерживаются MP3, WAV, M4A
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Audio detail panel with actions
interface AudioDetailPanelProps {
  audio: ReferenceAudio;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  onPlay: (audio: ReferenceAudio) => void;
  isPlaying: boolean;
  onUseForGeneration: (audio: ReferenceAudio, mode: 'cover' | 'extend') => void;
}

function AudioDetailPanel({ 
  audio, open, onOpenChange, onDelete, onPlay, isPlaying, onUseForGeneration 
}: AudioDetailPanelProps) {
  const { updateAnalysis } = useReferenceAudio();
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState(audio.transcription || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveLyrics = async () => {
    setIsSaving(true);
    try {
      await updateAnalysis({
        id: audio.id,
        transcription: editedLyrics,
      });
      setIsEditingLyrics(false);
      toast.success('Текст сохранен');
    } catch (error) {
      toast.error('Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Progress simulation
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-audio-style', {
        body: { audioUrl: audio.file_url },
      });

      if (error) throw error;

      await updateAnalysis({
        id: audio.id,
        genre: data.genre,
        mood: data.mood,
        vocalStyle: data.vocal_style,
        hasVocals: data.has_vocals,
        analysisStatus: 'completed',
      });

      setAnalysisProgress(100);
      toast.success('Анализ завершен');
    } catch (error) {
      logger.error('Analysis error', error);
      toast.error('Ошибка анализа');
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const handleExtractLyrics = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 8, 85));
    }, 600);

    try {
      const { data, error } = await supabase.functions.invoke('transcribe-lyrics', {
        body: { audioUrl: audio.file_url },
      });

      if (error) throw error;

      const lyrics = data.transcription || data.lyrics || '';
      setEditedLyrics(lyrics);

      await updateAnalysis({
        id: audio.id,
        transcription: lyrics,
        hasVocals: true,
        analysisStatus: 'completed',
      });

      setAnalysisProgress(100);
      toast.success('Текст извлечен');
    } catch (error) {
      logger.error('Lyrics extraction error', error);
      toast.error('Ошибка извлечения текста');
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {audio.source === 'recording' ? (
              <Mic className="w-4 h-4 text-primary" />
            ) : (
              <Music className="w-4 h-4" />
            )}
            <span className="truncate">{audio.file_name}</span>
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-full mt-4 pr-4">
          <div className="space-y-4 pb-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => onUseForGeneration(audio, 'cover')}
                className="h-14 gap-2"
              >
                <Disc className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium text-sm">Кавер</div>
                  <div className="text-[10px] opacity-70">Создать в этом стиле</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => onUseForGeneration(audio, 'extend')}
                className="h-14 gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium text-sm">Расширить</div>
                  <div className="text-[10px] opacity-70">Продолжить трек</div>
                </div>
              </Button>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 text-sm p-3 rounded-lg bg-secondary/30">
              <div>
                <p className="text-muted-foreground text-xs">Длительность</p>
                <p className="font-medium">{formatDuration(audio.duration_seconds)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Дата</p>
                <p className="font-medium">{format(new Date(audio.created_at), 'd MMM yyyy', { locale: ru })}</p>
              </div>
              {audio.genre && (
                <div>
                  <p className="text-muted-foreground text-xs">Жанр</p>
                  <p className="font-medium">{audio.genre}</p>
                </div>
              )}
              {audio.mood && (
                <div>
                  <p className="text-muted-foreground text-xs">Настроение</p>
                  <p className="font-medium">{audio.mood}</p>
                </div>
              )}
              {audio.vocal_style && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Стиль вокала</p>
                  <p className="font-medium">{audio.vocal_style}</p>
                </div>
              )}
            </div>

            {/* Analysis Actions */}
            {audio.analysis_status !== 'completed' && (
              <div className="space-y-2">
                {isAnalyzing && (
                  <div className="space-y-2">
                    <Progress value={analysisProgress} className="h-1" />
                    <p className="text-xs text-muted-foreground text-center">
                      Анализируем аудио...
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    Анализ стиля
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExtractLyrics}
                    disabled={isAnalyzing}
                    className="flex-1 gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    Извлечь текст
                  </Button>
                </div>
              </div>
            )}

            {/* Lyrics / Transcription */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-muted-foreground text-xs">Текст / Транскрипция</p>
                {!isEditingLyrics ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingLyrics(true)}
                    className="h-6 px-2 text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Редактировать
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingLyrics(false);
                        setEditedLyrics(audio.transcription || '');
                      }}
                      className="h-6 px-2 text-xs"
                      disabled={isSaving}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveLyrics}
                      className="h-6 px-2 text-xs text-primary"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              {isEditingLyrics ? (
                <Textarea
                  value={editedLyrics}
                  onChange={(e) => setEditedLyrics(e.target.value)}
                  placeholder="Введите текст песни..."
                  className="min-h-[200px] text-sm"
                />
              ) : audio.transcription ? (
                <pre className="whitespace-pre-wrap text-sm font-sans bg-secondary/50 p-3 rounded-lg max-h-[200px] overflow-auto">
                  {audio.transcription}
                </pre>
              ) : (
                <div className="text-center py-6 bg-secondary/30 rounded-lg">
                  <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Текст не извлечен</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleExtractLyrics}
                    disabled={isAnalyzing}
                    className="mt-1 text-xs"
                  >
                    Извлечь автоматически
                  </Button>
                </div>
              )}
            </div>

            {/* Playback & Delete */}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => onPlay(audio)}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Пауза
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Воспроизвести
                  </>
                )}
              </Button>
              <Button 
                variant="destructive" 
                size="icon"
                onClick={() => {
                  onDelete(audio.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export function CloudTab() {
  const navigate = useNavigate();
  const { audioList, isLoading, deleteAudio } = useReferenceAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudio, setSelectedAudio] = useState<ReferenceAudio | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const filteredAudio = audioList?.filter((a) =>
    a.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.genre?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.mood?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handlePlay = (audio: ReferenceAudio) => {
    if (playingId === audio.id) {
      audioElement?.pause();
      setPlayingId(null);
      setAudioElement(null);
    } else {
      audioElement?.pause();
      const newAudio = new Audio(audio.file_url);
      newAudio.play();
      newAudio.onended = () => {
        setPlayingId(null);
        setAudioElement(null);
      };
      setAudioElement(newAudio);
      setPlayingId(audio.id);
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
    // Store selected audio in sessionStorage for generation page
    sessionStorage.setItem('cloudAudioReference', JSON.stringify({
      id: audio.id,
      fileUrl: audio.file_url,
      fileName: audio.file_name,
      mode,
      genre: audio.genre,
      mood: audio.mood,
      vocalStyle: audio.vocal_style,
      transcription: audio.transcription,
    }));
    
    setSelectedAudio(null);
    navigate('/');
    toast.success(`Аудио выбрано для ${mode === 'cover' ? 'кавера' : 'расширения'}`);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        />
      ) : (
        <div className="text-center py-12">
          <Cloud className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchQuery ? 'Ничего не найдено' : 'Нет загруженных файлов'}
          </p>
          <p className="text-xs text-muted-foreground mt-2 mb-4">
            Загружайте аудио для использования в генерации
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
        <SimpleUploadDialog 
          open={uploadDialogOpen} 
          onOpenChange={setUploadDialogOpen} 
        />
      )}
    </div>
  );
}
