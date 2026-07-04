/**
 * GenerationResultSheet Component
 *
 * Shows generation results with A/B version selection after track creation.
 * Provides immediate access to versions without navigating to library first.
 * Uses design system tokens (Spec 032)
 */

import { memo, useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, Mic, Loader2 } from "@/lib/icons";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { useVersionSwitcher } from "@/hooks/useVersionSwitcher";
import { useTrackVersionsList } from "@/hooks/generation/useTrackVersionsList";
import { useSunoPersona } from "@/hooks/studio/useSunoPersona";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { MASHUP_STRINGS } from "@/lib/locale/mashupStrings";

interface TrackVersion {
  id: string;
  label: string;
  audioUrl: string;
  duration?: number;
  isPrimary: boolean;
}

interface GenerationResultSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string | null;
  trackTitle?: string;
}

export const GenerationResultSheet = memo(function GenerationResultSheet({
  open,
  onOpenChange,
  trackId,
  trackTitle,
}: GenerationResultSheetProps) {
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [playingVersionId, setPlayingVersionId] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState(false);
  // Sprint 052-B5 — Suno Persona training from a freshly generated track.
  const [personaDialogOpen, setPersonaDialogOpen] = useState(false);
  const [personaName, setPersonaName] = useState("");
  const [personaDescription, setPersonaDescription] = useState("");
  const { setPrimaryVersionAsync } = useVersionSwitcher();
  const personaMutation = useSunoPersona();
  const { data: versions = [], isLoading: loading } = useTrackVersionsList({
    trackId,
    enabled: open,
  });

  // Reset selection when versions change
  useEffect(() => {
    if (!open || !trackId) {
      setSelectedVersion(null);
      return;
    }
    const primary = versions.find((v) => v.isPrimary);
    if (primary) {
      setSelectedVersion(primary.id);
    } else if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0].id);
    }
  }, [open, trackId, versions, selectedVersion]);

  // Sprint 052-B5 — kick off Persona training. Track must have at least one
  // ready version (selectedVersionData has an audioUrl below — we check
  // against that when the user actually clicks "Train Persona").
  const personaStrings = MASHUP_STRINGS.persona;

  const handleTrainPersona = useCallback(async () => {
    if (!trackId) return;
    const trimmed = personaName.trim();
    if (!trimmed) {
      toast.error("Укажите имя персоны");
      return;
    }
    if (trimmed.length > 80) {
      toast.error("Имя персоны — максимум 80 символов");
      return;
    }
    try {
      const result = await personaMutation.mutateAsync({
        trackId,
        name: trimmed,
        description: personaDescription.trim() || undefined,
      });
      logger.info(personaStrings.logEvent, { personaId: result.personaId, status: result.status });
      toast.success(personaStrings.successToastPending, {
        description:
          result.status === "pending"
            ? "Suno готовит персону — обычно 1-2 минуты. Мы сообщим, когда она будет готова."
            : personaStrings.successToastReady,
      });
      setPersonaDialogOpen(false);
      setPersonaName("");
      setPersonaDescription("");
    } catch (err) {
      logger.error(personaStrings.logEventFailed, { err });
      toast.error("Не удалось запустить обучение персоны");
    }
  }, [trackId, personaName, personaDescription, personaMutation, personaStrings.logEventFailed]);

  // Handle version preview (play/pause)
  const handlePreview = useCallback(
    (version: TrackVersion) => {
      haptic.tap();

      if (playingVersionId === version.id && isPlaying) {
        pauseTrack();
        setPlayingVersionId(null);
      } else {
        // Create a minimal track object for playback - cast to Track for player compatibility
        playTrack({
          id: trackId!,
          title: trackTitle || "Новый трек",
          audio_url: version.audioUrl,
          cover_url: null,
          user_id: "",
          created_at: new Date().toISOString(),
          is_liked: false,
          likes_count: 0,
        } as never);
        setPlayingVersionId(version.id);
      }
    },
    [playingVersionId, isPlaying, pauseTrack, playTrack, trackId, trackTitle, haptic],
  );

  // Handle version selection
  const handleSelect = useCallback(
    (versionId: string) => {
      haptic.select();
      setSelectedVersion(versionId);
    },
    [haptic],
  );

  // Set selected version as primary
  const handleSetPrimary = useCallback(async () => {
    if (!selectedVersion || !trackId) return;

    haptic.impact("medium");
    setSettingPrimary(true);

    try {
      await setPrimaryVersionAsync({ trackId, versionId: selectedVersion });
    } catch (error) {
      logger.error("Failed to set primary version", error);
      toast.error("Не удалось установить версию");
    } finally {
      setSettingPrimary(false);
    }
  }, [selectedVersion, trackId, haptic]);

  // Navigate to studio
  const handleGoToStudio = useCallback(() => {
    haptic.impact("medium");
    pauseTrack();
    onOpenChange(false);
    navigate(`/studio-v2?trackId=${trackId}`);
  }, [trackId, navigate, onOpenChange, pauseTrack, haptic]);

  // Navigate to library
  const handleGoToLibrary = useCallback(() => {
    haptic.tap();
    pauseTrack();
    onOpenChange(false);
    navigate(`/library?track=${trackId}`);
  }, [trackId, navigate, onOpenChange, pauseTrack, haptic]);

  const selectedVersionData = versions.find((v) => v.id === selectedVersion);
  const hasMultipleVersions = versions.length > 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "h-auto max-h-[85dvh] flex flex-col p-0 overflow-hidden",
          "bg-background text-foreground border-t border-border/60",
        )}
        hideCloseButton={false}
      >
        <SheetTitle className="sr-only">Результат генерации</SheetTitle>

        {/* Masthead — editorial header */}
        <header className="px-6 pt-7 pb-5 border-b border-border/40">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">
              {hasMultipleVersions
                ? `№ 001 · ${String(versions.length).padStart(2, "0")} takes`
                : "№ 001 · single take"}
            </p>
            <p className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">
              {new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
            </p>
          </div>
          <h2 className="mt-3 font-display text-display-2 leading-[0.95] tracking-tight truncate">
            {trackTitle || "Untitled"}
          </h2>
          <p className="mt-2 font-mono text-caption uppercase tracking-[0.22em] text-muted-foreground">
            {hasMultipleVersions ? "A / B · choose your take" : "ready to ship"}
          </p>
        </header>

        {/* Versions — magazine spread */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-6 py-8 space-y-6">
              <Skeleton className="h-24 w-full rounded-none" />
              <Skeleton className="h-24 w-full rounded-none" />
            </div>
          ) : (
            <ol className="divide-y divide-border/30">
              <AnimatePresence initial={false} mode="popLayout">
                {versions.map((version, index) => {
                  const isSelected = version.id === selectedVersion;
                  const isCurrentlyPlaying = playingVersionId === version.id && isPlaying;
                  const totalLabel = versions.length;
                  const durMin = Math.floor((version.duration ?? 0) / 60);
                  const durSec = String(Math.floor((version.duration ?? 0) % 60)).padStart(2, "0");

                  return (
                    <motion.li
                      key={version.id}
                      initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                      animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                      exit={{ opacity: 0, clipPath: "inset(0 0 0 100%)" }}
                      transition={{ delay: index * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "relative cursor-pointer transition-colors",
                        "hover:bg-foreground/[0.02]",
                        isSelected && "bg-foreground/[0.03]",
                      )}
                      onClick={() => handleSelect(version.id)}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-0 top-0 bottom-0 w-[2px] transition-opacity duration-300",
                          isSelected ? "bg-primary opacity-100" : "opacity-0",
                        )}
                      />

                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5 px-6 py-6">
                        {/* Big letter — Unbounded */}
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">
                            {String(index + 1).padStart(2, "0")}/{String(totalLabel).padStart(2, "0")}
                          </span>
                          <span
                            className={cn(
                              "font-display leading-[0.85] tabular-nums",
                              "text-[64px] sm:text-[72px]",
                              isSelected ? "text-foreground" : "text-foreground/70",
                            )}
                          >
                            {version.label}
                          </span>
                        </div>

                        {/* Centre column — metadata + status */}
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex items-center gap-3 font-mono text-caption uppercase tracking-[0.18em] text-muted-foreground">
                            <span>Stereo</span>
                            <span aria-hidden>·</span>
                            <span>44.1 kHz</span>
                            <span aria-hidden>·</span>
                            <span>{version.duration ? `${durMin}:${durSec}` : "—:—"}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-overline uppercase tracking-[0.18em]">
                            {version.isPrimary && <span className="text-primary">★ Master take</span>}
                            {isCurrentlyPlaying && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                                className="text-foreground"
                              >
                                ▮▮ playing
                              </motion.span>
                            )}
                            {!version.isPrimary && !isCurrentlyPlaying && (
                              <span className="text-muted-foreground/60">take · listen &amp; choose</span>
                            )}
                          </div>
                        </div>

                        {/* Play + select — stacked, square */}
                        <div className="flex flex-col items-end gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={isCurrentlyPlaying ? "Пауза" : "Воспроизвести"}
                            className={cn(
                              "h-12 w-12 rounded-none border border-foreground/20",
                              "hover:bg-foreground hover:text-background",
                              isCurrentlyPlaying && "bg-foreground text-background border-foreground",
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(version);
                            }}
                          >
                            {isCurrentlyPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5 translate-x-[1px]" />
                            )}
                          </Button>
                          <span
                            className={cn(
                              "font-mono text-overline uppercase tracking-[0.22em] transition-colors",
                              isSelected ? "text-foreground" : "text-muted-foreground/40",
                            )}
                          >
                            {isSelected ? "✓ chosen" : "select"}
                          </span>
                        </div>
                      </div>

                      {isCurrentlyPlaying && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 flex items-end gap-[3px] h-10">
                            {Array.from({ length: 48 }).map((_, i) => (
                              <motion.span
                                key={i}
                                className="w-[2px] bg-foreground/70 block"
                                animate={{
                                  height: [`${20 + Math.sin(i * 0.7) * 12}%`, `${20 + Math.sin(i * 0.7 + 1) * 12}%`],
                                }}
                                transition={{
                                  duration: 0.8 + (i % 5) * 0.1,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                  delay: i * 0.02,
                                }}
                                style={{ height: "20%" }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          )}
        </div>

        {/* Colophon — footer */}
        <footer className="border-t border-border/60 px-6 pt-5 pb-[calc(1.25rem+var(--safe-area-inset-bottom,0px))] space-y-5 bg-background">
          {hasMultipleVersions && selectedVersionData && !selectedVersionData.isPrimary && (
            <button
              type="button"
              onClick={handleSetPrimary}
              disabled={settingPrimary}
              className={cn(
                "group w-full text-left",
                "flex items-baseline justify-between gap-4",
                "py-3 border-b border-foreground/30 hover:border-primary",
                "transition-colors",
              )}
            >
              <span className="font-mono text-overline uppercase tracking-[0.22em] text-muted-foreground">
                {settingPrimary ? "saving…" : "promote to master"}
              </span>
              <span className="font-display text-heading-3 text-foreground">Version {selectedVersionData.label} →</span>
            </button>
          )}

          <div className="grid grid-cols-3 gap-px bg-border/60 border border-border/60">
            <button
              type="button"
              onClick={handleGoToLibrary}
              className={cn(
                "group flex flex-col items-start gap-1 bg-background px-4 py-4 text-left",
                "hover:bg-foreground/[0.03] transition-colors",
              )}
            >
              <span className="font-mono text-overline uppercase tracking-[0.22em] text-muted-foreground">
                02 · archive
              </span>
              <span className="font-display text-heading-3 text-foreground">Library →</span>
            </button>
            <button
              type="button"
              onClick={handleGoToStudio}
              className={cn(
                "group flex flex-col items-start gap-1 bg-background px-4 py-4 text-left",
                "hover:bg-foreground hover:text-background transition-colors",
              )}
            >
              <span className="font-mono text-overline uppercase tracking-[0.22em] text-muted-foreground group-hover:text-background/70">
                03 · open
              </span>
              <span className="font-display text-heading-3">Studio →</span>
            </button>
            <button
              type="button"
              onClick={() => setPersonaDialogOpen(true)}
              disabled={!trackId}
              className={cn(
                "group flex flex-col items-start gap-1 bg-background px-4 py-4 text-left",
                "hover:bg-foreground hover:text-background transition-colors",
                !trackId && "opacity-50 cursor-not-allowed",
              )}
            >
              <span className="font-mono text-overline uppercase tracking-[0.22em] text-muted-foreground group-hover:text-background/70">
                04 · voice
              </span>
              <span className="font-display text-heading-3 flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Persona
              </span>
            </button>
          </div>

          <p className="font-mono text-overline uppercase tracking-[0.22em] text-muted-foreground/70">
            stems · mix · arrange · master · persona — all in studio
          </p>
        </footer>
      </SheetContent>

      {/* Sprint 052-B5 — Train Persona dialog. */}
      <Dialog open={personaDialogOpen} onOpenChange={setPersonaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              {personaStrings.dialogTitle}
            </DialogTitle>
            <DialogDescription>{personaStrings.dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">{personaStrings.nameLabel}</Label>
              <Input
                value={personaName}
                onChange={(e) => setPersonaName(e.target.value)}
                placeholder={personaStrings.namePlaceholder}
                maxLength={80}
                className="mt-1.5"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-sm">{personaStrings.descriptionLabel}</Label>
              <Input
                value={personaDescription}
                onChange={(e) => setPersonaDescription(e.target.value)}
                placeholder={personaStrings.descriptionPlaceholder}
                maxLength={500}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPersonaDialogOpen(false)} disabled={personaMutation.isPending}>
              {personaStrings.cancel}
            </Button>
            <Button onClick={handleTrainPersona} disabled={personaMutation.isPending || !personaName.trim()}>
              {personaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {personaStrings.submitting}
                </>
              ) : (
                personaStrings.submit
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
});
