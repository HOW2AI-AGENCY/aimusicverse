/**
 * Watermark Actions Section
 * 
 * Actions for applying and detecting audio watermarks
 */

import { Shield, ShieldCheck, Loader2 } from 'lucide-react';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAudioWatermark } from '@/hooks/useAudioWatermark';
import type { Track } from '@/types/track';

interface WatermarkActionsProps {
  track: Track;
  onAction?: () => void;
}

export function WatermarkActions({ track, onAction }: WatermarkActionsProps) {
  const { applyWatermark, detectWatermark, isApplying, isDetecting } = useAudioWatermark();

  const handleApplyWatermark = async () => {
    if (!track.audio_url) return;
    await applyWatermark(track.audio_url, track.id);
    onAction?.();
  };

  const handleDetectWatermark = async () => {
    if (!track.audio_url) return;
    await detectWatermark(track.audio_url);
    onAction?.();
  };

  const isLoading = isApplying || isDetecting;

  return (
    <>
      <DropdownMenuSeparator />
      
      <DropdownMenuItem
        onClick={handleApplyWatermark}
        disabled={isLoading || !track.audio_url || !!track.is_watermarked}
      >
        {isApplying ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Shield className="h-4 w-4 mr-2" />
        )}
        {track.is_watermarked === true ? 'Водяной знак добавлен' : 'Добавить водяной знак'}
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={handleDetectWatermark}
        disabled={isLoading || !track.audio_url}
      >
        {isDetecting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4 mr-2" />
        )}
        Проверить водяной знак
      </DropdownMenuItem>
    </>
  );
}
