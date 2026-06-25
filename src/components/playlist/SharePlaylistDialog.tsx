import { useState, useEffect } from "react";
import { Copy, Check, Share2, ExternalLink, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { canShareToStory, getPlaylistDeepLink, sharePlaylistToStory, sharePlaylistURL } from "@/services/telegram";
import { useTelegram } from "@/contexts/TelegramContext";
import type { Playlist } from "@/hooks/usePlaylists";

interface SharePlaylistDialogProps {
  playlist: Playlist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SharePlaylistDialog({ playlist, open, onOpenChange }: SharePlaylistDialogProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { webApp } = useTelegram();

  const canShare = canShareToStory();

  useEffect(() => {
    if (open && playlist) {
      setLoading(true);
      const deepLink = getPlaylistDeepLink(playlist.id);
      setShareUrl(deepLink);
      setLoading(false);
    }
  }, [open, playlist]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Не удалось скопировать");
    }
  };

  const handleShareToStory = () => {
    if (!playlist) return;

    const success = sharePlaylistToStory({
      id: playlist.id,
      title: playlist.title,
      cover_url: playlist.cover_url,
      track_count: playlist.track_count,
    });

    if (success) {
      toast.success("Открыто для публикации в Stories");
      onOpenChange(false);
    } else {
      toast.error("Не удалось открыть Stories");
    }
  };

  const handleShare = () => {
    if (!playlist) return;

    sharePlaylistURL({
      id: playlist.id,
      title: playlist.title,
      track_count: playlist.track_count,
    });

    toast.success("Поделиться плейлистом");
    onOpenChange(false);
  };

  if (!playlist) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Поделиться плейлистом
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Playlist Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
              {playlist.cover_url ? (
                <img src={playlist.cover_url} alt={playlist.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg">📁</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{playlist.title}</p>
              <p className="text-sm text-muted-foreground">{playlist.track_count || 0} треков</p>
            </div>
          </div>

          {/* Share URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ссылка для обмена</label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopy} disabled={loading}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Share Options */}
          <div className="grid grid-cols-2 gap-2">
            {/* Share to Story */}
            {canShare && (
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={handleShareToStory}>
                <span className="text-lg">📷</span>
                <span className="text-xs">В Stories</span>
              </Button>
            )}

            {/* Share via Telegram */}
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={handleShare}>
              <ExternalLink className="h-5 w-5" />
              <span className="text-xs">Поделиться</span>
            </Button>
          </div>

          {/* Deep Link Info */}
          <p className="text-xs text-muted-foreground text-center">Ссылка откроет плейлист в MusicVerse Mini App</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
