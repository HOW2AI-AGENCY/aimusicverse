import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudioProject } from '@/hooks/studio/useStudioProject';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { getTelegramHeaderPaddingTop } from '@/lib/telegramSafeArea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Music2, FileAudio, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrackOption {
  id: string;
  title: string;
  audio_url: string;
  duration_seconds: number | null;
}

export default function NewStudioProjectPage() {
  const navigate = useNavigate();
  const { createEmptyProject, createFromTrack, isLoading } = useStudioProject();
  
  // Telegram BackButton - navigate to studio hub
  useTelegramBackButton({
    visible: true,
    fallbackPath: '/studio-v2',
  });
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'empty' | 'from-track'>('empty');
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [loadingTracks, setLoadingTracks] = useState(false);

  const loadUserTracks = async () => {
    setLoadingTracks(true);
    const { data } = await supabase
      .from('tracks')
      .select('id, title, audio_url, duration_seconds')
      .order('created_at', { ascending: false })
      .limit(20);
    
    setTracks((data as TrackOption[]) || []);
    setLoadingTracks(false);
  };

  const handleModeChange = (newMode: 'empty' | 'from-track') => {
    setMode(newMode);
    if (newMode === 'from-track' && tracks.length === 0) {
      loadUserTracks();
    }
  };

  const handleCreate = async () => {
    if (mode === 'from-track') {
      if (!selectedTrackId) {
        toast.error('Выберите трек');
        return;
      }
      const projectId = await createFromTrack(selectedTrackId);
      if (projectId) {
        navigate(`/studio-v2/project/${projectId}`);
      }
    } else {
      if (!name.trim()) {
        toast.error('Введите название проекта');
        return;
      }
      const projectId = await createEmptyProject(name.trim());
      if (projectId) {
        navigate(`/studio-v2/project/${projectId}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Telegram safe area */}
      <header 
        className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur"
        style={{
          paddingTop: getTelegramHeaderPaddingTop(),
        }}
      >
        <div className="container flex h-14 items-center px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/studio-v2')}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Новый проект</h1>
        </div>
      </header>

      <main className="container max-w-2xl px-4 py-6">
        {/* Mode Selection */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Card 
            className={`cursor-pointer transition-all ${
              mode === 'empty' 
                ? 'border-primary ring-2 ring-primary/20' 
                : 'hover:border-muted-foreground/50'
            }`}
            onClick={() => handleModeChange('empty')}
          >
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <Music2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Пустой проект</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Создайте проект с нуля
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${
              mode === 'from-track' 
                ? 'border-primary ring-2 ring-primary/20' 
                : 'hover:border-muted-foreground/50'
            }`}
            onClick={() => handleModeChange('from-track')}
          >
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3 mb-3">
                <FileAudio className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">Из трека</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Начните с готового трека
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Empty Project Form */}
        {mode === 'empty' && (
          <Card>
            <CardHeader>
              <CardTitle>Детали проекта</CardTitle>
              <CardDescription>
                Задайте базовые параметры проекта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  placeholder="Мой проект"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Описание проекта (необязательно)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* From Track Selection */}
        {mode === 'from-track' && (
          <Card>
            <CardHeader>
              <CardTitle>Выберите трек</CardTitle>
              <CardDescription>
                Проект будет создан на основе выбранного трека
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTracks ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tracks.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Нет доступных треков
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/generate')}
                    className="mt-2"
                  >
                    Создать трек
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {tracks.map(track => (
                    <div
                      key={track.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTrackId === track.id
                          ? 'bg-primary/10 border border-primary'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                      onClick={() => setSelectedTrackId(track.id)}
                    >
                      <div className="rounded bg-primary/10 p-2">
                        <FileAudio className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.title || 'Без названия'}</p>
                        {track.duration_seconds && (
                          <p className="text-xs text-muted-foreground">
                            {Math.floor(track.duration_seconds / 60)}:
                            {String(Math.floor(track.duration_seconds % 60)).padStart(2, '0')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Button */}
        <div className="mt-6 flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/studio-v2')}
            className="flex-1 sm:flex-none"
          >
            Отмена
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={isLoading || (mode === 'empty' && !name.trim()) || (mode === 'from-track' && !selectedTrackId)}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать проект
          </Button>
        </div>
      </main>
    </div>
  );
}
