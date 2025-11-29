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

  const applyImprovement = async (field: string, value: string) => {
    setIsApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke('project-ai', {
        body: {
          action: 'improve',
          projectId: project.id,
          field,
          currentValue: (project as any)[field],
          suggestion: value,
          projectType: project.project_type,
          genre: project.genre,
          mood: project.mood,
        },
      });

      if (error) throw error;

      // Update the project with the improved value
      const improvedValue = data?.data?.improved;
      if (improvedValue) {
        const { error: updateError } = await supabase
          .from('music_projects')
          .update({ [field]: improvedValue })
          .eq('id', project.id);

        if (updateError) throw updateError;

        // Invalidate queries to refresh project data
        queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
        
        toast.success('Улучшение применено');
      }
    } catch (error) {
      console.error('Apply improvement error:', error);
      toast.error('Ошибка при применении улучшения');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Analysis Header */}
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

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Score */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Общая оценка</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-primary">
                  {analysis.score}
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
                <div className="flex-1">
                  <div className="h-4 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                      style={{ width: `${analysis.score}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Сильные стороны
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses */}
          {analysis.weaknesses.length > 0 && (
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Слабые стороны
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Market Potential */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Рыночный потенциал
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{analysis.marketPotential}</p>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Рекомендации
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Improvements */}
          {analysis.improvements.length > 0 && (
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Предложенные улучшения
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.improvements.map((improvement, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm capitalize">
                              {improvement.field.replace('_', ' ')}
                            </span>
                            <Badge
                              variant={
                                improvement.priority === 'high'
                                  ? 'destructive'
                                  : improvement.priority === 'medium'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {improvement.priority === 'high'
                                ? 'Высокий'
                                : improvement.priority === 'medium'
                                ? 'Средний'
                                : 'Низкий'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {improvement.suggestion}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isApplying}
                          onClick={() =>
                            applyImprovement(improvement.field, improvement.suggestion)
                          }
                        >
                          {isApplying ? 'Применение...' : 'Применить'}
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
