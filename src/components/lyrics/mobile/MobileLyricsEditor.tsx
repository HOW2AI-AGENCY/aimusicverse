/**
 * MobileLyricsEditor - Mobile-optimized lyrics editor
 * Features: section-based editing, section type picker, swipe gestures, Telegram safe areas
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { Plus, Wand2, MoreVertical, Trash2, Copy, ArrowUp, ArrowDown, GripVertical, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';
import { MobileSectionCard } from '@/components/mobile/MobileSectionCard';
import { MobileTextarea } from '@/components/mobile/forms/MobileTextarea';
import { MobileActionSheet } from '@/components/mobile/MobileActionSheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTelegramMainButton } from '@/hooks/telegram/useTelegramMainButton';
import { motion, AnimatePresence } from '@/lib/motion';
import { useSwipeable, SwipeEventData } from 'react-swipeable';

export interface LyricsSection {
  id: string;
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'hook' | 'prechorus' | 'breakdown';
  content: string;
  notes?: string;
  tags?: string[];
}

interface MobileLyricsEditorProps {
  sections: LyricsSection[];
  onChange: (sections: LyricsSection[]) => void;
  onAIGenerate?: () => void;
  onSave?: () => void;
  readOnly?: boolean;
  className?: string;
  showMainButton?: boolean;
}

const SECTION_TYPES: Array<{ value: LyricsSection['type']; label: string; color: string }> = [
  { value: 'verse', label: 'Куплет', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  { value: 'chorus', label: 'Припев', color: 'bg-purple-500/20 text-purple-500 border-purple-500/30' },
  { value: 'prechorus', label: 'Пре-припев', color: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30' },
  { value: 'bridge', label: 'Бридж', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
  { value: 'hook', label: 'Хук', color: 'bg-pink-500/20 text-pink-500 border-pink-500/30' },
  { value: 'intro', label: 'Вступление', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  { value: 'outro', label: 'Концовка', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  { value: 'breakdown', label: 'Брейкдаун', color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
];

const SECTION_COLORS: Record<string, string> = Object.fromEntries(
  SECTION_TYPES.map(t => [t.value, t.color])
);

const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  SECTION_TYPES.map(t => [t.value, t.label])
);

// Swipeable section wrapper
const SwipeableSection = memo(function SwipeableSection({
  section,
  index,
  totalCount,
  onDelete,
  onSwipeStart,
  children,
}: {
  section: LyricsSection;
  index: number;
  totalCount: number;
  onDelete: (id: string) => void;
  onSwipeStart?: () => void;
  children: React.ReactNode;
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const { patterns } = useHaptic();

  const handlers = useSwipeable({
    onSwiping: (eventData: SwipeEventData) => {
      if (eventData.dir === 'Left') {
        onSwipeStart?.();
        setSwipeOffset(Math.min(Math.abs(eventData.deltaX), 100));
      }
    },
    onSwipedLeft: (eventData: SwipeEventData) => {
      if (Math.abs(eventData.deltaX) > 80) {
        patterns.warning();
        onDelete(section.id);
      }
      setSwipeOffset(0);
    },
    onSwiped: () => setSwipeOffset(0),
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  return (
    <div className="relative overflow-hidden rounded-xl" {...handlers}>
      {/* Delete background */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-destructive/90 transition-opacity",
          swipeOffset > 20 ? "opacity-100" : "opacity-0"
        )}
        style={{ width: swipeOffset }}
      >
        <Trash2 className="w-5 h-5 text-destructive-foreground" />
      </div>
      
      {/* Content */}
      <motion.div
        style={{ x: -swipeOffset }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
});

