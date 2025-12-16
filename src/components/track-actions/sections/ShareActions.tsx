import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Share2, Video, Send, Link, ListMusic, Folder, Loader2, CheckCircle2 } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable, isActionDisabled, getActionLabel } from '@/lib/trackActionConditions';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface ShareActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function ShareActions({ track, state, onAction, variant, isProcessing }: ShareActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
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

  // Sheet variant
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between gap-3 h-12"
        >
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5" />
            <span>Поделиться</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 space-y-1">
        {showVideo && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('generate_video')}
            disabled={isProcessing || isActionDisabled('generate_video', track, state, isProcessing || false)}
          >
            {state.isVideoGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : state.hasVideo ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Video className="w-4 h-4" />
            )}
            <span>{getActionLabel('generate_video', track, state)}</span>
          </Button>
        )}
        {showTelegram && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('send_telegram')}
            disabled={isProcessing}
          >
            <Send className="w-4 h-4" />
            <span>Отправить в Telegram</span>
          </Button>
        )}
        {showCopyLink && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('copy_link')}
          >
            <Link className="w-4 h-4" />
            <span>Скопировать ссылку</span>
          </Button>
        )}
        {showPlaylist && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('add_to_playlist')}
          >
            <ListMusic className="w-4 h-4" />
            <span>В плейлист</span>
          </Button>
        )}
        {showProject && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('add_to_project')}
          >
            <Folder className="w-4 h-4" />
            <span>В проект</span>
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
