import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Trash2 } from 'lucide-react';
import { ActionId } from '@/config/trackActionsConfig';
import { Track } from '@/hooks/useTracksOptimized';
import { TrackActionState } from '@/lib/trackActionConditions';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface DeleteActionsProps {
  track?: Track;
  state?: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
}

export function DeleteActions({ track, state, onAction, variant }: DeleteActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasMultipleVersions = (state?.versionCount || 0) > 1;

  if (variant === 'dropdown') {
    if (hasMultipleVersions) {
      return (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Удалить
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8}>
            <DropdownMenuItem 
              onClick={() => onAction('delete_version')}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Выбрать версию
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAction('delete_all')}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Все версии ({state?.versionCount})
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }

    return (
      <DropdownMenuItem 
        onClick={() => onAction('delete_all')}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Удалить
      </DropdownMenuItem>
    );
  }

  // Sheet variant
  if (hasMultipleVersions) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              <span>Удалить</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onAction('delete_version')}
          >
            <Trash2 className="w-4 h-4" />
            <span>Выбрать версию</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onAction('delete_all')}
          >
            <Trash2 className="w-4 h-4" />
            <span>Все версии ({state?.versionCount})</span>
          </Button>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={() => onAction('delete_all')}
    >
      <Trash2 className="w-5 h-5" />
      <span>Удалить</span>
    </Button>
  );
}
