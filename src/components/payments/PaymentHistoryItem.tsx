/**
 * PaymentHistoryItem Component
 * Individual transaction row with status badge and animations
 * Feature: professional-payment-flow
 */

import { motion } from "@/lib/motion";
import { Calendar, CheckCircle2, Clock, XCircle, RefreshCw, Ban, Sparkles, Zap, Crown } from "@/lib/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { glass } from "@/lib/glass";
import type { PaymentTransaction } from "@/services/starsPaymentService";

type TransactionStatus = "completed" | "pending" | "processing" | "failed" | "cancelled" | "refunded";

// Status configuration with Russian labels
const STATUS_CONFIG: Record<
  TransactionStatus,
  {
    icon: React.ReactNode;
    label: string;
    labelRu: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Completed",
    labelRu: "Успешно",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  pending: {
    icon: <Clock className="h-4 w-4" />,
    label: "Pending",
    labelRu: "Ожидание",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  processing: {
    icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    label: "Processing",
    labelRu: "Обработка",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  failed: {
    icon: <XCircle className="h-4 w-4" />,
    label: "Failed",
    labelRu: "Ошибка",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  cancelled: {
    icon: <Ban className="h-4 w-4" />,
    label: "Cancelled",
    labelRu: "Отменено",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-muted",
  },
  refunded: {
    icon: <RefreshCw className="h-4 w-4" />,
    label: "Refunded",
    labelRu: "Возврат",
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
};

// Product type icons
function getProductIcon(productCode: string) {
  if (productCode.includes("sub") || productCode.includes("premium") || productCode.includes("pro")) {
    return <Crown className="h-5 w-5" />;
  }
  return <Zap className="h-5 w-5" />;
}

// Format product name from code
function formatProductName(code: string): string {
  // Convert snake_case or kebab-case to Title Case
  return code.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

interface PaymentHistoryItemProps {
  transaction: PaymentTransaction;
  language?: "en" | "ru";
  index?: number;
}

export function PaymentHistoryItem({ transaction, language = "ru", index = 0 }: PaymentHistoryItemProps) {
  const status = STATUS_CONFIG[transaction.status as TransactionStatus] || STATUS_CONFIG.pending;
  const date = new Date(transaction.created_at);
  const isCompleted = transaction.status === "completed";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card
        className={cn(
          "mb-3 transition-all duration-300 hover:shadow-md",
          glass.card,
          isCompleted && "hover:border-green-500/30",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Product Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Product Icon */}
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                  isCompleted
                    ? "bg-gradient-to-br from-primary/20 to-accent/20 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {getProductIcon(transaction.product_code)}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{formatProductName(transaction.product_code)}</h4>

                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  <time dateTime={transaction.created_at}>
                    {date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {" · "}
                    {date.toLocaleTimeString(language === "ru" ? "ru-RU" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>

                {/* Credits granted info */}
                {transaction.credits_granted && isCompleted && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary"
                  >
                    <Sparkles className="h-3 w-3" />+{transaction.credits_granted.toLocaleString()}{" "}
                    {language === "ru" ? "кредитов" : "credits"}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Right: Amount & Status */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 font-bold text-lg">
                <span>{transaction.stars_amount}</span>
                <span className="text-yellow-500">⭐</span>
              </div>

              <Badge
                variant="outline"
                className={cn("text-xs font-medium px-2.5 py-0.5", status.bgColor, status.color, status.borderColor)}
              >
                <span className="mr-1.5" aria-hidden="true">
                  {status.icon}
                </span>
                {language === "ru" ? status.labelRu : status.label}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
