import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  Music2,
  ChevronDown,
  Mic,
  Tag,
  Copy,
  BarChart3,
  Eye,
  EyeOff,
  Wand2,
  AlignLeft,
} from "@/lib/icons";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { SectionTagSelector } from "./SectionTagSelector";
import { TagBadge, TagList } from "@/components/lyrics/shared/TagBadge";
import { cn } from "@/lib/utils";
import { Plus, GripVertical, Trash2, Wand2, ChevronDown, ChevronUp, Tag, Music } from "@/lib/icons";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  SECTION_TYPES,
  STRUCTURE_TEMPLATES,
  parseLyrics,
  sectionsToLyrics,
  getCleanCharCount,
  type LyricSection,
} from "./lyricsVisualEditorConfig";

interface LyricsVisualEditorProps {
  value: string;
  onChange: (value: string) => void;
  onAIGenerate?: () => void;
}

interface LyricsVisualEditorProps {
  value: string;
  onChange: (value: string) => void;
  onAIGenerate?: () => void;
}

interface SortableLyricSectionProps {
  section: LyricSection;
  index: number;
  isEditing: boolean;
  onSetEditing: (id: string | null) => void;
  onSaveEdit: (id: string) => void;
  onUpdateSection: (id: string, content: string) => void;
  onUpdateSectionTags: (id: string, tags: string[]) => void;
  onDeleteSection: (id: string) => void;
  onDuplicateSection: (id: string) => void;
  onVoiceInput: (id: string, text: string) => void;
  getSectionConfig: (type: string) => (typeof SECTION_TYPES)[number];
}

