/**
 * InviteFriendsCard - Prominent referral invitation component
 * Shows referral stats and share button
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Gift, Share2, Copy, Sparkles } from 'lucide-react';
import { useReferralStats, useShareReferral } from '@/hooks/useReferrals';
import { ECONOMY } from '@/lib/economy';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { useTelegram } from '@/contexts/TelegramContext';
import { toast } from 'sonner';

interface InviteFriendsCardProps {
  variant?: 'default' | 'compact' | 'banner';
  className?: string;
}

export const InviteFriendsCard = memo(function InviteFriendsCard({
  variant = 'default',
  className,
}: InviteFriendsCardProps) {
  const { data: stats, isLoading } = useReferralStats();
  const { link: referralLink, share } = useShareReferral();
  const { hapticFeedback } = useTelegram();

  const handleShare = async () => {
    hapticFeedback?.('light');
    await share();
  };

  const handleCopyCode = async () => {
    if (stats?.referralCode) {
      hapticFeedback?.('light');
      await navigator.clipboard.writeText(stats.referralCode);
      toast.success('Код скопирован!');
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className="p-4">
          <div className="h-16 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={className}
      >
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 via-background to-primary/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Пригласи друга</span>
                  <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                    +{ECONOMY.REFERRAL_INVITE_BONUS}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Получи кредиты за каждого друга
                </p>
              </div>

              {/* Action */}
              <Button
                size="sm"
                onClick={handleShare}
                className="flex-shrink-0 gap-1.5 h-9"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Пригласить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className={cn(
          "gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50",
          className
        )}
      >
        <Gift className="w-4 h-4 text-primary" />
        <span>Пригласить</span>
        <Badge variant="secondary" className="text-xs ml-1 bg-primary/20 text-primary">
          +{ECONOMY.REFERRAL_INVITE_BONUS}
        </Badge>
      </Button>
    );
  }

  // Default variant - full card with stats
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="overflow-hidden border-primary/20">
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
              <Gift className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Пригласи друзей</h3>
              <p className="text-xs text-muted-foreground">
                Получай бонусы за каждого
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-4 pt-3 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-lg font-bold text-primary">
                <Users className="w-4 h-4" />
                {stats?.referralCount || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Приглашено</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-lg font-bold text-emerald-500">
                <Sparkles className="w-4 h-4" />
                {stats?.referralEarnings || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Заработано</p>
            </div>
          </div>

          {/* Rewards info */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ты получишь</span>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                +{ECONOMY.REFERRAL_INVITE_BONUS} кредитов
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Друг получит</span>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                +{ECONOMY.REFERRAL_NEW_USER_BONUS} кредитов
              </Badge>
            </div>
          </div>

          {/* Referral code */}
          {stats?.referralCode && (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 font-mono text-sm text-center">
                {stats.referralCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="flex-shrink-0 h-9 w-9"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Share button */}
          <Button
            className="w-full gap-2"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
            Пригласить друзей
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
});
