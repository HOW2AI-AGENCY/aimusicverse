import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Plus, Library, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { GenerateSheet } from './GenerateSheet';

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticFeedback } = useTelegram();
  const [generateOpen, setGenerateOpen] = useState(false);

  const handleNavigate = (path: string) => {
    hapticFeedback('light');
    navigate(path);
  };

  const handleGenerateClick = () => {
    hapticFeedback('medium');
    setGenerateOpen(true);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            {/* Home */}
            <button
              onClick={() => handleNavigate('/')}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                isActive('/') 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs font-medium">Главная</span>
            </button>

            {/* Projects */}
            <button
              onClick={() => handleNavigate('/projects')}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                isActive('/projects') 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FolderOpen className="w-5 h-5" />
              <span className="text-xs font-medium">Проекты</span>
            </button>

            {/* Create (Center) */}
            <button
              onClick={handleGenerateClick}
              className="flex items-center justify-center w-14 h-14 -mt-8 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-7 h-7 text-primary-foreground" />
            </button>

            {/* Library */}
            <button
              onClick={() => handleNavigate('/library')}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                isActive('/library') 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Library className="w-5 h-5" />
              <span className="text-xs font-medium">Библиотека</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => handleNavigate('/profile')}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                isActive('/profile')
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserCircle className="w-5 h-5" />
              <span className="text-xs font-medium">Профиль</span>
            </button>
          </div>
        </div>
      </nav>

      <GenerateSheet open={generateOpen} onOpenChange={setGenerateOpen} />
    </>
  );
};
