import { useAudioAnalysis, useAnalyzeAudio } from '@/hooks/useAudioAnalysis';
import { Track } from '@/hooks/useTracks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Music, Mic2, Activity, Key, Box } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface TrackAnalysisTabProps {
  track: Track;
}

export function TrackAnalysisTab({ track }: TrackAnalysisTabProps) {
  const { data: analysis, isLoading } = useAudioAnalysis(track.id);
  const { mutate: analyzeAudio, isPending } = useAnalyzeAudio();

  const handleAnalyze = () => {
    const audioUrl = track.audio_url || track.streaming_url || track.local_audio_url;
    if (!audioUrl) {
      return;
    }

    analyzeAudio({
      trackId: track.id,
      audioUrl,
      analysisType: 'manual',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center space-y-2">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Анализ трека не выполнен</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Используйте Audio Flamingo 3 для глубокого анализа аудио: жанр, настроение, инструменты и структура
          </p>
        </div>
        <Button 
          onClick={handleAnalyze}
          disabled={isPending || !track.audio_url}
          className="gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Анализ...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Анализировать трек
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Анализ</h3>
          <Badge variant="outline" className="text-xs">
            {analysis.analysis_type}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAnalyze}
          disabled={isPending}
          className="gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Обновление...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Обновить
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Structured Analysis */}
      <div className="grid gap-4">
        {analysis.genre && (
          <Card className="p-4 border-primary/20">
            <div className="flex items-start gap-3">
              <Music className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Жанр</p>
                <Badge variant="default" className="text-base">
                  {analysis.genre}
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {analysis.mood && (
          <Card className="p-4 border-primary/20">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Настроение</p>
                <p className="text-base font-medium">{analysis.mood}</p>
              </div>
            </div>
          </Card>
        )}

        {analysis.tempo && (
          <Card className="p-4 border-primary/20">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Темп</p>
                <p className="text-base font-medium">{analysis.tempo}</p>
              </div>
            </div>
          </Card>
        )}

        {analysis.key_signature && (
          <Card className="p-4 border-primary/20">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Тональность</p>
                <p className="text-base font-medium">{analysis.key_signature}</p>
              </div>
            </div>
          </Card>
        )}

        {analysis.instruments && analysis.instruments.length > 0 && (
          <Card className="p-4 border-primary/20">
            <div className="flex items-start gap-3">
              <Mic2 className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Инструменты</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.instruments.map((instrument, i) => (
                    <Badge key={i} variant="secondary">
                      {instrument}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {analysis.structure && (
          <Card className="p-4 border-primary/20">
            <div className="flex items-start gap-3">
              <Box className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Структура</p>
                <p className="text-sm leading-relaxed">{analysis.structure}</p>
              </div>
            </div>
          </Card>
        )}

        {analysis.style_description && (
          <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Описание стиля</p>
                <p className="text-sm leading-relaxed">{analysis.style_description}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Full Response */}
      {analysis.full_response && (
        <>
          <Separator />
          <details className="space-y-3">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Полный ответ AI
            </summary>
            <Card className="p-4 bg-muted/30 border border-border">
              <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
                {analysis.full_response}
              </pre>
            </Card>
          </details>
        </>
      )}
    </div>
  );
}
