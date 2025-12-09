import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface StrumData {
  time: number;
  direction: 'U' | 'D';
}

interface StrummingPatternVisualizationProps {
  strumming: StrumData[];
  bpm?: number;
  className?: string;
}

export function StrummingPatternVisualization({
  strumming,
  bpm = 120,
  className,
}: StrummingPatternVisualizationProps) {
  // Analyze strumming pattern
  const analysis = useMemo(() => {
    if (!strumming || strumming.length === 0) {
      return null;
    }

    const upCount = strumming.filter(s => s.direction === 'U').length;
    const downCount = strumming.filter(s => s.direction === 'D').length;

    // Try to detect repeating pattern
    const directions = strumming.map(s => s.direction);
    let patternLength = 0;
    
    for (let len = 2; len <= Math.min(8, Math.floor(directions.length / 2)); len++) {
      const pattern = directions.slice(0, len);
      let matches = true;
      
      for (let i = len; i < directions.length; i++) {
        if (directions[i] !== pattern[i % len]) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        patternLength = len;
        break;
      }
    }

    const patternStr = patternLength > 0 
      ? directions.slice(0, patternLength).join(' ')
      : directions.slice(0, Math.min(8, directions.length)).join(' ');

    // Classify pattern type
    let patternType = 'Свободный';
    if (patternStr.includes('D D U U D U')) patternType = 'Народный/Фолк';
    else if (patternStr === 'D D D D') patternType = 'Прямой бой';
    else if (patternStr === 'D U D U') patternType = 'Переменный бой';
    else if (patternStr.includes('D D U D U')) patternType = 'Восьмерка';
    else if (upCount > downCount * 1.5) patternType = 'Арпеджио/Перебор';

    return {
      upCount,
      downCount,
      patternStr,
      patternType,
      patternLength,
      totalStrokes: strumming.length,
    };
  }, [strumming]);

  if (!strumming || strumming.length === 0) {
    return (
      <Card className={cn("bg-card/50 backdrop-blur-sm", className)}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Music2 className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">Ритмический паттерн не обнаружен</p>
        </CardContent>
      </Card>
    );
  }

  // Show first 16 strokes or one pattern repetition
  const displayStrokes = strumming.slice(0, Math.min(16, strumming.length));

  return (
    <Card className={cn("bg-card/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Music2 className="w-4 h-4 text-primary" />
          Ритмический паттерн
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual strumming pattern */}
        <div className="flex items-center justify-center gap-1 py-4 px-2 bg-muted/30 rounded-lg overflow-x-auto">
          {displayStrokes.map((strum, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                strum.direction === 'D' 
                  ? "bg-primary/20 border border-primary/30" 
                  : "bg-accent/20 border border-accent/30"
              )}
            >
              {strum.direction === 'D' ? (
                <ArrowDown className="w-5 h-5 text-primary" />
              ) : (
                <ArrowUp className="w-5 h-5 text-accent" />
              )}
              <span className={cn(
                "text-xs font-bold",
                strum.direction === 'D' ? "text-primary" : "text-accent"
              )}>
                {strum.direction}
              </span>
            </div>
          ))}
          {strumming.length > 16 && (
            <span className="text-muted-foreground text-sm px-2">...</span>
          )}
        </div>

        {/* Pattern analysis */}
        {analysis && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {analysis.patternType}
              </Badge>
              {bpm && (
                <Badge variant="outline">
                  {bpm} BPM
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-primary">{analysis.downCount}</div>
                <div className="text-xs text-muted-foreground">Вниз ↓</div>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-accent">{analysis.upCount}</div>
                <div className="text-xs text-muted-foreground">Вверх ↑</div>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold text-foreground">{analysis.totalStrokes}</div>
                <div className="text-xs text-muted-foreground">Всего</div>
              </div>
            </div>

            {/* Pattern notation */}
            <div className="p-3 bg-muted/20 rounded-lg font-mono text-sm">
              <div className="text-xs text-muted-foreground mb-1">Паттерн:</div>
              <div className="flex flex-wrap gap-1">
                {analysis.patternStr.split(' ').map((char, i) => (
                  <span
                    key={i}
                    className={cn(
                      "px-2 py-0.5 rounded",
                      char === 'D' ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
                    )}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            {/* Timing info */}
            {strumming.length > 1 && (
              <div className="text-xs text-muted-foreground">
                Длительность: {((strumming[strumming.length - 1].time - strumming[0].time)).toFixed(1)}с
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
