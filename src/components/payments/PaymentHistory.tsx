/**
 * PaymentHistory Component
 * Displays transaction history with infinite scroll using react-virtuoso
 */

import { Virtuoso } from 'react-virtuoso';
import { Calendar, CheckCircle2, Clock, XCircle, RefreshCw, Ban, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
import type { StarsTransaction, StarsTransactionStatus } from '@/types/starsPayment';

interface PaymentHistoryProps {
  userId: string;
  height?: number;
  language?: 'en' | 'ru';
}

// Status configuration
const STATUS_CONFIG: Record<
  StarsTransactionStatus,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'Completed',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  pending: {
    icon: <Clock className="h-4 w-4" />,
    label: 'Pending',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  processing: {
    icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    label: 'Processing',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  failed: {
    icon: <XCircle className="h-4 w-4" />,
    label: 'Failed',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  cancelled: {
    icon: <Ban className="h-4 w-4" />,
    label: 'Cancelled',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  refunded: {
    icon: <RefreshCw className="h-4 w-4" />,
    label: 'Refunded',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
};

function TransactionRow({ transaction, language }: { transaction: StarsTransaction; language: 'en' | 'ru' }) {
  const status = STATUS_CONFIG[transaction.status];
  const productName = transaction.product?.name?.[language] || transaction.product?.name?.en || 'Unknown Product';
  const date = new Date(transaction.created_at);

  return (
    <Card className="mb-2 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Product Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">
              {productName}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              <time dateTime={transaction.created_at}>
                {date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
          </div>

          {/* Right: Amount & Status */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 font-semibold">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{transaction.amount_stars}</span>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                status.bgColor,
                status.color
              )}
            >
              <span className="mr-1" aria-hidden="true">{status.icon}</span>
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Error message if failed */}
        {transaction.status === 'failed' && transaction.error_message && (
          <p className="mt-2 text-xs text-destructive">
            {transaction.error_message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="mb-2">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PaymentHistory({ userId, height = 600, language = 'en' }: PaymentHistoryProps) {
  const { transactions, isLoading, hasMore, loadMore, isLoadingMore } = usePaymentHistory({
    userId,
    pageSize: 20,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-4 text-muted-foreground">
            {language === 'ru' ? 'Нет истории транзакций' : 'No payment history yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Virtuoso
      style={{ height }}
      data={transactions}
      endReached={() => {
        if (hasMore && !isLoadingMore) {
          loadMore();
        }
      }}
      itemContent={(index, transaction) => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          language={language}
        />
      )}
      components={{
        Footer: () =>
          isLoadingMore ? (
            <div className="py-4">
              <LoadingSkeleton />
            </div>
          ) : null,
      }}
    />
  );
}
