/**
 * DeepAnalysisResultCard - Enhanced analysis display with narrative, insights, and unique strength
 */

import { motion } from '@/lib/motion';
import { 
  Telescope, 
  FileText, 
  Music2, 
  Mic2, 
  LayoutGrid,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Globe,
  Quote,
  TrendingUp,
  Play,
  Target,
  Brain,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { QuickAction } from '../types';
import { ExpandedAnalysisData } from '@/lib/ai/aiResponseParser';
import { useState } from 'react';

interface DeepAnalysisResultCardProps {
  analysis: ExpandedAnalysisData;
  onQuickAction?: (action: string) => void;
  className?: string;
}

const SECTION_CONFIG = {
  meaning: { icon: FileText, label: 'Смысл', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  rhythm: { icon: Music2, label: 'Ритм', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  rhymes: { icon: Mic2, label: 'Рифмы', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  structure: { icon: LayoutGrid, label: 'Структура', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
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

export function DeepAnalysisResultCard({ 
  analysis, 
  onQuickAction,
  className 
}: DeepAnalysisResultCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showNarrative, setShowNarrative] = useState(true);
  const [showInsights, setShowInsights] = useState(true);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const hasNarrative = analysis.narrative && (
    analysis.narrative.start || 
    analysis.narrative.conflict || 
    analysis.narrative.climax || 
    analysis.narrative.resolution
  );

  const hasInsights = analysis.keyInsights && analysis.keyInsights.length > 0;
  const hasCultural = analysis.cultural && (
    analysis.cultural.influences?.length || 
    analysis.cultural.references?.length
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mt-3 rounded-xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-purple-500/5 overflow-hidden", className)}
    >
      {/* Header with Overall Score */}
      <div className={cn("p-4 border-b border-border/50 bg-gradient-to-r", getScoreGradient(analysis.overallScore))}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Telescope className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="font-semibold block">Глубокий анализ</span>
              <span className="text-xs text-muted-foreground">{getScoreLabel(analysis.overallScore)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={cn("text-4xl font-bold", getScoreColor(analysis.overallScore))}>
              {analysis.overallScore}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>
        <Progress value={analysis.overallScore} className="h-2" />
      </div>

      {/* Unique Strength - Highlight Box */}
      {analysis.uniqueStrength && (
        <div className="p-4 border-b border-border/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">Уникальная сила</span>
              <p className="text-sm mt-1">{analysis.uniqueStrength}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Insights */}
      {hasInsights && (
        <div className="border-b border-border/30">
          <button 
            onClick={() => setShowInsights(!showInsights)}
            className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium">Ключевые выводы</span>
              <Badge variant="secondary" className="text-[10px]">{analysis.keyInsights?.length}</Badge>
            </div>
            {showInsights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showInsights && (
            <div className="px-4 pb-4 space-y-2">
              {analysis.keyInsights?.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Narrative Arc */}
      {hasNarrative && (
        <div className="border-b border-border/30">
          <button 
            onClick={() => setShowNarrative(!showNarrative)}
            className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium">Нарративная арка</span>
            </div>
            {showNarrative ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showNarrative && (
            <div className="px-4 pb-4">
              <div className="relative pl-4 border-l-2 border-rose-500/30 space-y-3">
                {analysis.narrative?.start && (
                  <div className="relative">
                    <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-rose-500/50 border-2 border-background" />
                    <p className="text-xs"><span className="text-rose-400 font-medium">Начало:</span> {analysis.narrative.start}</p>
                  </div>
                )}
                {analysis.narrative?.conflict && (
                  <div className="relative">
                    <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-orange-500/50 border-2 border-background" />
                    <p className="text-xs"><span className="text-orange-400 font-medium">Конфликт:</span> {analysis.narrative.conflict}</p>
                  </div>
                )}
                {analysis.narrative?.climax && (
                  <div className="relative">
                    <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-amber-500/50 border-2 border-background" />
                    <p className="text-xs"><span className="text-amber-400 font-medium">Кульминация:</span> {analysis.narrative.climax}</p>
                  </div>
                )}
                {analysis.narrative?.resolution && (
                  <div className="relative">
                    <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-green-500/50 border-2 border-background" />
                    <p className="text-xs"><span className="text-green-400 font-medium">Разрешение:</span> {analysis.narrative.resolution}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {analysis.quickActions && analysis.quickActions.length > 0 && onQuickAction && (
        <div className="p-3 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-semibold">Быстрые действия</span>
          </div>
          <div className="grid gap-1.5">
            {analysis.quickActions.map((qa, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto py-2 px-3 border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                onClick={() => onQuickAction(qa.action)}
              >
                <span className="text-xs">{qa.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Section Scores Grid */}
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
            <div className="p-3 space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Тема: </span>
                <span className="text-sm font-medium">{analysis.meaning.theme}</span>
              </div>
              {analysis.meaning.emotions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {analysis.meaning.emotions.map((e, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{e}</Badge>
                  ))}
                </div>
              )}
              {/* Symbols/Metaphors from technical lyrics */}
              {analysis.technicalLyrics?.figurativeDevices && analysis.technicalLyrics.figurativeDevices.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Литературные приёмы:</span>
                  <div className="flex flex-wrap gap-1">
                    {analysis.technicalLyrics.figurativeDevices.map((d, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {analysis.meaning.issues.length > 0 && (
                <div className="space-y-1">
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

      {/* Cultural Context */}
      {hasCultural && (
        <div className="p-3 border-b border-border/30">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">Культурный контекст</span>
          </div>
          <div className="space-y-2 text-xs">
            {analysis.cultural?.era && (
              <div>
                <span className="text-muted-foreground">Эра: </span>
                <span>{analysis.cultural.era}</span>
              </div>
            )}
            {analysis.cultural?.influences && analysis.cultural.influences.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-muted-foreground shrink-0">Влияния: </span>
                {analysis.cultural.influences.map((inf, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{inf}</Badge>
                ))}
              </div>
            )}
            {analysis.cultural?.references && analysis.cultural.references.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-muted-foreground shrink-0">Отсылки: </span>
                {analysis.cultural.references.map((ref, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{ref}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="p-3 bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">Рекомендации</span>
            <Badge variant="secondary" className="text-[10px]">{analysis.recommendations.length}</Badge>
          </div>
          <div className="space-y-2">
            {analysis.recommendations.slice(0, 5).map((rec, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex items-start gap-2 text-xs p-2 rounded-lg",
                  rec.priority === 'high' && 'bg-red-500/10 border border-red-500/20',
                  rec.priority === 'medium' && 'bg-amber-500/10 border border-amber-500/20',
                  rec.priority === 'low' && 'bg-blue-500/10 border border-blue-500/20',
                )}
              >
                <Badge 
                  className={cn(
                    "text-[9px] shrink-0",
                    rec.priority === 'high' && "bg-red-500",
                    rec.priority === 'medium' && "bg-amber-500",
                    rec.priority === 'low' && "bg-blue-500",
                  )}
                >
                  {rec.priority === 'high' ? 'Важно' : rec.priority === 'medium' ? 'Средне' : 'Мелочь'}
                </Badge>
                <span className="flex-1">{rec.text}</span>
                {onQuickAction && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 shrink-0"
                    onClick={() => onQuickAction(rec.text)}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
