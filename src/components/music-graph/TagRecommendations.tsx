import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, TrendingUp, History, Link2, Copy, Check, 
  ChevronDown, ChevronUp, Lightbulb, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  useTagRecommendations, 
  useTagPopularity, 
  useSuccessfulCombinations 
} from '@/hooks/useTagRecommendations';

interface TagRecommendationsProps {
  currentTags?: string[];
  genre?: string;
  onTagSelect?: (tag: string) => void;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  genre: 'hsl(var(--primary))',
  mood: '#22c55e',
  instrument: '#f59e0b',
  vocal: '#ec4899',
  production: '#8b5cf6',
  structure: '#06b6d4',
  era: '#84cc16',
  tempo: '#f97316',
};

export function TagRecommendations({ 
  currentTags = [], 
  genre, 
  onTagSelect,
  className 
}: TagRecommendationsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    recommendations: true,
    popular: false,
    combinations: false,
  });
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const recommendations = useTagRecommendations(currentTags, genre);
  const { data: popularity, isLoading: loadingPopularity } = useTagPopularity();
  const { data: combinations, isLoading: loadingCombinations } = useSuccessfulCombinations();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCopyTag = async (tag: string) => {
    await navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    toast.success('Тег скопирован');
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleTagClick = (tag: string) => {
    if (onTagSelect) {
      onTagSelect(tag);
    } else {
      handleCopyTag(tag);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Recommendations */}
      <Collapsible 
        open={expandedSections.recommendations} 
        onOpenChange={() => toggleSection('recommendations')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm">Рекомендации для вас</h3>
                <p className="text-xs text-muted-foreground">
                  {recommendations.length} персональных предложений
                </p>
              </div>
            </div>
            {expandedSections.recommendations ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <ScrollArea className="h-64 px-4">
            <div className="space-y-2 pb-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-6">
                  <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Выберите теги, чтобы получить рекомендации
                  </p>
                </div>
              ) : (
                recommendations.map((rec, idx) => (
                  <motion.div
                    key={rec.tag}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer group"
                    onClick={() => handleTagClick(rec.tag)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{rec.tag}</span>
                          {rec.category && (
                            <Badge 
                              variant="outline" 
                              className="text-[10px] px-1.5"
                              style={{ 
                                borderColor: CATEGORY_COLORS[rec.category] + '50',
                                color: CATEGORY_COLORS[rec.category],
                              }}
                            >
                              {rec.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.reason}</p>
                        {rec.relatedTags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Link2 className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              {rec.relatedTags.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTag(rec.tag);
                        }}
                      >
                        {copiedTag === rec.tag ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Score indicator */}
                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${rec.score * 100}%` }}
                        transition={{ delay: idx * 0.05 + 0.2 }}
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

      {/* Popular Tags */}
      <Collapsible 
        open={expandedSections.popular} 
        onOpenChange={() => toggleSection('popular')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm">Популярные теги</h3>
                <p className="text-xs text-muted-foreground">
                  Самые используемые в сообществе
                </p>
              </div>
            </div>
            {expandedSections.popular ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4">
            {loadingPopularity ? (
              <div className="flex flex-wrap gap-2">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(popularity || []).slice(0, 20).map((item, idx) => (
                  <motion.div
                    key={item.tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "cursor-pointer hover:bg-primary/10 transition-colors",
                        currentTags.includes(item.tag) && "bg-primary/20 border-primary"
                      )}
                      onClick={() => handleTagClick(item.tag)}
                    >
                      {item.tag}
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        {item.count}
                      </span>
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Successful Combinations */}
      <Collapsible 
        open={expandedSections.combinations} 
        onOpenChange={() => toggleSection('combinations')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm">Успешные комбинации</h3>
                <p className="text-xs text-muted-foreground">
                  Проверенные сочетания тегов
                </p>
              </div>
            </div>
            {expandedSections.combinations ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <ScrollArea className="h-48 px-4">
            <div className="space-y-2 pb-4">
              {loadingCombinations ? (
                [...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : (combinations || []).length === 0 ? (
                <div className="text-center py-6">
                  <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Пока нет данных о комбинациях
                  </p>
                </div>
              ) : (
                (combinations || []).map((combo, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 rounded-xl bg-card border border-border hover:border-amber-500/30 transition-colors"
                  >
                    <div className="flex flex-wrap gap-1 mb-2">
                      {combo.tags.map(tag => (
                        <Badge 
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-amber-500/20"
                          onClick={() => handleTagClick(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Использовано {combo.count} раз
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
