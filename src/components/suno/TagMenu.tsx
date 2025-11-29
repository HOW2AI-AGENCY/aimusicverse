import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tag, X } from 'lucide-react';
import { TAG_CONFIGS, TagConfig } from './types';

interface TagMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTag: (tag: string) => void;
  anchorPosition?: { x: number; y: number };
}

export const TagMenu = ({ isOpen, onClose, onSelectTag, anchorPosition }: TagMenuProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = {
    VOCAL: { label: 'Вокал', color: 'bg-purple-500/10 text-purple-500' },
    INSTRUMENT: { label: 'Инструменты', color: 'bg-blue-500/10 text-blue-500' },
    MOOD: { label: 'Настроение', color: 'bg-green-500/10 text-green-500' },
    TECH: { label: 'Эффекты', color: 'bg-orange-500/10 text-orange-500' },
  };

  const filteredTags = selectedCategory
    ? TAG_CONFIGS.filter((tag) => tag.category === selectedCategory)
    : TAG_CONFIGS;

  const style = anchorPosition
    ? {
        position: 'fixed' as const,
        top: `${anchorPosition.y}px`,
        left: `${anchorPosition.x}px`,
        transform: 'translateY(-100%)',
      }
    : {};

  return (
    <div
      ref={menuRef}
      className="fixed bottom-0 left-0 right-0 md:absolute md:bottom-auto bg-background border border-border rounded-t-2xl md:rounded-lg shadow-xl z-50 max-w-xl md:max-w-md mx-auto md:mx-0"
      style={style}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Добавить тег</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 p-3 overflow-x-auto">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="flex-shrink-0"
        >
          Все
        </Button>
        {Object.entries(categories).map(([key, { label, color }]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(key)}
            className="flex-shrink-0"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Tags */}
      <ScrollArea className="max-h-64 p-3">
        <div className="grid grid-cols-2 gap-2">
          {filteredTags.map((tag) => {
            const categoryColor = categories[tag.category].color;
            return (
              <button
                key={tag.value}
                onClick={() => {
                  onSelectTag(tag.value);
                  onClose();
                }}
                className={`p-3 rounded-lg border border-border hover:border-primary transition-all text-left ${categoryColor}`}
              >
                <div className="font-medium text-sm">{tag.label}</div>
                {tag.description && (
                  <div className="text-xs opacity-70 mt-1">{tag.description}</div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
