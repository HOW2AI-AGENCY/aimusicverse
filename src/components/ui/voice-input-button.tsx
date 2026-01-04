import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceInput, VoiceInputContext } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  context?: VoiceInputContext;
  autoCorrect?: boolean;
  language?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
}

export function VoiceInputButton({
  onResult,
  context = 'general',
  autoCorrect = true,
  language = 'ru',
  className,
  size = 'icon',
  variant = 'ghost',
}: VoiceInputButtonProps) {
  const { isRecording, isProcessing, toggleRecording } = useVoiceInput({
    onResult,
    context,
    autoCorrect,
    language,
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          onClick={toggleRecording}
          disabled={isProcessing}
          className={cn(
            'relative',
            isRecording && 'text-destructive animate-pulse',
            className
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
          {isRecording && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-ping" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isRecording ? 'Остановить запись' : isProcessing ? 'Обработка...' : 'Голосовой ввод'}
      </TooltipContent>
    </Tooltip>
  );
}