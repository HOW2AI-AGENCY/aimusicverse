/**
 * LyricsEditorToolbar - Toolbar for lyrics text editing
 * 
 * Features:
 * - [A] Stress mark - capitalize letter for emphasis
 * - (бэк) Backing vocals wrapper
 * - Quick tag insertion
 */

import { useState, useCallback } from 'react';
import { ALargeSmall, Mic2, Tag, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SECTION_TAGS, TAG_CATEGORIES, type TagCategory } from '@/lib/lyrics/constants';

interface LyricsEditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInsertTag?: (tag: string) => void;
  className?: string;
}

const QUICK_TAGS = [
  'Whisper', 'Powerful', 'Soft', 'Build', 'Drop', 'Harmony'
];

export function LyricsEditorToolbar({ textareaRef, onInsertTag, className }: LyricsEditorToolbarProps) {
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  const getSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return null;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    return { start, end, selectedText, textarea };
  }, [textareaRef]);

  const replaceSelection = useCallback((newText: string) => {
    const selection = getSelection();
    if (!selection) return;
    
    const { start, end, textarea } = selection;
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);
    
    // Create and dispatch input event for React controlled components
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 
      'value'
    )?.set;
    
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(textarea, before + newText + after);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  }, [getSelection]);

  const handleStressmark = useCallback(() => {
    const selection = getSelection();
    if (!selection || !selection.selectedText) return;
    
    // Find the first lowercase letter and capitalize it
    const text = selection.selectedText;
    let modified = text;
    
    // If single character, just capitalize it
    if (text.length === 1) {
      modified = text.toUpperCase();
    } else {
      // Find first lowercase letter and capitalize
      for (let i = 0; i < text.length; i++) {
        if (/[a-zа-яё]/.test(text[i])) {
          modified = text.substring(0, i) + text[i].toUpperCase() + text.substring(i + 1);
          break;
        }
      }
    }
    
    replaceSelection(modified);
  }, [getSelection, replaceSelection]);

  const handleBackingVocals = useCallback(() => {
    const selection = getSelection();
    if (!selection) return;
    
    const { selectedText } = selection;
    if (selectedText) {
      // Wrap selected text in parentheses
      replaceSelection(`(${selectedText})`);
    } else {
      // Insert empty parentheses and place cursor inside
      replaceSelection('()');
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          const pos = textarea.selectionStart - 1;
          textarea.setSelectionRange(pos, pos);
        }
      }, 10);
    }
  }, [getSelection, replaceSelection, textareaRef]);

  const handleInsertTag = useCallback((tag: string) => {
    const selection = getSelection();
    if (!selection) {
      onInsertTag?.(tag);
      return;
    }
    
    // Insert tag in square brackets
    const tagText = `[${tag}]`;
    
    // If there's a selection, insert before it
    if (selection.selectedText) {
      replaceSelection(`${tagText} ${selection.selectedText}`);
    } else {
      replaceSelection(tagText + ' ');
    }
    
    setTagPopoverOpen(false);
    onInsertTag?.(tag);
  }, [getSelection, replaceSelection, onInsertTag]);

  return (
    <div className={cn(
      "flex items-center gap-1 p-1 bg-muted/30 rounded-t-md border-x border-t border-border/50",
      className
    )}>
      {/* Stress mark button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs gap-1"
        onClick={handleStressmark}
        title="Ударение (выделите букву)"
      >
        <ALargeSmall className="w-3.5 h-3.5" />
        <span>Ударение</span>
      </Button>

      {/* Backing vocals button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs gap-1"
        onClick={handleBackingVocals}
        title="Бэк-вокал (обернуть в скобки)"
      >
        <Mic2 className="w-3.5 h-3.5" />
        <span>(бэк)</span>
      </Button>

      <div className="w-px h-4 bg-border/50 mx-1" />

      {/* Quick tags */}
      <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Тег</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Быстрая вставка:</p>
            <div className="flex flex-wrap gap-1">
              {QUICK_TAGS.map(tag => {
                const def = SECTION_TAGS.find(t => t.value === tag);
                const categoryInfo = def ? TAG_CATEGORIES[def.category] : null;
                
                return (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={cn(
                      "cursor-pointer hover:bg-muted text-xs",
                      categoryInfo && `hover:${categoryInfo.colorClass} hover:text-white`
                    )}
                    onClick={() => handleInsertTag(tag)}
                  >
                    [{tag}]
                  </Badge>
                );
              })}
            </div>
            
            <div className="pt-2 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground mb-1.5">
                Теги добавляются в <code className="bg-muted px-1 rounded">[квадратных скобках]</code>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Бэк-вокал в <code className="bg-muted px-1 rounded">(круглых скобках)</code>
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Help text */}
      <span className="ml-auto text-[10px] text-muted-foreground hidden sm:inline">
        компАс = ударение • (ой-ой) = бэк
      </span>
    </div>
  );
}
