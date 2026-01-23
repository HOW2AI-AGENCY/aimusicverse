/**
 * StudioActions - Studio-related actions menu section
 * Includes: Studio, Section Replace, Stems, MIDI Transcription
 */

import { 
  DropdownMenuItem, 
  DropdownMenuSub, 
  DropdownMenuSubTrigger, 
  DropdownMenuSubContent,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Layers, Scissors, Wand2, RefreshCw, Lock, Music2 } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';
import { IconGridButton } from '../IconGridButton';
import { StemsActionButton } from './StemsActionButton';
import { MidiTranscriptionActions } from './MidiTranscriptionActions';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

interface StemInfo {
  id: string;
  stem_type: string;
  audio_url: string;
}

interface StudioActionsProps {
  track: Track;
  state: TrackActionState;
  stems?: StemInfo[];
  onAction: (actionId: ActionId, stemId?: string, stemType?: string) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function StudioActions({ track, state, stems = [], onAction, variant, isProcessing }: StudioActionsProps) {
  const showStudio = isActionAvailable('open_studio', track, state);
  const showReplaceSection = isActionAvailable('replace_section', track, state);
  const showStemsSimple = isActionAvailable('stems_simple', track, state);
  const showStemsDetailed = isActionAvailable('stems_detailed', track, state);
  
  // Feature access checks
  const { hasAccess: canReplaceSection, requiredTier: replaceTier } = useFeatureAccess('section_replace');
  const { hasAccess: canStemDetailed, requiredTier: stemDetailedTier } = useFeatureAccess('stem_separation_detailed');
  
  // Show unified stems button if either mode is available
  const showStems = showStemsSimple || showStemsDetailed;
  
  // Show MIDI transcription only if stems exist
  const showMidi = state.stemCount > 0;

  const hasAnyAction = showStudio || showReplaceSection || showStems || showMidi;
  if (!hasAnyAction) return null;

  if (variant === 'dropdown') {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Layers className="w-4 h-4 mr-2" />
          Открыть в студии
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="bg-background/95 backdrop-blur-sm z-[10000]" sideOffset={8}>
          {/* Open Studio */}
          {showStudio && (
            <DropdownMenuItem onClick={() => onAction('open_studio')}>
              <Layers className="w-4 h-4 mr-2" />
              Открыть студию
              {state.stemCount > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">{state.stemCount} стемов</span>
              )}
            </DropdownMenuItem>
          )}
          
          {/* Section Replace - Premium gated */}
          {showReplaceSection && (
            canReplaceSection ? (
              <DropdownMenuItem onClick={() => onAction('replace_section')}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Замена секции
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled className="text-muted-foreground">
                <Lock className="w-4 h-4 mr-2" />
                Замена секции
                <span className="ml-auto text-xs opacity-60">{replaceTier?.toUpperCase()}</span>
              </DropdownMenuItem>
            )
          )}
          
          {(showStems || showMidi) && <DropdownMenuSeparator />}
          
          {/* Stems - Basic always available, Detailed premium-gated */}
          {showStemsSimple && (
            <DropdownMenuItem onClick={() => onAction('stems_simple')} disabled={isProcessing}>
              <Scissors className="w-4 h-4 mr-2" />
              Стемы (2 дорожки)
              <span className="ml-auto text-xs text-muted-foreground">FREE</span>
            </DropdownMenuItem>
          )}
          {showStemsDetailed && (
            canStemDetailed ? (
              <DropdownMenuItem onClick={() => onAction('stems_detailed')} disabled={isProcessing}>
                <Wand2 className="w-4 h-4 mr-2" />
                Стемы (6+ дорожек)
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled className="text-muted-foreground">
                <Lock className="w-4 h-4 mr-2" />
                Стемы (6+ дорожек)
                <span className="ml-auto text-xs opacity-60">{stemDetailedTier?.toUpperCase()}</span>
              </DropdownMenuItem>
            )
          )}
          
          {/* MIDI Transcription - available after stems generated */}
          {showMidi && (
            <>
              <DropdownMenuSeparator />
              <MidiTranscriptionActions
                state={state}
                stems={stems}
                onAction={onAction}
                variant="dropdown"
                isProcessing={isProcessing}
              />
            </>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  // Sheet variant - Icon Grid Layout with unified stems button
  return (
    <div className="grid grid-cols-4 gap-1">
      {showStudio && (
        <IconGridButton
          icon={Layers}
          label="Студия"
          color="blue"
          badge={state.stemCount > 0 ? state.stemCount : undefined}
          onClick={() => onAction('open_studio')}
        />
      )}
      
      {/* Section Replace - Premium gated */}
      {showReplaceSection && (
        canReplaceSection ? (
          <IconGridButton
            icon={RefreshCw}
            label="Секция"
            color="amber"
            onClick={() => onAction('replace_section')}
          />
        ) : (
          <IconGridButton
            icon={Lock}
            label="Секция"
            color="muted"
            onClick={() => onAction('replace_section')}
            disabled
          />
        )
      )}
      
      {/* Unified stems button with mode selector dialog */}
      {showStems && (
        <StemsActionButton
          onAction={onAction}
          isProcessing={isProcessing}
        />
      )}
      
      {/* MIDI Transcription */}
      {showMidi && (
        <MidiTranscriptionActions
          state={state}
          stems={stems}
          onAction={onAction}
          variant="sheet"
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
