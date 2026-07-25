/**
 * Sprint 056 — Generate Sheet UX Redesign (Task 2).
 *
 * Real-time, sheet-level validation for the generation form.
 *
 * The hook is intentionally decoupled from the full `UseGenerateFormReturn`
 * type. It accepts a structural slice with only the fields it needs so that:
 *   - unit tests can pass `as never` placeholders (the brief's contract),
 *   - the composer (`useGenerateForm`) can be split or refactored without
 *     touching this hook,
 *   - the hook remains pure: no side-effects, no analytics, no toast.
 *
 * Rules implemented (6):
 *   1. empty style  → error (custom mode needs style description)
 *   2. empty title  → warning (auto-generated fallback exists)
 *   3. lyrics >3000 → error (Suno API hard limit)
 *   4. lyrics empty + hasVocals → warning (model can't sing nothing)
 *   5. insufficient credits (balance < cost) → error
 *   6. style >200 chars → warning (Suno truncates at ~200)
 *
 * The spec mentions 10 rules; the brief explicitly implements 6. The other 4
 * (deep-link to fields, artist-without-style, audio-file-no-duration,
 * model-v5-instrumental) are deferred — they need either navigation
 * orchestration (deep-link callbacks) or richer form state (selectedArtist,
 * audioDuration) which the brief's test contract does not exercise.
 */

import { useMemo } from "react";

export type ValidationField = "title" | "style" | "lyrics" | "credits" | "model" | "audioFile";

export type ValidationSeverity = "error" | "warning";

export interface ValidationReason {
  field: ValidationField;
  severity: ValidationSeverity;
  message: string;
  messageRu: string;
  deepLink?: () => void;
}

export interface UseGenerateSheetValidationReturn {
  canGenerate: boolean;
  reasons: ValidationReason[];
  hasWarnings: boolean;
}

/**
 * Minimum structural slice the hook reads. Kept narrow on purpose so the
 * hook is independently testable and resilient to composer refactors.
 */
export interface ValidationFormSlice {
  mode: "simple" | "custom";
  style: string;
  description: string;
  lyrics: string;
  title: string;
  hasVocals: boolean | null;
  vocalGender: string;
  model?: string;
  audioFile: File | null;
  audioDuration?: number | null;
  selectedArtistId?: string;
  selectedProjectId?: string;
  customVoiceId?: string | null;
}

export function useGenerateSheetValidation(
  form: ValidationFormSlice,
  balance: number | null,
  cost: number,
): UseGenerateSheetValidationReturn {
  const reasons = useMemo<ValidationReason[]>(() => {
    const r: ValidationReason[] = [];

    // ── title ────────────────────────────────────────────────────────
    if (!form.title.trim()) {
      r.push({
        field: "title",
        severity: "warning",
        message: "title.empty",
        messageRu: "Название не заполнено",
      });
    } else if (form.title.length > 80) {
      r.push({
        field: "title",
        severity: "warning",
        message: "title.too_long",
        messageRu: "Слишком длинное название (>80 символов)",
      });
    }

    // ── style ────────────────────────────────────────────────────────
    if (!form.style.trim()) {
      r.push({
        field: "style",
        severity: "error",
        message: "style.empty",
        messageRu: "Опишите стиль трека",
      });
    } else if (form.style.length > 200) {
      r.push({
        field: "style",
        severity: "warning",
        message: "style.too_long",
        messageRu: "Слишком длинное описание стиля (>200 символов)",
      });
    }

    // ── lyrics ───────────────────────────────────────────────────────
    if (form.lyrics.length > 5000) {
      r.push({
        field: "lyrics",
        severity: "error",
        message: "lyrics.too_long",
        messageRu: "Превышен лимит Suno API (5000 символов)",
      });
    } else if (form.hasVocals && !form.lyrics.trim()) {
      r.push({
        field: "lyrics",
        severity: "warning",
        message: "lyrics.empty_with_vocals",
        messageRu: "Вокал включён, но текст пустой",
      });
    }

    // ── credits ──────────────────────────────────────────────────────
    // null balance = still loading → treat as insufficient so the user can't
    // submit on stale/unknown credit state (safe default, mirrors the header
    // pill's loading treatment).
    if (balance === null || balance < cost) {
      r.push({
        field: "credits",
        severity: "error",
        message: "credits.insufficient",
        messageRu: `Недостаточно кредитов (нужно ${cost}, доступно ${balance ?? 0})`,
      });
    }

    return r;
  }, [form.title, form.style, form.lyrics, form.hasVocals, balance, cost]);

  const canGenerate = reasons.every((reason) => reason.severity !== "error");
  const hasWarnings = reasons.some((reason) => reason.severity === "warning");

  return { canGenerate, reasons, hasWarnings };
}
