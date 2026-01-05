import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Share2, Video, Send, Link, ListMusic, Folder, Loader2, CheckCircle2 } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable, isActionDisabled, getActionLabel } from '@/lib/trackActionConditions';

interface ShareActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function ShareActions({ track, state, onAction, variant, isProcessing }: ShareActionsProps) {
  const showVideo = isActionAvailable('generate_video', track, state) || state.isVideoGenerating || state.hasVideo;
  const showTelegram = isActionAvailable('send_telegram', track, state);
  const showCopyLink = isActionAvailable('copy_link', track, state);
  const showPlaylist = isActionAvailable('add_to_playlist', track, state);
  const showProject = isActionAvailable('add_to_project', track, state);

  const hasAnyAction = showVideo || showTelegram || showCopyLink || showPlaylist || showProject;
  if (!hasAnyAction) return null;

  const getVideoIcon = () => {
    if (state.isVideoGenerating) return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
    if (state.hasVideo) return <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />;
    return <Video className="w-4 h-4 mr-2" />;
  };

  if (variant === 'dropdown') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Share2 className="w-4 h-4 mr-2" />
          Поделиться
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8}>
          {showVideo && (
            <DropdownMenuItem 
              onClick={() => onAction('generate_video')} 
              disabled={isProcessing || isActionDisabled('generate_video', track, state, isProcessing || false)}
            >
              {getVideoIcon()}
              {getActionLabel('generate_video', track, state)}
            </DropdownMenuItem>
          )}
          {showTelegram && (
            <DropdownMenuItem onClick={() => onAction('send_telegram')} disabled={isProcessing}>
              <Send className="w-4 h-4 mr-2" />
              Отправить в Telegram
            </DropdownMenuItem>
          )}
          {showCopyLink && (
            <DropdownMenuItem onClick={() => onAction('copy_link')}>
              <Link className="w-4 h-4 mr-2" />
              Скопировать ссылку
            </DropdownMenuItem>
          )}
          {showPlaylist && (
            <DropdownMenuItem onClick={() => onAction('add_to_playlist')}>
              <ListMusic className="w-4 h-4 mr-2" />
              В плейлист
            </DropdownMenuItem>
          )}
          {showProject && (
            <DropdownMenuItem onClick={() => onAction('add_to_project')}>
              <Folder className="w-4 h-4 mr-2" />
              В проект
            </DropdownMenuItem>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // Sheet variant - flat list for use inside ActionCategory
  return (
    <div className="space-y-1">
      {showVideo && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-purple-500/10 group"
          onClick={() => onAction('generate_video')}
          disabled={isProcessing || isActionDisabled('generate_video', track, state, isProcessing || false)}
        >
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            {state.isVideoGenerating ? (
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
            ) : state.hasVideo ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Video className="w-4 h-4 text-purple-500" />
            )}
          </div>
          <span className="font-medium">{getActionLabel('generate_video', track, state)}</span>
        </Button>
      )}
      {showTelegram && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-blue-500/10 group"
          onClick={() => onAction('send_telegram')}
          disabled={isProcessing}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <Send className="w-4 h-4 text-blue-500" />
          </div>
          <span className="font-medium">Отправить в Telegram</span>
        </Button>
      )}
      {showCopyLink && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-muted group"
          onClick={() => onAction('copy_link')}
        >
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
            <Link className="w-4 h-4" />
          </div>
          <span className="font-medium">Скопировать ссылку</span>
        </Button>
      )}
      {showPlaylist && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-amber-500/10 group"
          onClick={() => onAction('add_to_playlist')}
        >
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
            <ListMusic className="w-4 h-4 text-amber-500" />
          </div>
          <span className="font-medium">В плейлист</span>
        </Button>
      )}
      {showProject && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-green-500/10 group"
          onClick={() => onAction('add_to_project')}
        >
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
            <Folder className="w-4 h-4 text-green-500" />
          </div>
          <span className="font-medium">В проект</span>
        </Button>
      )}
    </div>
  );
}
