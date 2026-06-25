/**
 * RhythmResultCard - Display rhythm analysis results with visual representation
 */

import { motion } from "@/lib/motion";
import { Music2, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AnalysisData } from "../types";

interface RhythmResultCardProps {
  analysis: AnalysisData;
  onOptimize?: () => void;
}

export function RhythmResultCard({ analysis, onOptimize }: RhythmResultCardProps) {
  const rhythm = analysis.rhythm;

  if (!rhythm) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 p-3 bg-background/80 rounded-xl border border-border/50 space-y-3"
    >
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Music2 className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium">Анализ ритма</h4>
            {rhythm.syllablePattern && (
              <p className="text-[10px] text-muted-foreground font-mono">Паттерн: {rhythm.syllablePattern}</p>
            )}
          </div>
        </div>

        <div className={cn("text-2xl font-bold", getScoreColor(rhythm.score))}>{rhythm.score}%</div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rhythm.score}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn("h-full rounded-full", getProgressColor(rhythm.score))}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {rhythm.score >= 80
            ? "Отличный ритм! Текст хорошо ложится на музыку."
            : rhythm.score >= 60
              ? "Неплохо, но есть места для улучшения."
              : "Рекомендуется доработать ритмическую структуру."}
        </p>
      </div>

      {/* Issues */}
      {rhythm.issues && rhythm.issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Найденные проблемы:</p>
          <div className="space-y-1.5">
            {rhythm.issues.map((issue, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-2 p-2 rounded-lg text-xs",
                  issue.type === "error" && "bg-red-500/10 text-red-400",
                  issue.type === "warning" && "bg-amber-500/10 text-amber-400",
                  issue.type === "suggestion" && "bg-blue-500/10 text-blue-400",
                )}
              >
                {issue.type === "error" || issue.type === "warning" ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <div>
                  <p>{issue.message}</p>
                  {issue.line !== undefined && <p className="text-[10px] opacity-70 mt-0.5">Строка {issue.line + 1}</p>}
                  {issue.fix && <p className="text-[10px] mt-1 opacity-80">💡 {issue.fix}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Issues */}
      {(!rhythm.issues || rhythm.issues.length === 0) && rhythm.score >= 80 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-400 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Отличная ритмическая структура!</span>
        </div>
      )}

      {/* Optimize Button */}
      {onOptimize && rhythm.score < 80 && (
        <Button size="sm" onClick={onOptimize} className="w-full gap-2 text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          Оптимизировать ритм с AI
        </Button>
      )}
    </motion.div>
  );
}
