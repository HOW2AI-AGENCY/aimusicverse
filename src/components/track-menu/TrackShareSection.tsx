import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Download, Share2, Globe, Lock, Send } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrackShareSectionProps {
  track: Track;
  isProcessing: boolean;
  onDownload: () => void;
  onShare: () => void;
  onTogglePublic: () => void;
  onSendToTelegram: () => void;
}

export function TrackShareSection({
  track,
  isProcessing,
  onDownload,
  onShare,
  onTogglePublic,
  onSendToTelegram,
}: TrackShareSectionProps) {
  if (!track.audio_url || track.status !== 'completed') {
    return null;
  }

  return (
    <>
      <DropdownMenuItem onClick={onDownload}>
        <Download className="w-4 h-4 mr-2" />
        Скачать MP3
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onShare}>
        <Share2 className="w-4 h-4 mr-2" />
        Поделиться
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onSendToTelegram} disabled={isProcessing}>
        <Send className="w-4 h-4 mr-2" />
        Отправить в Telegram
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={onTogglePublic} disabled={isProcessing}>
        {track.is_public ? (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Сделать приватным
          </>
        ) : (
          <>
            <Globe className="w-4 h-4 mr-2" />
            Сделать публичным
          </>
        )}
      </DropdownMenuItem>
    </>
  );
}
