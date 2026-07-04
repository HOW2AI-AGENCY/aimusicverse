import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LyricsSection, SectionType } from "./useLyricsSections";

const TYPES: { value: SectionType; label: string }[] = [
  { value: "verse", label: "Куплет" },
  { value: "chorus", label: "Припев" },
  { value: "bridge", label: "Бридж" },
  { value: "pre-chorus", label: "Предприпев" },
  { value: "intro", label: "Интро" },
  { value: "outro", label: "Аутро" },
  { value: "hook", label: "Хук" },
  { value: "custom", label: "Своя" },
];

interface Props {
  section: LyricsSection;
  onChange: (patch: Partial<LyricsSection>) => void;
  onDelete: () => void;
}

export function LyricsSectionCard({ section, onChange, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const lineCount = section.content.split("\n").length;

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Перетащить секцию"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-xs">
              {TYPES.find((t) => t.value === section.type)?.label ?? "Своя"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange({ type: t.value })}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md"
              >
                {t.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Удалить секцию"
          className="ml-auto min-w-[44px] min-h-[44px]"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <textarea
        value={section.content}
        onChange={(e) => onChange({ content: e.target.value })}
        rows={Math.max(2, Math.min(8, lineCount))}
        className="w-full bg-transparent text-sm leading-relaxed resize-none focus:outline-none"
        placeholder="Введите текст секции..."
      />
    </div>
  );
}
