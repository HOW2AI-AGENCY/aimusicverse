import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  className?: string;
  message?: string;
}

export function LoadingScreen({ className, message = 'Загрузка...' }: LoadingScreenProps) {
  return (
    <div className={cn(
      'flex min-h-screen items-center justify-center bg-background',
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}