function SortableLyricSection({
  section,
  index,
  isEditing,
  onSetEditing,
  onSaveEdit,
  onUpdateSection,
  onUpdateSectionTags,
  onDeleteSection,
  onDuplicateSection,
  onVoiceInput,
  getSectionConfig,
}: SortableLyricSectionProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: section.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const config = getSectionConfig(section.type);
  const charCount = getCleanCharCount(section.content);
  const lineCount = section.content.split("\n").filter((l) => l.trim()).length;
  const isOptimalLength = charCount >= 50 && charCount <= 200;

  return (
    <div
      id={`section-${section.id}`}
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border-2 overflow-hidden transition-all",
        isDragging
          ? "shadow-2xl scale-[1.02] border-primary rotate-1"
          : "border-border/30 hover:border-border/50 shadow-sm",
        `bg-gradient-to-br ${config.gradient} backdrop-blur-sm`,
      )}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-background/40 backdrop-blur-sm border-b border-border/30">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
        </div>

        <Badge variant="outline" className={cn("border-2 text-xs font-semibold shadow-sm", config.color)}>
          <span className="mr-1.5">{config.icon}</span>
          {config.label} {index + 1}
        </Badge>

        {/* Character count indicator */}
        <div className="flex items-center gap-1.5 ml-2">
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              isOptimalLength ? "text-emerald-500" : "text-muted-foreground",
            )}
          >
            {charCount}
          </span>
          {charCount > 0 && (
            <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all rounded-full", isOptimalLength ? "bg-emerald-500" : "bg-primary")}
                style={{ width: `${Math.min((charCount / 200) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          {isEditing ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 min-w-[44px] min-h-[44px] text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
              onClick={() => onSaveEdit(section.id)}
            >
              <Check className="w-4 h-4" />
            </Button>
          ) : (
            <>
              <VoiceInputButton
                onResult={(text) => onVoiceInput(section.id, text)}
                context="lyrics"
                size="icon"
                className="h-8 w-8 min-w-[44px] min-h-[44px]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 min-w-[44px] min-h-[44px] hover:bg-primary/10"
                onClick={() => onSetEditing(section.id)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 min-w-[44px] min-h-[44px] hover:bg-primary/10"
                onClick={() => onDuplicateSection(section.id)}
                title="Дублировать секцию"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 min-w-[44px] min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDeleteSection(section.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={section.content}
              onChange={(e) => onUpdateSection(section.id, e.target.value)}
              placeholder="Введите текст секции..."
              rows={6}
              className="resize-none text-sm bg-background/50 border-border/40 focus:border-primary/50 font-mono leading-relaxed"
              autoFocus
              onBlur={() => onSaveEdit(section.id)}
              onKeyDown={(e) => {
                if (e.key === "Escape") onSaveEdit(section.id);
              }}
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {lineCount} {lineCount === 1 ? "строка" : lineCount < 5 ? "строки" : "строк"}
              </span>
              <span className={cn("font-medium", isOptimalLength ? "text-emerald-500" : "text-muted-foreground")}>
                {isOptimalLength && "✓ "}
                {charCount} / 200 символов
              </span>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "text-sm whitespace-pre-wrap cursor-pointer rounded-lg p-3 transition-all min-h-[80px] font-mono leading-relaxed",
              section.content
                ? "hover:bg-background/40 bg-background/20 border border-border/20"
                : "bg-background/10 border-2 border-dashed border-border/30",
            )}
            onClick={() => onSetEditing(section.id)}
          >
            {section.content || (
              <span className="text-muted-foreground/60 italic flex items-center gap-2 justify-center h-full">
                <Edit2 className="w-4 h-4" />
                Нажмите для ввода текста...
              </span>
            )}
          </div>
        )}

        {/* Tags Section */}
        <div className="pt-2 border-t border-border/20">
          <SectionTagSelector
            selectedTags={section.tags || []}
            onChange={(tags) => onUpdateSectionTags(section.id, tags)}
            sectionName={config.label}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
}

export function LyricsVisualEditor({ value, onChange, onAIGenerate }: LyricsVisualEditorProps) {
  const [sections, setSections] = useState<LyricSection[]>(() => parseLyrics(value));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [showStats, setShowStats] = useState(true);

  // Sync sections when value changes externally
  useEffect(() => {
    const parsed = parseLyrics(value);
    if (JSON.stringify(parsed) !== JSON.stringify(sections)) {
      setSections(parsed);
    }
  }, [value]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalChars = sections.reduce((sum, s) => sum + getCleanCharCount(s.content), 0);
    const totalLines = sections.reduce((sum, s) => sum + s.content.split("\n").filter((l) => l.trim()).length, 0);
    const sectionCounts: Record<string, number> = {};
    sections.forEach((s) => {
      sectionCounts[s.type] = (sectionCounts[s.type] || 0) + 1;
    });

    return {
      totalChars,
      totalLines,
      sectionCounts,
      avgCharsPerSection: sections.length > 0 ? Math.round(totalChars / sections.length) : 0,
    };
  }, [sections]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === String(active.id));
    const newIndex = sections.findIndex((s) => s.id === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sections, oldIndex, newIndex);
    setSections(reordered);
    onChange(sectionsToLyrics(reordered));
    toast.success("Секция перемещена");
  };

  const handleAddSection = (type: LyricSection["type"]) => {
    const timestamp = Date.now();
    const newSectionId = `${type}-${timestamp}`;
    const newSection: LyricSection = {
      id: newSectionId,
      type,
      content: "",
      tags: [],
    };
    const updated = [...sections, newSection];
    setSections(updated);
    setEditingId(newSection.id);
    toast.success(
      `${SECTION_TYPES.find((t) => t.value === type)?.label} добавлен${type === "intro" || type === "outro" ? "а" : ""}`,
    );
  };

  const handleDuplicateSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (!section) return;

    const newSection: LyricSection = {
      ...section,
      id: `${section.type}-${Date.now()}`,
    };

    const index = sections.findIndex((s) => s.id === id);
    const updated = [...sections];
    updated.splice(index + 1, 0, newSection);

    setSections(updated);
    onChange(sectionsToLyrics(updated));
    toast.success("Секция дублирована");
  };

  const handleDeleteSection = (id: string) => {
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated);
    onChange(sectionsToLyrics(updated));
    toast.success("Секция удалена");
  };

  const handleUpdateSection = (id: string, content: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, content } : s));
    setSections(updated);
  };

  const handleUpdateSectionTags = (id: string, tags: string[]) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, tags } : s));
    setSections(updated);
    onChange(sectionsToLyrics(updated));
  };

  const handleSaveEdit = (id: string) => {
    setEditingId(null);
    onChange(sectionsToLyrics(sections));
  };

  const handleVoiceInput = (id: string, text: string) => {
    const section = sections.find((s) => s.id === id);
    if (section) {
      const newContent = section.content ? `${section.content}\n${text}` : text;
      handleUpdateSection(id, newContent);
      onChange(sectionsToLyrics(sections.map((s) => (s.id === id ? { ...s, content: newContent } : s))));
    }
  };

  const handleApplyTemplate = (template: (typeof STRUCTURE_TEMPLATES)[0]) => {
    const newSections = template.sections.map((type, index) => ({
      id: `${type}-${Date.now()}-${index}`,
      type: type as LyricSection["type"],
      content: "",
      tags: [],
    }));

    setSections(newSections);
    onChange(sectionsToLyrics(newSections));
    toast.success(`Шаблон "${template.name}" применён`);
  };

  const getSectionConfig = (type: string) => {
    return SECTION_TYPES.find((t) => t.value === type) || SECTION_TYPES[1];
  };

  return (
    <div className="space-y-3">
      {/* Enhanced Header with Stats */}
      <div className="flex items-start justify-between gap-2 p-3 rounded-lg border bg-gradient-to-br from-background/50 to-muted/30 backdrop-blur-sm">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="default" size="sm" className="gap-2 h-11 shadow-md">
                  <Plus className="w-4 h-4" />
                  Добавить
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Тип секции</DropdownMenuLabel>
                {SECTION_TYPES.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => handleAddSection(type.value as LyricSection["type"])}
                    className="gap-2"
                  >
                    <span className="text-base">{type.icon}</span>
                    <span>{type.label}</span>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Шаблоны структуры
                </DropdownMenuLabel>
                {STRUCTURE_TEMPLATES.map((template) => (
                  <DropdownMenuItem key={template.name} onClick={() => handleApplyTemplate(template)} className="gap-2">
                    <span className="text-base">{template.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground">{template.sections.length} секций</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {onAIGenerate && (
              <Button type="button" variant="secondary" size="sm" onClick={onAIGenerate} className="gap-2 h-11">
                <Sparkles className="w-4 h-4" />
                AI Лирика
              </Button>
            )}
          </div>

          {/* Quick Stats */}
          {showStats && sections.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Music2 className="w-3 h-3" />
                {sections.length} {sections.length === 1 ? "секция" : "секций"}
              </span>
              <span className="flex items-center gap-1">
                <AlignLeft className="w-3 h-3" />
                {stats.totalLines} {stats.totalLines === 1 ? "строка" : "строк"}
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                {stats.totalChars} символов
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="h-7 w-7 p-0"
            title={showStats ? "Скрыть статистику" : "Показать статистику"}
          >
            {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Timeline View */}
      {showTimeline && sections.length > 0 && (
        <div className="p-3 rounded-lg border bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Структура трека</span>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {sections.map((section, index) => {
              const config = getSectionConfig(section.type);
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setEditingId(section.id);
                    const element = document.getElementById(`section-${section.id}`);
                    element?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={cn(
                    "flex-shrink-0 h-8 px-2 rounded text-xs font-medium transition-all border-2",
                    config.color,
                    editingId === section.id && "ring-2 ring-primary ring-offset-2",
                  )}
                  title={`${config.label} (${getCleanCharCount(section.content)} символов)`}
                >
                  <span className="mr-1">{config.icon}</span>
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sections List */}
      <ScrollArea className="max-h-[500px]">
        {sections.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3 pr-2">
                {sections.map((section, index) => (
                  <SortableLyricSection
                    key={section.id}
                    section={section}
                    index={index}
                    isEditing={editingId === section.id}
                    onSetEditing={setEditingId}
                    onSaveEdit={handleSaveEdit}
                    onUpdateSection={handleUpdateSection}
                    onUpdateSectionTags={handleUpdateSectionTags}
                    onDeleteSection={handleDeleteSection}
                    onDuplicateSection={handleDuplicateSection}
                    onVoiceInput={handleVoiceInput}
                    getSectionConfig={getSectionConfig}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border/40 bg-gradient-to-br from-muted/30 to-muted/10 p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Music2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Начните создавать текст песни</h3>
                <p className="text-sm text-muted-foreground">Выберите шаблон структуры или добавьте секции вручную</p>
              </div>

              {/* Quick Start Templates */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Быстрый старт:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {STRUCTURE_TEMPLATES.slice(0, 4).map((template) => (
                    <Button
                      key={template.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyTemplate(template)}
                      className="gap-2 hover:border-primary/50"
                    >
                      <span className="text-base">{template.icon}</span>
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Or add manually */}
              <div className="pt-4 border-t border-border/20">
                <p className="text-xs font-medium text-muted-foreground mb-2">Или добавьте секции:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SECTION_TYPES.slice(0, 4).map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddSection(type.value as LyricSection["type"])}
                      className={cn("gap-1.5", type.color.split(" ")[0])}
                    >
                      <span>{type.icon}</span>
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Footer Info */}
      {sections.length > 0 && (
        <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-muted/20 border">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Music2 className="w-3 h-3" />
              {sections.length} {sections.length === 1 ? "секция" : "секций"}
            </span>
            {stats.totalChars > 0 && (
              <span
                className={cn(
                  "font-medium",
                  stats.totalChars >= 300 && stats.totalChars <= 3000 ? "text-emerald-500" : "text-amber-500",
                )}
              >
                {stats.totalChars >= 300 && stats.totalChars <= 3000 && "✓ "}
                {stats.totalChars} символов
              </span>
            )}
          </div>
          <span className="text-muted-foreground/60">Перетащите для изменения порядка</span>
        </div>
      )}
    </div>
  );
}
