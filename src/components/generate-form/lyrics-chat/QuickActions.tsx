import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  QUICK_ACTIONS_BY_CATEGORY,
  CATEGORY_INFO,
  getContextualQuickActions,
  type LyricsQuickAction,
} from './quickActions';

interface QuickActionsProps {
  hasLyrics?: boolean;
  onActionSelect: (action: LyricsQuickAction) => void;
  className?: string;
}

export function QuickActions({
  hasLyrics = false,
  onActionSelect,
  className,
}: QuickActionsProps) {
  const contextualActions = getContextualQuickActions(hasLyrics);
  
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">Быстрые действия</h4>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Выберите готовый запрос или напишите свой
        </p>
      </div>
      
      <Tabs defaultValue="contextual" className="w-full">
        <div className="border-b px-3">
          <TabsList className="w-full bg-transparent">
            <TabsTrigger value="contextual" className="text-xs flex-1">
              Для вас
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs flex-1">
              Все
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Contextual actions */}
        <TabsContent value="contextual" className="m-0 p-3">
          <div className="space-y-2">
            {contextualActions.map((action) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-3 text-left"
                  onClick={() => onActionSelect(action)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <span className="text-2xl">{action.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{action.label}</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">
                          {CATEGORY_INFO[action.category].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </TabsContent>
        
        {/* All actions by category */}
        <TabsContent value="all" className="m-0">
          <ScrollArea className="h-[300px]">
            <div className="p-3 space-y-4">
              {Object.entries(QUICK_ACTIONS_BY_CATEGORY).map(([category, actions]) => {
                const info = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{info.emoji}</span>
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {info.label}
                      </h5>
                    </div>
                    <div className="space-y-2">
                      {actions.map((action) => (
                        <motion.div
                          key={action.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto py-2 px-2 text-left"
                            onClick={() => onActionSelect(action)}
                          >
                            <div className="flex items-start gap-2 w-full">
                              <span className="text-lg">{action.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs">{action.label}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">
                                  {action.description}
                                </p>
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
