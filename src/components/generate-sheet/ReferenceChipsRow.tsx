// src/components/generate-sheet/ReferenceChipsRow.tsx
import { Plus, X, Folder, User, Music, Mic } from "@/lib/icons";
import { cn } from "@/lib/utils";

export type ReferenceKind = "project" | "artist" | "audio" | "voice";

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

const KIND_META: Record<ReferenceKind, { label: string; icon: typeof Plus }> = {
  project: { label: "Альбом", icon: Folder },
  artist: { label: "Артист", icon: User },
  audio: { label: "Аудио", icon: Music },
  voice: { label: "Голос", icon: Mic },
};

export function ReferenceChipsRow({ references, onAdd, onRemove }: Props) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none"
      role="group"
      aria-label="Референсы"
    >
      {(Object.keys(KIND_META) as ReferenceKind[]).map((kind) => {
        const item = references[kind];
        const { label, icon: Icon } = KIND_META[kind];
        if (item) {
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onRemove(kind, item.id)}
              aria-label={`Удалить ${label.toLowerCase()}: ${item.label}`}
              className={cn(
                "group inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-xs font-medium shrink-0",
                "bg-foreground/[0.06] text-foreground border border-foreground/10",
                "hover:bg-foreground/10 active:scale-[0.97] transition-all",
              )}
            >
              <Icon className="w-3.5 h-3.5 opacity-70" />
              <span className="max-w-[140px] truncate">{item.label}</span>
              <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </button>
          );
        }
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onAdd(kind)}
            aria-label={`Добавить ${label.toLowerCase()}`}
            className={cn(
              "inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-xs font-medium shrink-0",
              "border border-dashed border-border/70 text-muted-foreground",
              "hover:border-foreground/40 hover:text-foreground hover:bg-foreground/[0.03]",
              "active:scale-[0.97] transition-all",
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
