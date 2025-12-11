import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Split, Sparkles, Zap, Clock, Music2, 
  CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

/**
 * StemSeparationPrompt - Shows when track has no stems
 * Offers different separation modes with descriptions
 */

interface SeparationMode {
  id: 'simple' | 'detailed';
  label: string;
  description: string;
  stems: string[];
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
}

const separationModes: SeparationMode[] = [
  {
    id: 'simple',
    label: 'Быстрое разделение',
    description: 'Разделение на вокал и инструментал',
    stems: ['Вокал', 'Инструментал'],
    duration: '~1 мин',
    icon: Zap,
    recommended: true,
  },
  {
    id: 'detailed',
    label: 'Детальное разделение',
    description: 'Разделение на 6 отдельных дорожек',
    stems: ['Вокал', 'Бас', 'Ударные', 'Гитара', 'Фортепиано', 'Другое'],
    duration: '~3 мин',
    icon: Sparkles,
  },
];

interface StemSeparationPromptProps {
  trackId: string;
  trackTitle: string;
  audioUrl: string | null;
  sunoId: string | null;
  onSeparationStarted?: () => void;
  onSkip?: () => void;
  className?: string;
}

export function StemSeparationPrompt({
  trackId,
  trackTitle,
  audioUrl,
  sunoId,
  onSeparationStarted,
  onSkip,
  className,
}: StemSeparationPromptProps) {
  const [selectedMode, setSelectedMode] = useState<'simple' | 'detailed' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canSeparate = !!audioUrl && !!sunoId;

  const handleSeparate = async (mode: 'simple' | 'detailed') => {
    if (!audioUrl || !sunoId) {
      toast.error('Недостаточно данных для разделения');
      return;
    }

    setSelectedMode(mode);
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Не авторизован');

      const { error } = await supabase.functions.invoke('suno-separate-vocals', {
        body: {
          trackId,
          audioId: sunoId,
          audioUrl,
          mode,
          userId: user.id,
        }
      });

      if (error) throw error;

      toast.success(
        mode === 'simple' 
          ? 'Разделение на 2 стема запущено' 
          : 'Разделение на 6+ стемов запущено',
        { description: 'Вы получите уведомление когда будет готово' }
      );

      onSeparationStarted?.();
    } catch (error) {
      logger.error('Error separating stems', error);
      toast.error('Ошибка при разделении стемов');
    } finally {
      setIsProcessing(false);
      setSelectedMode(null);
    }
  };

  return (
    <div className={cn("p-4 sm:p-6", className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">
          Стемы недоступны
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Для доступа к профессиональным функциям микшера необходимо разделить трек на отдельные дорожки
        </p>
      </div>

      {/* Track info */}
      <Card className="mb-6 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-muted">
              <Music2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{trackTitle}</p>
              <p className="text-xs text-muted-foreground">
                {canSeparate ? 'Готов к разделению' : 'Разделение недоступно'}
              </p>
            </div>
            {canSeparate && (
              <Badge variant="outline" className="text-xs border-green-500/30 text-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Готов
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Separation options */}
      {canSeparate ? (
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-muted-foreground">
            Выберите режим разделения:
          </p>
          
          {separationModes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            const isLoading = isProcessing && isSelected;
            
            return (
              <motion.div
                key={mode.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-transparent hover:border-border",
                    isProcessing && !isSelected && "opacity-50"
                  )}
                  onClick={() => !isProcessing && handleSeparate(mode.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-xl shrink-0",
                        mode.recommended 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{mode.label}</h3>
                          {mode.recommended && (
                            <Badge className="text-[10px] bg-primary/10 text-primary border-0">
                              Рекомендуем
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {mode.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {mode.stems.map((stem) => (
                            <Badge 
                              key={stem} 
                              variant="secondary" 
                              className="text-[10px] px-2"
                            >
                              {stem}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {mode.duration}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant={mode.recommended ? "default" : "outline"}
                        disabled={isProcessing}
                        className="shrink-0"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Split className="w-4 h-4 mr-1.5" />
                            Разделить
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-500 mb-1">
                  Разделение недоступно
                </p>
                <p className="text-sm text-muted-foreground">
                  Этот трек не может быть разделён на стемы. Возможно, он был создан не через Suno API.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skip button */}
      {onSkip && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={onSkip}
        >
          Продолжить без стемов
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
}
