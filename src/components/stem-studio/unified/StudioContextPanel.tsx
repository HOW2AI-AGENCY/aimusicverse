/**
 * StudioContextPanel
 * 
 * Dynamic panel that changes based on what's selected:
 * - Idle: Shows mixer controls, presets, export options
 * - Section focused: Shows section replacement editor
 * - Stem focused: Shows stem effects, MIDI transcription
 */

import { memo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { 
  Sliders, Music2, Scissors, Volume2, Wand2, 
  Piano, Download, RotateCcw, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { TrackStem } from '@/hooks/useTrackStems';
import { StemEffects } from '@/hooks/studio';
import { formatTime } from '@/lib/player-utils';

type FocusMode = 'idle' | 'section' | 'stem';

interface StudioContextPanelProps {
  mode: FocusMode;
  
  // Section context
  focusedSection?: DetectedSection | null;
  focusedSectionIndex?: number | null;
  onStartSectionReplace?: () => void;
  
  // Stem context
  focusedStem?: TrackStem | null;
  stemState?: { muted: boolean; solo: boolean; volume: number };
  stemEffects?: StemEffects;
  effectsEnabled?: boolean;
  onStemVolumeChange?: (volume: number) => void;
  onToggleStemMute?: () => void;
  onToggleStemSolo?: () => void;
  onOpenStemEffects?: () => void;
  onOpenMidiTranscription?: () => void;
  
  // Idle context
  masterVolume?: number;
  onMasterVolumeChange?: (volume: number) => void;
  onOpenPresets?: () => void;
  onOpenExport?: () => void;
  
  // Common
  onClearFocus?: () => void;
  className?: string;
}

const StemIcon: Record<string, React.ComponentType<any>> = {
  vocals: Music2,
  vocal: Music2,
  drums: Sliders,
  bass: Sliders,
  guitar: Music2,
  piano: Piano,
  keyboard: Piano,
  default: Music2,
};

export const StudioContextPanel = memo(({
  mode,
  focusedSection,
  focusedSectionIndex,
  onStartSectionReplace,
  focusedStem,
  stemState,
  effectsEnabled,
  onStemVolumeChange,
  onToggleStemMute,
  onToggleStemSolo,
  onOpenStemEffects,
  onOpenMidiTranscription,
  masterVolume = 0.85,
  onMasterVolumeChange,
  onOpenPresets,
  onOpenExport,
  onClearFocus,
  className,
}: StudioContextPanelProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn("", className)}
      >
        {mode === 'idle' && (
          <IdlePanel
            masterVolume={masterVolume}
            onMasterVolumeChange={onMasterVolumeChange}
            onOpenPresets={onOpenPresets}
            onOpenExport={onOpenExport}
          />
        )}
        
        {mode === 'section' && focusedSection && (
          <SectionPanel
            section={focusedSection}
            index={focusedSectionIndex || 0}
            onStartReplace={onStartSectionReplace}
            onClose={onClearFocus}
          />
        )}
        
        {mode === 'stem' && focusedStem && (
          <StemPanel
            stem={focusedStem}
            state={stemState}
            effectsEnabled={effectsEnabled}
            onVolumeChange={onStemVolumeChange}
            onToggleMute={onToggleStemMute}
            onToggleSolo={onToggleStemSolo}
            onOpenEffects={onOpenStemEffects}
            onOpenMidi={onOpenMidiTranscription}
            onClose={onClearFocus}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
});

// Idle Panel - Master controls
const IdlePanel = memo(({
  masterVolume,
  onMasterVolumeChange,
  onOpenPresets,
  onOpenExport,
}: {
  masterVolume: number;
  onMasterVolumeChange?: (volume: number) => void;
  onOpenPresets?: () => void;
  onOpenExport?: () => void;
}) => (
  <Card className="bg-card/50 border-border/30">
    <CardHeader className="py-2 px-3">
      <CardTitle className="text-xs font-medium flex items-center gap-2">
        <Volume2 className="w-3.5 h-3.5" />
        Мастер
      </CardTitle>
    </CardHeader>
    <CardContent className="py-2 px-3 space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground w-16">Громкость</span>
        <Slider
          value={[masterVolume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => onMasterVolumeChange?.(v[0])}
          className="flex-1"
        />
        <span className="text-[10px] font-mono w-8 text-right">
          {Math.round(masterVolume * 100)}%
        </span>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPresets}
          className="flex-1 h-7 text-[10px]"
        >
          <Sliders className="w-3 h-3 mr-1" />
          Пресеты
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenExport}
          className="flex-1 h-7 text-[10px]"
        >
          <Download className="w-3 h-3 mr-1" />
          Экспорт
        </Button>
      </div>
    </CardContent>
  </Card>
));

// Section Panel - Section replacement
const SectionPanel = memo(({
  section,
  index,
  onStartReplace,
  onClose,
}: {
  section: DetectedSection;
  index: number;
  onStartReplace?: () => void;
  onClose?: () => void;
}) => (
  <Card className="bg-primary/5 border-primary/20">
    <CardHeader className="py-2 px-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-xs font-medium flex items-center gap-2">
          <Scissors className="w-3.5 h-3.5 text-primary" />
          {section.label}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-5 w-5 p-0">
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>
    </CardHeader>
    <CardContent className="py-2 px-3 space-y-3">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Badge variant="secondary" className="h-4 text-[9px]">
          {formatTime(section.startTime)} - {formatTime(section.endTime)}
        </Badge>
        <span>•</span>
        <span>{Math.round(section.endTime - section.startTime)}сек</span>
      </div>
      
      {section.lyrics && (
        <p className="text-[10px] text-muted-foreground line-clamp-2 italic">
          "{section.lyrics.slice(0, 80)}..."
        </p>
      )}
      
      <Button
        onClick={onStartReplace}
        size="sm"
        className="w-full h-8 gap-1.5"
      >
        <Wand2 className="w-3.5 h-3.5" />
        Заменить секцию
        <ChevronRight className="w-3 h-3 ml-auto" />
      </Button>
    </CardContent>
  </Card>
));

// Stem Panel - Stem controls
const StemPanel = memo(({
  stem,
  state,
  effectsEnabled,
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onOpenEffects,
  onOpenMidi,
  onClose,
}: {
  stem: TrackStem;
  state?: { muted: boolean; solo: boolean; volume: number };
  effectsEnabled?: boolean;
  onVolumeChange?: (volume: number) => void;
  onToggleMute?: () => void;
  onToggleSolo?: () => void;
  onOpenEffects?: () => void;
  onOpenMidi?: () => void;
  onClose?: () => void;
}) => {
  const Icon = StemIcon[stem.stem_type.toLowerCase()] || StemIcon.default;
  const volume = state?.volume ?? 0.85;

  return (
    <Card className="bg-accent/5 border-accent/20">
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-accent-foreground" />
            {stem.stem_type}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-5 w-5 p-0">
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-3">
        {/* Volume */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <Button
              variant={state?.solo ? "default" : "outline"}
              size="sm"
              onClick={onToggleSolo}
              className="h-6 w-6 p-0 text-[10px] font-bold"
            >
              S
            </Button>
            <Button
              variant={state?.muted ? "destructive" : "outline"}
              size="sm"
              onClick={onToggleMute}
              className="h-6 w-6 p-0 text-[10px] font-bold"
            >
              M
            </Button>
          </div>
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => onVolumeChange?.(v[0])}
            className="flex-1"
          />
          <span className="text-[10px] font-mono w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenEffects}
            disabled={!effectsEnabled}
            className="flex-1 h-7 text-[10px]"
          >
            <Sliders className="w-3 h-3 mr-1" />
            Эффекты
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenMidi}
            className="flex-1 h-7 text-[10px]"
          >
            <Piano className="w-3 h-3 mr-1" />
            MIDI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

IdlePanel.displayName = 'IdlePanel';
SectionPanel.displayName = 'SectionPanel';
StemPanel.displayName = 'StemPanel';
StudioContextPanel.displayName = 'StudioContextPanel';
