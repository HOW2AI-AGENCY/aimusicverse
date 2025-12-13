import { useState, useRef } from 'react';
import { useReferenceAudio } from '@/hooks/useReferenceAudio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Cloud, Search, Trash2, Play, Pause, Music, Mic, Upload, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// Simple upload dialog component
function SimpleUploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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

      await saveAudio({
        fileName: file.name,
        fileUrl: publicUrl,
        fileSize: file.size,
        mimeType: file.type,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Загрузить аудио</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            className="w-full h-20 gap-2"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Выбрать файл
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Поддерживаются MP3, WAV, M4A
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CloudTab() {
  const { audioList, isLoading, deleteAudio } = useReferenceAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudio, setSelectedAudio] = useState<typeof audioList[0] | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const filteredAudio = audioList?.filter((a) =>
    a.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.genre?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.mood?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const handlePlay = (audio: typeof audioList[0]) => {
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
      <div className="text-xs text-muted-foreground">
        {audioList?.length || 0} файлов в облаке
      </div>

      {/* Audio List */}
      {filteredAudio.length > 0 ? (
        <div className="space-y-2">
          {filteredAudio.map((audio) => (
            <div
              key={audio.id}
              onClick={() => setSelectedAudio(audio)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50",
                "hover:bg-card hover:border-border cursor-pointer transition-all",
                "active:scale-[0.99] touch-manipulation"
              )}
            >
              {/* Play Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-primary/10 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay(audio);
                }}
              >
                {playingId === audio.id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {audio.source === 'recording' ? (
                    <Mic className="w-3 h-3 text-primary" />
                  ) : (
                    <Upload className="w-3 h-3 text-muted-foreground" />
                  )}
                  <h3 className="font-medium text-sm truncate">{audio.file_name}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {formatDuration(audio.duration_seconds)}
                  </span>
                  {audio.genre && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                      {audio.genre}
                    </Badge>
                  )}
                  {audio.mood && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                      {audio.mood}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(audio.id);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
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

      {/* Audio Detail Sheet */}
      <Sheet open={!!selectedAudio} onOpenChange={(open) => !open && setSelectedAudio(null)}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
          {selectedAudio && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedAudio.source === 'recording' ? (
                    <Mic className="w-4 h-4 text-primary" />
                  ) : (
                    <Music className="w-4 h-4" />
                  )}
                  {selectedAudio.file_name}
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-full mt-4 pr-4">
                <div className="space-y-4 pb-8">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Длительность</p>
                      <p>{formatDuration(selectedAudio.duration_seconds)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Дата</p>
                      <p>{format(new Date(selectedAudio.created_at), 'd MMM yyyy', { locale: ru })}</p>
                    </div>
                    {selectedAudio.genre && (
                      <div>
                        <p className="text-muted-foreground text-xs">Жанр</p>
                        <p>{selectedAudio.genre}</p>
                      </div>
                    )}
                    {selectedAudio.mood && (
                      <div>
                        <p className="text-muted-foreground text-xs">Настроение</p>
                        <p>{selectedAudio.mood}</p>
                      </div>
                    )}
                  </div>

                  {/* Transcription */}
                  {selectedAudio.transcription && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Транскрипция</p>
                      <pre className="whitespace-pre-wrap text-sm font-sans bg-secondary/50 p-3 rounded-lg">
                        {selectedAudio.transcription}
                      </pre>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handlePlay(selectedAudio)}
                    >
                      {playingId === selectedAudio.id ? (
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
                        setDeleteConfirmId(selectedAudio.id);
                        setSelectedAudio(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

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

      {/* Upload Dialog - using simple upload interface */}
      {uploadDialogOpen && (
        <SimpleUploadDialog 
          open={uploadDialogOpen} 
          onOpenChange={setUploadDialogOpen} 
        />
      )}
    </div>
  );
}
