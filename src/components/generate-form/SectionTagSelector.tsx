/**
 * SectionTagSelector Component
 *
 * Editorial tag-picker for section-level metadata in the advanced generation form.
 * Categories render as numbered hairline rules (01 · VOCAL), tags as inverted chips.
 * Public API preserved: { selectedTags, onChange, sectionName?, compact? }.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tag, Plus, X, Music2, Mic, Zap, Heart, Check } from "@/lib/icons";
import { TagBadge } from "@/components/lyrics/shared/TagBadge";
import { cn } from "@/lib/utils";

interface TagCategoryDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  tags: string[];
}

/**
 * Predefined tag categories. The 4 categories below match the genre/mood/instrument/
 * structure buckets used by `tagColors` in design-colors, so any future palette work
 * stays in one place.
 */
const TAG_CATEGORIES: TagCategoryDef[] = [
  {
    key: "vocal",
    label: "Вокал",
    icon: <Mic className="h-3 w-3" />,
    tags: [
      "Male Vocal",
      "Female Vocal",
      "Duet",
      "Choir",
      "Falsetto",
      "Raspy Voice",
      "Whisper",
      "Belting",
      "Autotune",
      "Harmonies",
      "Ad-libs",
      "Vocal Runs",
    ],
  },
  {
    key: "instrument",
    label: "Инструменты",
    icon: <Music2 className="h-3 w-3" />,
    tags: [
      "Piano",
      "Acoustic Guitar",
      "Electric Guitar",
      "Bass",
      "Drums",
      "808s",
      "Synth",
      "Strings",
      "Brass",
      "Violin",
      "Saxophone",
      "Flute",
    ],
  },
  {
    key: "dynamic",
    label: "Динамика",
    icon: <Zap className="h-3 w-3" />,
    tags: [
      "Soft Start",
      "Build",
      "Drop",
      "Breakdown",
      "Crescendo",
      "Decrescendo",
      "Climax",
      "Fade Out",
      "Sudden Stop",
      "Tempo Change",
      "Key Change",
    ],
  },
  {
    key: "emotional",
    label: "Эмоции",
    icon: <Heart className="h-3 w-3" />,
    tags: [
      "with passion",
      "softly",
      "powerfully",
      "tenderly",
      "angrily",
      "joyfully",
      "sadly",
      "desperately",
      "confidently",
      "playfully",
      "mysteriously",
      "intensely",
    ],
  },
];

interface SectionTagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  sectionName?: string;
  compact?: boolean;
}

export function SectionTagSelector({
  selectedTags,
  onChange,
  sectionName = "секции",
  compact = false,
}: SectionTagSelectorProps) {
  const [customTag, setCustomTag] = useState("");

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      onChange([...selectedTags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  const clearAll = () => {
    onChange([]);
  };

  // -------------------------------------------------------------------------
  // Compact display for inline use (selected chips + Sheet trigger).
  // -------------------------------------------------------------------------
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => <TagBadge key={tag} tag={tag} size="sm" onRemove={() => removeTag(tag)} />)
        ) : (
          <span className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground/60">
            теги · none
          </span>
        )}

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1 font-mono text-overline uppercase tracking-[0.18em]"
            >
              <Plus className="h-3 w-3" />
              <span>теги</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] flex flex-col p-0">
            <SheetHeader className="px-5 pt-6 pb-4 border-b border-foreground/15">
              <p className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">
                tags · {sectionName}
              </p>
              <SheetTitle className="font-display text-heading-1 tracking-tight">Теги секции</SheetTitle>
              <SheetDescription className="font-mono text-caption uppercase tracking-[0.16em] text-muted-foreground">
                вокал · инструменты · динамика · эмоции
              </SheetDescription>
            </SheetHeader>

            <TagSelectorBody
              selectedTags={selectedTags}
              toggleTag={toggleTag}
              customTag={customTag}
              setCustomTag={setCustomTag}
              addCustomTag={addCustomTag}
              clearAll={clearAll}
            />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Full display — editorial stack with numbered category headers.
  // -------------------------------------------------------------------------
  return (
    <div
      className="w-full max-w-3xl mx-auto border border-foreground/15 rounded-none bg-background text-foreground"
      data-testid="section-tag-selector"
    >
      {/* Masthead */}
      <header className="px-5 sm:px-6 pt-5 pb-4 border-b border-foreground/15 flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <p className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">
            tags · {sectionName}
          </p>
        </div>
        <p className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">
          <span className="tabular-nums">{selectedTags.length.toString().padStart(2, "0")}</span>
          <span aria-hidden> · </span>
          <span>selected</span>
        </p>
      </header>

      <TagSelectorBody
        selectedTags={selectedTags}
        toggleTag={toggleTag}
        customTag={customTag}
        setCustomTag={setCustomTag}
        addCustomTag={addCustomTag}
        clearAll={clearAll}
      />
    </div>
  );
}