// Section type picker
const SectionTypePicker = memo(function SectionTypePicker({
  currentType,
  onSelect,
  onClose,
}: {
  currentType: LyricsSection['type'];
  onSelect: (type: LyricsSection['type']) => void;
  onClose: () => void;
}) {
  const { patterns } = useHaptic();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute left-0 right-0 top-full mt-2 z-50 bg-background/95 backdrop-blur-lg rounded-xl border border-border shadow-xl p-3"
    >
      <div className="grid grid-cols-4 gap-2">
        {SECTION_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => {
              patterns.select();
              onSelect(type.value);
              onClose();
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-all min-h-[52px]",
              "border hover:bg-muted/50 active:scale-95",
              currentType === type.value 
                ? "ring-2 ring-primary bg-primary/10" 
                : "border-border/50"
            )}
          >
            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", type.color)}>
              {type.label.slice(0, 3)}
            </Badge>
            <span className="text-[10px] text-muted-foreground leading-tight text-center">
              {type.label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
});

export const MobileLyricsEditor = memo(function MobileLyricsEditor({
  sections,
  onChange,
  onAIGenerate,
  onSave,
  readOnly = false,
  className,
  showMainButton = true,
}: MobileLyricsEditorProps) {
  const { patterns } = useHaptic();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [typePickerOpen, setTypePickerOpen] = useState<string | null>(null);
  const [addSectionType, setAddSectionType] = useState<LyricsSection['type'] | null>(null);

  // Check if content has changes for save button
  const hasContent = useMemo(() => 
    sections.some(s => s.content.trim().length > 0),
    [sections]
  );

  // Telegram MainButton for save
  useTelegramMainButton({
    text: 'СОХРАНИТЬ',
    onClick: () => {
      patterns.success();
      onSave?.();
    },
    visible: showMainButton && hasContent && !readOnly && !!onSave,
    enabled: hasContent,
    color: '#22c55e',
  });

  const handleSectionChange = useCallback((sectionId: string, content: string) => {
    const updated = sections.map(s =>
      s.id === sectionId ? { ...s, content } : s
    );
    onChange(updated);
  }, [sections, onChange]);

  const handleChangeSectionType = useCallback((sectionId: string, type: LyricsSection['type']) => {
    patterns.select();
    const updated = sections.map(s =>
      s.id === sectionId ? { ...s, type } : s
    );
    onChange(updated);
    setTypePickerOpen(null);
  }, [sections, onChange, patterns]);

  const handleAddSection = useCallback((type: LyricsSection['type'] = 'verse') => {
    patterns.tap();
    const newSection: LyricsSection = {
      id: `section-${Date.now()}`,
      type,
      content: '',
    };
    onChange([...sections, newSection]);
    setAddSectionType(null);
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
    const section = sections[index];

    return [{
      title: `${SECTION_LABELS[section?.type] || 'Секция'} ${index + 1}`,
      actions: [
        {
          label: 'Изменить тип',
          icon: <Type className="w-5 h-5" />,
          onClick: () => {
            setTypePickerOpen(selectedSection);
            setActionSheetOpen(false);
          },
        },
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
      <div 
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center",
          className
        )}
        style={{
          minHeight: 'calc(var(--tg-viewport-stable-height, 50vh) - 200px)',
        }}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Type className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground mb-6">
          Начните с добавления секции
        </p>
        
        {/* Section type selector for first section */}
        <div className="grid grid-cols-4 gap-2 max-w-sm mb-4">
          {SECTION_TYPES.slice(0, 4).map((type) => (
            <button
              key={type.value}
              onClick={() => handleAddSection(type.value)}
              disabled={readOnly}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                "border border-border/50 hover:bg-muted/50 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Badge variant="outline" className={cn("text-xs h-6 px-2", type.color)}>
                {type.label.slice(0, 3)}
              </Badge>
              <span className="text-xs text-muted-foreground">{type.label}</span>
            </button>
          ))}
        </div>
        
        {onAIGenerate && (
          <Button onClick={onAIGenerate} variant="outline" className="gap-2" disabled={readOnly}>
            <Wand2 className="w-4 h-4" />
            AI Генератор
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn("space-y-3", className)}
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
      }}
    >
      {/* AI Generate Button */}
      {onAIGenerate && !readOnly && (
        <Button
          onClick={onAIGenerate}
          className="w-full gap-2"
          variant="outline"
        >
          <Wand2 className="w-4 h-4" />
          AI Генератор
        </Button>
      )}

      {/* Sections */}
      <AnimatePresence mode="popLayout">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
          >
            <SwipeableSection
              section={section}
              index={index}
              totalCount={sections.length}
              onDelete={handleDeleteSection}
            >
              <MobileSectionCard
                title={SECTION_LABELS[section.type] || section.type}
                defaultExpanded={activeSection === section.id || sections.length <= 3}
                collapsible={sections.length > 3}
                icon={
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      patterns.tap();
                      setTypePickerOpen(typePickerOpen === section.id ? null : section.id);
                    }}
                    className="touch-manipulation active:scale-95 transition-transform"
                    disabled={readOnly}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs h-6 px-2 border cursor-pointer hover:ring-2 hover:ring-primary/50",
                        SECTION_COLORS[section.type]
                      )}
                    >
                      {index + 1}
                    </Badge>
                  </button>
                }
                badge={
                  !readOnly && (
                    <div className="flex items-center gap-1">
                      <div className="cursor-grab active:cursor-grabbing touch-none">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoreClick(section.id)}
                        className="h-8 w-8 touch-manipulation"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                }
                className="touch-manipulation relative"
              >
                {/* Type picker dropdown */}
                <AnimatePresence>
                  {typePickerOpen === section.id && (
                    <SectionTypePicker
                      currentType={section.type}
                      onSelect={(type) => handleChangeSectionType(section.id, type)}
                      onClose={() => setTypePickerOpen(null)}
                    />
                  )}
                </AnimatePresence>

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

                {section.tags && section.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {section.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] h-5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </MobileSectionCard>
            </SwipeableSection>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add Section Button with type selector */}
      {!readOnly && (
        <div className="relative">
          <Button
            onClick={() => setAddSectionType(addSectionType ? null : 'verse')}
            variant="outline"
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Добавить секцию
          </Button>
          
          <AnimatePresence>
            {addSectionType !== null && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 bottom-full mb-2 z-50 bg-background/95 backdrop-blur-lg rounded-xl border border-border shadow-xl p-3"
              >
                <p className="text-xs text-muted-foreground mb-2 text-center">Выберите тип секции</p>
                <div className="grid grid-cols-4 gap-2">
                  {SECTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleAddSection(type.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                        "border border-border/50 hover:bg-muted/50 active:scale-95"
                      )}
                    >
                      <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", type.color)}>
                        {type.label.slice(0, 3)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{type.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action Sheet */}
      <MobileActionSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        title="Управление секцией"
        groups={getSectionActions()}
      />
      
      {/* Backdrop for type picker */}
      {(typePickerOpen || addSectionType !== null) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setTypePickerOpen(null);
            setAddSectionType(null);
          }}
        />
      )}
    </div>
  );
});

export default MobileLyricsEditor;
