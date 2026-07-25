import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUp, ArrowDown, RotateCcw, Trash2, MoreHorizontal, Plus, X } from "@/lib/icons";
import { LYRIC_SECTION_TYPES, LYRIC_SECTION_BY_VALUE, getLyricSectionColor } from "../lyricsSectionMeta";
import type { LyricSectionType, LyricSection } from "../lyricsEditorHelpers";

interface SectionCardProps {
  index: number;
  total: number;
  ordinal: number | null;
  section: LyricSection;
  disabled?: boolean;
  registerRef: (el: HTMLTextAreaElement | null) => void;
  onFocusSection: () => void;
  onTypeChange: (type: LyricSectionType) => void;
  onTagsChange: (tags: string[]) => void;
  onContentChange: (content: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClear: () => void;
  onDelete: () => void;
}

/**
 * Suno v5.5 compound-tag modifier presets. Grouped so the popover reads
 * as a curated palette, not a wall of chips. Values are inserted verbatim
 * into the section header: `[Verse, energetic, male vocal]`.
 */
const MODIFIER_GROUPS: { label: string; items: string[] }[] = [
  { label: "Энергия", items: ["energetic", "soft", "aggressive", "melancholic", "uplifting", "dark"] },
  { label: "Вокал", items: ["male vocal", "female vocal", "duet", "harmony", "whisper", "spoken", "ad-libs"] },
  { label: "Динамика", items: ["build up", "breakdown", "drop", "layered", "minimal", "atmospheric"] },
  { label: "Текстура", items: ["acoustic", "distorted", "reverb", "clean", "lo-fi"] },
];

export const SectionCard = memo(function SectionCard({
  index,
  total,
  ordinal,
  section,
  disabled,
  registerRef,
  onFocusSection,
  onTypeChange,
  onTagsChange,
  onContentChange,
  onMoveUp,
  onMoveDown,
  onClear,
  onDelete,
}: SectionCardProps) {
  const def = LYRIC_SECTION_BY_VALUE[section.type];
  const color = getLyricSectionColor(section.type);
  const charCount = section.content.length;
  const tags = section.tags ?? [];

  const [customTag, setCustomTag] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const toggleTag = (t: string) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      onTagsChange(tags.filter((x) => x !== trimmed));
    } else {
      onTagsChange([...tags, trimmed]);
    }
  };

  const removeTag = (t: string) => onTagsChange(tags.filter((x) => x !== t));

  const commitCustomTag = () => {
    const v = customTag.trim();
    if (!v) return;
    if (!tags.includes(v)) onTagsChange([...tags, v]);
    setCustomTag("");
  };

  return (
    <li
      className={cn(
        "relative rounded-xl border border-border/50 bg-background/40",
        "focus-within:border-primary/40 transition-colors",
      )}
      data-section-id={section.id}
    >
      {/* Slim left accent bar */}
      <span aria-hidden className={cn("absolute left-0 top-3 bottom-3 w-[2px] rounded-full", color.dot)} />

      {/* Single-row header: type picker · char count · [+] modifiers · overflow menu */}
      <header className="flex items-center gap-1.5 pl-3 pr-1.5 pt-2 pb-1.5">
        <Select value={section.type} onValueChange={(v) => onTypeChange(v as LyricSectionType)} disabled={disabled}>
          <SelectTrigger
            className={cn(
              "h-7 gap-1.5 rounded-md border-none bg-transparent px-1.5 py-0",
              "text-xs font-medium shadow-none focus:ring-0 focus:ring-offset-0",
              "hover:bg-muted/50 transition-colors [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-50",
              color.text,
            )}
            aria-label={`Тип секции ${index + 1}`}
          >
            <span className="flex items-center gap-1.5">
              <span className={cn("font-mono", color.text)}>{def.glyph}</span>
              <SelectValue />
              {ordinal !== null && <span className="tabular-nums text-muted-foreground/80">{ordinal}</span>}
            </span>
          </SelectTrigger>
          <SelectContent>
            {LYRIC_SECTION_TYPES.map((t) => {
              const tc = getLyricSectionColor(t.value);
              return (
                <SelectItem key={t.value} value={t.value} className="text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className={cn("font-mono w-4 text-center", tc.text)}>{t.glyph}</span>
                    <span>{t.label}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <span className="ml-auto text-[0.6875rem] font-mono tabular-nums text-muted-foreground/60">
          {charCount}
        </span>

        {/* Compound-tag composer — Suno v5.5 style [Verse, energetic, male vocal] */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Добавить модификатор к секции"
              disabled={disabled}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3 space-y-3">
            <div>
              <p className="text-xs font-medium mb-1">Составной тег</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-relaxed">
                Suno v5.5 умеет читать модификаторы после запятой, например{" "}
                <code className="font-mono">[Verse, energetic, male vocal]</code>.
              </p>
            </div>

            {MODIFIER_GROUPS.map((g) => (
              <div key={g.label} className="space-y-1">
                <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground/70">{g.label}</p>
                <div className="flex flex-wrap gap-1">
                  {g.items.map((item) => {
                    const active = tags.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleTag(item)}
                        className={cn(
                          "h-6 px-2 rounded-md text-[0.6875rem] font-medium border transition-colors",
                          active
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex gap-1 pt-1">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitCustomTag();
                  }
                }}
                placeholder="Свой модификатор…"
                className="h-7 text-xs"
              />
              <Button type="button" size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={commitCustomTag}>
                Добавить
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Actions collapsed into an overflow menu — reclaims ~120px of horizontal real estate. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
              aria-label={`Действия для секции ${index + 1}`}
              disabled={disabled}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onMoveUp} disabled={index === 0}>
              <ArrowUp className="h-4 w-4 mr-2" /> Вверх
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveDown} disabled={index === total - 1}>
              <ArrowDown className="h-4 w-4 mr-2" /> Вниз
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear} disabled={!section.content}>
              <RotateCcw className="h-4 w-4 mr-2" /> Очистить
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              disabled={total <= 1}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Active modifier chips — only render when present, so they never fight for vertical space. */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-1.5" role="list" aria-label="Модификаторы секции">
          {tags.map((t) => (
            <span
              key={t}
              role="listitem"
              className="inline-flex items-center gap-1 h-5 pl-1.5 pr-0.5 rounded-md bg-muted/60 border border-border/40 text-[0.6875rem] text-foreground/80"
            >
              <span>{t}</span>
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="h-4 w-4 inline-flex items-center justify-center rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label={`Убрать модификатор ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Textarea */}
      <div className="px-3 pb-2.5">
        <Textarea
          ref={(el) => registerRef(el)}
          value={section.content}
          onChange={(e) => onContentChange(e.target.value)}
          onFocus={onFocusSection}
          disabled={disabled}
          placeholder={`${def.label} — пишите здесь…`}
          rows={Math.max(3, Math.min((section.content.split(/\r?\n/).length || 1) + 1, 8))}
          className={cn(
            "resize-none min-h-[72px] text-sm leading-relaxed whitespace-pre-wrap",
            "rounded-lg bg-muted/20 border-border/40",
            "focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
            "placeholder:text-muted-foreground/50 transition-colors",
          )}
          data-section-id={section.id}
        />
      </div>
    </li>
  );
});
