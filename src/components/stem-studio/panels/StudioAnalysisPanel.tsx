import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Activity, Brain, Loader2, Sparkles, 
  MessageSquare, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAudioAnalysis, useAnalyzeAudio } from '@/hooks/useAudioAnalysis';
import { useEmotionAnalysis } from '@/hooks/useEmotionAnalysis';
import { EmotionalMap } from '@/components/track-detail/EmotionalMap';
import { EmotionBadge } from '@/components/ui/EmotionBadge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';

interface StudioAnalysisPanelProps {
  trackId: string;
  audioUrl: string;
  className?: string;
}

export function StudioAnalysisPanel({ 
  trackId, 
  audioUrl,
  className 
}: StudioAnalysisPanelProps) {
  const { data: analysis, isLoading } = useAudioAnalysis(trackId);
  const analyzeAudio = useAnalyzeAudio();
  const analyzeEmotion = useEmotionAnalysis();
  
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswer, setCustomAnswer] = useState<string | null>(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const hasEmotionData = analysis?.arousal !== null && analysis?.valence !== null;
  const isAnalyzing = analyzeAudio.isPending || analyzeEmotion.isPending;

  const handleFullAnalysis = async () => {
    try {
      // Run both analyses in parallel
      await Promise.all([
        analyzeAudio.mutateAsync({ trackId, audioUrl }),
        analyzeEmotion.mutateAsync({ trackId, audioUrl })
      ]);
    } catch (error) {
      // Errors handled by mutation hooks
    }
  };

  const handleEmotionAnalysis = async () => {
    await analyzeEmotion.mutateAsync({ trackId, audioUrl });
  };

  const handleAskQuestion = async () => {
    if (!customQuestion.trim()) return;
    
    setIsAskingQuestion(true);
    try {
      const result = await analyzeAudio.mutateAsync({ 
        trackId, 
        audioUrl,
        customPrompt: customQuestion
      });
      setCustomAnswer(result.analysis?.full_response || 'Ответ не получен');
    } catch (error) {
      setCustomAnswer('Ошибка при получении ответа');
    } finally {
      setIsAskingQuestion(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with emotion badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Анализ трека</h3>
          {hasEmotionData && analysis && (
            <EmotionBadge 
              arousal={analysis.arousal ?? 0.5} 
              valence={analysis.valence ?? 0.5}
              size="sm"
            />
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFullAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {analysis ? 'Обновить' : 'Анализировать'}
        </Button>
      </div>

      {/* Emotional Map */}
      {hasEmotionData && analysis && (
        <EmotionalMap analysis={analysis} />
      )}

      {/* Quick emotion analysis button if no emotion data */}
      {!hasEmotionData && !isAnalyzing && (
        <Card className="p-4 border-dashed">
          <div className="text-center space-y-3">
            <Activity className="w-8 h-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Эмоциональный анализ</p>
              <p className="text-xs text-muted-foreground">
                Определите настроение и энергию трека
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEmotionAnalysis}
              disabled={analyzeEmotion.isPending}
            >
              {analyzeEmotion.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Анализировать эмоции
            </Button>
          </div>
        </Card>
      )}

      {/* Analysis Details */}
      {analysis && (
        <Card className="overflow-hidden">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Детали анализа</span>
            </div>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 pb-4 space-y-3 border-t">
                  {/* Genre & Mood */}
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    {analysis.genre && (
                      <div>
                        <span className="text-xs text-muted-foreground">Жанр</span>
                        <p className="text-sm font-medium">{analysis.genre}</p>
                      </div>
                    )}
                    {analysis.mood && (
                      <div>
                        <span className="text-xs text-muted-foreground">Настроение</span>
                        <p className="text-sm font-medium">{analysis.mood}</p>
                      </div>
                    )}
                    {analysis.tempo && (
                      <div>
                        <span className="text-xs text-muted-foreground">Темп</span>
                        <p className="text-sm font-medium">{analysis.tempo}</p>
                      </div>
                    )}
                    {analysis.key_signature && (
                      <div>
                        <span className="text-xs text-muted-foreground">Тональность</span>
                        <p className="text-sm font-medium">{analysis.key_signature}</p>
                      </div>
                    )}
                  </div>

                  {/* Instruments */}
                  {analysis.instruments && analysis.instruments.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Инструменты</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.instruments.map((instrument, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {instrument}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structure */}
                  {analysis.structure && (
                    <div>
                      <span className="text-xs text-muted-foreground">Структура</span>
                      <p className="text-sm">{analysis.structure}</p>
                    </div>
                  )}

                  {/* Style Description */}
                  {analysis.style_description && (
                    <div>
                      <span className="text-xs text-muted-foreground">Описание стиля</span>
                      <p className="text-sm text-muted-foreground">{analysis.style_description}</p>
                    </div>
                  )}

                  {/* Analysis Metadata */}
                  {analysis.analysis_metadata && (
                    <div className="pt-2 border-t">
                      <span className="text-xs text-muted-foreground">Источник данных</span>
                      <div className="flex gap-2 mt-1">
                        {(analysis.analysis_metadata as any).mtg_analyzed_at && (
                          <Badge variant="outline" className="text-xs">
                            MTG Model
                          </Badge>
                        )}
                        {analysis.full_response && (
                          <Badge variant="outline" className="text-xs">
                            Audio Flamingo
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Custom Question */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Задать вопрос об аудио</span>
        </div>
        <Textarea
          placeholder="Например: Какие эмоции передаёт вокал? Какие техники использованы в припеве?"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          className="min-h-[80px] resize-none mb-3"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAskQuestion}
          disabled={isAskingQuestion || !customQuestion.trim()}
          className="w-full"
        >
          {isAskingQuestion ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          Спросить AI
        </Button>

        {/* Custom Answer */}
        {customAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-muted/50 rounded-lg"
          >
            <p className="text-sm whitespace-pre-wrap">{customAnswer}</p>
          </motion.div>
        )}
      </Card>
    </div>
  );
}
