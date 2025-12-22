/**
 * FullAnalysisResultCard - Display comprehensive lyrics analysis with actionable quick fixes
 */

import { motion } from '@/lib/motion';
import { 
  BarChart3, 
  FileText, 
  Music2, 
  Mic2, 
  LayoutGrid,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
  RefreshCw,
  Wand2,
  Languages,
  Target,
  Sparkles,
  Check,
  CheckCheck,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FullAnalysisData, QuickAction } from '../types';
import { useState } from 'react';

interface FullAnalysisResultCardProps {
  analysis: FullAnalysisData;
  onQuickAction?: (action: string) => void;
  onApplyRecommendations?: (recommendations: string[]) => void;
  className?: string;
}

const SECTION_CONFIG = {
  meaning: { icon: FileText, label: 'Смысл', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  rhythm: { icon: Music2, label: 'Ритм', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  rhymes: { icon: Mic2, label: 'Рифмы', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  structure: { icon: LayoutGrid, label: 'Структура', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

const PRIORITY_CONFIG = {
  high: { color: 'bg-red-500', text: 'text-red-400', label: 'Важно', icon: AlertTriangle },
  medium: { color: 'bg-amber-500', text: 'text-amber-400', label: 'Средне', icon: Target },
  low: { color: 'bg-blue-500', text: 'text-blue-400', label: 'Мелочь', icon: Sparkles },
};

const QUICK_ACTION_ICONS: Record<string, any> = {
  'translate': Languages,
  'rhythm': Music2,
  'rhyme': Mic2,
  'structure': LayoutGrid,
  'fix': Wand2,
  'improve': RefreshCw,
};

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreGradient(score: number) {
  if (score >= 80) return 'from-green-500/20 to-green-500/5';
  if (score >= 60) return 'from-amber-500/20 to-amber-500/5';
  return 'from-red-500/20 to-red-500/5';
}

function getScoreLabel(score: number) {
  if (score >= 90) return 'Отлично';
  if (score >= 80) return 'Хорошо';
  if (score >= 60) return 'Средне';
  return 'Требует работы';
}

function getQuickActionIcon(label: string) {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('translat') || lowerLabel.includes('english') || lowerLabel.includes('перевод')) return Languages;
  if (lowerLabel.includes('rhythm') || lowerLabel.includes('ритм')) return Music2;
  if (lowerLabel.includes('rhyme') || lowerLabel.includes('рифм')) return Mic2;
  if (lowerLabel.includes('structure') || lowerLabel.includes('структур')) return LayoutGrid;
  if (lowerLabel.includes('fix') || lowerLabel.includes('исправ')) return Wand2;
  return RefreshCw;
}

export function FullAnalysisResultCard({ 
  analysis, 
  onQuickAction,
  onApplyRecommendations,
  className 
}: FullAnalysisResultCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<number>>(new Set());

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const toggleRecommendation = (index: number) => {
    setSelectedRecommendations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const selectAllRecommendations = () => {
    const allIndices = new Set(recommendations.map((_, i) => i));
    setSelectedRecommendations(allIndices);
  };

  const handleApplySelected = () => {
    if (onApplyRecommendations && selectedRecommendations.size > 0) {
      const selectedTexts = Array.from(selectedRecommendations).map(i => recommendations[i].text);
      onApplyRecommendations(selectedTexts);
    }
  };

  const handleApplyAll = () => {
    if (onQuickAction && recommendations.length > 0) {
      const allRecsText = recommendations.map(r => `- ${r.text}`).join('\n');
      onQuickAction(`Примени все рекомендации:\n${allRecsText}`);
    }
  };

  const hasIssues = 
    (analysis.meaning?.issues?.length || 0) + 
    (analysis.rhythm?.issues?.length || 0) + 
    (analysis.rhymes?.weakRhymes?.length || 0) + 
    (analysis.structure?.issues?.length || 0) > 0;

  const quickActions = analysis.quickActions || [];
  const recommendations = analysis.recommendations || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mt-3 rounded-xl border border-purple-500/30 bg-purple-500/5 overflow-hidden", className)}
    >
      {/* Overall Score Header */}
      <div className={cn("p-4 border-b border-border/50 bg-gradient-to-r", getScoreGradient(analysis.overallScore))}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span className="font-semibold">Полный анализ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-3xl font-bold", getScoreColor(analysis.overallScore))}>
              {analysis.overallScore}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
        <Progress value={analysis.overallScore} className="h-2" />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">{getScoreLabel(analysis.overallScore)}</p>
          {hasIssues && (
            <Badge variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Есть замечания
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions - Prominent at top */}
      {quickActions.length > 0 && onQuickAction && (
        <div className="p-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold">Быстрые исправления</span>
          </div>
          <div className="grid gap-2">
            {quickActions.map((qa, i) => {
              const Icon = getQuickActionIcon(qa.label);
              return (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
                  onClick={() => onQuickAction(qa.action)}
                >
                  <Icon className="w-4 h-4 mr-2 text-primary shrink-0" />
                  <span className="text-xs">{qa.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Section Scores Summary */}
      <div className="p-3 border-b border-border/30 grid grid-cols-4 gap-2">
        {Object.entries(SECTION_CONFIG).map(([key, config]) => {
          const sectionData = analysis[key as keyof typeof analysis] as any;
          const score = sectionData?.score || 0;
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => toggleSection(key)}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-all",
                expandedSection === key ? config.bg : "hover:bg-muted/30",
                expandedSection === key && config.border,
                expandedSection === key && "border"
              )}
            >
              <Icon className={cn("w-4 h-4 mb-1", config.color)} />
              <span className={cn("text-lg font-bold", getScoreColor(score))}>{score}</span>
              <span className="text-[10px] text-muted-foreground">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Section Details */}
      {expandedSection && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-b border-border/30"
        >
          {expandedSection === 'meaning' && (
            <div className="p-3 space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">Тема: </span>
                <span className="text-sm">{analysis.meaning.theme}</span>
              </div>
              {analysis.meaning.emotions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {analysis.meaning.emotions.map((e, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{e}</Badge>
                  ))}
                </div>
              )}
              {analysis.meaning.issues.length > 0 && (
                <div className="mt-2 space-y-1">
                  {analysis.meaning.issues.map((issue, i) => (
                    <p key={i} className="text-xs text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {issue}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {expandedSection === 'rhythm' && (
            <div className="p-3 space-y-2">
              <p className="text-sm font-mono bg-muted/30 p-2 rounded">{analysis.rhythm.pattern}</p>
              {analysis.rhythm.issues.length > 0 && (
                <div className="space-y-1">
                  {analysis.rhythm.issues.map((issue, i) => (
                    <p key={i} className="text-xs text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {issue}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {expandedSection === 'rhymes' && (
            <div className="p-3 space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">Схема: </span>
                <span className="text-sm font-mono">{analysis.rhymes.scheme}</span>
              </div>
              {analysis.rhymes.weakRhymes.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Слабые рифмы: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.rhymes.weakRhymes.map((rhyme, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                        {rhyme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {expandedSection === 'structure' && (
            <div className="p-3 space-y-2">
              <div className="flex flex-wrap gap-1">
                {analysis.structure.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
              {analysis.structure.issues.length > 0 && (
                <div className="space-y-1">
                  {analysis.structure.issues.map((issue, i) => (
                    <p key={i} className="text-xs text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {issue}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="p-3 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">Рекомендации</span>
            <Badge variant="secondary" className="text-[10px]">
              {selectedRecommendations.size > 0 ? `${selectedRecommendations.size}/` : ''}{recommendations.length}
            </Badge>
            {onQuickAction && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 text-[10px] px-2"
                onClick={selectAllRecommendations}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Выбрать все
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 5).map((rec, i) => {
              const priorityConfig = PRIORITY_CONFIG[rec.priority];
              const isSelected = selectedRecommendations.has(i);
              return (
                <div 
                  key={i} 
                  onClick={() => onQuickAction && toggleRecommendation(i)}
                  className={cn(
                    "flex items-start gap-2 text-xs p-2 rounded-lg transition-all",
                    rec.priority === 'high' && 'bg-red-500/10 border border-red-500/20',
                    rec.priority === 'medium' && 'bg-amber-500/10 border border-amber-500/20',
                    rec.priority === 'low' && 'bg-blue-500/10 border border-blue-500/20',
                    onQuickAction && 'cursor-pointer hover:opacity-80',
                    isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                  )}
                >
                  {onQuickAction && (
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5",
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  )}
                  <Badge 
                    className={cn("text-[9px] shrink-0", priorityConfig?.color)}
                  >
                    {priorityConfig?.label || rec.priority}
                  </Badge>
                  <span className="flex-1">{rec.text}</span>
                  {onQuickAction && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAction(rec.text);
                      }}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Apply buttons */}
          {onQuickAction && selectedRecommendations.size > 0 && (
            <div className="flex gap-2 mt-3 pt-2 border-t border-border/30">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs gap-1"
                onClick={handleApplySelected}
              >
                <Wand2 className="w-3 h-3" />
                Применить выбранные ({selectedRecommendations.size})
              </Button>
            </div>
          )}
          
          {onQuickAction && selectedRecommendations.size === 0 && recommendations.length > 0 && (
            <div className="mt-3 pt-2 border-t border-border/30">
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs gap-1"
                onClick={handleApplyAll}
              >
                <Wand2 className="w-3 h-3" />
                Применить все рекомендации
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
