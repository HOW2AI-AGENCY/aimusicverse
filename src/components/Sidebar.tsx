import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  Library, 
  BarChart2, 
  Sparkles,
  ListMusic,
  Users,
  Globe,
  BookOpen,
  User,
  Settings,
  Gift,
  FileText,
  Loader2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { GenerateSheet } from './GenerateSheet';
import { NotificationCenter } from './notifications';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useNotificationHub } from '@/contexts/NotificationContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';

const mainNavItems = [
  { path: '/', label: 'Главная', icon: Home },
  { path: '/projects', label: 'Проекты', icon: FolderOpen },
  { path: '/library', label: 'Библиотека', icon: Library },
  { path: '/analytics', label: 'Аналитика', icon: BarChart2 },
];

const musicNavItems = [
  { path: '/playlists', label: 'Плейлисты', icon: ListMusic, showCount: true },
  { path: '/templates', label: 'Шаблоны', icon: FileText },
  { path: '/artists', label: 'AI-артисты', icon: Users },
  { path: '/community', label: 'Сообщество', icon: Globe },
  { path: '/blog', label: 'Блог', icon: BookOpen },
];

const accountNavItems = [
  { path: '/profile', label: 'Профиль', icon: User },
  { path: '/rewards', label: 'Награды', icon: Gift },
  { path: '/settings', label: 'Настройки', icon: Settings },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const { playlists } = usePlaylists();
  const { activeGenerations, generationCount } = useNotificationHub();

  const playlistCount = playlists?.length || 0;

  const isActive = (path: string) => location.pathname === path;

  const NavButton = ({ path, label, icon: Icon, badge }: { 
    path: string; 
    label: string; 
    icon: React.ElementType;
    badge?: number;
  }) => (
    <Button
      variant={isActive(path) ? 'secondary' : 'ghost'}
      className={cn(
        "w-full justify-start gap-3 h-10",
        isActive(path) && "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none"
      )}
      onClick={() => navigate(path)}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
          {badge}
        </Badge>
      )}
    </Button>
  );

  return (
    <>
      <aside className="h-full flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-primary">MusicVerse</h1>
          <NotificationCenter />
        </div>
        
        {/* Create Button */}
        <div className="px-3 py-4">
          <Button
            onClick={() => setGenerateOpen(true)}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 gap-2 shadow-lg h-11"
          >
            <Sparkles className="w-5 h-5" />
            <span>Создать трек</span>
          </Button>
        </div>

        {/* Active Generations */}
        {generationCount > 0 && (
          <div className="px-3 pb-3">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-xs font-medium">
                  Генерация ({generationCount})
                </span>
              </div>
              {activeGenerations.slice(0, 2).map((gen) => (
                <div key={gen.id} className="mb-2 last:mb-0">
                  <p className="text-[10px] text-muted-foreground truncate mb-1">
                    {gen.prompt.slice(0, 25)}...
                  </p>
                  <Progress value={gen.progress} className="h-1" />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 h-7 text-xs text-primary"
                onClick={() => navigate('/library')}
              >
                Открыть библиотеку →
              </Button>
            </div>
          </div>
        )}

        {/* Scrollable Navigation */}
        <ScrollArea className="flex-1">
          <nav className="px-3 space-y-1">
            {/* Main Navigation */}
            {mainNavItems.map((item) => (
              <NavButton key={item.path} {...item} />
            ))}
            
            {/* Music Section */}
            <Collapsible open={musicOpen} onOpenChange={setMusicOpen} className="pt-4">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-8 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
                >
                  Музыка
                  {musicOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {musicNavItems.map((item) => (
                  <NavButton 
                    key={item.path} 
                    {...item} 
                    badge={item.showCount ? playlistCount : undefined}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Account Section */}
            <Collapsible open={accountOpen} onOpenChange={setAccountOpen} className="pt-4">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-8 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
                >
                  Аккаунт
                  {accountOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {accountNavItems.map((item) => (
                  <NavButton key={item.path} {...item} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground text-center">
            MusicVerse AI Studio
          </p>
        </div>
      </aside>
    
      <GenerateSheet open={generateOpen} onOpenChange={setGenerateOpen} />
    </>
  );
};
