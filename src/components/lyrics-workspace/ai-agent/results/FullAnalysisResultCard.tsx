/**
 * FullAnalysisResultCard - Display comprehensive lyrics analysis
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
  Zap
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
  className?: string;
}

const SECTION_CONFIG = {
  meaning: { icon: FileText, label: 'Смысл', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  rhythm: { icon: Music2, label: 'Ритм', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  rhymes: { icon: Mic2, label: 'Рифмы', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  structure: { icon: LayoutGrid, label: 'Структура', color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreLabel(score: number) {
  if (score >= 90) return 'Отлично';
  if (score >= 80) return 'Хорошо';
  if (score >= 60) return 'Средне';
  return 'Требует работы';
}

export function FullAnalysisResultCard({ 
  analysis, 
  onQuickAction,
  className 
}: FullAnalysisResultCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mt-3 rounded-xl border border-purple-500/30 bg-purple-500/5 overflow-hidden", className)}
    >
      {/* Overall Score Header */}
      <div className="p-3 border-b border-border/50 bg-gradient-to-r from-purple-500/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span className="font-semibold">Общий анализ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-2xl font-bold", getScoreColor(analysis.overallScore))}>
              {analysis.overallScore}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>
        <Progress value={analysis.overallScore} className="mt-2 h-2" />
        <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(analysis.overallScore)}</p>
      </div>

      {/* Sections */}
      <div className="divide-y divide-border/30">
        {/* Meaning Section */}
        <SectionBlock
          config={SECTION_CONFIG.meaning}
          score={analysis.meaning.score}
          isExpanded={expandedSection === 'meaning'}
          onToggle={() => toggleSection('meaning')}
        >
          <div className="space-y-2">
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
                  <p key={i} className="text-xs text-amber-500">⚠ {issue}</p>
                ))}
              </div>
            )}
          </div>
        </SectionBlock>

        {/* Rhythm Section */}
        <SectionBlock
          config={SECTION_CONFIG.rhythm}
          score={analysis.rhythm.score}
          isExpanded={expandedSection === 'rhythm'}
          onToggle={() => toggleSection('rhythm')}
        >
          <div className="space-y-2">
            <p className="text-sm font-mono">{analysis.rhythm.pattern}</p>
            {analysis.rhythm.issues.length > 0 && (
              <div className="space-y-1">
                {analysis.rhythm.issues.map((issue, i) => (
                  <p key={i} className="text-xs text-amber-500">⚠ {issue}</p>
                ))}
              </div>
            )}
          </div>
        </SectionBlock>

        {/* Rhymes Section */}
        <SectionBlock
          config={SECTION_CONFIG.rhymes}
          score={analysis.rhymes.score}
          isExpanded={expandedSection === 'rhymes'}
          onToggle={() => toggleSection('rhymes')}
        >
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground">Схема: </span>
              <span className="text-sm font-mono">{analysis.rhymes.scheme}</span>
            </div>
            {analysis.rhymes.weakRhymes.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">Слабые рифмы: </span>
                <span className="text-sm text-amber-500">{analysis.rhymes.weakRhymes.join(', ')}</span>
              </div>
            )}
          </div>
        </SectionBlock>

        {/* Structure Section */}
        <SectionBlock
          config={SECTION_CONFIG.structure}
          score={analysis.structure.score}
          isExpanded={expandedSection === 'structure'}
          onToggle={() => toggleSection('structure')}
        >
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {analysis.structure.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
            {analysis.structure.issues.length > 0 && (
              <div className="space-y-1">
                {analysis.structure.issues.map((issue, i) => (
                  <p key={i} className="text-xs text-amber-500">⚠ {issue}</p>
                ))}
              </div>
            )}
          </div>
        </SectionBlock>
      </div>

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="p-3 border-t border-border/50 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">Рекомендации</span>
          </div>
          <div className="space-y-1.5">
            {analysis.recommendations.slice(0, 5).map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Badge 
                  variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}
                  className="text-[9px] shrink-0"
                >
                  {rec.priority === 'high' ? '!' : rec.priority === 'medium' ? '~' : '•'}
                </Badge>
                <span>{rec.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {analysis.quickActions && analysis.quickActions.length > 0 && onQuickAction && (
        <div className="p-3 border-t border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">Быстрые действия</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.quickActions.map((qa, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => onQuickAction(qa.action)}
              >
                {qa.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface SectionBlockProps {
  config: { icon: any; label: string; color: string; bg: string };
  score: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SectionBlock({ config, score, isExpanded, onToggle, children }: SectionBlockProps) {
  const Icon = config.icon;
  
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full p-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-6 h-6 rounded flex items-center justify-center", config.bg)}>
            <Icon className={cn("w-3.5 h-3.5", config.color)} />
          </div>
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-bold", getScoreColor(score))}>{score}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-3 pb-3"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
