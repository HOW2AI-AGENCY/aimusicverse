/**
 * MashupFormFields — pure-Dumb sub-component of MashupDialog.
 *
 * Вынесен из MashupDialog в Sprint 052-C cleanup для:
 *   - Storybook stories (Dumb-компонент без TanStack Query hooks)
 *   - снижения cognitive complexity MashupDialog (было: 2 useMemo + 10+ state)
 *   - упрощения юнит-тестирования validation logic
 *
 * Контракт: компонент получает все значения через props, изменения — через
 * setters. Не вызывает React Query мутации, не имеет внутреннего state кроме UI-локального.
 *
 * Контейнер (Dialog/Drawer) решается вызывающим кодом (MashupDialog).
 */

import { Loader2, Mic, Disc } from "@/lib/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PromptValidationAlert } from "@/components/generate-form/PromptValidationAlert";
import { MASHUP_STRINGS } from "@/lib/locale/mashupStrings";

export interface MashupModelOption {
  key: string;
  label: string;
}

export interface MashupTrackOption {
  value: string;
  label: string;
}

export interface MashupFormFieldsProps {
  // Source tracks
  trackAId: string;
  trackBId: string;
  onTrackAChange: (id: string) => void;
  onTrackBChange: (id: string) => void;
  trackOptions: MashupTrackOption[];
  trackOptionsB: MashupTrackOption[];

  // Core params
  customMode: boolean;
  onCustomModeChange: (v: boolean) => void;
  instrumental: boolean;
  onInstrumentalChange: (v: boolean) => void;

  style: string;
  onStyleChange: (v: string) => void;
  title: string;
  onTitleChange: (v: string) => void;
  prompt: string;
  onPromptChange: (v: string) => void;

  model: string;
  onModelChange: (v: string) => void;
  modelOptions: MashupModelOption[];

  // Async
  submitting: boolean;

  // Actions
  onSubmit: () => void;

  // Optional aria/id
  ariaLabelledBy?: string;
}

export const MashupFormFields = ({
  trackAId,
  trackBId,
  onTrackAChange,
  onTrackBChange,
  trackOptions,
  trackOptionsB,
  customMode,
  onCustomModeChange,
  instrumental,
  onInstrumentalChange,
  style,
  onStyleChange,
  title,
  onTitleChange,
  prompt,
  onPromptChange,
  model,
  onModelChange,
  modelOptions,
  submitting,
  onSubmit,
  ariaLabelledBy,
}: MashupFormFieldsProps) => {
  const t = MASHUP_STRINGS;

  return (
    <div className="space-y-4" aria-labelledby={ariaLabelledBy}>
      {/* Track A */}
      <div>
        <Label className="text-sm font-medium">{t.form.trackALabel}</Label>
        <Select value={trackAId} onValueChange={onTrackAChange}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder={t.form.selectTrackPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {trackOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Track B */}
      <div>
        <Label className="text-sm font-medium">{t.form.trackBLabel}</Label>
        <Select value={trackBId} onValueChange={onTrackBChange} disabled={!trackAId}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder={trackAId ? t.form.selectTrackPlaceholder : t.form.selectTrackAFirstPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {trackOptionsB.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model */}
      <div>
        <Label className="text-sm font-medium">{t.form.modelLabel}</Label>
        <Select value={model} onValueChange={onModelChange}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom mode toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <Label className="text-sm">{t.form.customModeLabel}</Label>
        <Switch checked={customMode} onCheckedChange={onCustomModeChange} />
      </div>

      {customMode && (
        <>
          <div>
            <Label className="text-sm font-medium">{t.form.styleLabel}</Label>
            <Textarea
              placeholder={t.form.stylePlaceholder}
              value={style}
              onChange={(e) => onStyleChange(e.target.value)}
              rows={2}
              className="mt-1.5 resize-none"
              maxLength={1000}
              aria-label={t.form.styleLabel}
            />
            <PromptValidationAlert text={style} onApplyReplacement={onStyleChange} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">{t.form.titleLabel}</Label>
            <Input
              placeholder={t.form.titlePlaceholder}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="mt-1.5"
              maxLength={100}
              aria-label={t.form.titleLabel}
            />
          </div>
        </>
      )}

      {/* Vocal toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          <Label className="text-sm">{t.form.vocalToggleLabel}</Label>
        </div>
        <Switch checked={!instrumental} onCheckedChange={(c) => onInstrumentalChange(!c)} />
      </div>

      {!instrumental && (
        <div>
          <Label className="text-sm font-medium">{t.form.promptLabel}</Label>
          <Textarea
            placeholder={t.form.promptPlaceholder}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={3}
            className="mt-1.5 resize-none"
            maxLength={5000}
            aria-label={t.form.promptLabel}
          />
          <PromptValidationAlert text={prompt} onApplyReplacement={onPromptChange} className="mt-1" />
        </div>
      )}

      <Button
        onClick={onSubmit}
        disabled={submitting || !trackAId || !trackBId || (customMode && (!style.trim() || !title.trim()))}
        className="w-full h-11"
        size="lg"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            {t.actions.submitting}
          </>
        ) : (
          <>
            <Disc className="w-4 h-4 mr-2" />
            {t.actions.submit}
          </>
        )}
      </Button>
    </div>
  );
};
