/**
 * Stem Studio Header Component
 * 
 * Desktop header with navigation and action buttons
 * Extracted from StemStudioContent for better organization
 */

import { memo } from 'react';
import { ChevronLeft, HelpCircle, Sliders, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReplacementProgressIndicator } from '../ReplacementProgressIndicator';
import { ReplacementHistoryPanel } from '../ReplacementHistoryPanel';

interface StemStudioHeaderProps {
  trackTitle: string;
  trackId: string;
  trackAudioUrl?: string;
  canReplaceSection: boolean;
  effectsEnabled: boolean;
  editMode: 'none' | 'selecting' | 'editing' | 'comparing';
  onBack: () => void;
  onEnableEffects: () => void;
  onStartReplace: () => void;
  onHelp: () => void;
  onViewReplacementResult: (taskId: string) => void;
  actionsSlot?: React.ReactNode;
}

export const StemStudioHeader = memo(({
  trackTitle,
  trackId,
  trackAudioUrl,
  canReplaceSection,
  effectsEnabled,
  editMode,
  onBack,
  onEnableEffects,
  onStartReplace,
  onHelp,
  onViewReplacementResult,
  actionsSlot,
}: StemStudioHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/50 bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full h-10 w-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Студия стемов
          </span>
          <h1 className="text-sm font-semibold truncate max-w-[200px] sm:max-w-none">
            {trackTitle || 'Без названия'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Replacement Progress */}
        <ReplacementProgressIndicator 
          trackId={trackId}
          onViewResult={onViewReplacementResult}
        />

        {/* Replace Section Button */}
        {canReplaceSection && editMode === 'none' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onStartReplace}
              className="h-9 gap-1.5"
            >
              <Scissors className="w-4 h-4" />
              <span className="hidden sm:inline">Заменить</span>
            </Button>
            {trackAudioUrl && (
              <ReplacementHistoryPanel 
                trackId={trackId} 
                trackAudioUrl={trackAudioUrl} 
              />
            )}
          </>
        )}

        {/* Effects Mode Toggle */}
        {!effectsEnabled ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onEnableEffects}
            className="h-9 gap-1.5"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline">Эффекты</span>
          </Button>
        ) : (
          <Badge variant="secondary" className="h-9 px-3 gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-xs">FX</span>
          </Badge>
        )}

        {/* Help button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onHelp}
          className="h-9 w-9 rounded-full"
          title="Показать обучение"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>

        {/* Additional actions slot (MIDI, Downloads, Export, etc.) */}
        {actionsSlot}
      </div>
    </header>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.trackTitle === nextProps.trackTitle &&
    prevProps.trackId === nextProps.trackId &&
    prevProps.canReplaceSection === nextProps.canReplaceSection &&
    prevProps.effectsEnabled === nextProps.effectsEnabled &&
    prevProps.editMode === nextProps.editMode &&
    prevProps.actionsSlot === nextProps.actionsSlot
  );
});

StemStudioHeader.displayName = 'StemStudioHeader';
