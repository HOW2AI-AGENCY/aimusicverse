import { useState, lazy, Suspense, useCallback, useEffect } from 'react';
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
  ChevronRight,
  Guitar,
  PanelLeftClose,
  PanelLeft,
  Shield,
  Layers,
  CreditCard,
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { NotificationCenter } from './notifications';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useNotificationHub } from '@/contexts/NotificationContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { preloadRoute } from '@/lib/route-preloader';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';

// Lazy load GenerateSheet
const GenerateSheet = lazy(() => import('./GenerateSheet').then(m => ({ default: m.GenerateSheet })));

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

// Main navigation with keyboard shortcuts
const mainNavItems = [
  { path: '/', label: 'Главная', icon: Home, shortcut: '1' },
  { path: '/library', label: 'Моя музыка', icon: Library, shortcut: '2' },
];

// Content Hub navigation (direct links to tabs)
const contentNavItems = [
  { path: '/projects?tab=artists', label: 'Артисты', icon: Users },
  { path: '/projects?tab=projects', label: 'Проекты', icon: FolderOpen, shortcut: '3' },
  { path: '/projects?tab=lyrics', label: 'Тексты', icon: FileText },
  { path: '/projects?tab=cloud', label: 'Облако', icon: Globe },
];

// Studio navigation
const studioNavItems = [
  { path: '/studio-v2', label: 'Студия', icon: Layers, badge: 'NEW', description: 'Мультитрек редактор', shortcut: '4' },
  { path: '/guitar-studio', label: 'Guitar Studio', icon: Guitar, badge: 'PRO', description: 'Запись и анализ гитары' },
  { path: '/playlists', label: 'Плейлисты', icon: ListMusic, showCount: true },
];

// Account navigation
const accountNavItems = [
  { path: '/profile', label: 'Профиль', icon: User },
  { path: '/rewards', label: 'Награды', icon: Gift },
  { path: '/pricing', label: 'Магазин', icon: CreditCard, description: 'Кредиты и подписки' },
  { path: '/analytics', label: 'Аналитика', icon: BarChart2 },
  { path: '/settings', label: 'Настройки', icon: Settings, shortcut: ',' },
];

