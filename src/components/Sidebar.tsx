
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Library, UserCircle, Settings, BarChart2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { GenerateSheet } from './GenerateSheet';

const navItems = [
  { path: '/', label: 'Главная', icon: Home },
  { path: '/projects', label: 'Проекты', icon: FolderOpen },
  { path: '/library', label: 'Библиотека', icon: Library },
  { path: '/analytics', label: 'Аналитика', icon: BarChart2 },
];

const bottomNavItems = [
  { path: '/profile', label: 'Профиль', icon: UserCircle },
  { path: '/settings', label: 'Настройки', icon: Settings },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [generateOpen, setGenerateOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <aside className="h-full flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-sidebar-primary">MusicVerse</h1>
        </div>
        
        {/* Create/Generate Button */}
        <div className="px-2 pb-4">
          <Button
            onClick={() => setGenerateOpen(true)}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 gap-2 shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            <span>Создать трек</span>
          </Button>
        </div>
        
        <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant={isActive(item.path) ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2"
            onClick={() => navigate(item.path)}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Button>
        ))}
      </nav>
      <div className="px-2 py-4 border-t border-sidebar-border">
        {bottomNavItems.map((item) => (
          <Button
            key={item.path}
            variant={isActive(item.path) ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2"
            onClick={() => navigate(item.path)}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Button>
        ))}
      </div>
    </aside>
    
    <GenerateSheet open={generateOpen} onOpenChange={setGenerateOpen} />
    </>
  );
};
