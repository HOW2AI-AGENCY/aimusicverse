/**
 * RhythmAnalyzer - Visual rhythm analysis with syllable highlighting
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Music2, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RhythmAnalyzerProps {
  lyrics: string;
  onFixSuggestion?: (lineIndex: number, suggestion: string) => void;
  className?: string;
}

interface SyllableInfo {
  text: string;
  isStressed: boolean;
  position: number;
}

interface LineAnalysis {
  text: string;
  syllables: SyllableInfo[];
  syllableCount: number;
  stressPattern: string;
  issues: LineIssue[];
  score: number;
}

interface LineIssue {
  type: 'warning' | 'error' | 'info';
  message: string;
  suggestion?: string;
}

// Russian vowels for syllable counting
const VOWELS = /[аеёиоуыэюяАЕЁИОУЫЭЮЯaeiouyAEIOUY]/g;
const STRESSED_VOWELS = /[áéíóúýÁÉÍÓÚÝаеёиоуыэюя]/;

// Common stress patterns for Russian poetry
const COMMON_PATTERNS = {
  iamb: /^([^́]*[́][^́]*)+$/,      // weak-STRONG
  trochee: /^([́][^́]*[^́]*)+$/,   // STRONG-weak
  dactyl: /^([́][^́]*[^́]*[^́]*)+$/, // STRONG-weak-weak
  anapest: /^([^́]*[^́]*[́])+$/,   // weak-weak-STRONG
};

function countSyllables(word: string): number {
  const matches = word.match(VOWELS);
  return matches ? matches.length : 0;
}

function splitIntoSyllables(word: string): SyllableInfo[] {
  const syllables: SyllableInfo[] = [];
  let currentSyllable = '';
  let position = 0;
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    currentSyllable += char;
    
    if (VOWELS.test(char)) {
      // Check if next char is consonant and there's another vowel ahead
      let j = i + 1;
      while (j < word.length && !VOWELS.test(word[j])) {
        if (j + 1 < word.length && VOWELS.test(word[j + 1])) {
          // Next consonant belongs to next syllable
          break;
        }
        currentSyllable += word[j];
        j++;
      }
      i = j - 1;
      
      syllables.push({
        text: currentSyllable,
        isStressed: position === 0 || currentSyllable.includes('ё'), // Simplified stress detection
        position,
      });
      currentSyllable = '';
      position++;
    }
  }
  
  if (currentSyllable) {
    if (syllables.length > 0) {
      syllables[syllables.length - 1].text += currentSyllable;
    } else {
      syllables.push({ text: currentSyllable, isStressed: false, position: 0 });
    }
  }
  
  return syllables;
}

function analyzeLine(line: string, expectedSyllables?: number): LineAnalysis {
  const words = line.trim().split(/\s+/).filter(w => w.length > 0);
  const allSyllables: SyllableInfo[] = [];
  let totalSyllables = 0;
  
  words.forEach((word, wordIndex) => {
    const wordSyllables = splitIntoSyllables(word);
    wordSyllables.forEach((s, i) => {
      allSyllables.push({
        ...s,
        position: totalSyllables + i,
      });
    });
    totalSyllables += wordSyllables.length;
    
    // Add space marker between words
    if (wordIndex < words.length - 1) {
      allSyllables.push({ text: ' ', isStressed: false, position: -1 });
    }
  });
  
  const issues: LineIssue[] = [];
  let score = 100;
  
  // Check syllable count consistency
  if (expectedSyllables !== undefined) {
    const diff = Math.abs(totalSyllables - expectedSyllables);
    if (diff > 2) {
      issues.push({
        type: 'error',
        message: `Слогов: ${totalSyllables} (ожидается ~${expectedSyllables})`,
        suggestion: diff > 0 ? 'Попробуйте сократить строку' : 'Попробуйте добавить слова',
      });
      score -= 30;
    } else if (diff > 0) {
      issues.push({
        type: 'warning',
        message: `Небольшое отклонение: ${totalSyllables} слогов`,
      });
      score -= 10;
    }
  }
  
  // Check for very short or very long lines
  if (totalSyllables < 4 && line.trim().length > 0) {
    issues.push({
      type: 'info',
      message: 'Очень короткая строка',
    });
  } else if (totalSyllables > 16) {
    issues.push({
      type: 'warning',
      message: 'Длинная строка, может быть сложно для пения',
    });
    score -= 15;
  }
  
  // Generate stress pattern visualization
  const stressPattern = allSyllables
    .filter(s => s.position >= 0)
    .map((s, i) => i % 2 === 0 ? '—' : '∪')
    .join('');
  
  return {
    text: line,
    syllables: allSyllables,
    syllableCount: totalSyllables,
    stressPattern,
    issues,
    score: Math.max(0, score),
  };
}

function analyzeRhythm(lyrics: string): { lines: LineAnalysis[]; overallScore: number; avgSyllables: number } {
  const lines = lyrics.split('\n').filter(l => l.trim() && !l.trim().startsWith('['));
  
  // First pass: calculate average syllables
  const syllableCounts = lines.map(l => countSyllables(l));
  const avgSyllables = syllableCounts.length > 0 
    ? Math.round(syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length)
    : 8;
  
  // Second pass: analyze each line with expected syllables
  const analyzedLines = lyrics.split('\n').map(line => {
    if (!line.trim() || line.trim().startsWith('[')) {
      return {
        text: line,
        syllables: [],
        syllableCount: 0,
        stressPattern: '',
        issues: [],
        score: 100,
      };
    }
    return analyzeLine(line, avgSyllables);
  });
  
  const scores = analyzedLines.filter(l => l.syllableCount > 0).map(l => l.score);
  const overallScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 100;
  
  return { lines: analyzedLines, overallScore, avgSyllables };
}

export function RhythmAnalyzer({ lyrics, onFixSuggestion, className }: RhythmAnalyzerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  
  const analysis = useMemo(() => analyzeRhythm(lyrics), [lyrics]);
  
  const problemLines = analysis.lines.filter(l => l.issues.some(i => i.type === 'error' || i.type === 'warning'));
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (!lyrics.trim()) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground text-sm", className)}>
        Добавьте текст для анализа ритма
      </div>
    );
  }

  return (
    <div className={cn("border rounded-xl bg-card overflow-hidden", className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium">Анализ ритма</h3>
            <p className="text-xs text-muted-foreground">
              {analysis.lines.filter(l => l.syllableCount > 0).length} строк · ~{analysis.avgSyllables} слогов
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Score Badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            analysis.overallScore >= 80 ? "bg-green-500/20 text-green-400" :
            analysis.overallScore >= 60 ? "bg-amber-500/20 text-amber-400" :
            "bg-red-500/20 text-red-400"
          )}>
            {analysis.overallScore >= 80 ? <CheckCircle2 className="w-3.5 h-3.5" /> :
             analysis.overallScore >= 60 ? <Info className="w-3.5 h-3.5" /> :
             <AlertTriangle className="w-3.5 h-3.5" />}
            {analysis.overallScore}%
          </div>
          
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Problem Summary */}
            {problemLines.length > 0 && (
              <div className="px-3 pb-2">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{problemLines.length} строк с проблемами ритма</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Lines Analysis */}
            <ScrollArea className="max-h-[400px]">
              <div className="p-3 pt-0 space-y-1">
                <TooltipProvider>
                  {analysis.lines.map((line, idx) => {
                    const isSection = line.text.trim().startsWith('[');
                    const isEmpty = !line.text.trim();
                    const hasIssues = line.issues.length > 0;
                    const isSelected = selectedLine === idx;
                    
                    if (isEmpty) {
                      return <div key={idx} className="h-2" />;
                    }
                    
                    if (isSection) {
                      return (
                        <div key={idx} className="py-1">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {line.text.trim()}
                          </Badge>
                        </div>
                      );
                    }
                    
                    return (
                      <motion.div
                        key={idx}
                        className={cn(
                          "p-2 rounded-lg transition-all cursor-pointer",
                          isSelected ? "bg-muted ring-1 ring-primary/50" : "hover:bg-muted/50",
                          hasIssues && line.issues.some(i => i.type === 'error') && "bg-red-500/5",
                          hasIssues && line.issues.some(i => i.type === 'warning') && !line.issues.some(i => i.type === 'error') && "bg-amber-500/5"
                        )}
                        onClick={() => setSelectedLine(isSelected ? null : idx)}
                      >
                        {/* Syllable Display */}
                        <div className="flex flex-wrap gap-0.5 font-mono text-sm">
                          {line.syllables.map((syllable, sIdx) => {
                            if (syllable.position === -1) {
                              return <span key={sIdx} className="w-1.5" />;
                            }
                            
                            const isEven = syllable.position % 2 === 0;
                            
                            return (
                              <Tooltip key={sIdx}>
                                <TooltipTrigger asChild>
                                  <span
                                    className={cn(
                                      "px-0.5 py-0.5 rounded transition-all",
                                      isEven 
                                        ? "bg-primary/20 text-primary font-medium" 
                                        : "text-muted-foreground",
                                      syllable.isStressed && "underline decoration-2"
                                    )}
                                  >
                                    {syllable.text}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  Слог {syllable.position + 1}
                                  {isEven ? ' (сильная доля)' : ' (слабая доля)'}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                        
                        {/* Line Info */}
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {line.syllableCount} сл.
                            </span>
                            {line.stressPattern && (
                              <span className="text-[10px] text-muted-foreground/50 font-mono">
                                {line.stressPattern.slice(0, 12)}
                              </span>
                            )}
                          </div>
                          
                          {/* Issues */}
                          <div className="flex items-center gap-1">
                            {line.issues.map((issue, iIdx) => (
                              <Badge
                                key={iIdx}
                                variant="outline"
                                className={cn(
                                  "text-[9px] h-4",
                                  issue.type === 'error' && "border-red-500/50 text-red-400",
                                  issue.type === 'warning' && "border-amber-500/50 text-amber-400",
                                  issue.type === 'info' && "border-blue-500/50 text-blue-400"
                                )}
                              >
                                {issue.type === 'error' && <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />}
                                {issue.message}
                              </Badge>
                            ))}
                            {!hasIssues && line.syllableCount > 0 && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isSelected && line.issues.some(i => i.suggestion) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-2 pt-2 border-t border-border/50"
                            >
                              {line.issues.filter(i => i.suggestion).map((issue, iIdx) => (
                                <div key={iIdx} className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    💡 {issue.suggestion}
                                  </span>
                                  {onFixSuggestion && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-xs gap-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onFixSuggestion(idx, issue.suggestion!);
                                      }}
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      Исправить
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </TooltipProvider>
              </div>
            </ScrollArea>
            
            {/* Legend */}
            <div className="p-3 border-t border-border/50 bg-muted/30">
              <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary">сло</span>
                  <span>Сильная доля</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded text-muted-foreground">сло</span>
                  <span>Слабая доля</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  <span>Хороший ритм</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Проблема</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
