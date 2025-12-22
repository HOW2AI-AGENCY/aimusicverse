/**
 * Generation Task Error Component
 * Shows failed generation with retry/delete options
 */

import { useState } from 'react';
import { AlertCircle, RefreshCw, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GenerationTaskErrorProps {
  taskId: string;
  trackId?: string;
  errorMessage: string;
  errorCode?: string;
  prompt?: string;
  style?: string;
  generationMode?: string;
  createdAt?: string;
  onRetry?: () => void;
  onDelete?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  'RATE_LIMIT': 'Превышен лимит запросов. Попробуйте позже.',
  'INSUFFICIENT_CREDITS': 'Недостаточно кредитов для генерации.',
  'ARTIST_NAME_NOT_ALLOWED': 'Имя артиста не разрешено. Измените промпт.',
  'COPYRIGHTED_CONTENT': 'Обнаружен защищённый контент. Измените текст.',
  'MALFORMED_LYRICS': 'Неправильный формат текста. Проверьте лирику.',
  'GENERATION_FAILED': 'Ошибка генерации. Попробуйте снова.',
  'API_ERROR': 'Ошибка API. Попробуйте позже.',
  'TIMEOUT': 'Превышено время ожидания. Попробуйте снова.',
};

export function GenerationTaskError({
  taskId,
  trackId,
  errorMessage,
  errorCode,
  prompt,
  style,
  generationMode,
  createdAt,
  onRetry,
  onDelete,
  onDismiss,
  className,
}: GenerationTaskErrorProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const displayMessage = errorCode && ERROR_MESSAGES[errorCode] 
    ? ERROR_MESSAGES[errorCode] 
    : errorMessage || 'Произошла ошибка при генерации';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete the generation task
      const { error: taskError } = await supabase
        .from('generation_tasks')
        .delete()
        .eq('id', taskId);

      if (taskError) throw taskError;

      // If there's a track, delete it too
      if (trackId) {
        const { error: trackError } = await supabase
          .from('tracks')
          .delete()
          .eq('id', trackId);

        if (trackError) {
          console.warn('Could not delete track:', trackError);
        }
      }

      toast.success('Задача удалена');
      onDelete?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Не удалось удалить задачу');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetry = async () => {
    if (!prompt) {
      toast.error('Нет данных для повторной генерации');
      return;
    }

    setIsRetrying(true);
    try {
      // Mark old task as dismissed
      await supabase
        .from('generation_tasks')
        .update({ status: 'dismissed' })
        .eq('id', taskId);

      // Call the retry callback
      onRetry?.();
      toast.success('Повторная генерация запущена');
    } catch (error) {
      console.error('Retry error:', error);
      toast.error('Не удалось запустить повторную генерацию');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card className={cn('border-destructive/50 bg-destructive/5', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm text-foreground">Ошибка генерации</p>
                <p className="text-sm text-muted-foreground mt-1">{displayMessage}</p>
              </div>
              
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={onDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Details collapsible */}
            {(prompt || style || generationMode || createdAt) && (
              <Collapsible open={showDetails} onOpenChange={setShowDetails} className="mt-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                    {showDetails ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                    {showDetails ? 'Скрыть детали' : 'Показать детали'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2 text-xs text-muted-foreground">
                  {generationMode && (
                    <div><span className="font-medium">Режим:</span> {generationMode}</div>
                  )}
                  {style && (
                    <div><span className="font-medium">Стиль:</span> {style}</div>
                  )}
                  {prompt && (
                    <div className="max-h-16 overflow-y-auto">
                      <span className="font-medium">Промпт:</span> {prompt.slice(0, 150)}{prompt.length > 150 ? '...' : ''}
                    </div>
                  )}
                  {createdAt && (
                    <div><span className="font-medium">Создано:</span> {new Date(createdAt).toLocaleString('ru-RU')}</div>
                  )}
                  {errorCode && (
                    <div><span className="font-medium">Код:</span> {errorCode}</div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
            
            <div className="flex items-center gap-2 mt-3">
              {onRetry && prompt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying || isDeleting}
                  className="gap-1.5"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isRetrying && "animate-spin")} />
                  {isRetrying ? 'Запуск...' : 'Повторить'}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting || isRetrying}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
