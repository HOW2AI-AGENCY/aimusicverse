/**
 * IntegratedStemTracks - Minimalist DAW-style stem tracks
 *
 * Features:
 * - Clean, minimal design focused on waveform
 * - Mobile-first responsive layout
 * - Swipe-friendly stem controls
 * - Synchronized playhead with main timeline
 * - Inline MIDI notes preview with transcription support
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  Volume2, VolumeX, ChevronDown, ChevronUp, Headphones, Plus, Loader2, Gauge, Trash2, Waves,
} from "@/lib/icons";
import { TrackStem } from "@/hooks/useTrackStems";
import type { StemTranscription } from "@/hooks/useStemTranscription";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSimulatedStemLevels } from "@/hooks/audio/useSimulatedStemLevels";
import { StemTrackSkeleton } from "@/components/studio/StemTrackSkeleton";
import { VirtualizedStemList } from "@/components/studio/VirtualizedStemList";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { stemConfig, type StemState } from "./stemTrackConfig";
import { StemTrackRowMobile, StemTrackRowDesktop } from "./stem-tracks";

interface IntegratedStemTracksProps {
  stems: TrackStem[];
  stemStates: Record<string, StemState>;
  transcriptionsByStem?: Record<string, StemTranscription>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  masterMuted: boolean;
  stemsReady?: boolean;
  stemsLoadingProgress?: number;
  onStemToggle: (stemId: string, type: "mute" | "solo") => void;
  onStemVolumeChange: (stemId: string, volume: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onMasterMuteToggle: () => void;
  onSeek: (time: number) => void;
  onStemAction: (
    stem: TrackStem,
    action: "midi" | "reference" | "download" | "effects" | "view-notes" | "delete" | "arrangement",
  ) => void;
  onAddTrack?: () => void;
  effectsEnabled?: boolean;
  className?: string;
}

export function IntegratedStemTracks({
  stems,
  stemStates,
  transcriptionsByStem,
  isPlaying,
  currentTime,
  duration,
  masterVolume,
  masterMuted,
  stemsReady = true,
  stemsLoadingProgress = 100,
  onStemToggle,
  onStemVolumeChange,
  onMasterVolumeChange,
  onMasterMuteToggle,
  onSeek,
  onStemAction,
  onAddTrack,
  effectsEnabled,
  className,
}: IntegratedStemTracksProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHardwareMode, setIsHardwareMode] = useState(false);
  const [pendingDeleteStem, setPendingDeleteStem] = useState<TrackStem | null>(null);
  const haptic = useHapticFeedback();

  const toggleExpand = useCallback(() => {
    haptic.select();
    setIsExpanded((prev) => !prev);
  }, [haptic]);

  const toggleHardwareMode = useCallback(() => {
    haptic.impact();
    setIsHardwareMode((prev) => !prev);
  }, [haptic]);

  // S6 — deleting a stem is destructive and irreversible: require confirmation.
  const handleStemAction = useCallback<IntegratedStemTracksProps["onStemAction"]>(
    (stem, action) => {
      if (action === "delete") {
        haptic.impact();
        setPendingDeleteStem(stem);
        return;
      }
      onStemAction(stem, action);
    },
    [haptic, onStemAction],
  );

  const confirmDeleteStem = useCallback(() => {
    if (pendingDeleteStem) onStemAction(pendingDeleteStem, "delete");
    setPendingDeleteStem(null);
  }, [pendingDeleteStem, onStemAction]);

  const simulatedLevels = useSimulatedStemLevels(stemStates, masterVolume, masterMuted, isPlaying);

  const hardwareStems = useMemo(
    () =>
      (stems || []).map((stem) => ({
        id: stem.id,
        name: stem.stem_type.charAt(0).toUpperCase() + stem.stem_type.slice(1),
        type: stem.stem_type,
        level: simulatedLevels.stems[stem.id] ?? 0,
      })),
    [stems, simulatedLevels.stems],
  );

  // Empty state
  if (!stems || stems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Waves className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Нет стемов</h3>
        <p className="text-xs text-muted-foreground/60 max-w-[200px]">
          Разделите трек на стемы, чтобы редактировать каждую дорожку отдельно
        </p>
        {onAddTrack && (
          <Button variant="outline" size="sm" className="mt-4" onClick={onAddTrack}>
            <Plus className="w-4 h-4 mr-1" />
            Добавить дорожку
          </Button>
        )}
      </div>
    );
  }

  const soloedCount = Object.values(stemStates).filter((s) => s.solo).length;
  const mutedCount = Object.values(stemStates).filter((s) => s.muted).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("flex flex-col", className)}>
      {/* Minimal header */}
      <div className={cn("flex items-center justify-between px-3 py-2", "bg-muted/30 border-y border-border/30")}>
        <button onClick={toggleExpand} className="flex items-center gap-2 text-xs font-medium">
          <Headphones className="w-4 h-4 text-primary" />
          <span>Стемы</span>
          {!stemsReady && stemsLoadingProgress < 100 ? (
            <Badge variant="secondary" className="h-5 px-1.5 text-[0.625rem] font-mono flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {stemsLoadingProgress}%
            </Badge>
          ) : (
            <Badge variant="secondary" className="h-5 px-1.5 text-[0.625rem] font-mono">
              {stems.length}
            </Badge>
          )}
          {soloedCount > 0 && <Badge className="h-5 px-1.5 text-[0.625rem] bg-primary">{soloedCount}S</Badge>}
          {mutedCount > 0 && (
            <Badge variant="outline" className="h-5 px-1.5 text-[0.625rem] text-destructive">
              {mutedCount}M
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Hardware mode toggle + Add Track + Master volume */}
        <div className="flex items-center gap-2">
          {/* Hardware mode toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isHardwareMode ? "default" : "ghost"}
                size="sm"
                onClick={toggleHardwareMode}
                className={cn("h-7 w-7 p-0 rounded-lg", isHardwareMode && "bg-primary text-primary-foreground")}
              >
                <Gauge className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isHardwareMode ? "Обычный микшер" : "Hardware микшер"}</TooltipContent>
          </Tooltip>

          {onAddTrack && (
            <Button variant="outline" size="sm" onClick={onAddTrack} className="h-7 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Добавить</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onMasterMuteToggle}
            className={cn("h-7 w-7 p-0 rounded-lg", masterMuted && "text-destructive")}
          >
            {masterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          {!isMobile && (
            <>
              <Slider
                value={[masterVolume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => onMasterVolumeChange(v[0])}
                disabled={masterMuted}
                className="w-20"
              />
              <span className="text-[0.625rem] font-mono text-muted-foreground w-7">{Math.round(masterVolume * 100)}</span>
            </>
          )}
        </div>
      </div>

      {/* Stem tracks */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            key={isHardwareMode ? "hardware" : "standard"}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Show skeleton while loading */}
            {!stemsReady && stemsLoadingProgress < 100 ? (
              <div className="p-2">
                <StemTrackSkeleton count={stems.length} isMobile={isMobile} />
              </div>
            ) : (
              /* Standard mode - virtualized list */
              <VirtualizedStemList
                stems={stems}
                stemStates={stemStates}
                transcriptionsByStem={transcriptionsByStem}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                isMobile={isMobile}
                onStemToggle={onStemToggle}
                onStemVolumeChange={onStemVolumeChange}
                onSeek={onSeek}
                onStemAction={handleStemAction}
                renderMobileRow={(props) => <StemTrackRowMobile {...props} />}
                renderDesktopRow={(props) => <StemTrackRowDesktop {...props} />}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!pendingDeleteStem} onOpenChange={(o) => !o && setPendingDeleteStem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              Удалить стем?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteStem
                ? `Дорожка «${pendingDeleteStem.stem_type}» будет удалена безвозвратно. Это действие нельзя отменить.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
