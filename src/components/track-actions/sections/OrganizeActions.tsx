import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Folder, ListMusic, Sparkles, FolderPlus } from 'lucide-react';
import { Track } from '@/hooks/useTracksOptimized';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface OrganizeActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
}

export function OrganizeActions({ track, state, onAction, variant }: OrganizeActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const showPlaylist = isActionAvailable('add_to_playlist', track, state);
  const showProject = isActionAvailable('add_to_project', track, state);
  const showArtist = isActionAvailable('create_artist', track, state);

  if (!showPlaylist && !showProject && !showArtist) return null;

  if (variant === 'dropdown') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <FolderPlus className="w-4 h-4 mr-2" />
          Добавить в...
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8}>
          {showPlaylist && (
            <DropdownMenuItem onClick={() => onAction('add_to_playlist')}>
              <ListMusic className="w-4 h-4 mr-2" />
              Плейлист
            </DropdownMenuItem>
          )}
          {showProject && (
            <DropdownMenuItem onClick={() => onAction('add_to_project')}>
              <Folder className="w-4 h-4 mr-2" />
              Проект
            </DropdownMenuItem>
          )}
          {showArtist && (
            <DropdownMenuItem onClick={() => onAction('create_artist')}>
              <Sparkles className="w-4 h-4 mr-2" />
              Создать артиста
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
            <FolderPlus className="w-5 h-5" />
            <span>Добавить в...</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 space-y-1">
        {showPlaylist && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('add_to_playlist')}
          >
            <ListMusic className="w-4 h-4" />
            <span>Плейлист</span>
          </Button>
        )}
        {showProject && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('add_to_project')}
          >
            <Folder className="w-4 h-4" />
            <span>Проект</span>
          </Button>
        )}
        {showArtist && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('create_artist')}
          >
            <Sparkles className="w-4 h-4" />
            <span>Создать артиста</span>
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
