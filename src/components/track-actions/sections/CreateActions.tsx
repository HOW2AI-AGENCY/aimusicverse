import { DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Plus, Music, ImagePlus, Disc, Sparkles, Mic2, Guitar, Video, Fingerprint } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
import { IconGridButton } from '../IconGridButton';

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
  // Video generation available for all tracks
  const showVideo = true;

  const hasAnyAction = showGenerateCover || showCover || showExtend || showRemix || showAddVocals || showAddInstrumental || showVideo;
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
          {showVideo && (
            <DropdownMenuItem onClick={() => onAction('generate_video')} disabled={isProcessing}>
              <Video className="w-4 h-4 mr-2" />
              Видео
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

  // Sheet variant - Icon Grid Layout
  return (
    <div className="grid grid-cols-4 gap-1">
      {showGenerateCover && (
        <IconGridButton
          icon={ImagePlus}
          label="Обложка"
          color="pink"
          onClick={() => onAction('generate_cover')}
          disabled={isProcessing}
        />
      )}
      {showCover && (
        <IconGridButton
          icon={Disc}
          label="Кавер"
          color="purple"
          onClick={() => onAction('cover')}
        />
      )}
      {showExtend && (
        <IconGridButton
          icon={Plus}
          label="Расширить"
          color="green"
          onClick={() => onAction('extend')}
        />
      )}
      {showRemix && (
        <IconGridButton
          icon={Music}
          label="Ремикс"
          color="amber"
          onClick={() => onAction('remix')}
          disabled={isProcessing}
        />
      )}
      {showVideo && (
        <IconGridButton
          icon={Video}
          label="Видео"
          color="blue"
          onClick={() => onAction('generate_video')}
          disabled={isProcessing}
        />
      )}
      {showAddVocals && (
        <IconGridButton
          icon={Mic2}
          label="Вокал"
          sublabel="Добавить"
          color="cyan"
          onClick={() => onAction('add_vocals')}
          disabled={isProcessing}
        />
      )}
      {showAddInstrumental && (
        <IconGridButton
          icon={Guitar}
          label="Инструм."
          sublabel="Добавить"
          color="orange"
          onClick={() => onAction('add_instrumental')}
          disabled={isProcessing}
        />
      )}
    </div>
  );
}
