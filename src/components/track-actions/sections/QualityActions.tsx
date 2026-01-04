import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState, isActionAvailable } from '@/lib/trackActionConditions';

interface QualityActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
}

export function QualityActions({ track, state, onAction, variant, isProcessing }: QualityActionsProps) {
  const showUpscale = isActionAvailable('upscale_hd', track, state);
  
  // Check if already has HD audio
  const hasHdAudio = !!(track as any).audio_url_hd || (track as any).audio_quality === 'hd';
  const isUpscaling = (track as any).upscale_status === 'processing';

  if (!showUpscale) return null;

  if (variant === 'dropdown') {
    if (hasHdAudio) {
      return (
        <DropdownMenuItem disabled className="text-green-500">
          <Check className="w-4 h-4 mr-2" />
          HD 48kHz ✓
        </DropdownMenuItem>
      );
    }

    if (isUpscaling) {
      return (
        <DropdownMenuItem disabled>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Улучшение...
        </DropdownMenuItem>
      );
    }

    return (
      <DropdownMenuItem onClick={() => onAction('upscale_hd')} disabled={isProcessing}>
        <Sparkles className="w-4 h-4 mr-2" />
        HD Audio (48kHz)
      </DropdownMenuItem>
    );
  }

  // Sheet variant
  if (hasHdAudio) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 h-12 text-green-500"
        disabled
      >
        <Check className="w-5 h-5" />
        <span>HD 48kHz ✓</span>
      </Button>
    );
  }

  if (isUpscaling) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 h-12"
        disabled
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Улучшение...</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 h-12"
      onClick={() => onAction('upscale_hd')}
      disabled={isProcessing}
    >
      <Sparkles className="w-5 h-5" />
      <span>HD Audio (48kHz)</span>
    </Button>
  );
}
