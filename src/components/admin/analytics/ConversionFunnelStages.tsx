/**
 * Conversion Funnel Stages
 *
 * Visualizes deeplink conversion funnel:
 * Visit → Engaged → Registered → First Action → Generation → Completed → Payment → Retained
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MousePointerClick, UserPlus, Play, Sparkles, CheckCircle, CreditCard, Heart } from "@/lib/icons";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}

interface ConversionFunnelStagesProps {
  data: {
    visit: number;
    engaged: number;
    registered: number;
    first_action: number;
    generation: number;
    completed: number;
    payment: number;
    retained: number;
  };
  isLoading?: boolean;
}

const STAGE_CONFIG: Omit<FunnelStage, "count">[] = [
  { stage: "visit", label: "Визиты", icon: Eye, color: "bg-blue-500" },
  { stage: "engaged", label: "Взаимодействие", icon: MousePointerClick, color: "bg-indigo-500" },
  { stage: "registered", label: "Регистрация", icon: UserPlus, color: "bg-purple-500" },
  { stage: "first_action", label: "Первое действие", icon: Play, color: "bg-pink-500" },
  { stage: "generation", label: "Генерация", icon: Sparkles, color: "bg-orange-500" },
  { stage: "completed", label: "Завершено", icon: CheckCircle, color: "bg-green-500" },
  { stage: "payment", label: "Оплата", icon: CreditCard, color: "bg-amber-500" },
  { stage: "retained", label: "Удержание", icon: Heart, color: "bg-red-500" },
];

export function ConversionFunnelStages({ data, isLoading }: ConversionFunnelStagesProps) {
  const stages = useMemo(() => {
    return STAGE_CONFIG.map((config) => ({
      ...config,
      count: data[config.stage as keyof typeof data] || 0,
    }));
  }, [data]);

  // Calculate max for width scaling
  const maxCount = useMemo(() => {
    return Math.max(1, ...stages.map((s) => s.count));
  }, [stages]);

  // Calculate conversion rates between stages
  const conversionRates = useMemo(() => {
    const rates: Array<{ from: string; to: string; rate: number }> = [];

    for (let i = 0; i < stages.length - 1; i++) {
      const current = stages[i];
      const next = stages[i + 1];
      const rate = current.count > 0 ? (next.count / current.count) * 100 : 0;
      rates.push({
        from: current.stage,
        to: next.stage,
        rate: Math.round(rate * 10) / 10,
      });
    }

    return rates;
  }, [stages]);

  // Overall conversion (visit to payment)
  const overallConversion = useMemo(() => {
    const visits = data.visit || 0;
    const payments = data.payment || 0;
    return visits > 0 ? ((payments / visits) * 100).toFixed(2) : "0";
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Воронка конверсии</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Загрузка...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base">Воронка конверсии диплинков</CardTitle>
            <CardDescription className="text-xs sm:text-sm">От визита до оплаты</CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] sm:text-sm w-fit">
            Общая конв.: {overallConversion}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="space-y-2 sm:space-y-3">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const widthPercent = Math.max(10, (stage.count / maxCount) * 100);
            const conversionRate = index > 0 ? conversionRates[index - 1]?.rate : null;

            return (
              <div key={stage.stage} className="space-y-0.5 sm:space-y-1">
                {/* Conversion rate indicator */}
                {conversionRate !== null && (
                  <div className="flex justify-center">
                    <div
                      className={cn(
                        "text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full",
                        conversionRate >= 50
                          ? "bg-green-500/10 text-green-500"
                          : conversionRate >= 25
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-red-500/10 text-red-500",
                      )}
                    >
                      ↓ {conversionRate}%
                    </div>
                  </div>
                )}

                {/* Stage bar */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={cn("flex items-center justify-between p-2 sm:p-3 rounded-lg mx-auto", stage.color)}
                  style={{ minWidth: "140px" }}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 text-white">
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-[10px] sm:text-sm font-medium">{stage.label}</span>
                  </div>
                  <span className="text-white font-bold text-xs sm:text-base">{stage.count.toLocaleString()}</span>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-primary">{conversionRates[1]?.rate || 0}%</div>
            <div className="text-[9px] sm:text-xs text-muted-foreground">Engaged → Reg</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-primary">{conversionRates[4]?.rate || 0}%</div>
            <div className="text-[9px] sm:text-xs text-muted-foreground">Gen → Complete</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-primary">{conversionRates[5]?.rate || 0}%</div>
            <div className="text-[9px] sm:text-xs text-muted-foreground">Complete → Pay</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
