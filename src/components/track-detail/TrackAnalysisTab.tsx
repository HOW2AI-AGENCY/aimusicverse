import { useAudioAnalysis, useAnalyzeAudio } from '@/hooks/useAudioAnalysis';
import { useReplicateAnalysis } from '@/hooks/useReplicateAnalysis';
import { Track } from '@/hooks/useTracksOptimized';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Music, Mic2, Activity, Key, Box, Zap, ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AdvancedMusicAnalytics } from './AdvancedMusicAnalytics';
import { EmotionalMap } from './EmotionalMap';
import { BeatsVisualization } from './BeatsVisualization';
import { AnalysisQuickStats } from './AnalysisQuickStats';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface TrackAnalysisTabProps {
  track: Track;
}

export function TrackAnalysisTab({ track }: TrackAnalysisTabProps) {
  const { data: analysis, isLoading } = useAudioAnalysis(track.id);
  const { mutate: analyzeAudio, isPending } = useAnalyzeAudio();
  const { mutate: replicateAnalyze, isPending: isReplicatePending } = useReplicateAnalysis();
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const handleAdvancedAnalyze = () => {
    const audioUrl = track.audio_url || track.streaming_url || track.local_audio_url;
    if (!audioUrl) {
      return;
    }

    replicateAnalyze({
      trackId: track.id,
      audioUrl,
      analysisTypes: ['bpm', 'beats', 'emotion', 'approachability'],
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
            Используйте AI для глубокого анализа аудио
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleAnalyze}
            disabled={isPending || !(track.audio_url || track.streaming_url || track.local_audio_url)}
            className="gap-2"
            variant="default"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Базовый анализ...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Базовый анализ
              </>
            )}
          </Button>
          <Button 
            onClick={handleAdvancedAnalyze}
            disabled={isReplicatePending || !(track.audio_url || track.streaming_url || track.local_audio_url)}
            className="gap-2"
            variant="secondary"
          >
            {isReplicatePending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Продвинутый...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Продвинутый анализ
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Анализ</h3>
          <Badge variant="outline" className="text-xs">
            {analysis.analysis_type}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Базовый</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAdvancedAnalyze}
            disabled={isReplicatePending}
            className="gap-1.5"
          >
            {isReplicatePending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Продвинутый</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <AnalysisQuickStats analysis={analysis} />

      <Separator />

      {/* Emotional Map */}
      {(analysis.arousal !== null || analysis.valence !== null) && (
        <EmotionalMap analysis={analysis} />
      )}

      {/* Beats Visualization */}
      {analysis.beats_data && Array.isArray(analysis.beats_data) && analysis.beats_data.length > 0 && (
        <BeatsVisualization 
          analysis={analysis}
          currentTime={currentTime}
          duration={track.duration_seconds || 0}
          isPlaying={isPlaying}
          onSeek={(time) => setCurrentTime(time)}
          onPlayPause={() => setIsPlaying(!isPlaying)}
        />
      )}

      {/* Advanced Music Analytics */}
      <AdvancedMusicAnalytics analysis={analysis} />

      {/* Detailed Analysis - Collapsible */}
      <Collapsible open={showDetails} onOpenChange={setShowDetails}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between gap-2 h-auto py-3">
            <span className="text-sm font-medium">Подробный анализ</span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              showDetails && "rotate-180"
            )} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
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

          {/* Full Response */}
          {analysis.full_response && (
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
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
