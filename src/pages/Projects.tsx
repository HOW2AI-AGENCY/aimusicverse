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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Проекты</h1>
            <p className="text-muted-foreground">Управляйте вашими музыкальными альбомами, EP и синглами.</p>
          </div>
          <Button onClick={() => setCreateSheetOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Создать проект
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <FolderOpen className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{projects?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Всего проектов</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Music className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Завершено</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-muted-foreground">В работе</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="p-4 hover:bg-muted/50 transition-all cursor-pointer"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <img
                      src={project.cover_url || `https://placehold.co/128x128/1a1a1a/ffffff?text=${project.title.charAt(0)}`}
                      alt={project.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate mb-1">{project.title}</h3>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">{project.genre || 'Без жанра'}</Badge>
                      <Badge variant="outline">{project.mood || 'Без настроения'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Создан: {project.created_at && new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
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
