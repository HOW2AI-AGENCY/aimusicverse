/**
 * SubscriptionManagement Component
 * Displays user's subscription status, payment history, and cancel option
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Crown, Calendar, CreditCard, Clock, AlertTriangle, 
  CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp,
  RefreshCw, Ban
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { motion, AnimatePresence } from '@/lib/motion';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { 
  getUserPaymentTransactions, 
  getActiveSubscription,
  cancelTinkoffSubscription,
  type TinkoffSubscription,
} from '@/services/tinkoffPaymentService';
import type { PaymentTransaction } from '@/types/payment';
import { formatRubles } from '@/types/payment';
import { cn } from '@/lib/utils';

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Активна', variant: 'default' },
    paused: { label: 'Приостановлена', variant: 'secondary' },
    cancelled: { label: 'Отменена', variant: 'destructive' },
    expired: { label: 'Истекла', variant: 'outline' },
    completed: { label: 'Оплачено', variant: 'default' },
    pending: { label: 'В обработке', variant: 'secondary' },
    failed: { label: 'Ошибка', variant: 'destructive' },
  };

  const config = variants[status] || { label: status, variant: 'outline' };

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        status === 'active' && 'bg-success hover:bg-success/80',
        status === 'completed' && 'bg-success hover:bg-success/80'
      )}
    >
      {config.label}
    </Badge>
  );
}

function PaymentHistoryItem({ transaction }: { transaction: PaymentTransaction }) {
  const date = new Date(transaction.created_at);
  const formattedDate = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-full",
          transaction.status === 'completed' ? 'bg-success/10' : 
          transaction.status === 'failed' ? 'bg-destructive/10' : 'bg-muted'
        )}>
          {transaction.status === 'completed' ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : transaction.status === 'failed' ? (
            <XCircle className="w-4 h-4 text-destructive" />
          ) : (
            <Clock className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {transaction.credits_granted 
              ? `${transaction.credits_granted} кредитов` 
              : transaction.subscription_granted || transaction.product_code}
          </p>
          <p className="text-xs text-muted-foreground">
            {formattedDate} в {formattedTime}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">
          {formatRubles(transaction.amount_cents)}
        </p>
        <StatusBadge status={transaction.status} />
      </div>
    </motion.div>
  );
}

export function SubscriptionManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { 
    isActive, 
    tier, 
    expiresAt, 
    daysRemaining, 
    autoRenew,
    isLoading: statusLoading 
  } = useSubscriptionStatus({
    userId: user?.id || '',
    enabled: !!user?.id,
  });

  const { data: activeSubscription, isLoading: subLoading } = useQuery({
    queryKey: ['tinkoff-subscription-active', user?.id],
    queryFn: getActiveSubscription,
    enabled: !!user?.id,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['payment-transactions', user?.id],
    queryFn: () => getUserPaymentTransactions(10),
    enabled: !!user?.id,
  });

  const isLoading = statusLoading || subLoading || txLoading;

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;

    setCancelling(true);
    try {
      const result = await cancelTinkoffSubscription(activeSubscription.id);
      
      if (result.success) {
        toast.success('Подписка отменена', {
          description: `Доступ сохранится до ${result.expiresAt ? new Date(result.expiresAt).toLocaleDateString('ru-RU') : 'окончания периода'}`,
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['tinkoff-subscription-active'] });
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      } else {
        toast.error('Не удалось отменить подписку', {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error('Произошла ошибка при отмене подписки');
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const showExpirationWarning = isActive && daysRemaining !== undefined && daysRemaining !== null && daysRemaining < 7;
  const isCancelled = activeSubscription?.status === 'cancelled';

  return (
    <div className="space-y-4">
      {/* Current Subscription Card */}
      <Card className={cn(
        'overflow-hidden transition-colors',
        isActive && 'border-primary/30'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className={cn(
                "h-5 w-5",
                tier === 'premium' || tier === 'pro' ? 'text-amber-500' : 'text-muted-foreground'
              )} />
              <CardTitle className="text-lg">Подписка</CardTitle>
            </div>
            <StatusBadge status={isActive ? 'active' : (isCancelled ? 'cancelled' : 'expired')} />
          </div>
          <CardDescription>
            Управление вашей подпиской
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Tier Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Текущий план</p>
              <p className="text-xl font-bold capitalize">{tier || 'Free'}</p>
            </div>
            
            {activeSubscription?.card_pan && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Способ оплаты</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{activeSubscription.card_pan}</span>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          {(expiresAt || activeSubscription?.next_billing_date) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {expiresAt && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {isCancelled ? 'Доступ до' : 'Следующее списание'}
                    </p>
                    <p className="font-medium">
                      {new Date(expiresAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                
                {daysRemaining !== null && daysRemaining !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Осталось</p>
                    <p className={cn(
                      "font-medium",
                      daysRemaining < 7 && 'text-amber-500'
                    )}>
                      {daysRemaining} {daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Expiration Warning */}
          <AnimatePresence>
            {showExpirationWarning && !isCancelled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    Подписка скоро истекает
                  </p>
                  <p className="text-muted-foreground">
                    Автосписание произойдёт через {daysRemaining} {daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cancellation Notice */}
          <AnimatePresence>
            {isCancelled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 p-3 bg-muted rounded-lg"
              >
                <Ban className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Подписка отменена</p>
                  <p className="text-muted-foreground">
                    Доступ сохранится до окончания оплаченного периода
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cancel Button */}
          {isActive && activeSubscription && !isCancelled && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Отмена...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Отменить подписку
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Отменить подписку?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вы уверены, что хотите отменить подписку? 
                    Доступ к премиум-функциям сохранится до {expiresAt ? new Date(expiresAt).toLocaleDateString('ru-RU') : 'конца периода'}.
                    Автоматическое продление будет отключено.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Оставить подписку</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Да, отменить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Renew Button for cancelled */}
          {isCancelled && (
            <Button 
              className="w-full"
              onClick={() => window.location.href = '/subscription'}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Возобновить подписку
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">История платежей</CardTitle>
                </div>
                {historyOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Нет платежей</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {transactions.map((tx) => (
                    <PaymentHistoryItem key={tx.id} transaction={tx} />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
