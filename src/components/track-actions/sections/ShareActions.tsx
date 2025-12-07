import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Download, Share2, Send } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';

interface ShareActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function ShareActions({ track, state, onAction, variant, isProcessing }: ShareActionsProps) {
  const showDownload = isActionAvailable('download', track, state);
  const showShare = isActionAvailable('share', track, state);
  const showTelegram = isActionAvailable('send_telegram', track, state);

  if (!showDownload && !showShare && !showTelegram) return null;

  if (variant === 'dropdown') {
    return (
      <>
        {showDownload && (
          <DropdownMenuItem onClick={() => onAction('download')}>
            <Download className="w-4 h-4 mr-2" />
            Скачать
          </DropdownMenuItem>
        )}
        {showShare && (
          <DropdownMenuItem onClick={() => onAction('share')}>
            <Share2 className="w-4 h-4 mr-2" />
            Поделиться
          </DropdownMenuItem>
        )}
        {showTelegram && (
          <DropdownMenuItem onClick={() => onAction('send_telegram')} disabled={isProcessing}>
            <Send className="w-4 h-4 mr-2" />
            Отправить в Telegram
          </DropdownMenuItem>
        )}
      </>
    );
  }

  // Sheet variant
  return (
    <>
      {showDownload && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={() => onAction('download')}
        >
          <Download className="w-5 h-5" />
          <span>Скачать</span>
        </Button>
      )}
      {showShare && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={() => onAction('share')}
        >
          <Share2 className="w-5 h-5" />
          <span>Поделиться</span>
        </Button>
      )}
      {showTelegram && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={() => onAction('send_telegram')}
          disabled={isProcessing}
        >
          <Send className="w-5 h-5" />
          <span>Отправить в Telegram</span>
        </Button>
      )}
    </>
  );
}
