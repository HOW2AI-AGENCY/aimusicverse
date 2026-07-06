import { cn } from "@/lib/utils";
import { Wand2 } from "@/lib/icons";
import { LYRIC_SECTION_TYPES, LYRIC_SECTION_BY_VALUE, getLyricSectionColor } from "../lyricsSectionMeta";
import type { LyricSectionType } from "../lyricsEditorHelpers";
import { QUICK_TEMPLATES, type QUICK_TEMPLATE_DEF } from "../lyricsEditorHelpers";

interface EmptyStateProps {
  onPickTemplate: (template: QUICK_TEMPLATE_DEF) => void;
  onPickType: (type: LyricSectionType) => void;
  onAIGenerate?: () => void;
  disabled?: boolean;
}

export function EmptyState({ onPickTemplate, onPickType, onAIGenerate, disabled }: EmptyStateProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Structure templates */}
      <div>
        <p className="text-overline uppercase text-muted-foreground">Шаблоны структуры</p>
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {QUICK_TEMPLATES.map((tpl) => (
            <li key={tpl.id}>
              <button
                type="button"
                onClick={() => onPickTemplate(tpl)}
                disabled={disabled}
                className={cn(
                  "w-full text-left p-3 rounded-xl border border-border/60 bg-background/40",
                  "hover:border-primary/50 hover:bg-primary/5 transition-colors touch-manipulation",
                  "disabled:opacity-40 disabled:pointer-events-none",
                )}
              >
                <p className="text-sm font-semibold text-foreground">{tpl.label}</p>
                <p className="mt-0.5 text-caption-sm text-muted-foreground">{tpl.blurb}</p>
                {/* Mini structure preview — colored glyph per section */}
                <p className="mt-1.5 flex items-center gap-1" aria-hidden>
                  {tpl.structure.map((type, i) => (
                    <span key={`${tpl.id}-${i}`} className={cn("text-overline", getLyricSectionColor(type).text)}>
                      {LYRIC_SECTION_BY_VALUE[type].glyph}
                    </span>
                  ))}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border/60" />
        <span className="text-overline uppercase text-muted-foreground">или</span>
        <span className="h-px flex-1 bg-border/60" />
      </div>

      {/* Single section shortcut */}
      <div>
        <p className="text-overline uppercase text-muted-foreground">Начать с одной секции</p>
        <ul className="mt-2 grid grid-cols-3 gap-1.5">
          {LYRIC_SECTION_TYPES.map((t) => {
            const tColor = getLyricSectionColor(t.value);
            return (
              <li key={t.value}>
                <button
                  type="button"
                  onClick={() => onPickType(t.value)}
                  disabled={disabled}
                  className={cn(
                    "w-full h-14 flex flex-col items-center justify-center gap-0.5",
                    "rounded-xl border border-border/50 bg-background/40",
                    "hover:border-primary/50 hover:bg-primary/5 transition-colors touch-manipulation",
                    "disabled:opacity-40 disabled:pointer-events-none",
                  )}
                  title={t.label}
                >
                  <span className={cn("text-base font-bold leading-none", tColor.text)}>{t.glyph}</span>
                  <span className="text-caption-sm text-muted-foreground">{t.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* AI CTA */}
      {onAIGenerate && (
        <button
          type="button"
          onClick={onAIGenerate}
          disabled={disabled}
          className={cn(
            "self-center flex items-center gap-2 px-3 py-2 rounded-full",
            "bg-primary/10 border border-dashed border-primary/40",
            "hover:bg-primary/15 hover:border-primary/60",
            "transition-all duration-200 touch-manipulation",
            "disabled:opacity-40 disabled:pointer-events-none",
          )}
          aria-label="Создать текст с AI"
        >
          <Wand2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">Создать с AI</span>
        </button>
      )}
    </div>
  );
}
