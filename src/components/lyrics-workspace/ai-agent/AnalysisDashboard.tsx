/**
 * AnalysisDashboard - Unified analysis visualization
 */

import { motion } from '@/lib/motion';
import { 
  BarChart3, Target, Music2, Tag, AlertTriangle, 
  CheckCircle, XCircle, Lightbulb, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AnalysisIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  fix?: string;
}

interface AnalysisDashboardProps {
  qualityScore?: number;
  v5Score?: number;
  syllableStats?: {
    avg: number;
    min: number;
    max: number;
    distribution: number[];
  };
  rhymeScheme?: string;
  structureInfo?: {
    sections: string[];
    hasIntro: boolean;
    hasOutro: boolean;
    hasEnd: boolean;
  };
  tagCounts?: {
    structural: number;
    vocal: number;
    dynamic: number;
    instrument: number;
  };
  issues?: AnalysisIssue[];
  recommendations?: string[];
  onApplyFix?: (fix: string) => void;
  onClose?: () => void;
}

export function AnalysisDashboard({
  qualityScore = 0,
  v5Score,
  syllableStats,
  rhymeScheme,
  structureInfo,
  tagCounts,
  issues = [],
  recommendations = [],
  onApplyFix,
  onClose,
}: AnalysisDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20';
    if (score >= 60) return 'bg-amber-500/20';
    return 'bg-red-500/20';
  };

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 p-3 bg-muted/30 rounded-xl border border-border/50"
    >
      {/* Header with scores */}
      <div className="flex items-center gap-4">
        {/* Quality Score Circle */}
        <div className={cn(
          "relative w-16 h-16 rounded-full flex items-center justify-center",
          getScoreBg(qualityScore)
        )}>
          <div className="text-center">
            <span className={cn("text-xl font-bold", getScoreColor(qualityScore))}>
              {qualityScore}
            </span>
            <span className="text-[10px] text-muted-foreground block">качество</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-1.5">
          {v5Score !== undefined && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">V5 совместимость</span>
              <span className={getScoreColor(v5Score)}>{v5Score}%</span>
            </div>
          )}
          {syllableStats && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Слоги (avg)</span>
              <span className={cn(
                syllableStats.avg >= 6 && syllableStats.avg <= 12 
                  ? "text-emerald-400" 
                  : "text-amber-400"
              )}>
                {syllableStats.avg.toFixed(1)}
              </span>
            </div>
          )}
          {rhymeScheme && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Рифмовка</span>
              <span className="font-mono text-foreground">{rhymeScheme}</span>
            </div>
          )}
        </div>
      </div>

      {/* Syllable heatmap */}
      {syllableStats?.distribution && syllableStats.distribution.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Слоги по строкам</span>
          <div className="flex gap-0.5 h-4 items-end">
            {syllableStats.distribution.slice(0, 30).map((count, i) => {
              const height = Math.min((count / 16) * 100, 100);
              const color = count <= 12 ? 'bg-emerald-500/60' : count <= 16 ? 'bg-amber-500/60' : 'bg-red-500/60';
              return (
                <div
                  key={i}
                  className={cn("w-1.5 rounded-t", color)}
                  style={{ height: `${Math.max(height, 10)}%` }}
                  title={`Строка ${i + 1}: ${count} слогов`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Tag counts */}
      {tagCounts && (
        <div className="flex flex-wrap gap-1.5">
          {tagCounts.structural > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Music2 className="w-3 h-3" />
              Структура: {tagCounts.structural}
            </Badge>
          )}
          {tagCounts.vocal > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              Вокал: {tagCounts.vocal}
            </Badge>
          )}
          {tagCounts.dynamic > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              Динамика: {tagCounts.dynamic}
            </Badge>
          )}
          {tagCounts.instrument > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              Инстр: {tagCounts.instrument}
            </Badge>
          )}
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-muted-foreground">
              Проблемы: {errorCount > 0 && <span className="text-red-400">{errorCount} ошибок</span>}
              {errorCount > 0 && warningCount > 0 && ', '}
              {warningCount > 0 && <span className="text-amber-400">{warningCount} предупреждений</span>}
            </span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {issues.slice(0, 5).map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-xs p-1.5 rounded bg-muted/50">
                {issue.type === 'error' && <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />}
                {issue.type === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />}
                {issue.type === 'info' && <CheckCircle className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <span className="text-foreground/80">{issue.message}</span>
                  {issue.line && <span className="text-muted-foreground ml-1">(строка {issue.line})</span>}
                </div>
                {issue.fix && onApplyFix && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] px-1.5"
                    onClick={() => onApplyFix(issue.fix!)}
                  >
                    Исправить
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            <span className="text-muted-foreground">Рекомендации</span>
          </div>
          <div className="space-y-1">
            {recommendations.slice(0, 3).map((rec, i) => (
              <div key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                <TrendingUp className="w-3 h-3 text-primary/60 mt-0.5 shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
