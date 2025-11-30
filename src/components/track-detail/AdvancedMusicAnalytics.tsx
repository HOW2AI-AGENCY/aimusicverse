import { AudioAnalysis } from '@/hooks/useAudioAnalysis';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, Users, Zap, Music2 } from 'lucide-react';

interface AdvancedMusicAnalyticsProps {
  analysis: AudioAnalysis;
}

export function AdvancedMusicAnalytics({ analysis }: AdvancedMusicAnalyticsProps) {
  const hasAdvancedData = analysis.bpm || analysis.arousal !== null || analysis.valence !== null || 
                          analysis.approachability || analysis.engagement;

  if (!hasAdvancedData) {
    return null;
  }

  // Convert arousal/valence to percentage for display
  const arousalPercent = analysis.arousal !== null ? Math.round(analysis.arousal * 100) : null;
  const valencePercent = analysis.valence !== null ? Math.round(analysis.valence * 100) : null;

  // Get emotion quadrant based on arousal and valence
  const getEmotionQuadrant = () => {
    if (arousalPercent === null || valencePercent === null) return null;
    
    if (arousalPercent >= 50 && valencePercent >= 50) return 'Радостный/Энергичный';
    if (arousalPercent >= 50 && valencePercent < 50) return 'Напряжённый/Агрессивный';
    if (arousalPercent < 50 && valencePercent >= 50) return 'Спокойный/Умиротворённый';
    return 'Грустный/Меланхоличный';
  };

  const emotionQuadrant = getEmotionQuadrant();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        <h4 className="text-sm font-semibold">Продвинутая аналитика</h4>
      </div>

      <div className="grid gap-3">
        {analysis.bpm && (
          <Card className="p-4 border-primary/20">
            <div className="flex items-start gap-3">
              <Music2 className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">BPM (Темп)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{Math.round(analysis.bpm)}</span>
                  <span className="text-sm text-muted-foreground">ударов/мин</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {(arousalPercent !== null || valencePercent !== null) && (
          <Card className="p-4 border-primary/20">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Эмоциональный анализ</p>
                
                {emotionQuadrant && (
                  <Badge variant="default" className="mb-2">
                    {emotionQuadrant}
                  </Badge>
                )}

                {arousalPercent !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Энергия/Возбуждение</span>
                      <span className="font-medium">{arousalPercent}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${arousalPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {valencePercent !== null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Позитивность/Валентность</span>
                      <span className="font-medium">{valencePercent}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${valencePercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {(analysis.approachability || analysis.engagement) && (
          <Card className="p-4 border-primary/20">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Доступность и вовлечённость
                </p>
                
                {analysis.approachability && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Доступность</span>
                    <Badge 
                      variant={
                        analysis.approachability === 'high' ? 'default' : 
                        analysis.approachability === 'mid' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {analysis.approachability === 'high' ? 'Высокая' : 
                       analysis.approachability === 'mid' ? 'Средняя' : 
                       'Низкая'}
                    </Badge>
                  </div>
                )}

                {analysis.engagement && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Вовлечённость</span>
                    <Badge 
                      variant={
                        analysis.engagement === 'high' ? 'default' : 
                        analysis.engagement === 'mid' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {analysis.engagement === 'high' ? 'Высокая' : 
                       analysis.engagement === 'mid' ? 'Средняя' : 
                       'Низкая'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {analysis.beats_data && Array.isArray(analysis.beats_data) && (
          <Card className="p-4 border-primary/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Обнаружение битов
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{analysis.beats_data.length}</span>
                  <span className="text-sm text-muted-foreground">битов обнаружено</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
