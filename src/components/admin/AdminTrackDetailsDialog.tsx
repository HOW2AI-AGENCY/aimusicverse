import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Music, Play, Pause, Globe, Lock, Clock, 
  Heart, Calendar, User, FileAudio 
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useRef, useState } from "react";

interface AdminTrack {
  id: string;
  title: string | null;
  status: string | null;
  style: string | null;
  duration_seconds: number | null;
  play_count: number | null;
  is_public: boolean | null;
  created_at: string | null;
  user_id: string;
  audio_url: string | null;
  cover_url: string | null;
  creator_username?: string | null;
  creator_photo_url?: string | null;
}

interface AdminTrackDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: AdminTrack | null;
}

export function AdminTrackDetailsDialog({ 
  open, 
  onOpenChange, 
  track 
}: AdminTrackDetailsDialogProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!track) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Детали трека
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cover and Title */}
          <div className="flex gap-4">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {track.cover_url ? (
                <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Music className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              {track.audio_url && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute inset-0 m-auto w-10 h-10 rounded-full opacity-90"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {track.title || "Без названия"}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {track.style || "Стиль не указан"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {track.is_public ? (
                  <Badge variant="outline" className="text-green-500 border-green-500/30">
                    <Globe className="h-3 w-3 mr-1" />
                    Публичный
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Lock className="h-3 w-3 mr-1" />
                    Приватный
                  </Badge>
                )}
                <Badge variant={track.status === "completed" ? "default" : "secondary"}>
                  {track.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Audio Player */}
          {track.audio_url && (
            <audio
              ref={audioRef}
              src={track.audio_url}
              onEnded={() => setIsPlaying(false)}
              className="w-full"
              controls
            />
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Длительность</div>
                <div className="font-medium">{formatDuration(track.duration_seconds)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Play className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Прослушиваний</div>
                <div className="font-medium">{track.play_count || 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Создан</div>
                <div className="font-medium">
                  {track.created_at 
                    ? format(new Date(track.created_at), "dd MMM yyyy", { locale: ru })
                    : "—"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <FileAudio className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">ID</div>
                <div className="font-mono text-xs truncate">{track.id.slice(0, 8)}...</div>
              </div>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <Avatar>
              <AvatarImage src={track.creator_photo_url || undefined} />
              <AvatarFallback>
                {track.creator_username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm text-muted-foreground">Автор</div>
              <div className="font-medium">@{track.creator_username || "—"}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