// Admin navigation items
const adminNavItems = [
  { path: '/admin', label: 'Админ-панель', icon: Shield, description: 'Панель управления' },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export const Sidebar = ({ collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const { playlists } = usePlaylists();
  const { activeGenerations, generationCount } = useNotificationHub();
  const { isAdmin } = useUserRole();
  
  // Internal collapsed state with localStorage persistence
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    }
    return false;
  });
  
  // Use controlled or internal state
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  
  const toggleCollapsed = useCallback(() => {
    const newValue = !isCollapsed;
    setInternalCollapsed(newValue);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
    onCollapsedChange?.(newValue);
  }, [isCollapsed, onCollapsedChange]);

  const playlistCount = playlists?.length || 0;

  const isActive = (path: string) => location.pathname === path;

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const shortcuts: Record<string, string> = {
        '1': '/',
        '2': '/library',
        '3': '/projects?tab=projects',
        '4': '/studio-v2',
        ',': '/settings',
        'g': 'generate', // Special case for generate
      };

      const shortcut = shortcuts[e.key];
      if (shortcut) {
        e.preventDefault();
        if (shortcut === 'generate') {
          setGenerateOpen(true);
        } else {
          navigate(shortcut);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  /**
   * 🎯 Компонент кнопки навигации
   * Поддерживает:
   * - Числовые бейджи (для счётчиков)
   * - Текстовые бейджи (PRO, NEW, и т.д.)
   * - Тултипы с описанием
   * - Collapsed mode (только иконки)
   */
  const NavButton = ({
    path,
    label,
    icon: Icon,
    badge,
    description,
    shortcut,
  }: {
    path: string;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    description?: string;
    shortcut?: string;
  }) => {
    const active = isActive(path);
    const isPROBadge = badge === 'PRO';
    const isNEWBadge = badge === 'NEW';
    const isNumericBadge = typeof badge === 'number' && badge > 0;
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    // Preload route on hover for faster navigation
    const handleMouseEnter = useCallback(() => {
      preloadRoute(path);
    }, [path]);

    const buttonContent = (
      <Button
        variant={active ? 'secondary' : 'ghost'}
        className={cn(
          "w-full gap-3 h-10 relative group",
          isCollapsed ? "justify-center px-2" : "justify-start",
          active && "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none"
        )}
        onClick={() => navigate(path)}
        onMouseEnter={handleMouseEnter}
        onFocus={handleMouseEnter}
        title={isCollapsed ? label : description}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left truncate">{label}</span>

            {isNumericBadge && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {badge}
              </Badge>
            )}

            {isPROBadge && (
              <Badge
                className={cn(
                  "h-5 px-1.5 text-[10px] font-bold",
                  "bg-gradient-to-r from-amber-500 to-orange-500",
                  "text-white border-0 shadow-sm"
                )}
              >
                PRO
              </Badge>
            )}

            {isNEWBadge && (
              <Badge
                className={cn(
                  "h-5 px-1.5 text-[10px] font-bold",
                  "bg-gradient-to-r from-emerald-500 to-teal-500",
                  "text-white border-0 shadow-sm"
                )}
              >
                NEW
              </Badge>
            )}

            {/* Keyboard shortcut hint */}
            {shortcut && (
              <kbd className="hidden lg:inline-flex h-5 px-1.5 items-center justify-center rounded bg-muted/80 text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {isMac ? '⌘' : 'Ctrl+'}{shortcut}
              </kbd>
            )}
          </>
        )}
      </Button>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            <span>{label}</span>
            {shortcut && (
              <kbd className="h-4 px-1 text-[9px] font-mono rounded bg-muted">
                {isMac ? '⌘' : 'Ctrl+'}{shortcut}
              </kbd>
            )}
            {isPROBadge && (
              <Badge className="h-4 px-1 text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                PRO
              </Badge>
            )}
            {isNEWBadge && (
              <Badge className="h-4 px-1 text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                NEW
              </Badge>
            )}
            {isNumericBadge && (
              <Badge variant="secondary" className="h-4 px-1 text-[9px]">{badge}</Badge>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonContent;
  };

  return (
    <TooltipProvider>
      <aside 
        className={cn(
          "h-full flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 z-navigation",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className={cn(
          "p-4 flex items-center border-b border-sidebar-border",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-sidebar-primary">MusicVerse</h1>
          )}
          <div className="flex items-center gap-1">
            {!isCollapsed && <NotificationCenter />}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCollapsed}
                  className="h-8 w-8"
                >
                  {isCollapsed ? (
                    <PanelLeft className="w-4 h-4" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? "right" : "bottom"}>
                {isCollapsed ? "Развернуть" : "Свернуть"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Create Button */}
        <div className={cn("py-4", isCollapsed ? "px-2" : "px-3")}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setGenerateOpen(true)}
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                  size="icon"
                >
                  <Sparkles className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Создать трек</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={() => setGenerateOpen(true)}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 gap-2 shadow-lg h-11"
            >
              <Sparkles className="w-5 h-5" />
              <span>Создать трек</span>
            </Button>
          )}
        </div>

        {/* Active Generations */}
        {generationCount > 0 && !isCollapsed && (
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
        
        {/* Collapsed generation indicator */}
        {generationCount > 0 && isCollapsed && (
          <div className="px-2 pb-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10 relative"
                  onClick={() => navigate('/library')}
                >
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {generationCount}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {generationCount} генерация в процессе
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Scrollable Navigation */}
        <ScrollArea className="flex-1">
          <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-3")}>
            {/* Main Navigation */}
            {mainNavItems.map((item) => (
              <NavButton key={item.path} {...item} />
            ))}
            
            {/* Content Section */}
            {isCollapsed ? (
              <div className="pt-4 space-y-1">
                {contentNavItems.map((item) => (
                  <NavButton key={item.path} {...item} />
                ))}
              </div>
            ) : (
              <Collapsible open={musicOpen} onOpenChange={setMusicOpen} className="pt-4">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-8 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
                  >
                    Контент
                    {musicOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-1">
                  {contentNavItems.map((item) => (
                    <NavButton key={item.path} {...item} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Studio Section */}
            {isCollapsed ? (
              <div className="pt-4 space-y-1">
                {studioNavItems.map((item) => (
                  <NavButton
                    key={item.path}
                    {...item}
                    badge={item.showCount ? playlistCount : item.badge}
                  />
                ))}
              </div>
            ) : (
              <Collapsible className="pt-4">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-8 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
                  >
                    Студия
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-1">
                  {studioNavItems.map((item) => (
                    <NavButton
                      key={item.path}
                      {...item}
                      badge={item.showCount ? playlistCount : item.badge}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Account Section */}
            {isCollapsed ? (
              <div className="pt-4 space-y-1">
                {accountNavItems.map((item) => (
                  <NavButton key={item.path} {...item} />
                ))}
              </div>
            ) : (
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
            )}

            {/* Admin Section - Only for admins */}
            {isAdmin && (
              isCollapsed ? (
                <div className="pt-4 space-y-1">
                  {adminNavItems.map((item) => (
                    <NavButton key={item.path} {...item} />
                  ))}
                </div>
              ) : (
                <div className="pt-4 space-y-1">
                  <div className="flex items-center gap-2 px-2 pb-1">
                    <Shield className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-xs font-semibold text-destructive uppercase tracking-wider">
                      Админ
                    </span>
                  </div>
                  {adminNavItems.map((item) => (
                    <NavButton key={item.path} {...item} />
                  ))}
                </div>
              )
            )}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <p className={cn(
            "text-[10px] text-muted-foreground text-center",
            isCollapsed && "hidden"
          )}>
            MusicVerse AI Studio
          </p>
        </div>
      </aside>
    
      {generateOpen && (
        <Suspense fallback={null}>
          <GenerateSheet open={generateOpen} onOpenChange={setGenerateOpen} />
        </Suspense>
      )}
    </TooltipProvider>
  );
};
