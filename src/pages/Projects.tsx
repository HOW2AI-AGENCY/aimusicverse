import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Search, Plus, Music, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  genre: string | null;
  mood: string | null;
  status: string | null;
  created_at: string | null;
  cover_url: string | null;
}

export default function Projects() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('music_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast.error('Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  };

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

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <p className="text-2xl font-bold text-foreground">{projects.length}</p>
              <p className="text-xs text-muted-foreground">Проектов</p>
            </div>
          </Card>

          <Card className="p-4 glass-card border-primary/20">
            <div className="flex flex-col items-center text-center">
              <Music className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {projects.reduce((acc, p) => acc + (p.status === 'completed' ? 1 : 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Завершено</p>
            </div>
          </Card>

          <Card className="p-4 glass-card border-primary/20">
            <div className="flex flex-col items-center text-center">
              <Clock className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {projects.reduce((acc, p) => acc + (p.status === 'in_progress' ? 1 : 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">В работе</p>
            </div>
          </Card>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
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
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Создать проект
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
