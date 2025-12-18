// PostGenerationSharePrompt - Shows share prompt after successful track generation
import { useState, useEffect } from 'react';
import { Share2, Gift, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRewardShare } from '@/hooks/useGamification';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PostGenerationSharePromptProps {
  trackId: string;
  trackTitle: string;
  onDismiss: () => void;
  className?: string;
}

export function PostGenerationSharePrompt({ 
  trackId, 
  trackTitle, 
  onDismiss,
  className 
}: PostGenerationSharePromptProps) {
  const { hapticFeedback } = useTelegram();
  const { mutate: rewardShare, isPending } = useRewardShare();
  const [hasShared, setHasShared] = useState(false);

  const handleShare = async () => {
    hapticFeedback('light');
    
    const shareUrl = `${window.location.origin}/track/${trackId}`;
    const shareText = `🎵 Послушай мой новый трек "${trackTitle}" на MusicVerse AI!`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: trackTitle,
          text: shareText,
          url: shareUrl,
        });
        
        // Reward the user
        rewardShare({ trackId }, {
          onSuccess: () => {
            setHasShared(true);
            hapticFeedback('success');
            toast.success('+5 кредитов за шеринг! 🎉');
            setTimeout(onDismiss, 2000);
          },
        });
      } else {
        // Fallback - copy link
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast.success('Ссылка скопирована!');
        
        rewardShare({ trackId }, {
          onSuccess: () => {
            setHasShared(true);
            setTimeout(onDismiss, 2000);
          },
        });
      }
    } catch (err) {
      // User cancelled sharing
      if ((err as Error).name !== 'AbortError') {
        console.error('Share error:', err);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn("relative", className)}
    >
      <Card className="p-4 bg-gradient-to-br from-generate/20 via-primary/10 to-card border-generate/30 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-generate rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary rounded-full blur-2xl" />
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="relative">
          {!hasShared ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-generate/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-generate" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Трек создан! 🎉</h3>
                  <p className="text-xs text-muted-foreground">Поделись с друзьями</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 mb-3">
                <Gift className="w-4 h-4 text-primary" />
                <span className="text-xs">
                  Получи <span className="font-bold text-primary">+5 кредитов</span> за шеринг!
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-generate hover:bg-generate/90 text-white gap-2"
                  onClick={handleShare}
                  disabled={isPending}
                >
                  <Share2 className="w-4 h-4" />
                  {isPending ? 'Делимся...' : 'Поделиться'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="text-xs"
                >
                  Позже
                </Button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-2"
            >
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                <Gift className="w-6 h-6 text-green-500" />
              </div>
              <p className="font-semibold text-green-500">+5 кредитов!</p>
              <p className="text-xs text-muted-foreground">Спасибо за шеринг</p>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Hook to show share prompt after generation
export function usePostGenerationSharePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [trackData, setTrackData] = useState<{ id: string; title: string } | null>(null);

  const triggerPrompt = (trackId: string, trackTitle: string) => {
    setTrackData({ id: trackId, title: trackTitle });
    // Small delay to let user see their track first
    setTimeout(() => setShowPrompt(true), 1500);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    setTrackData(null);
  };

  return {
    showPrompt,
    trackData,
    triggerPrompt,
    dismissPrompt,
  };
}
