/**
 * CloudAudioPicker - Select audio from cloud reference library
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Cloud, 
  Search, 
  Play, 
  Pause, 
  Check, 
  Music2,
  Loader2,
  Clock,
  Tag
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface CloudAudio {
  id: string;
  file_name: string;
  file_url: string;
  duration_seconds: number | null;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  instruments: string[] | null;
  source: string;
  created_at: string;
}

interface CloudAudioPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (audio: CloudAudio) => void;
}

export function CloudAudioPicker({ 
  open, 
  onOpenChange, 
  onSelect 
}: CloudAudioPickerProps) {
  const { user } = useAuth();
  const [audioList, setAudioList] = useState<CloudAudio[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch audio list
  useEffect(() => {
    if (open && user) {
      fetchAudioList();
    }
  }, [open, user]);

  // Cleanup audio on close
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
    }
  }, [open]);

  const fetchAudioList = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reference_audio')
        .select('id, file_name, file_url, duration_seconds, genre, mood, bpm, instruments, source, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAudioList(data || []);
    } catch (error) {
      console.error('Failed to fetch audio list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = (audio: CloudAudio) => {
    if (playingId === audio.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const newAudio = new Audio(audio.file_url);
    newAudio.onended = () => setPlayingId(null);
    newAudio.onerror = () => {
      setPlayingId(null);
      console.error('Failed to load audio:', audio.file_url);
    };
    newAudio.play().catch((err) => {
      console.error('Audio play error:', err);
      setPlayingId(null);
    });
    audioRef.current = newAudio;
    setPlayingId(audio.id);
  };

  const handleSelect = (audio: CloudAudio) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onSelect(audio);
    onOpenChange(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredList = audioList.filter(audio => 
    audio.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    audio.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    audio.mood?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            Выбрать из облака
          </DialogTitle>
          <DialogDescription>
            Выберите аудио-референс из вашей библиотеки
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию, жанру..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Audio List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Music2 className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'Ничего не найдено' : 'Нет аудио в библиотеке'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filteredList.map((audio) => (
                <div
                  key={audio.id}
                  className={cn(
                    "p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors",
                    "flex items-center gap-3"
                  )}
                >
                  {/* Play Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handlePlay(audio)}
                  >
                    {playingId === audio.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {audio.file_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {audio.duration_seconds && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(audio.duration_seconds)}
                        </span>
                      )}
                      {audio.bpm && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          {audio.bpm} BPM
                        </Badge>
                      )}
                      {audio.genre && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {audio.genre}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Select Button */}
                  <Button
                    size="sm"
                    className="shrink-0 gap-1"
                    onClick={() => handleSelect(audio)}
                  >
                    <Check className="w-3 h-3" />
                    Выбрать
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
