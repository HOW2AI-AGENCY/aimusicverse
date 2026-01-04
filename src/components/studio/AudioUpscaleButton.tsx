/**
 * AudioUpscaleButton component
 * 
 * Button for upscaling audio to 48kHz HD quality
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { useAudioUpscale } from '@/hooks/useAudioUpscale';
import { getUpscaleStatus, hasHdAudio } from '@/api/audio-upscale.api';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface AudioUpscaleButtonProps {
  trackId: string;
  audioUrl: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function AudioUpscaleButton({
  trackId,
  audioUrl,
  className,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
}: AudioUpscaleButtonProps) {
  const { upscale, isLoading, progress } = useAudioUpscale();
  const [hasHd, setHasHd] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Check initial status
  useEffect(() => {
    const checkStatus = async () => {
      const [hdAvailable, upscaleStatus] = await Promise.all([
        hasHdAudio(trackId),
        getUpscaleStatus(trackId),
      ]);
      setHasHd(hdAvailable);
      setStatus(upscaleStatus);
    };
    checkStatus();
  }, [trackId]);

  const handleUpscale = async () => {
    const result = await upscale({ audioUrl, trackId });
    if (result?.success) {
      setHasHd(true);
      setStatus('completed');
    }
  };

  // Already has HD audio
  if (hasHd || status === 'completed') {
    return (
      <Button
        variant="ghost"
        size={size}
        className={cn('text-green-500 cursor-default', className)}
        disabled
      >
        <Check className="h-4 w-4" />
        {showLabel && <span className="ml-2">HD 48kHz</span>}
      </Button>
    );
  }

  // Processing
  if (isLoading || status === 'processing') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button variant={variant} size={size} disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showLabel && <span className="ml-2">Улучшение...</span>}
        </Button>
        {progress > 0 && (
          <Progress value={progress} className="w-16 h-1" />
        )}
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleUpscale}
      className={cn(className)}
      aria-label="Улучшить качество аудио до 48kHz"
    >
      <Sparkles className="h-4 w-4" />
      {showLabel && <span className="ml-2">HD Audio (48kHz)</span>}
    </Button>
  );
}