// ============================================================================
// SHARED BODY — used by both full and Sheet-rendered variants.
// ============================================================================

interface TagSelectorBodyProps {
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  customTag: string;
  setCustomTag: (tag: string) => void;
  addCustomTag: () => void;
  clearAll: () => void;
}

function TagSelectorBody({
  selectedTags,
  toggleTag,
  customTag,
  setCustomTag,
  addCustomTag,
  clearAll,
}: TagSelectorBodyProps) {
  const totalSelected = selectedTags.length;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Selected tray */}
      <div className="px-5 sm:px-6 pt-4 pb-4 border-b border-foreground/10">
        <div className="flex items-center justify-between gap-3 font-mono text-overline uppercase tracking-[0.18em]">
          <p className="text-muted-foreground">
            <span>выбрано</span>
            <span aria-hidden> · </span>
            <span className="tabular-nums text-foreground">{totalSelected.toString().padStart(2, "0")}</span>
          </p>
          {totalSelected > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className={cn(
                "inline-flex items-center gap-1.5 text-muted-foreground",
                "hover:text-destructive transition-colors",
              )}
              aria-label="Очистить все теги"
            >
              <span>clear</span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{totalSelected.toString().padStart(2, "0")}</span>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {totalSelected > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-[2px]">
            {selectedTags.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "h-7 px-2.5 inline-flex items-center gap-1.5 font-mono",
                    "text-overline uppercase tracking-[0.16em]",
                    "bg-foreground text-background border border-foreground",
                    "hover:bg-background hover:text-foreground transition-colors",
                  )}
                  aria-label={`Убрать ${tag}`}
                >
                  <Check className="h-3 w-3" aria-hidden />
                  <span>{tag}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 font-mono text-caption uppercase tracking-[0.16em] text-muted-foreground/60">
            пока пусто · выбери ниже
          </p>
        )}
      </div>

      {/* Category stack */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-5 sm:px-6 py-4 space-y-5">
          {TAG_CATEGORIES.map((category, idx) => {
            const selectedInCategory = category.tags.filter((t) => selectedTags.includes(t)).length;
            return (
              <section key={category.key} aria-label={category.label}>
                {/* Numbered category header */}
                <header className="flex items-baseline justify-between gap-3">
                  <p className="font-mono text-overline uppercase tracking-[0.18em] text-foreground">
                    <span className="tabular-nums">{String(idx + 1).padStart(2, "0")}</span>
                    <span aria-hidden> · </span>
                    <span>{category.label}</span>
                  </p>
                  <p className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="tabular-nums">{selectedInCategory.toString().padStart(2, "0")}</span>
                    <span aria-hidden> / </span>
                    <span className="tabular-nums">{category.tags.length.toString().padStart(2, "0")}</span>
                  </p>
                </header>
                <span aria-hidden className="mt-1 block h-[1px] w-full bg-foreground/15" />

                {/* Tag chips */}
                <ul className="mt-3 flex flex-wrap gap-[2px]">
                  {category.tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <li key={tag}>
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          aria-pressed={isSelected}
                          className={cn(
                            "h-8 px-3 inline-flex items-center gap-1.5 font-mono",
                            "text-caption uppercase tracking-[0.14em]",
                            "border transition-colors",
                            isSelected
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background text-foreground border-foreground/15 hover:border-foreground",
                          )}
                        >
                          {isSelected ? (
                            <Check className="h-3 w-3" aria-hidden />
                          ) : (
                            <span aria-hidden className="h-3 w-3 inline-flex items-center justify-center">
                              {category.icon}
                            </span>
                          )}
                          <span>{tag}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </ScrollArea>

      {/* Custom-tag input — fixed at bottom */}
      <div className="border-t border-foreground/15 px-5 sm:px-6 py-4 safe-area-bottom">
        <Label
          htmlFor="section-tag-custom"
          className="font-mono text-overline uppercase tracking-[0.18em] text-muted-foreground"
        >
          добавить свой тег
        </Label>
        <div className="mt-2 flex items-stretch gap-[2px]">
          <Input
            id="section-tag-custom"
            placeholder="Введите тег…"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
            className={cn(
              "h-10 rounded-none border border-foreground/15 bg-background",
              "font-mono text-body-sm placeholder:text-muted-foreground/50",
              "focus-visible:border-primary focus-visible:ring-0",
            )}
          />
          <button
            type="button"
            onClick={addCustomTag}
            disabled={!customTag.trim()}
            className={cn(
              "h-10 px-4 inline-flex items-center gap-1.5 font-mono",
              "text-overline uppercase tracking-[0.18em]",
              "border border-foreground bg-background text-foreground",
              "hover:bg-foreground hover:text-background transition-colors",
              "disabled:opacity-40 disabled:pointer-events-none",
            )}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            <span>add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
