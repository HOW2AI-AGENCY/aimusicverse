import { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTracks } from '@/hooks/useProjectTracks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Sparkles, Music, Settings, FileText } from 'lucide-react';
import { ProjectDetailsTab } from '@/components/project/ProjectDetailsTab';
import { ProjectAnalysisTab } from '@/components/project/ProjectAnalysisTab';
import { ProjectTracklistTab } from '@/components/project/ProjectTracklistTab';
import { AIActionsDialog } from '@/components/project/AIActionsDialog';
import { supabase } from '@/integrations/supabase/client';
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { projects, isLoading } = useProjects();
  const { tracks, isLoading: tracksLoading } = useProjectTracks(id);
  const [activeTab, setActiveTab] = useState('details');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const project = projects?.find((p) => p.id === id);

  const handleApplyUpdates = async (updates: Record<string, string | number | boolean | null>) => {
    if (!project) return;
    
    try {
      const { error } = await supabase
        .from('music_projects')
        .update(updates)
        .eq('id', project.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Проект не найден</h3>
          <p className="text-muted-foreground mb-6">Проект с таким ID не существует или был удален.</p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться к проектам
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <img
              src={project.cover_url || `https://placehold.co/128x128/1a1a1a/ffffff?text=${project.title.charAt(0)}`}
              alt={project.title}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">{project.title}</h1>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <Badge variant="default" className="capitalize">{project.project_type?.replace('_', ' ') || 'N/A'}</Badge>
                  <Badge variant="secondary">{project.genre || 'Без жанра'}</Badge>
                  <Badge variant="outline">{project.mood || 'Без настроения'}</Badge>
                </div>
                {project.description && (
                  <p className="text-muted-foreground mt-2 max-w-prose">{project.description}</p>
                )}
              </div>
              <div className="mt-4 sm:mt-0 flex gap-2 flex-shrink-0">
                <Button variant="outline" onClick={() => navigate('/projects')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Назад
                </Button>
                <Button onClick={() => setAiDialogOpen(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Действия
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="details" className="gap-2 text-base py-3">
              <FileText className="w-5 h-5" />
              Детали
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2 text-base py-3">
              <Sparkles className="w-5 h-5" />
              Анализ
            </TabsTrigger>
            <TabsTrigger value="tracklist" className="gap-2 text-base py-3">
              <Music className="w-5 h-5" />
              Треклист
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <ProjectDetailsTab project={project} />
          </TabsContent>
          <TabsContent value="analysis">
            <ProjectAnalysisTab project={project} />
          </TabsContent>
          <TabsContent value="tracklist">
            <ProjectTracklistTab 
              project={project} 
              tracks={tracks || []} 
              isLoading={tracksLoading}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AIActionsDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        projectId={project.id}
        onApply={handleApplyUpdates}
      />
    </div>
  );
}
