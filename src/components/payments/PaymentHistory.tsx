/**
 * PaymentHistory Component
 * Displays transaction history with infinite scroll and professional styling
 * Feature: professional-payment-flow
 */

import { Virtuoso } from "react-virtuoso";
import { motion } from "@/lib/motion";
import { Sparkles, Receipt, RefreshCw } from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { glass } from "@/lib/glass";
import { usePaymentHistory } from "@/hooks/usePaymentHistory";
import { PaymentHistoryItem } from "./PaymentHistoryItem";

interface PaymentHistoryProps {
  userId: string;
  height?: number;
  language?: "en" | "ru";
  showHeader?: boolean;
}

function LoadingSkeleton() {
  return (
    <Card className={cn("mb-3", glass.card)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="space-y-2 flex-shrink-0">
            <Skeleton className="h-5 w-16 ml-auto" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentHistory({ userId, height = 600, language = "ru", showHeader = true }: PaymentHistoryProps) {
  const { transactions, isLoading, hasMore, loadMore, isLoadingMore, refetch, isRefetching } = usePaymentHistory({
    userId,
    pageSize: 20,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        )}
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className={cn("overflow-hidden", glass.card)}>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
            </div>
            <h3 className="font-semibold mb-1">{language === "ru" ? "Нет транзакций" : "No transactions yet"}</h3>
            <p className="text-sm text-muted-foreground">
              {language === "ru"
                ? "Ваша история платежей появится здесь после первой покупки"
                : "Your payment history will appear here after your first purchase"}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div>
      {showHeader && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{language === "ru" ? "История платежей" : "Payment History"}</h3>
            <span className="text-sm text-muted-foreground">({transactions.length})</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isRefetching} className="h-8 w-8">
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </Button>
        </motion.div>
      )}

      <Virtuoso
        style={{ height }}
        data={transactions}
        endReached={() => {
          if (hasMore && !isLoadingMore) {
            loadMore();
          }
        }}
        itemContent={(index, transaction) => (
          <PaymentHistoryItem key={transaction.id} transaction={transaction} language={language} index={index} />
        )}
        components={{
          Footer: () =>
            isLoadingMore ? (
              <div className="py-4">
                <LoadingSkeleton />
              </div>
            ) : hasMore ? null : transactions.length > 5 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-4 text-center text-xs text-muted-foreground"
              >
                {language === "ru" ? "Вся история загружена" : "All history loaded"}
              </motion.p>
            ) : null,
        }}
      />
    </div>
  );
}
