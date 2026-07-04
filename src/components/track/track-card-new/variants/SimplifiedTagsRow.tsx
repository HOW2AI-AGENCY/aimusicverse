/**
 * SimplifiedTagsRow - Compact tags display for track cards
 *
 * Renders tags on a single row (no wrap) so card height stays constant.
 * - Splits raw strings on `,` `/` `|` `;` (handled by parser)
 * - Each chip is truncated with max-width so long tag values don't break layout
 * - Overflow shown as "+N" badge that opens nothing (visual hint only)
 */

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getDisplayTags, TagCategory } from "@/lib/styleTagParser";
import { tagColors } from "@/lib/design-colors";

interface SimplifiedTagsRowProps {
  style?: string | null;
  tags?: string | string[] | null;
  onClick?: (tag: string) => void;
  maxTags?: number;
  className?: string;
}

const CATEGORY_COLORS: Record<TagCategory, string> = {
  genre: `${tagColors.genre.bg} ${tagColors.genre.text}`,
  mood: `${tagColors.mood.bg} ${tagColors.mood.text}`,
  instrument: `${tagColors.instrument.bg} ${tagColors.instrument.text}`,
  vocal: `${tagColors.vocal.bg} ${tagColors.vocal.text}`,
  tempo: `${tagColors.tempo.bg} ${tagColors.tempo.text}`,
  structure: `${tagColors.structure.bg} ${tagColors.structure.text}`,
};

export const SimplifiedTagsRow = memo(function SimplifiedTagsRow({
  style,
  tags,
  onClick,
  maxTags = 2,
  className,
}: SimplifiedTagsRowProps) {
  const parsedTags = useMemo(() => getDisplayTags(style, tags, maxTags), [style, tags, maxTags]);

  // Always reserve a single-row strip so card height stays identical
  // regardless of whether tags are present, short, long, or many.
  return (
    <div className={cn("flex items-center gap-1 flex-nowrap min-w-0 overflow-hidden h-5", className)}>
      {parsedTags.visible.length === 0 ? (
        <span className="text-[10px] text-muted-foreground/40 italic" aria-hidden>
          —
        </span>
      ) : (
        parsedTags.visible.map((tag, index) => (
          <button
            key={`${tag.normalized}-${index}`}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(tag.value);
            }}
            title={tag.value}
            className={cn(
              "shrink min-w-0 max-w-[88px] px-1.5 py-0.5 rounded text-[10px] font-medium leading-none",
              "truncate whitespace-nowrap transition-all duration-200",
              "cursor-pointer active:scale-95 hover:brightness-110",
              CATEGORY_COLORS[tag.category],
            )}
          >
            {tag.value}
          </button>
        ))
      )}

      {parsedTags.hiddenCount > 0 && (
        <span
          className="shrink-0 ml-auto text-[10px] text-muted-foreground tabular-nums"
          aria-label={`Ещё ${parsedTags.hiddenCount} тегов`}
        >
          +{parsedTags.hiddenCount}
        </span>
      )}
    </div>
  );
});
