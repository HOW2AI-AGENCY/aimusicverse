/**
 * AIActions - AI-powered track actions
 * Includes analysis, style detection, lyrics generation
 */

import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Brain, Mic2, Music2, Wand2, Sparkles } from 'lucide-react';
import { Track } from '@/types/track';
import { ActionId } from '@/config/trackActionsConfig';
import { TrackActionState } from '@/lib/trackActionConditions';
import { ProBadge } from '@/components/ui/pro-badge';
import { useNavigate } from 'react-router-dom';
import { hapticImpact } from '@/lib/haptic';
import { toast } from 'sonner';

interface AIActionsProps {
  track: Track;
  state: TrackActionState;
  onAction: (actionId: ActionId) => void;
  variant: 'dropdown' | 'sheet';
  isProcessing?: boolean;
  onClose?: () => void;
}

export function AIActions({ 
  track, 
  state, 
  onAction, 
  variant, 
  isProcessing,
  onClose 
}: AIActionsProps) {
  const navigate = useNavigate();
  
  const hasLyrics = !!(track.lyrics && track.lyrics.trim().length > 0);
  const hasAnalysis = !!(track as any).audio_analysis;

  const handleAnalyze = () => {
    hapticImpact('medium');
    toast.info('Анализ трека запущен');
    // Navigate to track analysis or trigger analysis
    onClose?.();
    navigate(`/track/${track.id}?tab=analysis`);
  };

  const handleDetectStyle = () => {
    hapticImpact('light');
    toast.info('Определение стиля...');
    // This would call an AI endpoint
    onClose?.();
  };

  const handleGenerateLyrics = () => {
    hapticImpact('light');
    onClose?.();
    navigate(`/lyrics-wizard?trackId=${track.id}`);
  };

  if (variant === 'dropdown') {
    return (
      <>
        <DropdownMenuItem onClick={handleAnalyze}>
          <Brain className="w-4 h-4 mr-2" />
          AI Анализ
          <ProBadge size="sm" className="ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDetectStyle} disabled={hasAnalysis}>
          <Sparkles className="w-4 h-4 mr-2" />
          Определить стиль
        </DropdownMenuItem>
        {!hasLyrics && (
          <DropdownMenuItem onClick={handleGenerateLyrics}>
            <Mic2 className="w-4 h-4 mr-2" />
            Сгенерировать текст
          </DropdownMenuItem>
        )}
      </>
    );
  }

  // Sheet variant
  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 h-12"
        onClick={handleAnalyze}
      >
        <Brain className="w-5 h-5 text-purple-500" />
        <span>AI Анализ трека</span>
        <ProBadge size="sm" className="ml-auto" />
      </Button>
      
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 h-12"
        onClick={handleDetectStyle}
        disabled={hasAnalysis}
      >
        <Sparkles className="w-5 h-5 text-amber-500" />
        <span>Определить стиль</span>
      </Button>
      
      {!hasLyrics && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-12"
          onClick={handleGenerateLyrics}
        >
          <Mic2 className="w-5 h-5 text-blue-500" />
          <span>Сгенерировать текст</span>
        </Button>
      )}
    </>
  );
}
