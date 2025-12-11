/**
 * Tag Builder Panel
 * Interactive builder for Suno V4.5+ compound tags
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Plus, X, Sparkles, Music, Mic2, Zap, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TagBuilderPanelProps {
  onTagsGenerated: (tags: string) => void;
  genre?: string;
  mood?: string;
  className?: string;
}

// Tag categories for Suno V4.5+
const TAG_CATEGORIES = {
  sections: {
    label: 'Секции',
    icon: Music,
    tags: ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro', 'Hook', 'Breakdown', 'Drop', 'Build', 'Climax', 'Instrumental', 'Solo']
  },
  vocals: {
    label: 'Вокал',
    icon: Mic2,
    tags: ['Male Vocal', 'Female Vocal', 'Duet', 'Choir', 'Whisper', 'Shout', 'Falsetto', 'Rap', 'Spoken Word', 'Harmony', 'Ad-libs']
  },
  dynamics: {
    label: 'Динамика',
    icon: Zap,
    tags: ['Soft', 'Loud', 'Crescendo', 'Decrescendo', 'Powerful', 'Intimate', 'Energetic', 'Calm', 'Dramatic', 'Subtle']
  },
  production: {
    label: 'Продакшн',
    icon: Settings2,
    tags: ['Full Band', 'Acoustic', 'Electronic', 'Orchestral', 'Minimal', 'Layered', 'Lo-fi', 'Hi-fi', 'Live Feel', 'Studio Polish']
  }
} as const;

// Vocal effects for back-vocals (round brackets)
const BACK_VOCAL_EFFECTS = [
  '(ooh)', '(aah)', '(hey)', '(yeah)', '(oh)', 
  '(la la la)', '(na na na)', '(echo)', '(harmony)', '(whoa)'
];

// V4.5+ Advanced tags
const ADVANCED_TAGS = {
  vocalist: ['Male', 'Female', 'Alto', 'Soprano', 'Tenor', 'Bass', 'Raspy', 'Smooth', 'Emotional'],
  vocalStyle: ['Smooth', 'Raspy', 'Breathy', 'Powerful', 'Intimate', 'Emotional', 'Aggressive'],
  instrumentFocus: ['Piano', 'Guitar', 'Drums', 'Bass', 'Synth', 'Strings', 'Brass', 'Percussion']
};

export function TagBuilderPanel({ onTagsGenerated, genre, mood, className }: TagBuilderPanelProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [backVocals, setBackVocals] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('sections');

  const addTag = useCallback((tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
  }, [selectedTags]);

  const removeTag = useCallback((tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  }, []);

  const addBackVocal = useCallback((effect: string) => {
    if (!backVocals.includes(effect)) {
      setBackVocals(prev => [...prev, effect]);
    }
  }, [backVocals]);

  const removeBackVocal = useCallback((effect: string) => {
    setBackVocals(prev => prev.filter(e => e !== effect));
  }, []);

  const generateCompoundTag = useCallback(() => {
    if (selectedTags.length === 0) {
      toast.warning('Выберите хотя бы один тег');
      return;
    }

    // Build compound tag: [Tag1] [Tag2] [Tag3]
    const compoundTag = selectedTags.map(t => `[${t}]`).join(' ');
    
    // Add back vocals if any
    const backVocalStr = backVocals.join(' ');
    
    const fullTag = backVocalStr ? `${compoundTag}\n${backVocalStr}` : compoundTag;
    
    onTagsGenerated(fullTag);
    toast.success('Тег добавлен в текст');
  }, [selectedTags, backVocals, onTagsGenerated]);

  const copyToClipboard = useCallback(() => {
    const compoundTag = selectedTags.map(t => `[${t}]`).join(' ');
    const backVocalStr = backVocals.join(' ');
    const fullTag = backVocalStr ? `${compoundTag}\n${backVocalStr}` : compoundTag;
    
    navigator.clipboard.writeText(fullTag);
    toast.success('Скопировано!');
  }, [selectedTags, backVocals]);

  const clearAll = useCallback(() => {
    setSelectedTags([]);
    setBackVocals([]);
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selected Tags Preview */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Выбранные теги:</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={copyToClipboard}
              disabled={selectedTags.length === 0}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={clearAll}
              disabled={selectedTags.length === 0 && backVocals.length === 0}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="min-h-[2rem]">
          <AnimatePresence mode="popLayout">
            {selectedTags.length > 0 ? (
              <motion.div 
                className="flex flex-wrap gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {selectedTags.map(tag => (
                  <motion.div
                    key={tag}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    layout
                  >
                    <Badge 
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/20 transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      [{tag}] <X className="h-2.5 w-2.5 ml-1" />
                    </Badge>
                  </motion.div>
                ))}
                {backVocals.map(bv => (
                  <motion.div
                    key={bv}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    layout
                  >
                    <Badge 
                      variant="outline"
                      className="cursor-pointer hover:bg-destructive/20 transition-colors text-primary"
                      onClick={() => removeBackVocal(bv)}
                    >
                      {bv} <X className="h-2.5 w-2.5 ml-1" />
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.p 
                className="text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Нажмите на теги ниже для добавления
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tag Categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4 h-9">
          {Object.entries(TAG_CATEGORIES).map(([key, cat]) => (
            <TabsTrigger key={key} value={key} className="text-xs gap-1 px-2">
              <cat.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(TAG_CATEGORIES).map(([key, cat]) => (
          <TabsContent key={key} value={key} className="mt-3">
            <ScrollArea className="h-24">
              <div className="flex flex-wrap gap-1.5">
                {cat.tags.map(tag => (
                  <motion.button
                    key={tag}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                      selectedTags.includes(tag)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 hover:bg-muted text-foreground'
                    )}
                    onClick={() => selectedTags.includes(tag) ? removeTag(tag) : addTag(tag)}
                  >
                    {tag}
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {/* Back Vocals Section */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Mic2 className="h-3 w-3" />
          Бэк-вокал (круглые скобки)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {BACK_VOCAL_EFFECTS.map(effect => (
            <motion.button
              key={effect}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs transition-all border',
                backVocals.includes(effect)
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-transparent border-border hover:border-primary/50 text-muted-foreground'
              )}
              onClick={() => backVocals.includes(effect) ? removeBackVocal(effect) : addBackVocal(effect)}
            >
              {effect}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <Button 
        onClick={generateCompoundTag}
        disabled={selectedTags.length === 0}
        className="w-full gap-2"
        size="sm"
      >
        <Plus className="h-4 w-4" />
        Добавить составной тег
      </Button>
    </div>
  );
}
