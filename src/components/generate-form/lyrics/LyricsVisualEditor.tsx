import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Sparkles } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LyricsSectionCard } from "./LyricsSectionCard";
import { useLyricsSections } from "./useLyricsSections";
import { LYRICS_TEMPLATES } from "./LyricsSectionTemplates";

interface Props {
  text: string;
  onChange: (text: string) => void;
  onOpenAssistant: () => void;
}

export function LyricsVisualEditor({ text, onChange, onOpenAssistant }: Props) {
  const { sections, addSection, removeSection, updateSection, reorderSections, applyTemplate, stats } =
    useLyricsSections(text, onChange);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const from = sections.findIndex((s) => s.id === active.id);
      const to = sections.findIndex((s) => s.id === over.id);
      if (from !== -1 && to !== -1) reorderSections(from, to);
    }
  };

  const durationMin = Math.round((stats.estimatedDurationSeconds / 60) * 10) / 10;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={onOpenAssistant} className="min-h-[44px]">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI-помощник
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="min-h-[44px]">
              Шаблоны
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1">
            {LYRICS_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md min-h-[44px]"
              >
                {t.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <span className="text-xs text-muted-foreground ml-auto">
          {stats.totalLines} строк · ~{durationMin} мин
        </span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <LyricsSectionCard
                key={section.id}
                section={section}
                onChange={(patch) => updateSection(section.id, patch)}
                onDelete={() => removeSection(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button variant="outline" size="sm" onClick={() => addSection("verse")} className="w-full min-h-[44px]">
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Добавить секцию
      </Button>
    </div>
  );
}
