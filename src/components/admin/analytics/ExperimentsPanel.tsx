/**
 * Experiments Panel
 * Admin panel for managing A/B experiments
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FlaskConical,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EXPERIMENTS, type Experiment, type ExperimentVariant } from "@/lib/ab-testing";

// Simulated experiment results (in production, fetch from analytics)
const MOCK_RESULTS: Record<string, ExperimentResult> = {
  onboarding_v2: {
    participants: { control: 1234, treatment: 1256 },
    conversions: { control: 456, treatment: 589 },
    significance: 0.95,
    winner: "treatment",
    uplift: 12.4,
  },
  generation_ui: {
    participants: { a: 890, b: 876, c: 901 },
    conversions: { a: 234, b: 289, c: 312 },
    significance: 0.87,
    winner: "c",
    uplift: 18.2,
  },
  player_expand_cta: {
    participants: { control: 2100, visible: 2150 },
    conversions: { control: 420, visible: 645 },
    significance: 0.99,
    winner: "visible",
    uplift: 50.0,
  },
};

interface ExperimentResult {
  participants: Record<string, number>;
  conversions: Record<string, number>;
  significance: number;
  winner: string | null;
  uplift: number;
}

export function ExperimentsPanel() {
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);

  // Convert readonly EXPERIMENTS to mutable array with proper typing
  const experiments = useMemo(
    () =>
      Object.values(EXPERIMENTS).map((exp) => ({
        ...exp,
        variants: [...exp.variants] as ExperimentVariant[],
        metrics: [...exp.metrics] as string[],
        status: exp.status as "draft" | "running" | "paused" | "completed",
      })),
    [],
  );

  const stats = useMemo(
    () => ({
      total: experiments.length,
      running: experiments.filter((e) => e.status === "running").length,
      draft: experiments.filter((e) => e.status === "draft").length,
      completed: experiments.filter((e) => e.status === "completed").length,
    }),
    [experiments],
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <StatCard icon={FlaskConical} label="Всего экспериментов" value={stats.total} iconColor="text-blue-500" />
        <StatCard icon={Play} label="Активных" value={stats.running} iconColor="text-green-500" />
        <StatCard icon={Clock} label="Черновиков" value={stats.draft} iconColor="text-yellow-500" />
        <StatCard icon={CheckCircle} label="Завершённых" value={stats.completed} iconColor="text-purple-500" />
      </div>

      {/* Experiments List */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <FlaskConical className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">A/B Эксперименты</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm hidden xs:block">
                Управление и мониторинг экспериментов
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 shrink-0 text-xs sm:text-sm">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Обновить</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-3 sm:space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Все
              </TabsTrigger>
              <TabsTrigger value="running" className="text-xs sm:text-sm">
                Активные
              </TabsTrigger>
              <TabsTrigger value="draft" className="text-xs sm:text-sm">
                Черновики
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">
                Завершённые
              </TabsTrigger>
            </TabsList>

            {["all", "running", "draft", "completed"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {experiments
                  .filter((exp) => tab === "all" || exp.status === tab)
                  .map((experiment) => (
                    <ExperimentCard
                      key={experiment.id}
                      experiment={{
                        ...experiment,
                        status: experiment.status as Experiment["status"],
                      }}
                      result={MOCK_RESULTS[experiment.id]}
                      isSelected={selectedExperiment === experiment.id}
                      onSelect={() =>
                        setSelectedExperiment(selectedExperiment === experiment.id ? null : experiment.id)
                      }
                    />
                  ))}
                {experiments.filter((exp) => tab === "all" || exp.status === tab).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Нет экспериментов в этой категории</div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface ExperimentCardProps {
  experiment: Experiment;
  result?: ExperimentResult;
  isSelected: boolean;
  onSelect: () => void;
}

function ExperimentCard({ experiment, result, isSelected, onSelect }: ExperimentCardProps) {
  const statusConfig = {
    draft: { label: "Черновик", color: "bg-yellow-500/10 text-yellow-500", icon: Clock },
    running: { label: "Активен", color: "bg-green-500/10 text-green-500", icon: Play },
    paused: { label: "Пауза", color: "bg-orange-500/10 text-orange-500", icon: Pause },
    completed: { label: "Завершён", color: "bg-purple-500/10 text-purple-500", icon: CheckCircle },
  };

  const status = statusConfig[experiment.status];
  const StatusIcon = status.icon;

  const totalParticipants = result ? Object.values(result.participants).reduce((a, b) => a + b, 0) : 0;

  return (
    <div
      className={cn(
        "border rounded-lg p-4 transition-all cursor-pointer",
        isSelected ? "border-primary bg-primary/5" : "hover:border-primary/50",
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{experiment.name}</h3>
            <Badge className={cn("text-xs", status.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{experiment.description}</p>
        </div>

        {result?.winner && (
          <div className="text-right">
            <div className="text-sm font-medium text-green-500">+{result.uplift.toFixed(1)}% подъём</div>
            <div className="text-xs text-muted-foreground">Победитель: {result.winner}</div>
          </div>
        )}
      </div>

      {/* Variants */}
      <div className="space-y-2 mb-3">
        {experiment.variants.map((variant) => {
          const participants = result?.participants[variant.id] || 0;
          const conversions = result?.conversions[variant.id] || 0;
          const conversionRate = participants > 0 ? (conversions / participants) * 100 : 0;
          const isWinner = result?.winner === variant.id;

          return (
            <div key={variant.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium", isWinner && "text-green-500")}>{variant.name}</span>
                  {isWinner && (
                    <Badge variant="outline" className="text-xs text-green-500 border-green-500">
                      Победитель
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground">{variant.weight}% трафика</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={conversionRate} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-16 text-right">{conversionRate.toFixed(1)}% CR</span>
              </div>
              {result && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{participants.toLocaleString()} участников</span>
                  <span>{conversions.toLocaleString()} конверсий</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Details */}
      {isSelected && (
        <div className="border-t pt-3 mt-3 space-y-3">
          {/* Metrics */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Отслеживаемые метрики</div>
            <div className="flex flex-wrap gap-1">
              {experiment.metrics.map((metric) => (
                <Badge key={metric} variant="secondary" className="text-xs">
                  {metric}
                </Badge>
              ))}
            </div>
          </div>

          {/* Significance */}
          {result && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Статистическая значимость</span>
              <Badge
                className={cn(
                  result.significance >= 0.95
                    ? "bg-green-500"
                    : result.significance >= 0.9
                      ? "bg-yellow-500"
                      : "bg-red-500",
                )}
              >
                {(result.significance * 100).toFixed(0)}%
              </Badge>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Активен</span>
              <Switch checked={experiment.status === "running"} onCheckedChange={() => {}} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <BarChart3 className="h-3 w-3" />
                Детали
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Settings className="h-3 w-3" />
                Настроить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      {!isSelected && result && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {totalParticipants.toLocaleString()} участников
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {(result.significance * 100).toFixed(0)}% значимость
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  iconColor: string;
}

function StatCard({ icon: Icon, label, value, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-2.5 sm:p-4">
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{value}</p>
          </div>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}
