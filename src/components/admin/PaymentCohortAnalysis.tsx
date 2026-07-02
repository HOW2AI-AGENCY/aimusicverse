/**
 * Payment Cohort Analysis Component
 * Feature: Payment Analytics Dashboard
 *
 * Analyzes payment behavior by user cohorts (registration date)
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users, Calendar, Percent } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { usePaymentCohortAnalytics, type CohortData } from "@/hooks/admin/usePaymentCohortAnalytics";

const COHORT_PERIODS = [
  { label: "6 мес", months: 6 },
  { label: "12 мес", months: 12 },
] as const;

function getConversionColor(rate: number): string {
  if (rate >= 15) return "bg-green-500/80";
  if (rate >= 10) return "bg-green-500/50";
  if (rate >= 5) return "bg-yellow-500/50";
  if (rate >= 2) return "bg-orange-500/50";
  return "bg-red-500/30";
}

function getRetentionColor(rate: number): string {
  if (rate >= 70) return "text-green-500";
  if (rate >= 50) return "text-yellow-500";
  if (rate >= 30) return "text-orange-500";
  return "text-red-500";
}

export function PaymentCohortAnalysis() {
  const [selectedPeriod, setSelectedPeriod] = useState(6);
  const { data: cohorts, isLoading, error } = usePaymentCohortAnalytics(selectedPeriod);

  const summary = useMemo(() => {
    if (!cohorts?.length) return null;

    const avgConversion = cohorts.reduce((sum, c) => sum + c.conversion_rate, 0) / cohorts.length;
    const totalRevenue = cohorts.reduce((sum, c) => sum + c.total_revenue_rub, 0);
    const avgDaysToPayment = cohorts.reduce((sum, c) => sum + c.first_payment_avg_days, 0) / cohorts.length;
    const bestCohort = cohorts.reduce((best, c) => (c.conversion_rate > best.conversion_rate ? c : best), cohorts[0]);

    return {
      avgConversion: avgConversion.toFixed(1),
      totalRevenue,
      avgDaysToPayment: avgDaysToPayment.toFixed(1),
      bestCohort: bestCohort.cohort_month,
      bestRate: bestCohort.conversion_rate,
    };
  }, [cohorts]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
    return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ₽`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ₽`;
    return `${value} ₽`;
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Users className="h-4 w-4" />
            Когортный анализ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">Ошибка загрузки данных</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 px-3 pt-3 sm:px-6 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Когортный анализ платежей
            </CardTitle>
            <CardDescription className="text-xs mt-1 hidden sm:block">
              Конверсия в платящих по месяцу регистрации
            </CardDescription>
          </div>

          <div className="flex gap-1">
            {COHORT_PERIODS.map((period) => (
              <Button
                key={period.months}
                variant={selectedPeriod === period.months ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setSelectedPeriod(period.months)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6 space-y-4">
        {/* Summary */}
        {summary && !isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-muted/30 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-primary">{summary.avgConversion}%</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Ср. конверсия</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-lg sm:text-xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Общий доход</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-lg sm:text-xl font-bold">{summary.avgDaysToPayment}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Дней до оплаты</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-lg sm:text-xl font-bold text-green-500">{summary.bestRate}%</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {formatMonth(summary.bestCohort)}
              </div>
            </div>
          </div>
        )}

        {/* Cohort Table */}
        <ScrollArea className="w-full">
          <div className="min-w-[500px]">
            {/* Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-[10px] sm:text-xs font-medium text-muted-foreground border-b pb-2 mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Когорта
              </div>
              <div className="text-center">Юзеры</div>
              <div className="text-center">Платящие</div>
              <div className="text-center">
                <Percent className="h-3 w-3 inline" />
              </div>
              <div className="text-center">30д</div>
              <div className="text-center">60д</div>
              <div className="text-center">90д</div>
            </div>

            {/* Rows */}
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-7 gap-1 sm:gap-2 py-2 border-b border-border/30">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <Skeleton key={j} className="h-6 w-full" />
                    ))}
                  </div>
                ))
              : cohorts?.map((cohort: CohortData, idx: number) => (
                  <div
                    key={cohort.cohort_month}
                    className={cn(
                      "grid grid-cols-7 gap-1 sm:gap-2 py-2 items-center",
                      idx < cohorts.length - 1 && "border-b border-border/30",
                    )}
                  >
                    <div className="font-medium text-xs sm:text-sm">{formatMonth(cohort.cohort_month)}</div>
                    <div className="text-center text-xs sm:text-sm">{cohort.total_users}</div>
                    <div className="text-center text-xs sm:text-sm">{cohort.converted_users}</div>
                    <div className="flex justify-center">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] sm:text-xs px-1.5 py-0 h-5",
                          getConversionColor(cohort.conversion_rate),
                        )}
                      >
                        {cohort.conversion_rate}%
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        "text-center text-xs sm:text-sm font-medium",
                        getRetentionColor(cohort.retention_30d),
                      )}
                    >
                      {cohort.retention_30d}%
                    </div>
                    <div
                      className={cn(
                        "text-center text-xs sm:text-sm font-medium",
                        getRetentionColor(cohort.retention_60d),
                      )}
                    >
                      {cohort.retention_60d}%
                    </div>
                    <div
                      className={cn(
                        "text-center text-xs sm:text-sm font-medium",
                        getRetentionColor(cohort.retention_90d),
                      )}
                    >
                      {cohort.retention_90d}%
                    </div>
                  </div>
                ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Heatmap Legend */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
          <span>Конверсия:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/30" />
            <span>&lt;2%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/50" />
            <span>2-5%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500/50" />
            <span>5-10%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/50" />
            <span>10-15%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/80" />
            <span>&gt;15%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentCohortAnalysis;
