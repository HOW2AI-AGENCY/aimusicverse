import { memo } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, ArrowDown, RotateCcw, Trash2 } from "@/lib/icons";
import { LYRIC_SECTION_TYPES, LYRIC_SECTION_BY_VALUE, getLyricSectionColor } from "../lyricsSectionMeta";
import type { LyricSectionType, LyricSection } from "../lyricsEditorHelpers";
import { ActionButton } from "./ActionButton";

interface SectionCardProps {
  index: number;
  total: number;
  ordinal: number | null;
  section: LyricSection;
  disabled?: boolean;
  registerRef: (el: HTMLTextAreaElement | null) => void;
  onFocusSection: () => void;
  onTypeChange: (type: LyricSectionType) => void;
  onContentChange: (content: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClear: () => void;
  onDelete: () => void;
}

export const SectionCard = memo(function SectionCard({
  index,
  total,
  ordinal,
  section,
  disabled,
  registerRef,
  onFocusSection,
  onTypeChange,
  onContentChange,
  onMoveUp,
  onMoveDown,
  onClear,
  onDelete,
}: SectionCardProps) {
  const def = LYRIC_SECTION_BY_VALUE[section.type];
  const color = getLyricSectionColor(section.type);
  const lineCount = section.content.trim() ? section.content.split(/\r?\n/).length : 0;
  const charCount = section.content.length;

  return (
    <li
      className={cn(
        "relative rounded-xl border border-border/60 bg-background/50 overflow-hidden",
        "focus-within:border-primary/50 transition-colors",
      )}
      data-section-id={section.id}
    >
      {/* Left accent bar in the section color */}
      <span aria-hidden className={cn("absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full", color.dot)} />

      {/* Header row: badge + counters */}
      <header className="flex items-center justify-between gap-2 pl-4 pr-3 pt-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border",
            "text-overline uppercase",
            color.bg,
            color.border,
            color.text,
          )}
        >
          <span>{def.glyph}</span>
          <span>
            {def.label}
            {ordinal !== null && <span className="tabular-nums"> {ordinal}</span>}
          </span>
        </span>
        <span className="text-caption-sm text-muted-foreground/70 tabular-nums">
          {lineCount} стр · {charCount} симв
        </span>
      </header>

      {/* Type picker — horizontally scrollable labelled chips */}
      <div
        className="flex gap-1 pl-4 pr-3 pt-2 overflow-x-auto scrollbar-none"
        role="radiogroup"
        aria-label={`Тип секции ${index + 1}`}
      >
        {LYRIC_SECTION_TYPES.map((t) => {
          const isActive = t.value === section.type;
          const tColor = getLyricSectionColor(t.value);
          return (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={disabled}
              onClick={() => onTypeChange(t.value)}
              className={cn(
                "h-8 shrink-0 px-2 inline-flex items-center gap-1 rounded-lg border",
                "text-caption-sm transition-colors touch-manipulation",
                "disabled:opacity-40 disabled:pointer-events-none",
                isActive
                  ? cn(tColor.bg, tColor.border, tColor.text, "font-semibold")
                  : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
              title={t.label}
            >
              <span className={cn(!isActive && tColor.text)}>{t.glyph}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Textarea */}
      <div className="pl-4 pr-3 pt-2">
        <Textarea
          ref={(el) => registerRef(el)}
          value={section.content}
          onChange={(e) => onContentChange(e.target.value)}
          onFocus={onFocusSection}
          disabled={disabled}
          placeholder={`${def.label} — пишите здесь…`}
          rows={Math.max(3, Math.min(lineCount + 1, 8))}
          className={cn(
            "resize-none min-h-[80px] text-sm leading-relaxed whitespace-pre-wrap",
            "rounded-lg bg-muted/30 border-border/50",
            "focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
            "placeholder:text-muted-foreground/50 transition-colors",
          )}
          data-section-id={section.id}
        />
      </div>

      {/* Action tray — 44px touch targets */}
      <div className="flex items-center justify-end gap-0.5 pl-4 pr-2 py-1.5">
        <ActionButton
          label="Переместить вверх"
          onClick={onMoveUp}
          disabled={disabled || index === 0}
          icon={<ArrowUp className="h-4 w-4" />}
        />
        <ActionButton
          label="Переместить вниз"
          onClick={onMoveDown}
          disabled={disabled || index === total - 1}
          icon={<ArrowDown className="h-4 w-4" />}
        />
        <ActionButton
          label="Очистить секцию"
          onClick={onClear}
          disabled={disabled || !section.content}
          icon={<RotateCcw className="h-4 w-4" />}
        />
        <ActionButton
          label="Удалить секцию"
          onClick={onDelete}
          disabled={disabled || total <= 1}
          icon={<Trash2 className="h-4 w-4" />}
          destructive
        />
      </div>
    </li>
  );
});
