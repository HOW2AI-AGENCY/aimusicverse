/**
 * Tags Editor Component
 * Allows adding, removing, and managing tags for lyrics
 */
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, Plus, Tag, Sparkles, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

// Popular music generation tags
const SUGGESTED_TAGS = {
  genres: ['pop', 'rock', 'hip-hop', 'electronic', 'jazz', 'r&b', 'indie', 'folk', 'classical', 'metal'],
  moods: ['energetic', 'melancholic', 'happy', 'dark', 'romantic', 'aggressive', 'chill', 'dreamy', 'epic', 'nostalgic'],
  vocals: ['male vocals', 'female vocals', 'duet', 'choir', 'whisper', 'powerful', 'soft', 'raspy', 'autotune'],
  instruments: ['piano', 'guitar', 'synth', 'drums', 'bass', 'strings', 'brass', 'acoustic', 'electric'],
  tempo: ['slow', 'moderate', 'fast', 'upbeat', 'downtempo', 'ballad'],
  style: ['cinematic', 'lo-fi', 'anthem', 'intimate', 'experimental', 'commercial', 'underground'],
};

interface TagsEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestedTags?: string[];
  maxTags?: number;
  className?: string;
  compact?: boolean;
}

export function TagsEditor({
  tags,
  onChange,
  suggestedTags = [],
  maxTags = 15,
  className,
  compact = false,
}: TagsEditorProps) {
  const [newTag, setNewTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof SUGGESTED_TAGS | null>(null);

  const handleAddTag = useCallback((tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (!normalizedTag || tags.includes(normalizedTag) || tags.length >= maxTags) return;
    
    onChange([...tags, normalizedTag]);
    setNewTag('');
    hapticImpact('light');
  }, [tags, onChange, maxTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
    hapticImpact('light');
  }, [tags, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag(newTag);
    }
  }, [newTag, handleAddTag]);

  // Combine suggested tags from props and predefined
  const allSuggestions = useMemo(() => {
    const fromProps = suggestedTags.filter(t => !tags.includes(t.toLowerCase()));
    return [...new Set(fromProps)].slice(0, 10);
  }, [suggestedTags, tags]);

  const categoryTags = useMemo(() => {
    if (!selectedCategory) return [];
    return SUGGESTED_TAGS[selectedCategory].filter(t => !tags.includes(t));
  }, [selectedCategory, tags]);

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 pr-1 hover:bg-destructive/20 transition-colors group"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/30"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="+ тег"
              className="h-6 w-20 text-xs px-2"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Current Tags */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Tag className="w-4 h-4" />
            Теги ({tags.length}/{maxTags})
          </label>
          {tags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground"
              onClick={() => onChange([])}
            >
              Очистить
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
          <AnimatePresence mode="popLayout">
            {tags.map((tag) => (
              <motion.div
                key={tag}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                layout
              >
                <Badge
                  variant="default"
                  className="gap-1 pr-1.5 cursor-pointer hover:bg-primary/80"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="w-3 h-3" />
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tags.length === 0 && (
            <span className="text-sm text-muted-foreground">Нет тегов</span>
          )}
        </div>
      </div>

      {/* Add New Tag */}
      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Добавить тег..."
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={() => handleAddTag(newTag)}
          disabled={!newTag.trim() || tags.length >= maxTags}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* AI Suggested Tags */}
      {allSuggestions.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5 text-primary">
            <Sparkles className="w-4 h-4" />
            AI-предложения
          </label>
          <div className="flex flex-wrap gap-1.5">
            {allSuggestions.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="cursor-pointer hover:bg-primary/20 border-primary/30"
                onClick={() => handleAddTag(tag)}
              >
                + {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Category Suggestions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant={showSuggestions ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="gap-1.5"
          >
            <Tag className="w-3.5 h-3.5" />
            Популярные теги
          </Button>
        </div>

        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                {/* Category Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(SUGGESTED_TAGS).map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => setSelectedCategory(
                        selectedCategory === category ? null : category as keyof typeof SUGGESTED_TAGS
                      )}
                    >
                      {category === 'genres' && 'Жанры'}
                      {category === 'moods' && 'Настроение'}
                      {category === 'vocals' && 'Вокал'}
                      {category === 'instruments' && 'Инструменты'}
                      {category === 'tempo' && 'Темп'}
                      {category === 'style' && 'Стиль'}
                    </Badge>
                  ))}
                </div>

                {/* Tags for Selected Category */}
                {selectedCategory && (
                  <ScrollArea className="max-h-24">
                    <div className="flex flex-wrap gap-1.5">
                      {categoryTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary/20 transition-colors"
                          onClick={() => handleAddTag(tag)}
                        >
                          + {tag}
                        </Badge>
                      ))}
                      {categoryTags.length === 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Все теги добавлены
                        </span>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
