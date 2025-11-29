import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertCircle, CheckCircle, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { Project } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ProjectAnalysisTabProps {
  project: Project;
}

interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  marketPotential: string;
  improvements: {
    field: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export const ProjectAnalysisTab = ({ project }: ProjectAnalysisTabProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Load saved analysis from project.ai_context on mount
  useEffect(() => {
    if (project.ai_context && typeof project.ai_context === 'object') {
      const savedAnalysis = (project.ai_context as any).analysis;
      if (savedAnalysis) {
        setAnalysis(savedAnalysis);
      }
    }
  }, [project.ai_context]);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('project-ai', {
        body: {
          action: 'analyze',
          projectId: project.id,
          title: project.title,
          description: project.description,
          genre: project.genre,
          mood: project.mood,
          concept: project.concept,
          targetAudience: project.target_audience,
          projectType: project.project_type,
        },
      });

      if (error) throw error;

      if (data?.data) {
        const analysisResult = data.data;
        setAnalysis(analysisResult);

        // Save analysis to database
        const { error: saveError } = await supabase
          .from('music_projects')
          .update({
            ai_context: {
              ...(typeof project.ai_context === 'object' ? project.ai_context : {}),
              analysis: analysisResult,
              analyzedAt: new Date().toISOString(),
            }
          })
          .eq('id', project.id);

        if (saveError) {
          console.error('Error saving analysis:', saveError);
        }

        // Invalidate queries to refresh project data
        queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
        
        toast.success('Анализ проекта завершен');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Ошибка при анализе проекта');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyImprovement = async (field: string, suggestion: string) => {
    setIsApplying(true);
    try {
      // Call the edge function to improve the field
      const { data, error } = await supabase.functions.invoke('project-ai', {
        body: {
          action: 'improve',
          projectId: project.id,
          field,
          currentValue: (project as any)[field] || '',
          suggestion,
          projectType: project.project_type,
          genre: project.genre,
          mood: project.mood,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      // Update the project with the improved value
      const improvedValue = data?.data?.improved;
      
      if (!improvedValue) {
        throw new Error('No improved value returned from AI');
      }

      console.log('Applying improvement:', { field, improvedValue });

      const { error: updateError } = await supabase
        .from('music_projects')
        .update({ [field]: improvedValue })
        .eq('id', project.id)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Invalidate queries to refresh project data
      await queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
      
      toast.success(`Поле "${field === 'description' ? 'Описание' :
                            field === 'concept' ? 'Концепт' :
                            field === 'target_audience' ? 'Целевая аудитория' :
                            field === 'genre' ? 'Жанр' :
                            field === 'mood' ? 'Настроение' :
                            field}" обновлено`);
    } catch (error) {
      console.error('Apply improvement error:', error);
      toast.error('Ошибка при применении улучшения');
    } finally {
      setIsApplying(false);
    }
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 80) return { emoji: '🚀', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (score >= 60) return { emoji: '✨', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (score >= 40) return { emoji: '⚡', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { emoji: '💡', color: 'text-orange-500', bg: 'bg-orange-500/10' };
  };

  return (
    <div className="space-y-4">
      {/* Analysis Header - Only show if no results */}
      {!analysis && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-Анализ проекта
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Получите детальный анализ вашего проекта с помощью AI, включая сильные и слабые стороны,
              рекомендации по улучшению и оценку рыночного потенциала.
            </p>
            <Button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="w-full gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Анализ...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Начать анализ
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Header with Re-analyze button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Результаты анализа
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  Анализ...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Повторить
                </>
              )}
            </Button>
          </div>

          {/* Score - Compact version */}
          <Card className="glass-card border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                {(() => {
                  const mood = getMoodEmoji(analysis.score);
                  return (
                    <>
                      <div className={`w-16 h-16 rounded-2xl ${mood.bg} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-3xl">{mood.emoji}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-4xl font-bold text-primary">{analysis.score}</span>
                          <span className="text-lg text-muted-foreground">/100</span>
                          <span className={`ml-auto text-sm font-medium ${mood.color}`}>
                            {analysis.score >= 80 ? 'Отлично' : analysis.score >= 60 ? 'Хорошо' : analysis.score >= 40 ? 'Нормально' : 'Требует доработки'}
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                            style={{ width: `${analysis.score}%` }}
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Strengths & Weaknesses - Combined and Compact */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <Card className="glass-card border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  Сильные стороны
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span className="text-foreground/90">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            {analysis.weaknesses.length > 0 && (
              <Card className="glass-card border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    Слабые стороны
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-500 mt-0.5">•</span>
                        <span className="text-foreground/90">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Market Potential - Compact with emoji */}
          <Card className="glass-card border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    Рыночный потенциал
                    {(() => {
                      const potential = analysis.marketPotential.toLowerCase();
                      if (potential.includes('высок') || potential.includes('отличн') || potential.includes('больш')) {
                        return <span className="text-lg">🎯</span>;
                      } else if (potential.includes('средн') || potential.includes('хорош')) {
                        return <span className="text-lg">📈</span>;
                      } else if (potential.includes('низк') || potential.includes('огранич')) {
                        return <span className="text-lg">📊</span>;
                      }
                      return <span className="text-lg">💼</span>;
                    })()}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{analysis.marketPotential}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations - Compact */}
          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">💡</span>
                Рекомендации
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <span className="text-yellow-500 font-bold text-sm mt-0.5">{index + 1}.</span>
                    <span className="text-sm text-foreground/90 leading-relaxed">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Improvements - Compact and actionable */}
          {analysis.improvements.length > 0 && (
            <Card className="glass-card border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  Предложенные улучшения
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.improvements.map((improvement, index) => (
                    <div
                      key={`${improvement.field}-${index}`}
                      className="p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-medium text-sm capitalize">
                              {improvement.field === 'description' ? 'Описание' :
                               improvement.field === 'concept' ? 'Концепт' :
                               improvement.field === 'target_audience' ? 'Целевая аудитория' :
                               improvement.field === 'genre' ? 'Жанр' :
                               improvement.field === 'mood' ? 'Настроение' :
                               improvement.field.replace('_', ' ')}
                            </span>
                            <Badge
                              variant={
                                improvement.priority === 'high'
                                  ? 'destructive'
                                  : improvement.priority === 'medium'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs h-5"
                            >
                              {improvement.priority === 'high' ? '🔥 Высокий' :
                               improvement.priority === 'medium' ? '⚡ Средний' : '💫 Низкий'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {improvement.suggestion}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={isApplying}
                          onClick={() => applyImprovement(improvement.field, improvement.suggestion)}
                          className="flex-shrink-0"
                        >
                          {isApplying ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            'Применить'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
