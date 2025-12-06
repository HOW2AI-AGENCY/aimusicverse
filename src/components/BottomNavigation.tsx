import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Plus, Library, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';
import { GenerateSheet } from './GenerateSheet';
import { NavigationMenuSheet } from './NavigationMenuSheet';

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticFeedback } = useTelegram();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (path: string) => {
    hapticFeedback('light');
    navigate(path);
  };

  const handleGenerateClick = () => {
    hapticFeedback('medium');
    setGenerateOpen(true);
  };

  const handleMenuClick = () => {
    hapticFeedback('light');
    setMenuOpen(true);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 bottom-nav-safe">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-around gap-1 sm:gap-2">
            {/* Home */}
            <button
              onClick={() => handleNavigate('/')}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-h-[44px] min-w-[44px] touch-manipulation active:scale-95",
                isActive('/') 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted"
              )}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs font-medium">Главная</span>
            </button>

            {/* Projects */}
            <button
              onClick={() => handleNavigate('/projects')}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-h-[44px] min-w-[44px] touch-manipulation active:scale-95",
                isActive('/projects') 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted"
              )}
            >
              <FolderOpen className="w-5 h-5" />
              <span className="text-xs font-medium">Проекты</span>
            </button>

            {/* Create (Center) */}
            <button
              onClick={handleGenerateClick}
              className="flex items-center justify-center w-14 h-14 min-h-[56px] min-w-[56px] -mt-6 sm:-mt-8 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl active:scale-95 transition-all touch-manipulation"
            >
              <Plus className="w-7 h-7 text-primary-foreground" />
            </button>

            {/* Library */}
            <button
              onClick={() => handleNavigate('/library')}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-h-[44px] min-w-[44px] touch-manipulation active:scale-95",
                isActive('/library') 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted"
              )}
            >
              <Library className="w-5 h-5" />
              <span className="text-xs font-medium">Библиотека</span>
            </button>

            {/* Menu */}
            <button
              onClick={handleMenuClick}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-h-[44px] min-w-[44px] touch-manipulation active:scale-95",
                menuOpen
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted"
              )}
            >
              <Menu className="w-5 h-5" />
              <span className="text-xs font-medium">Меню</span>
            </button>
          </div>
        </div>
      </nav>

      <GenerateSheet open={generateOpen} onOpenChange={setGenerateOpen} />
      <NavigationMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
};
