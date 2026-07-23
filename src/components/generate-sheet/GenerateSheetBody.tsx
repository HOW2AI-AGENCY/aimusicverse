// src/components/generate-sheet/GenerateSheetBody.tsx
import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "@/lib/motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ReferenceChipsRow } from "./ReferenceChipsRow";
import type { ReferenceKind } from "./ReferenceChipsRow";
import type { UseGenerateFormReturn } from "@/hooks/generation/useGenerateForm.types";
import { FormStepper } from "@/components/generate-form/FormStepper";

const GenerateFormSimple = lazy(() =>
  import("@/components/generate-form/GenerateFormSimple").then((m) => ({ default: m.GenerateFormSimple })),
);
const GenerateFormCustom = lazy(() =>
  import("@/components/generate-form/GenerateFormCustom").then((m) => ({ default: m.GenerateFormCustom })),
);

const FormSkeleton = () => (
  <div data-safe-skeleton="" className="space-y-3 p-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

interface Props {
  form: UseGenerateFormReturn;
  advancedOpen: boolean;
  onAdvancedToggle: (open: boolean) => void;
  onOpenLyricsAssistant: () => void;
  onAddReference: (kind: ReferenceKind) => void;
  onRemoveReference: (kind: ReferenceKind, id: string) => void;
  /** Opens the StylePresetSelector dialog. Required — the legacy sheet wired
   * this and the redesign shipped a no-op, leaving "Стили" dead. See design
   * review F1. */
  onOpenStyles: () => void;
  /** Used to resolve reference-chip labels (F2): chips were showing raw IDs. */
  projects?: { id: string; title?: string }[];
  artists?: { id: string; name?: string }[];
}

export function GenerateSheetBody({
  form,
  advancedOpen,
  onAdvancedToggle,
  onOpenLyricsAssistant,
  onAddReference,
  onRemoveReference,
  onOpenStyles,
  projects,
  artists,
}: Props) {
  return (
    <ScrollArea className="flex-1 overflow-x-hidden">
      <div className="px-3 sm:px-4 py-3 space-y-3 w-full max-w-full min-w-0">
        {/* Sprint 055-B5: sticky step indicator for custom mode */}
        {form.mode === "custom" && <FormStepper />}
        <ReferenceChipsRow
          references={{
            project: form.selectedProjectId
              ? {
                  id: form.selectedProjectId,
                  label: projects?.find((p) => p.id === form.selectedProjectId)?.title ?? form.selectedProjectId,
                }
              : undefined,
            artist: form.selectedArtistId
              ? {
                  id: form.selectedArtistId,
                  label: artists?.find((a) => a.id === form.selectedArtistId)?.name ?? form.selectedArtistId,
                }
              : undefined,
            audio: form.audioFile ? { id: "audio", label: form.audioFile.name } : undefined,
            voice: form.customVoiceId ? { id: form.customVoiceId, label: "Голос" } : undefined,
          }}
          onAdd={onAddReference}
          onRemove={onRemoveReference}
        />

        <Suspense fallback={<FormSkeleton />}>
          <AnimatePresence mode="wait">
            {form.mode === "simple" ? (
              <GenerateFormSimple
                description={form.description}
                onDescriptionChange={form.setDescription}
                title={form.title}
                onTitleChange={form.setTitle}
                hasVocals={form.hasVocals}
                onHasVocalsChange={form.setHasVocals}
                onBoostStyle={form.handleBoostStyle}
                boostLoading={form.boostLoading}
                onOpenStyles={onOpenStyles}
              />
            ) : (
              <GenerateFormCustom
                title={form.title}
                onTitleChange={form.setTitle}
                style={form.style}
                onStyleChange={form.setStyle}
                lyrics={form.lyrics}
                onLyricsChange={form.setLyrics}
                hasVocals={form.hasVocals}
                onHasVocalsChange={form.setHasVocals}
                onBoostStyle={form.handleBoostStyle}
                boostLoading={form.boostLoading}
                onOpenLyricsAssistant={onOpenLyricsAssistant}
                isPublic={form.isPublic}
                onIsPublicChange={form.setIsPublic}
                canMakePrivate={false}
                advancedOpen={advancedOpen}
                onAdvancedOpenChange={onAdvancedToggle}
                negativeTags={form.negativeTags}
                onNegativeTagsChange={form.setNegativeTags}
                vocalGender={form.vocalGender}
                onVocalGenderChange={form.setVocalGender}
                styleWeight={form.styleWeight}
                onStyleWeightChange={form.setStyleWeight}
                weirdnessConstraint={form.weirdnessConstraint}
                onWeirdnessConstraintChange={form.setWeirdnessConstraint}
                audioWeight={form.audioWeight}
                onAudioWeightChange={form.setAudioWeight}
                hasReferenceAudio={!!form.audioFile}
                hasPersona={!!form.selectedArtistId}
                onOpenStyles={onOpenStyles}
                customVoiceId={form.customVoiceId}
                onCustomVoiceIdChange={form.setCustomVoiceId}
              />
            )}
          </AnimatePresence>
        </Suspense>
      </div>
    </ScrollArea>
  );
}
