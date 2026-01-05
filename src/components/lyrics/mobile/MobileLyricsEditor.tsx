/**
 * MobileLyricsEditor - Mobile-optimized lyrics editor
 * Features: section-based editing, quick AI tools, swipe gestures
 */

import { memo, useState, useCallback } from 'react';
import { Plus, Wand2, ChevronDown, ChevronUp, MoreVertical, Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { MobileSectionCard } from '@/components/mobile/MobileSectionCard';
import { MobileTextarea } from '@/components/mobile/forms/MobileTextarea';
import { MobileActionSheet } from '@/components/mobile/MobileActionSheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface LyricsSection {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'hook' | 'prechorus' | 'breakdown';
  content: string;
  notes?: string;
}

interface MobileLyricsEditorProps {
  /** Lyrics sections */
  sections: LyricsSection[];
  /** Sections change handler */
  onChange: (sections: LyricsSection[]) => void;
  /** AI generate handler */
  onAIGenerate?: () => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Additional className */
  className?: string;
}

const SECTION_COLORS: Record<string, string> = {
  verse: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  chorus: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  bridge: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  intro: 'bg-green-500/20 text-green-500 border-green-500/30',
  outro: 'bg-red-500/20 text-red-500 border-red-500/30',
  hook: 'bg-pink-500/20 text-pink-500 border-pink-500/30',
  prechorus: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
  breakdown: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
};

const SECTION_LABELS: Record<string, string> = {
  verse: 'Куплет',
  chorus: 'Припев',
  bridge: 'Бридж',
  intro: 'Вступление',
  outro: 'Концовка',
  hook: 'Хук',
  prechorus: 'Пре-припев',
  breakdown: 'Брейкдаун',
};

export const MobileLyricsEditor = memo(function MobileLyricsEditor({
  sections,
  onChange,
  onAIGenerate,
  readOnly = false,
  className,
}: MobileLyricsEditorProps) {
  const { patterns } = useHaptic();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const handleSectionChange = useCallback((sectionId: string, content: string) => {
    const updated = sections.map(s =>
      s.id === sectionId ? { ...s, content } : s
    );
    onChange(updated);
  }, [sections, onChange]);

  const handleAddSection = useCallback(() => {
    patterns.tap();
    const newSection: LyricsSection = {
      id: `section-${Date.now()}`,
      type: 'verse',
      content: '',
    };
    onChange([...sections, newSection]);
  }, [sections, onChange, patterns]);

  const handleDeleteSection = useCallback((sectionId: string) => {
    patterns.warning();
    onChange(sections.filter(s => s.id !== sectionId));
    setActionSheetOpen(false);
  }, [sections, onChange, patterns]);

  const handleDuplicateSection = useCallback((sectionId: string) => {
    patterns.select();
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const duplicate: LyricsSection = {
      ...section,
      id: `section-${Date.now()}`,
    };

    const index = sections.findIndex(s => s.id === sectionId);
    const updated = [...sections];
    updated.splice(index + 1, 0, duplicate);
    onChange(updated);
    setActionSheetOpen(false);
  }, [sections, onChange, patterns]);

  const handleMoveUp = useCallback((sectionId: string) => {
    patterns.tap();
    const index = sections.findIndex(s => s.id === sectionId);
    if (index <= 0) return;

    const updated = [...sections];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
    setActionSheetOpen(false);
  }, [sections, onChange, patterns]);

  const handleMoveDown = useCallback((sectionId: string) => {
    patterns.tap();
    const index = sections.findIndex(s => s.id === sectionId);
    if (index >= sections.length - 1) return;

    const updated = [...sections];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
    setActionSheetOpen(false);
  }, [sections, onChange, patterns]);

  const handleMoreClick = useCallback((sectionId: string) => {
    setSelectedSection(sectionId);
    setActionSheetOpen(true);
  }, []);

  const getSectionActions = useCallback(() => {
    if (!selectedSection) return [];

    const index = sections.findIndex(s => s.id === selectedSection);

    return [{
      title: 'Действия',
      actions: [
        {
          label: 'Переместить вверх',
          icon: <ArrowUp className="w-5 h-5" />,
          onClick: () => handleMoveUp(selectedSection),
          disabled: index === 0,
        },
        {
          label: 'Переместить вниз',
          icon: <ArrowDown className="w-5 h-5" />,
          onClick: () => handleMoveDown(selectedSection),
          disabled: index === sections.length - 1,
        },
        {
          label: 'Дублировать',
          icon: <Copy className="w-5 h-5" />,
          onClick: () => handleDuplicateSection(selectedSection),
        },
        {
          label: 'Удалить',
          icon: <Trash2 className="w-5 h-5" />,
          onClick: () => handleDeleteSection(selectedSection),
          variant: 'destructive' as const,
        },
      ],
    }];
  }, [selectedSection, sections, handleMoveUp, handleMoveDown, handleDuplicateSection, handleDeleteSection]);

  if (sections.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}>
        <p className="text-muted-foreground mb-4">
          Начните с добавления секции
        </p>
        <Button onClick={handleAddSection} disabled={readOnly}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить секцию
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* AI Generate Button */}
      {onAIGenerate && !readOnly && (
        <Button
          onClick={onAIGenerate}
          className="w-full"
          variant="outline"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          AI Генератор
        </Button>
      )}

      {/* Sections */}
      {sections.map((section, index) => (
        <MobileSectionCard
          key={section.id}
          title={SECTION_LABELS[section.type] || section.type}
          defaultExpanded={activeSection === section.id}
          collapsible
          icon={
            <Badge
              variant="outline"
              className={cn(
                "text-xs h-6 px-2 border",
                SECTION_COLORS[section.type]
              )}
            >
              {index + 1}
            </Badge>
          }
          badge={
            !readOnly && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMoreClick(section.id)}
                className="h-8 w-8"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            )
          }
          className="touch-manipulation"
        >
          <MobileTextarea
            value={section.content}
            onChange={(value) => handleSectionChange(section.id, value)}
            placeholder={`Напишите ${SECTION_LABELS[section.type].toLowerCase()}...`}
            minRows={4}
            maxRows={12}
            showCounter
            disabled={readOnly}
          />

          {section.notes && (
            <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/30">
              <p className="text-xs text-muted-foreground">
                {section.notes}
              </p>
            </div>
          )}
        </MobileSectionCard>
      ))}

      {/* Add Section Button */}
      {!readOnly && (
        <Button
          onClick={handleAddSection}
          variant="outline"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить секцию
        </Button>
      )}

      {/* Action Sheet */}
      <MobileActionSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        title="Управление секцией"
        groups={getSectionActions()}
      />
    </div>
  );
});

export default MobileLyricsEditor;
