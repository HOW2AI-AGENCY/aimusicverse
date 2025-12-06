import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoiceInput, VoiceInputContext } from '@/hooks/useVoiceInput';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  context?: VoiceInputContext;
  autoCorrect?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  appendMode?: boolean; // If true, appends to existing text instead of replacing
  currentValue?: string;
}

export function VoiceInputButton({
  onResult,
  context = 'general',
  autoCorrect = true,
  className,
  size = 'sm',
  appendMode = false,
  currentValue = '',
}: VoiceInputButtonProps) {
  const handleResult = (text: string) => {
    if (appendMode && currentValue) {
      // Add space or newline between existing and new text
      const separator = context === 'lyrics' ? '\n' : ' ';
      onResult(currentValue.trim() + separator + text);
    } else {
      onResult(text);
    }
  };

  const { isRecording, isProcessing, toggleRecording } = useVoiceInput({
    onResult: handleResult,
    context,
    autoCorrect,
  });

  return (
    <Button
      type="button"
      variant={isRecording ? 'destructive' : 'ghost'}
      size={size}
      onClick={toggleRecording}
      disabled={isProcessing}
      className={cn(
        'relative transition-all',
        isRecording && 'animate-pulse',
        className
      )}
      title={isRecording ? 'Остановить запись' : 'Голосовой ввод'}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isRecording ? (
        <>
          <MicOff className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
}
