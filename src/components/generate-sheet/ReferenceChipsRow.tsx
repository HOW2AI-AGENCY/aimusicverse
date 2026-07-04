// src/components/generate-sheet/ReferenceChipsRow.tsx
import { Plus, X, Folder, User, Music, Mic } from "@/lib/icons";
import { cn } from "@/lib/utils";

type ReferenceKind = "project" | "artist" | "audio" | "voice";

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
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {(Object.keys(KIND_META) as ReferenceKind[]).map((kind) => {
        const item = references[kind];
        const { label, icon: Icon } = KIND_META[kind];
        if (item) {
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onRemove(kind, item.id)}
              aria-label={`удалить ${label}`}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium",
                "bg-primary/10 text-primary border border-primary/30",
                "hover:bg-primary/20 active:scale-95 transition-all",
                "min-w-[44px] min-h-[44px]",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="max-w-[140px] truncate">{item.label}</span>
              <X className="w-3 h-3" />
            </button>
          );
        }
        return (
          <button
            key={kind}
            type="button"
            onClick={() => onAdd(kind)}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium",
              "border border-dashed border-muted-foreground/40 text-muted-foreground",
              "hover:border-primary/60 hover:text-primary hover:bg-primary/5",
              "active:scale-95 transition-all",
              "min-w-[44px] min-h-[44px]",
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
