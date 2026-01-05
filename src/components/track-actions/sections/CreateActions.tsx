import { Button } from '@/components/ui/button';
import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Plus, Music, ImagePlus, Disc, Sparkles, Mic2, Guitar } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';

interface CreateActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function CreateActions({ track, state, onAction, variant, isProcessing }: CreateActionsProps) {
  const showGenerateCover = isActionAvailable('generate_cover', track, state);
  const showCover = isActionAvailable('cover', track, state);
  const showExtend = isActionAvailable('extend', track, state);
  const showRemix = isActionAvailable('remix', track, state);
  const showAddVocals = isActionAvailable('add_vocals', track, state);
  const showAddInstrumental = isActionAvailable('add_instrumental', track, state);

  const hasAnyAction = showGenerateCover || showCover || showExtend || showRemix || showAddVocals || showAddInstrumental;
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
          {showAddInstrumental && (
            <DropdownMenuItem onClick={() => onAction('add_instrumental')} disabled={isProcessing}>
              <Guitar className="w-4 h-4 mr-2" />
              Добавить инструментал
            </DropdownMenuItem>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // Sheet variant - compact buttons h-10
  return (
    <div className="space-y-0.5">
      {showGenerateCover && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 rounded-lg hover:bg-pink-500/10 group"
          onClick={() => onAction('generate_cover')}
          disabled={isProcessing}
        >
          <div className="w-7 h-7 rounded-md bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
            <ImagePlus className="w-3.5 h-3.5 text-pink-500" />
          </div>
          <span className="text-sm">Обложка</span>
          <span className="ml-auto text-xs text-muted-foreground">AI</span>
        </Button>
      )}
      {showCover && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 rounded-lg hover:bg-purple-500/10 group"
          onClick={() => onAction('cover')}
        >
          <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <Disc className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <span className="text-sm">Кавер версия</span>
        </Button>
      )}
      {showExtend && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 rounded-lg hover:bg-green-500/10 group"
          onClick={() => onAction('extend')}
        >
          <div className="w-7 h-7 rounded-md bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
            <Plus className="w-3.5 h-3.5 text-green-500" />
          </div>
          <span className="text-sm">Расширить трек</span>
        </Button>
      )}
      {showRemix && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 rounded-lg hover:bg-amber-500/10 group"
          onClick={() => onAction('remix')}
          disabled={isProcessing}
        >
          <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
            <Music className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <span className="text-sm">Ремикс</span>
        </Button>
      )}
      {showAddVocals && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 rounded-lg hover:bg-blue-500/10 group"
          onClick={() => onAction('add_vocals')}
          disabled={isProcessing}
        >
          <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <Mic2 className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-sm">Добавить вокал</span>
        </Button>
      )}
      {showAddInstrumental && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-10 rounded-lg hover:bg-orange-500/10 group"
          onClick={() => onAction('add_instrumental')}
          disabled={isProcessing}
        >
          <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
            <Guitar className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <span className="text-sm">Добавить инструментал</span>
        </Button>
      )}
    </div>
  );
}
