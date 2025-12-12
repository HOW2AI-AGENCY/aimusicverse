/**
 * Generation Error Card Component
 * Displays failed generation with error details and retry option
 */

import { AlertCircle, RefreshCw, XCircle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GenerationErrorCardProps {
  title?: string;
  errorMessage: string;
  errorCode?: string;
  canRetry?: boolean;
  onRetry?: () => void;
  onEdit?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ERROR_ICONS: Record<string, typeof AlertCircle> = {
  ARTIST_NAME_NOT_ALLOWED: Edit3,
  COPYRIGHTED_CONTENT: XCircle,
  MALFORMED_LYRICS: Edit3,
  RATE_LIMIT: RefreshCw,
  INSUFFICIENT_CREDITS: XCircle,
};

const ERROR_COLORS: Record<string, string> = {
  ARTIST_NAME_NOT_ALLOWED: 'text-amber-500',
  COPYRIGHTED_CONTENT: 'text-red-500',
  MALFORMED_LYRICS: 'text-amber-500',
  RATE_LIMIT: 'text-amber-500',
  INSUFFICIENT_CREDITS: 'text-red-500',
  GENERATION_FAILED: 'text-red-500',
};

export function GenerationErrorCard({
  title = 'Ошибка генерации',
  errorMessage,
  errorCode,
  canRetry = true,
  onRetry,
  onEdit,
  onDismiss,
  className,
}: GenerationErrorCardProps) {
  const IconComponent = (errorCode && ERROR_ICONS[errorCode]) || AlertCircle;
  const iconColor = (errorCode && ERROR_COLORS[errorCode]) || 'text-destructive';

  const needsEdit = errorCode === 'ARTIST_NAME_NOT_ALLOWED' || 
                    errorCode === 'COPYRIGHTED_CONTENT' || 
                    errorCode === 'MALFORMED_LYRICS';

  return (
    <Card className={cn('border-destructive/50 bg-destructive/5', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('mt-0.5', iconColor)}>
            <IconComponent className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            
            <div className="flex items-center gap-2 mt-3">
              {needsEdit && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Изменить
                </Button>
              )}
              
              {canRetry && onRetry && !needsEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Попробовать снова
                </Button>
              )}
              
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                >
                  Закрыть
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
