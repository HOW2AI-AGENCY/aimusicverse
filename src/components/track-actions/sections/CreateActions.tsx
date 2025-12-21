import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Plus, Music, ImagePlus, Disc, Sparkles, Mic2 } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CreateActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function CreateActions({ track, state, onAction, variant, isProcessing }: CreateActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const showGenerateCover = isActionAvailable('generate_cover', track, state);
  const showCover = isActionAvailable('cover', track, state);
  const showExtend = isActionAvailable('extend', track, state);
  const showRemix = isActionAvailable('remix', track, state);
  const showAddVocals = isActionAvailable('add_vocals', track, state);

  const hasAnyAction = showGenerateCover || showCover || showExtend || showRemix || showAddVocals;
  if (!hasAnyAction) return null;

  if (variant === 'dropdown') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Sparkles className="w-4 h-4 mr-2" />
          Создать
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8}>
          {showGenerateCover && (
            <DropdownMenuItem onClick={() => onAction('generate_cover')} disabled={isProcessing}>
              <ImagePlus className="w-4 h-4 mr-2" />
              Обложка
            </DropdownMenuItem>
          )}
          {showCover && (
            <DropdownMenuItem onClick={() => onAction('cover')}>
              <Disc className="w-4 h-4 mr-2" />
              Кавер версия
            </DropdownMenuItem>
          )}
          {showExtend && (
            <DropdownMenuItem onClick={() => onAction('extend')}>
              <Plus className="w-4 h-4 mr-2" />
              Расширить трек
            </DropdownMenuItem>
          )}
          {showRemix && (
            <DropdownMenuItem onClick={() => onAction('remix')} disabled={isProcessing}>
              <Music className="w-4 h-4 mr-2" />
              Ремикс
            </DropdownMenuItem>
          )}
          {showAddVocals && (
            <DropdownMenuItem onClick={() => onAction('add_vocals')} disabled={isProcessing}>
              <Mic2 className="w-4 h-4 mr-2" />
              Добавить вокал
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
            <Sparkles className="w-5 h-5" />
            <span>Создать</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-4 space-y-1">
        {showGenerateCover && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('generate_cover')}
            disabled={isProcessing}
          >
            <ImagePlus className="w-4 h-4" />
            <span>Обложка</span>
          </Button>
        )}
        {showCover && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('cover')}
          >
            <Disc className="w-4 h-4" />
            <span>Кавер версия</span>
          </Button>
        )}
        {showExtend && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('extend')}
          >
            <Plus className="w-4 h-4" />
            <span>Расширить трек</span>
          </Button>
        )}
        {showRemix && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('remix')}
            disabled={isProcessing}
          >
            <Music className="w-4 h-4" />
            <span>Ремикс</span>
          </Button>
        )}
        {showAddVocals && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-11"
            onClick={() => onAction('add_vocals')}
            disabled={isProcessing}
          >
            <Mic2 className="w-4 h-4" />
            <span>Добавить вокал</span>
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
