// src/components/generate-sheet/ReferenceChipsRow.tsx
// v2 — 2x2 source-selection grid (Audio / Voice / Persona / Project)
// with roving tabindex keyboard navigation, clear active state,
// and a Neon-Studio mint accent to align with the redesigned footer.
import { useCallback, useRef, KeyboardEvent } from "react";
import { Plus, X, Folder, User, Music, Mic, Check } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

export type ReferenceKind = "audio" | "voice" | "artist" | "project";

interface ReferenceItem {
  id: string;
  label: string;
}

interface References {
  project?: ReferenceItem;
  artist?: ReferenceItem;
  audio?: ReferenceItem;
  voice?: ReferenceItem;
}

interface Props {
  references: References;
  onAdd: (kind: ReferenceKind) => void;
  onRemove: (kind: ReferenceKind, id: string) => void;
}

const KIND_META: Record<ReferenceKind, { label: string; hint: string; icon: typeof Plus }> = {
  audio: { label: "Аудио", hint: "Референс-трек", icon: Music },
  voice: { label: "Голос", hint: "Клон вокала", icon: Mic },
  artist: { label: "Персона", hint: "Стиль артиста", icon: User },
  project: { label: "Проект", hint: "Альбом/проект", icon: Folder },
};

const ORDER: ReferenceKind[] = ["audio", "voice", "artist", "project"];

export function ReferenceChipsRow({ references, onAdd, onRemove }: Props) {
  const haptic = useHapticFeedback();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusIndex = useCallback((i: number) => {
    const n = ORDER.length;
    const next = ((i % n) + n) % n;
    refs.current[next]?.focus();
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          focusIndex(idx + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          focusIndex(idx - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          focusIndex(idx + 2);
          break;
        case "ArrowUp":
          e.preventDefault();
          focusIndex(idx - 2);
          break;
        case "Home":
          e.preventDefault();
          focusIndex(0);
          break;
        case "End":
          e.preventDefault();
          focusIndex(ORDER.length - 1);
          break;
      }
    },
    [focusIndex],
  );

  // roving tabindex: first active card is tab stop, else first card.
  const firstActive = ORDER.findIndex((k) => references[k]);
  const tabStop = firstActive >= 0 ? firstActive : 0;

  return (
    <div role="group" aria-label="Источники и референсы" className="grid grid-cols-2 gap-2">
      {ORDER.map((kind, idx) => {
        const item = references[kind];
        const { label, hint, icon: Icon } = KIND_META[kind];
        const active = !!item;
        return (
          <button
            key={kind}
            ref={(el) => {
              refs.current[idx] = el;
            }}
            type="button"
            tabIndex={idx === tabStop ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, idx)}
            onClick={() => {
              if (active) {
                haptic.impact("light");
                onRemove(kind, item!.id);
              } else {
                haptic.selectionChanged();
                onAdd(kind);
              }
            }}
            aria-pressed={active}
            aria-label={
              active ? `${label}: ${item!.label}. Нажмите чтобы удалить` : `Добавить ${label.toLowerCase()} — ${hint}`
            }
            className={cn(
              "group relative flex flex-col items-start gap-1.5 min-h-[68px] p-3 rounded-2xl border text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "active:scale-[0.98]",
              active
                ? "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.25)]"
                : "border-dashed border-border/60 bg-muted/20 text-muted-foreground hover:border-foreground/40 hover:text-foreground hover:bg-foreground/[0.03]",
            )}
          >
            <div className="flex items-center gap-2 w-full">
              <span
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-lg border",
                  active
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/50 bg-background/40 text-muted-foreground",
                )}
                aria-hidden
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-semibold flex-1 truncate">{label}</span>
              {active ? (
                <span
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground"
                  aria-hidden
                >
                  <Check className="w-3 h-3" />
                </span>
              ) : (
                <Plus className="w-3.5 h-3.5 opacity-60" aria-hidden />
              )}
            </div>
            <span
              className={cn(
                "text-[0.65625rem] leading-tight truncate w-full",
                active ? "text-foreground/80 font-medium" : "text-muted-foreground/80",
              )}
            >
              {active ? item!.label : hint}
            </span>
            {active && (
              <X
                className="absolute top-2 right-2 w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
