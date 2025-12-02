import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { GripVertical, Trash2, Edit, Check, ChevronUp, ChevronDown, Tag } from 'lucide-react';
import { LyricSection, SECTION_LABELS } from './types';
import { parseTags, translateTagsToRussian, countSyllables, insertTagAtCursor } from './utils';

interface SectionBlockProps {
  section: LyricSection;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onOpenTagMenu: (sectionId: string, cursorPosition: number) => void;
  dragHandleProps?: Record<string, unknown>;
}

export const SectionBlock = ({
  section,
  index,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onOpenTagMenu,
  dragHandleProps,
}: SectionBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(section.content);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sectionLabel = SECTION_LABELS[section.type];
  const tags = parseTags(section.content);
  const syllableCount = countSyllables(section.content.replace(/\[.*?\]/g, ''));

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  // Update section content when it changes from outside (only if not currently editing)
  useEffect(() => {
    if (!isEditing) {
      setLocalContent(section.content);
    }
  }, [section.content, isEditing]);

  const handleSave = () => {
    onUpdate(section.id, localContent);
    setIsEditing(false);
  };

  const handleOpenTagMenu = () => {
    const pos = textareaRef.current?.selectionStart || localContent.length;
    setCursorPosition(pos);
    onOpenTagMenu(section.id, pos);
  };

  // View Mode
  if (!isEditing) {
    return (
      <Card
        className="glass-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
        onClick={() => setIsEditing(true)}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div {...dragHandleProps} className="pt-1">
              <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
            </div>

            {/* Position Badge */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={sectionLabel.color}>{sectionLabel.ru}</Badge>
                {syllableCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {syllableCount} слогов
                  </span>
                )}
              </div>

              {/* Text with inline tags */}
              <div className="text-sm space-y-1">
                {section.content.split('\n').map((line, i) => {
                  const lineTags = parseTags(line);
                  if (lineTags.length > 0) {
                    return (
                      <div key={i} className="flex flex-wrap gap-1 items-center">
                        {lineTags.map((tag, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">
                            {translateTagsToRussian(tag)}
                          </Badge>
                        ))}
                      </div>
                    );
                  }
                  return line.trim() ? (
                    <p key={i} className="text-foreground/90">
                      {line}
                    </p>
                  ) : (
                    <div key={i} className="h-2" />
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              {!isFirst && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp(section.id);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              )}
              {!isLast && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown(section.id);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Удалить эту секцию?')) {
                    onDelete(section.id);
                  }
                }}
                className="h-8 w-8 p-0 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Edit Mode
  return (
    <Card className="glass-card border-primary">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="pt-1">
            <GripVertical className="w-5 h-5 text-muted-foreground opacity-50" />
          </div>

          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
            {index + 1}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={sectionLabel.color}>{sectionLabel.ru}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenTagMenu}
                className="gap-1 h-7"
              >
                <Tag className="w-3 h-3" />
                Тег
              </Button>
            </div>

            <Textarea
              ref={textareaRef}
              value={localContent}
              onChange={(e) => {
                setLocalContent(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onSelect={(e) => {
                const target = e.target as HTMLTextAreaElement;
                setCursorPosition(target.selectionStart);
              }}
              placeholder="Введите текст..."
              className="min-h-[100px] resize-none text-base"
              style={{ fontSize: '16px' }} // Prevent iOS zoom
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Отмена
              </Button>
              <Button size="sm" onClick={handleSave} className="gap-1">
                <Check className="w-4 h-4" />
                Готово
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
