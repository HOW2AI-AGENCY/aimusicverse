/**
 * MidiTranscriptionActions - MIDI transcription menu with stem selection
 * Only available after stems have been generated
 */

import { 
  DropdownMenuItem, 
  DropdownMenuSub, 
  DropdownMenuSubTrigger, 
  DropdownMenuSubContent,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Music2, Lock, Mic2, Drum, Guitar, Piano, Waves, Music } from 'lucide-react';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState } from '@/lib/trackActionConditions';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { IconGridButton } from '../IconGridButton';
import { getTranscriptionConfig } from '@/lib/transcription-utils';

interface StemInfo {
  id: string;
  stem_type: string;
  audio_url: string;
}

interface MidiTranscriptionActionsProps {
  state: TrackActionState;
  stems?: StemInfo[];
  onAction: (actionId: ActionId, stemId?: string, stemType?: string) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

// Icon mapping for stem types
const STEM_ICONS: Record<string, typeof Music2> = {
  vocals: Mic2,
  drums: Drum,
  bass: Guitar,
  guitar: Guitar,
  piano: Piano,
  keys: Piano,
  strings: Waves,
  other: Music,
  instrumental: Music,
};

// Label mapping for stem types
const STEM_LABELS: Record<string, string> = {
  vocals: 'Вокал',
  drums: 'Ударные',
  bass: 'Бас',
  guitar: 'Гитара',
  piano: 'Фортепиано',
  keys: 'Клавишные',
  strings: 'Струнные',
  other: 'Прочее',
  instrumental: 'Инструментал',
};

function getStemIcon(stemType: string): typeof Music2 {
  const type = stemType.toLowerCase();
  for (const [key, icon] of Object.entries(STEM_ICONS)) {
    if (type.includes(key)) return icon;
  }
  return Music2;
}

function getStemLabel(stemType: string): string {
  const type = stemType.toLowerCase();
  for (const [key, label] of Object.entries(STEM_LABELS)) {
    if (type.includes(key)) return label;
  }
  return stemType;
}

export function MidiTranscriptionActions({ 
  state, 
  stems = [],
  onAction, 
  variant,
  isProcessing 
}: MidiTranscriptionActionsProps) {
  const { hasAccess, requiredTier } = useFeatureAccess('midi_transcription');
  
  // MIDI transcription only available when stems exist
  const hasStems = state.stemCount > 0;
  if (!hasStems) return null;

  // Dropdown variant
  if (variant === 'dropdown') {
    // No access - show locked item
    if (!hasAccess) {
      return (
        <DropdownMenuItem disabled className="text-muted-foreground">
          <Lock className="w-4 h-4 mr-2" />
          MIDI транскрипция
          <span className="ml-auto text-xs opacity-60">
            {requiredTier?.toUpperCase()}
          </span>
        </DropdownMenuItem>
      );
    }

    // Has access - show submenu with stems
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Music2 className="w-4 h-4 mr-2" />
          MIDI транскрипция
          <span className="ml-auto text-xs text-muted-foreground">
            {state.stemCount} стемов
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8}>
          {stems.map((stem) => {
            const Icon = getStemIcon(stem.stem_type);
            const label = getStemLabel(stem.stem_type);
            const config = getTranscriptionConfig(stem.stem_type);
            
            return (
              <DropdownMenuItem
                key={stem.id}
                onClick={() => onAction('transcribe_midi', stem.id, stem.stem_type)}
                disabled={isProcessing}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label} → MIDI
                <span className="ml-auto text-xs text-muted-foreground">
                  {config.model}
                </span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onAction('transcribe_notes')}
            disabled={isProcessing}
          >
            <Music2 className="w-4 h-4 mr-2" />
            Все стемы → Ноты
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // Sheet variant - Icon Grid
  if (!hasAccess) {
    return (
      <IconGridButton
        icon={Lock}
        label="MIDI"
        color="muted"
        onClick={() => onAction('transcribe_midi')}
        disabled
      />
    );
  }

  return (
    <IconGridButton
      icon={Music2}
      label="MIDI"
      color="purple"
      badge={state.stemCount}
      onClick={() => onAction('transcribe_midi')}
      disabled={isProcessing}
    />
  );
}
