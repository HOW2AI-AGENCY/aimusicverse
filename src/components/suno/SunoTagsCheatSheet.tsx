/**
 * SunoTagsCheatSheet - Interactive reference for Suno AI meta-tags
 * Features: search, copy, categories, best practices, examples
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Search, Copy, Check, LayoutList, Mic, User, Zap, Settings2, 
  TrendingUp, Sparkles, Sliders, AlertTriangle, BookOpen, X,
  ChevronDown, ChevronRight, Info, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  SUNO_META_TAG_CATEGORIES,
  TEXT_FORMATTING_TIPS,
  BEST_PRACTICES,
  ANTI_PATTERNS,
  type SunoMetaTag,
  type SunoTagCategory,
} from '@/constants/sunoMetaTags';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutList,
  Mic,
  User,
  Zap,
  Settings2,
  TrendingUp,
  Sparkles,
  Sliders,
};

interface SunoTagsCheatSheetProps {
  onSelectTag?: (tag: string) => void;
  compact?: boolean;
  className?: string;
}

export function SunoTagsCheatSheet({ onSelectTag, compact, className }: SunoTagsCheatSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['structure']);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tags' | 'tips' | 'best'>('tags');

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return SUNO_META_TAG_CATEGORIES;

    const query = searchQuery.toLowerCase();
    return SUNO_META_TAG_CATEGORIES.map(cat => ({
      ...cat,
      tags: cat.tags.filter(
        tag =>
          tag.value.toLowerCase().includes(query) ||
          tag.label.toLowerCase().includes(query) ||
          tag.hint.toLowerCase().includes(query)
      ),
    })).filter(cat => cat.tags.length > 0);
  }, [searchQuery]);

  const handleCopyTag = useCallback((tag: SunoMetaTag) => {
    const formatted = `[${tag.value}]`;
    navigator.clipboard.writeText(formatted);
    setCopiedTag(tag.value);
    toast.success(`Скопировано: ${formatted}`);
    setTimeout(() => setCopiedTag(null), 2000);
    
    if (onSelectTag) {
      onSelectTag(formatted);
    }
  }, [onSelectTag]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
  };

  const expandAll = () => {
    setExpandedCategories(SUNO_META_TAG_CATEGORIES.map(c => c.id));
  };

  const collapseAll = () => {
    setExpandedCategories([]);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex-shrink-0 space-y-3 p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Справочник тегов Suno AI
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
          {[
            { id: 'tags', label: 'Теги', icon: LayoutList },
            { id: 'tips', label: 'Форматирование', icon: Lightbulb },
            { id: 'best', label: 'Best Practices', icon: Check },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className={compact ? "hidden sm:inline" : ""}>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'tags' && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск тегов..."
                className="pl-9 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Expand/Collapse */}
            <div className="flex gap-2 text-xs">
              <button
                onClick={expandAll}
                className="text-muted-foreground hover:text-foreground"
              >
                Развернуть все
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                onClick={collapseAll}
                className="text-muted-foreground hover:text-foreground"
              >
                Свернуть все
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'tags' && (
              <motion.div
                key="tags"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {filteredCategories.map(category => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    isExpanded={expandedCategories.includes(category.id)}
                    onToggle={() => toggleCategory(category.id)}
                    onCopyTag={handleCopyTag}
                    copiedTag={copiedTag}
                    compact={compact}
                  />
                ))}

                {filteredCategories.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Теги не найдены</p>
                    <p className="text-sm">Попробуйте другой запрос</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'tips' && (
              <motion.div
                key="tips"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <FormattingTipsSection />
              </motion.div>
            )}

            {activeTab === 'best' && (
              <motion.div
                key="best"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <BestPracticesSection />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

interface CategorySectionProps {
  category: SunoTagCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onCopyTag: (tag: SunoMetaTag) => void;
  copiedTag: string | null;
  compact?: boolean;
}

function CategorySection({ category, isExpanded, onToggle, onCopyTag, copiedTag, compact }: CategorySectionProps) {
  const IconComponent = ICON_MAP[category.icon] || LayoutList;

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
      >
        <IconComponent className="w-4 h-4 text-primary" />
        <span className="font-medium flex-1 text-left">{category.label}</span>
        <Badge variant="secondary" className="text-xs">
          {category.tags.length}
        </Badge>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 grid gap-2 grid-cols-1 sm:grid-cols-2">
              {category.tags.map(tag => (
                <TagItem
                  key={tag.value}
                  tag={tag}
                  onCopy={() => onCopyTag(tag)}
                  isCopied={copiedTag === tag.value}
                  compact={compact}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TagItemProps {
  tag: SunoMetaTag;
  onCopy: () => void;
  isCopied: boolean;
  compact?: boolean;
}

function TagItem({ tag, onCopy, isCopied, compact }: TagItemProps) {
  return (
    <motion.button
      onClick={onCopy}
      className={cn(
        "flex items-start gap-2 p-2 rounded-md text-left transition-all",
        "hover:bg-muted/50 active:scale-[0.98]",
        tag.critical && "border border-amber-500/30 bg-amber-500/5"
      )}
      whileTap={{ scale: 0.98 }}
    >
      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
        [{tag.value}]
      </code>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{tag.label}</span>
          {tag.critical && (
            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
          )}
        </div>
        {!compact && (
          <p className="text-xs text-muted-foreground truncate">{tag.hint}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {isCopied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </motion.button>
  );
}

function FormattingTipsSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        Форматирование текста
      </div>

      {/* Hyphen */}
      <div className="p-3 rounded-lg bg-muted/30 space-y-2">
        <h4 className="font-medium text-sm">{TEXT_FORMATTING_TIPS.hyphen.name}</h4>
        <p className="text-sm text-muted-foreground">{TEXT_FORMATTING_TIPS.hyphen.description}</p>
        <code className="block text-xs bg-muted p-2 rounded font-mono">
          {TEXT_FORMATTING_TIPS.hyphen.example}
        </code>
      </div>

      {/* Caps */}
      <div className="p-3 rounded-lg bg-muted/30 space-y-2">
        <h4 className="font-medium text-sm">{TEXT_FORMATTING_TIPS.caps.name}</h4>
        <p className="text-sm text-muted-foreground">{TEXT_FORMATTING_TIPS.caps.description}</p>
        <code className="block text-xs bg-muted p-2 rounded font-mono">
          {TEXT_FORMATTING_TIPS.caps.example}
        </code>
      </div>

      {/* Parentheses */}
      <div className="p-3 rounded-lg bg-muted/30 space-y-2">
        <h4 className="font-medium text-sm">{TEXT_FORMATTING_TIPS.parentheses.name}</h4>
        <p className="text-sm text-muted-foreground">{TEXT_FORMATTING_TIPS.parentheses.description}</p>
        <div className="flex flex-wrap gap-2">
          {TEXT_FORMATTING_TIPS.parentheses.examples.map((ex, i) => (
            <code key={i} className="text-xs bg-muted px-2 py-1 rounded font-mono">
              {ex}
            </code>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-600 dark:text-amber-400">Важно</p>
          <p className="text-muted-foreground">
            Круглые скобки (...) — для бэк-вокала и подпевок, НЕ для инструкций!
            Инструкции типа [Soft], [Powerful] только в квадратных скобках.
          </p>
        </div>
      </div>
    </div>
  );
}

function BestPracticesSection() {
  return (
    <div className="space-y-4">
      {/* Best Practices */}
      <div>
        <div className="flex items-center gap-2 text-sm font-medium mb-3">
          <Check className="w-4 h-4 text-green-500" />
          Рекомендации
        </div>
        <div className="space-y-2">
          {BEST_PRACTICES.map((practice, i) => (
            <div key={i} className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="font-medium text-sm text-green-600 dark:text-green-400">
                ✓ {practice.rule}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{practice.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Anti-patterns */}
      <div>
        <div className="flex items-center gap-2 text-sm font-medium mb-3">
          <X className="w-4 h-4 text-red-500" />
          Чего избегать
        </div>
        <div className="space-y-2">
          {ANTI_PATTERNS.map((pattern, i) => (
            <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-red-600 dark:text-red-400">
                  ✗ {pattern.issue}
                </span>
                <code className="text-xs bg-red-500/10 px-1.5 py-0.5 rounded">
                  {pattern.example}
                </code>
              </div>
              <p className="text-xs text-muted-foreground mt-1">→ {pattern.fix}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key reminder */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-sm">Ключевое напоминание</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Suno AI — вероятностная генеративная система. Мета-теги — это рекомендации, 
          а не строгие команды. Думайте о них как об архитектурном чертеже: он задаёт план, 
          но итоговая реализация зависит от «строителя» (модели) и «материала» (жанра).
        </p>
      </div>
    </div>
  );
}

export default SunoTagsCheatSheet;
