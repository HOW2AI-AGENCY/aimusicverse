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

  const handleApplyUpdates = async (updates: Record<string, any>) => {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="p-8 glass-card border-primary/20 text-center max-w-md">
          <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Проект не найден</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Проект с таким ID не существует или был удален
          </p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться к проектам
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/projects')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к проектам
            </Button>
            <Button
              onClick={() => setAiDialogOpen(true)}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI Actions
            </Button>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
              {project.cover_url ? (
                <img
                  src={project.cover_url}
                  alt={project.title}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Music className="w-10 h-10 text-primary" />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                {project.title}
              </h1>
              <div className="flex gap-2 mb-2 flex-wrap">
                {project.project_type && (
                  <Badge variant="default" className="capitalize">
                    {project.project_type.replace('_', ' ')}
                  </Badge>
                )}
                {project.genre && (
                  <Badge variant="secondary">{project.genre}</Badge>
                )}
                {project.mood && (
                  <Badge variant="outline">{project.mood}</Badge>
                )}
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="details" className="gap-2">
              <FileText className="w-4 h-4" />
              Детали
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Анализ
            </TabsTrigger>
            <TabsTrigger value="tracklist" className="gap-2">
              <Music className="w-4 h-4" />
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
