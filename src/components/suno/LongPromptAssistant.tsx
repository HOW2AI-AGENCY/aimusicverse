import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, Loader2, Brain, Scissors, CheckCircle2, 
  AlertCircle, ChevronRight, Music2, Copy, Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface PromptPart {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  tips: string;
}

interface Analysis {
  needsSplit: boolean;
  parts?: PromptPart[];
  overallTips?: string;
  optimized?: string;
  removed?: string;
  kept?: string;
  length?: number;
}

interface LongPromptAssistantProps {
  onGenerateParts: (parts: string[]) => void;
}

export const LongPromptAssistant = ({ onGenerateParts }: LongPromptAssistantProps) => {
  const [prompt, setPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      toast.error('Введите промпт для анализа');
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-long-prompt', {
        body: { 
          prompt: prompt.trim(),
          action: 'analyze'
        },
      });

      if (error) throw error;

      if (data?.analysis) {
        setAnalysis(data.analysis);
        toast.success('Анализ завершен!', {
          description: data.analysis.needsSplit 
            ? `Рекомендуется разделить на ${data.analysis.parts?.length || 0} частей`
            : 'Промпт оптимален'
        });
      }
    } catch (error) {
      logger.error('Analysis error', error);
      const errorMessage = error instanceof Error ? error.message : 'Попробуйте еще раз';
      toast.error('Ошибка анализа', {
        description: errorMessage,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!prompt.trim()) {
      toast.error('Введите промпт для оптимизации');
      return;
    }

    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-long-prompt', {
        body: { 
          prompt: prompt.trim(),
          action: 'optimize'
        },
      });

      if (error) throw error;

      if (data?.analysis?.optimized) {
        setOptimizedPrompt(data.analysis.optimized);
        toast.success('Промпт оптимизирован!', {
          description: `${data.analysis.length || 0} символов`,
        });
      }
    } catch (error) {
      logger.error('Optimization error', error);
      const errorMessage = error instanceof Error ? error.message : 'Попробуйте еще раз';
      toast.error('Ошибка оптимизации', {
        description: errorMessage,
      });
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopyPart = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Скопировано в буфер обмена');
  };

  const handleGenerateAll = () => {
    if (!analysis?.parts) return;
    
    const parts = analysis.parts.map(p => p.content);
    onGenerateParts(parts);
    toast.success('Части добавлены для генерации');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Card */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-4 h-4" />
            ИИ-помощник для длинных промптов
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Введите ваш промпт (любой длины)
              </span>
              <span className={`${prompt.length > 200 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                {prompt.length} символов
              </span>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Например: Энергичная рок-баллада с мощными электрогитарами, драматическим вокалом и оркестровыми элементами. Темп средний, атмосфера напряженная и эмоциональная, с кульминацией в припеве..."
              rows={6}
              className="text-sm"
              style={{ fontSize: '16px' }}
            />
          </div>

          {prompt.length > 200 && (
            <Alert className="border-yellow-500/20 bg-yellow-500/5">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-sm">
                Промпт превышает лимит в 200 символов. Используйте анализ или оптимизацию для улучшения.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !prompt.trim()}
              variant="outline"
              className="flex-1 gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Анализ...
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  Разбить на части
                </>
              )}
            </Button>
            <Button
              onClick={handleOptimize}
              disabled={optimizing || !prompt.trim()}
              variant="outline"
              className="flex-1 gap-2"
            >
              {optimizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Оптимизация...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Оптимизировать
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Optimized Result */}
      {optimizedPrompt && (
        <Card className="glass-card border-green-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              Оптимизированный промпт
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-background/50 rounded-lg border border-border">
              <p className="text-sm">{optimizedPrompt}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{optimizedPrompt.length} символов</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopyPart(optimizedPrompt, -1)}
                className="gap-1 h-7"
              >
                {copiedIndex === -1 ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                Копировать
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && analysis.parts && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Music2 className="w-4 h-4" />
                Рекомендуемые части ({analysis.parts.length})
              </CardTitle>
              {analysis.parts.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleGenerateAll}
                  className="gap-2"
                >
                  <Sparkles className="w-3 h-3" />
                  Генерировать все
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.overallTips && (
              <Alert className="border-blue-500/20 bg-blue-500/5">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm">
                  {analysis.overallTips}
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {analysis.parts.map((part, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Часть {index + 1}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(part.priority)}
                          >
                            {getPriorityLabel(part.priority)}
                          </Badge>
                        </div>
                      </div>

                      <h4 className="font-medium text-sm">{part.title}</h4>

                      <div className="p-2 bg-background/50 rounded border border-border">
                        <p className="text-sm font-mono">{part.content}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {part.content.length} символов
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyPart(part.content, index)}
                          className="gap-1 h-6"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          Копировать
                        </Button>
                      </div>

                      {part.tips && (
                        <>
                          <Separator />
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{part.tips}</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-sm">💡 Советы по работе</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>• <strong>Разбить на части:</strong> ИИ проанализирует промпт и предложит оптимальную разбивку</li>
            <li>• <strong>Оптимизировать:</strong> ИИ сожмет промпт до 200 символов, сохранив смысл</li>
            <li>• <strong>Приоритеты:</strong> Части с высоким приоритетом содержат ключевые элементы</li>
            <li>• <strong>Генерация:</strong> Можно генерировать лирику для каждой части отдельно</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
