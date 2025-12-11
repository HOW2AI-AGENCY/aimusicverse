import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Split, Scissors, Mic2, Music2, Clock, Shuffle, 
  Download, Sparkles, Zap, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

/**
 * StudioQuickActions - Quick action buttons for track editing
 */

interface StudioQuickActionsProps {
  trackId: string;
  hasSunoId: boolean;
  showSeparationPrompt?: boolean;
  className?: string;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresSunoId?: boolean;
  variant?: 'default' | 'primary';
}

const quickActions: QuickAction[] = [
  {
    id: 'trim',
    label: 'Обрезать',
    description: 'Выбрать начало и конец',
    icon: Scissors,
  },
  {
    id: 'remix',
    label: 'Ремикс',
    description: 'Создать новую версию',
    icon: Shuffle,
    requiresSunoId: true,
  },
  {
    id: 'extend',
    label: 'Расширить',
    description: 'Добавить продолжение',
    icon: Clock,
    requiresSunoId: true,
  },
  {
    id: 'replace-vocal',
    label: 'Новый вокал',
    description: 'Заменить голос',
    icon: Mic2,
    requiresSunoId: true,
  },
  {
    id: 'replace-arrangement',
    label: 'Аранжировка',
    description: 'Новый инструментал',
    icon: Music2,
    requiresSunoId: true,
  },
  {
    id: 'download',
    label: 'Скачать',
    description: 'Сохранить на устройство',
    icon: Download,
  },
];

export function StudioQuickActions({
  trackId,
  hasSunoId,
  showSeparationPrompt = false,
  className,
}: StudioQuickActionsProps) {
  const [separating, setSeparating] = useState(false);
  const [separationMode, setSeparationMode] = useState<'simple' | 'detailed' | null>(null);

  const handleSeparate = async (mode: 'simple' | 'detailed') => {
    setSeparationMode(mode);
    setSeparating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      // Get track info
      const { data: track } = await supabase
        .from('tracks')
        .select('audio_url, suno_id')
        .eq('id', trackId)
        .single();

      if (!track?.audio_url || !track?.suno_id) {
        throw new Error('Недостаточно данных для разделения');
      }

      const { error } = await supabase.functions.invoke('suno-separate-vocals', {
        body: {
          trackId,
          audioId: track.suno_id,
          audioUrl: track.audio_url,
          mode,
          userId: user.id,
        }
      });

      if (error) throw error;

      toast.success(
        mode === 'simple' ? 'Разделение на 2 стема запущено' : 'Разделение на 6+ стемов запущено',
        { description: 'Вы получите уведомление когда будет готово' }
      );
    } catch (error) {
      logger.error('Error separating stems', error);
      toast.error('Ошибка при разделении стемов');
    } finally {
      setSeparating(false);
      setSeparationMode(null);
    }
  };

  const handleAction = (actionId: string) => {
    toast.info(`Функция "${actionId}" скоро будет доступна`);
  };

  return (
    <div className={cn("p-4 space-y-4", className)}>
      {/* Stem Separation Prompt */}
      {showSeparationPrompt && hasSunoId && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Разделить на стемы</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Quick separation */}
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                separating && separationMode !== 'simple' && "opacity-50"
              )}
              onClick={() => !separating && handleSeparate('simple')}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-[9px]">~1 мин</Badge>
                </div>
                <p className="text-sm font-medium">Быстрое</p>
                <p className="text-[11px] text-muted-foreground">Вокал + Инструментал</p>
                {separating && separationMode === 'simple' && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Обработка...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed separation */}
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                separating && separationMode !== 'detailed' && "opacity-50"
              )}
              onClick={() => !separating && handleSeparate('detailed')}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-muted">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Badge variant="secondary" className="text-[9px]">~3 мин</Badge>
                </div>
                <p className="text-sm font-medium">Детальное</p>
                <p className="text-[11px] text-muted-foreground">6 отдельных дорожек</p>
                {separating && separationMode === 'detailed' && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Обработка...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="font-semibold">Инструменты</h3>
        
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const isDisabled = action.requiresSunoId && !hasSunoId;

            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                disabled={isDisabled}
                onClick={() => handleAction(action.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl",
                  "bg-card border border-border/50 transition-all",
                  "hover:border-primary/30 hover:bg-card/80",
                  "active:scale-95",
                  isDisabled && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
