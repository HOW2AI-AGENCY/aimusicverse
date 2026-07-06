/**
 * SectionCard Component for LyricsVisualEditorCompact
 * Sprint 051 — Test Debt + God Files Decomposition
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import { getLyricSectionColor } from "../lyricsSectionMeta";
import type { LyricSection, LyricSectionType } from "../LyricsVisualEditorCompact";
import { ArrowUp, ArrowDown, Trash2 } from "@/lib/icons";

interface SectionCardProps {
  section: LyricSection;
  sectionNumber: number;
  isActive: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onChangeType: (type: LyricSectionType) => void;
  onChangeContent: (content: string) => void;
  onSetActive: () => void;
  disabled?: boolean;
}

export const SectionCard = memo(function SectionCard({
  section,
  sectionNumber,
  isActive,
  onMoveUp,
  onMoveDown,
  onDelete,
  onChangeType,
  onChangeContent,
  onSetActive,
  disabled = false,
}: SectionCardProps) {
  const sectionColor = getLyricSectionColor(section.type);

  return (
    <div
      className={cn(
        "group relative rounded-xl border-2 bg-card p-4 transition-all duration-200",
        isActive
          ? `border-[${sectionColor}] shadow-[0_0_0_4px_rgba(var(--${sectionColor}),0.3)]`
          : "border-border hover:border-primary/50",
        disabled && "opacity-50",
      )}
      onClick={onSetActive}
    >
      {/* Section Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{sectionNumber + 1}.</span>
          <span
            className={cn("rounded-lg px-3 py-1 text-xs font-semibold uppercase", `bg-[${sectionColor}] text-white`)}
          >
            {section.type}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={disabled || sectionNumber === 0}
            className="rounded-lg p-2 hover:bg-accent"
            aria-label="Move section up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={disabled}
            className="rounded-lg p-2 hover:bg-accent"
            aria-label="Move section down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={disabled}
            className="rounded-lg p-2 hover:bg-destructive/10 text-destructive"
            aria-label="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Section Content */}
      <textarea
        value={section.content}
        onChange={(e) => onChangeContent(e.target.value)}
        disabled={disabled}
        className="min-h-[80px] w-full resize-none rounded-lg border-0 bg-background p-3 text-sm focus:ring-2 focus:ring-inset focus:ring-primary"
        placeholder={`Содержимое секции ${section.type}...`}
        aria-label={`Section ${section.type} content`}
      />
    </div>
  );
});
