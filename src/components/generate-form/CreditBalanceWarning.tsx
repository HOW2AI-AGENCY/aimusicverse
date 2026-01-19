/**
 * CreditBalanceWarning - Shows warning when user has insufficient credits
 * Provides quick link to top up balance or shows subscription upgrade popup for free users at limit
 */

import { memo, useState } from 'react';
import { AlertCircle, Coins, ArrowRight, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { useNavigate } from 'react-router-dom';
import { useCreditsLimits } from '@/hooks/useCreditsLimits';
import { SubscriptionUpgradePopup } from '@/components/popups/SubscriptionUpgradePopup';

interface CreditBalanceWarningProps {
  balance: number;
  cost: number;
  onClose?: () => void;
  className?: string;
}

export const CreditBalanceWarning = memo(function CreditBalanceWarning({
  balance,
  cost,
  onClose,
  className,
}: CreditBalanceWarningProps) {
  const { hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  const { isFreeUser, isBalanceLimitReached } = useCreditsLimits();
  const [upgradePopupOpen, setUpgradePopupOpen] = useState(false);
  
  const isInsufficient = balance < cost;
  const isLow = balance < cost * 2 && balance >= cost; // Low but can still generate
  
  // Show upgrade popup if free user is at balance limit
  const showUpgradeOption = isFreeUser && isBalanceLimitReached;
  
  if (!isInsufficient && !isLow) return null;
  
  const handleTopUp = () => {
    hapticFeedback('light');
    
    if (showUpgradeOption) {
      setUpgradePopupOpen(true);
    } else {
      onClose?.();
      navigate('/profile?tab=credits');
    }
  };
  
  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className={cn(
            "rounded-xl border overflow-hidden",
            isInsufficient 
              ? "border-destructive/30 bg-destructive/10" 
              : "border-amber-500/30 bg-amber-500/10",
            className
          )}
        >
          <div className="p-3">
            <div className="flex items-start gap-2.5">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                isInsufficient ? "bg-destructive/20" : "bg-amber-500/20"
              )}>
                {isInsufficient ? (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                ) : (
                  <Coins className="w-4 h-4 text-amber-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-medium",
                  isInsufficient ? "text-destructive" : "text-amber-600 dark:text-amber-400"
                )}>
                  {isInsufficient 
                    ? showUpgradeOption ? 'Достигнут лимит кредитов' : 'Недостаточно кредитов' 
                    : 'Баланс на исходе'
                  }
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isInsufficient ? (
                    showUpgradeOption ? (
                      <>Бесплатный лимит: <span className="font-semibold text-foreground">100</span> кредитов</>
                    ) : (
                      <>
                        Ваш баланс: <span className="font-semibold text-foreground">{balance}</span> • 
                        Требуется: <span className="font-semibold text-foreground">{cost}</span>
                      </>
                    )
                  ) : (
                    <>
                      После генерации останется: <span className="font-semibold text-amber-600 dark:text-amber-400">{balance - cost}</span> кредитов
                    </>
                  )}
                </p>
                
                <Button
                  type="button"
                  variant={isInsufficient ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleTopUp}
                  className={cn(
                    "mt-2 h-8 text-xs gap-1.5",
                    !isInsufficient && "border-amber-500/30 hover:bg-amber-500/20",
                    showUpgradeOption && isInsufficient && "bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white hover:from-amber-600 hover:to-orange-600"
                  )}
                >
                  {showUpgradeOption ? (
                    <>
                      <Crown className="w-3.5 h-3.5" />
                      Получить PRO
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Пополнить баланс
                    </>
                  )}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Subscription Upgrade Popup */}
      <SubscriptionUpgradePopup
        open={upgradePopupOpen}
        onClose={() => setUpgradePopupOpen(false)}
        reason="balance_limit"
      />
    </>
  );
});
