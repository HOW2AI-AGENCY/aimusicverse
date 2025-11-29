import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjectsOptimized';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Search, Plus, Music, Clock, Sparkles } from 'lucide-react';
import { CreateProjectSheet } from '@/components/CreateProjectSheet';

export default function Projects() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { projects, isLoading } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const filteredProjects = projects?.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const completedCount = projects?.filter(p => p.status === 'completed').length || 0;
  const inProgressCount = projects?.filter(p => p.status === 'in_progress').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full glass-card border-primary/20">
            <FolderOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Проекты
            </h1>
            <p className="text-muted-foreground">Управляйте вашими музыкальными проектами</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Поиск проектов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 glass-card border-primary/20">
            <div className="flex flex-col items-center text-center">
              <FolderOpen className="w-8 h-8 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{projects?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Проектов</p>
            </div>
          </Card>

          <Card className="p-4 glass-card border-primary/20">
            <div className="flex flex-col items-center text-center">
              <Music className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-foreground">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Завершено</p>
            </div>
          </Card>

          <Card className="p-4 glass-card border-primary/20">
            <div className="flex flex-col items-center text-center">
              <Clock className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
              <p className="text-xs text-muted-foreground">В работе</p>
            </div>
          </Card>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="p-4 glass-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                    {project.cover_url ? (
                      <img src={project.cover_url} alt={project.title} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Music className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 truncate">{project.title}</h3>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {project.genre && (
                        <Badge variant="secondary" className="text-xs">
                          {project.genre}
                        </Badge>
                      )}
                      {project.mood && (
                        <Badge variant="outline" className="text-xs">
                          {project.mood}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.created_at && new Date(project.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 glass-card border-primary/20 text-center">
            <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              {searchQuery ? 'Проекты не найдены' : 'Нет проектов'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery
                ? 'Попробуйте изменить поисковый запрос'
                : 'Создайте свой первый музыкальный проект'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setCreateSheetOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Создать проект
              </Button>
            )}
          </Card>
        )}
      </div>

      <CreateProjectSheet 
        open={createSheetOpen} 
        onOpenChange={setCreateSheetOpen}
      />
    </div>
  );
}
