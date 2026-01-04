/**
 * SmartPromptSuggestions Component
 * 
 * Intelligent prompt suggestions for music generation.
 * Features:
 * - Genre-specific suggestions
 * - Mood-based recommendations
 * - Quick prompt templates
 * - Contextual suggestions based on user history
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Sparkles, 
  Music, 
  Heart, 
  Zap, 
  Sun, 
  Moon, 
  Lightbulb,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface PromptTemplate {
  id: string;
  category: 'genre' | 'mood' | 'style' | 'popular';
  title: string;
  prompt: string;
  icon: typeof Music;
  tags: string[];
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Popular/Trending
  {
    id: 'epic-orchestral',
    category: 'popular',
    title: 'Эпический оркестр',
    prompt: 'Epic orchestral music with powerful brass, dramatic strings, and heroic choir',
    icon: TrendingUp,
    tags: ['эпик', 'оркестр', 'драма'],
  },
  {
    id: 'chill-lofi',
    category: 'popular',
    title: 'Lofi хип-хоп',
    prompt: 'Chill lo-fi hip hop beats with vinyl crackle, jazzy piano, and relaxed drums',
    icon: TrendingUp,
    tags: ['lofi', 'чилл', 'хип-хоп'],
  },
  {
    id: 'synthwave',
    category: 'popular',
    title: 'Synthwave ретро',
    prompt: 'Retro synthwave with nostalgic 80s synths, pulsing bassline, and dreamy atmosphere',
    icon: TrendingUp,
    tags: ['синтвейв', 'ретро', '80s'],
  },
  
  // Genre-specific
  {
    id: 'pop-dance',
    category: 'genre',
    title: 'Поп-данс',
    prompt: 'Upbeat pop dance track with catchy melody, electronic beats, and bright synths',
    icon: Music,
    tags: ['поп', 'данс', 'электро'],
  },
  {
    id: 'rock-energy',
    category: 'genre',
    title: 'Энергичный рок',
    prompt: 'High-energy rock with distorted guitars, powerful drums, and driving bassline',
    icon: Zap,
    tags: ['рок', 'энергия', 'гитара'],
  },
  {
    id: 'jazz-smooth',
    category: 'genre',
    title: 'Джаз',
    prompt: 'Smooth jazz with sultry saxophone, walking bass, and brushed drums',
    icon: Moon,
    tags: ['джаз', 'саксофон', 'smooth'],
  },
  
  // Mood-based
  {
    id: 'happy-uplifting',
    category: 'mood',
    title: 'Радостный',
    prompt: 'Happy and uplifting music with bright melodies, cheerful rhythm, and positive energy',
    icon: Sun,
    tags: ['радость', 'позитив', 'энергия'],
  },
  {
    id: 'emotional-deep',
    category: 'mood',
    title: 'Эмоциональный',
    prompt: 'Deep emotional ballad with piano, strings, and heartfelt vocals',
    icon: Heart,
    tags: ['эмоции', 'баллада', 'пиано'],
  },
  {
    id: 'mysterious-dark',
    category: 'mood',
    title: 'Таинственный',
    prompt: 'Mysterious dark ambient with deep drones, haunting melodies, and subtle percussion',
    icon: Moon,
    tags: ['тайна', 'эмбиент', 'темный'],
  },
  
  // Style-specific
  {
    id: 'acoustic-folk',
    category: 'style',
    title: 'Акустический фолк',
    prompt: 'Acoustic folk song with fingerpicked guitar, warm vocals, and natural atmosphere',
    icon: Music,
    tags: ['акустика', 'фолк', 'гитара'],
  },
  {
    id: 'cinematic-score',
    category: 'style',
    title: 'Кино-саундтрек',
    prompt: 'Cinematic film score with sweeping orchestration, emotional depth, and grand crescendos',
    icon: Sparkles,
    tags: ['кино', 'оркестр', 'драма'],
  },
];

interface SmartPromptSuggestionsProps {
  /** Callback when user selects a prompt */
  onSelectPrompt: (prompt: string) => void;
  /** Current prompt value */
  currentPrompt?: string;
  /** Compact mode for smaller display */
  compact?: boolean;
  /** Filter by category */
  filterCategory?: 'all' | 'genre' | 'mood' | 'style' | 'popular';
}

export function SmartPromptSuggestions({
  onSelectPrompt,
  currentPrompt,
  compact = false,
  filterCategory = 'all',
}: SmartPromptSuggestionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(filterCategory);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return PROMPT_TEMPLATES;
    return PROMPT_TEMPLATES.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  const categories = [
    { id: 'all', label: 'Все', icon: Sparkles },
    { id: 'popular', label: 'Популярное', icon: TrendingUp },
    { id: 'genre', label: 'Жанры', icon: Music },
    { id: 'mood', label: 'Настроение', icon: Heart },
    { id: 'style', label: 'Стиль', icon: Lightbulb },
  ];

  if (compact) {
    return (
      <div className="space-y-2 max-w-full">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5" />
          <span>Быстрые идеи:</span>
        </div>
        <div className="flex gap-1.5 w-full max-w-full overflow-x-auto pb-1 pr-2 scrollbar-none">
          {PROMPT_TEMPLATES.slice(0, 6).map((template) => {
            const Icon = template.icon;
            return (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => onSelectPrompt(template.prompt)}
                className="h-7 text-xs gap-1.5 flex-shrink-0 whitespace-nowrap hover:bg-primary/10 hover:text-primary hover:border-primary"
              >
                <Icon className="h-3 w-3" />
                {template.title}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Умные подсказки</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {filteredTemplates.length} шаблонов
        </Badge>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="flex items-center gap-1.5 text-xs"
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-3">
          <ScrollArea className="h-[240px] pr-4">
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredTemplates.map((template, index) => {
                  const Icon = template.icon;
                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card
                        className={cn(
                          "p-3 cursor-pointer transition-all hover:bg-accent hover:border-primary",
                          "group"
                        )}
                        onClick={() => onSelectPrompt(template.prompt)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="font-medium text-sm">{template.title}</h4>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {template.prompt}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px] h-5 px-1.5"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {currentPrompt && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Текущий промт:</p>
          <p 
            className="text-xs bg-muted/50 p-2 rounded-md line-clamp-2 text-foreground" 
            title={currentPrompt}
          >
            {currentPrompt}
          </p>
        </div>
      )}
    </Card>
  );
}
